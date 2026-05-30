import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { z } from 'zod'
import {
  generateVideoFromReference,
  extendVideo,
  downloadVideo,
  PixVerseError,
  type VideoClipResult,
} from '@/lib/pixverse'
import {
  ensureWorkDir,
  isFfmpegAvailable,
  normalizeVideo,
  extractThumbnail,
} from '@/lib/ffmpeg'
import { getVideoTemplateById, resolveTemplatePrompts } from '@/video_templates'
import { VIDEO_CONFIG, PLAN_LIMITS, isAdmin } from '@/config/constants'
import type { VideoProgressEvent } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 300 // Vercel Hobby plan limit (5 minutes)

const PostBodySchema = z.object({
  userId: z.string().min(1),
  brandId: z.string().min(1),
  mascotId: z.string().min(1),
  mascotName: z.string().optional(),
  mascotImageUrl: z.string().url(),
  mascotDescription: z.string().optional(),
  templateId: z.string().min(1),
  videoId: z.string().min(1), // pre-allocated by client
  currentVideoCount: z.number().int().nonnegative().optional(),
})

/**
 * GET /api/video?userId=...&brandId=... — return template metadata for the
 * frontend to enumerate available templates without re-reading the filesystem
 * client-side.
 */
export async function GET() {
  const { getVideoTemplates } = await import('@/video_templates')
  const { summarizeTemplate } = await import('@/video_templates/templates-client')

  const templates = getVideoTemplates().map(summarizeTemplate)
  return NextResponse.json({ templates })
}

/**
 * POST /api/video — generate a story video with Server-Sent Events progress.
 *
 * Pipeline:
 *   1. Validate request + plan limits (free = 5 active videos)
 *   2. Resolve template prompts (replace {mascot_description})
 *   3. Generate clip 1 via `pixverse create reference`
 *   4. Generate clips 2..N via `pixverse create extend` (sequential, chained)
 *   5. Stream progress events to the client; client persists to Firestore
 *
 * The final extend output IS the full chained video (PixVerse concatenates
 * clips natively when extending), so no FFmpeg stitch is required. Clients
 * can optionally back up the final URL to Firebase Storage.
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PostBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const {
    userId,
    brandId,
    mascotId,
    mascotName,
    mascotImageUrl,
    mascotDescription,
    templateId,
    videoId,
    currentVideoCount,
  } = parsed.data

  // Plan-limit defense in depth — frontend also blocks before posting.
  const videoLimit = PLAN_LIMITS.free.videosMax
  if (
    !isAdmin(userId) &&
    typeof currentVideoCount === 'number' &&
    currentVideoCount >= videoLimit
  ) {
    return NextResponse.json(
      {
        error: 'Free plan limit reached',
        code: 'limit_reached',
        message: `You've reached your free plan limit of ${videoLimit} video${videoLimit === 1 ? '' : 's'}. Delete an existing video or upgrade.`,
      },
      { status: 402 },
    )
  }

  const template = getVideoTemplateById(templateId)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const resolved = resolveTemplatePrompts(
    template,
    mascotDescription || mascotName || 'the mascot character',
  )
  const sortedClips = [...resolved.clips].sort((a, b) => a.index - b.index)
  const totalClips = sortedClips.length

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writeEvent = (event: VideoProgressEvent) => {
        const payload = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      // Send heartbeats every 20s to keep proxies/CDNs from closing the stream
      // during long PixVerse calls.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          // controller already closed
        }
      }, 20_000)

      const cleanup = () => {
        clearInterval(heartbeat)
        try {
          controller.close()
        } catch {
          // already closed
        }
      }

      try {
        writeEvent({
          type: 'init',
          videoId,
          totalClips,
          templateName: template.name,
        })

        const clipResults: VideoClipResult[] = []
        const clipVideoIds: string[] = []

        // Clip 1 — reference fusion (locks in mascot identity)
        writeEvent({
          type: 'clip_start',
          clipIndex: 1,
          totalClips,
          message: `Casting your mascot in scene 1 of ${totalClips}…`,
        })

        const first = await runWithRetry(
          () =>
            generateVideoFromReference(mascotImageUrl, sortedClips[0].prompt, {
              model: template.model || VIDEO_CONFIG.defaultModel,
              quality: VIDEO_CONFIG.quality,
              aspectRatio: VIDEO_CONFIG.aspectRatio,
              duration: sortedClips[0].duration ?? VIDEO_CONFIG.clipDurationSecs,
              cliTimeoutSecs: VIDEO_CONFIG.cliTimeoutSecs,
            }),
          VIDEO_CONFIG.maxRetries,
        )

        clipResults.push({ ...first, clipIndex: sortedClips[0].index })
        clipVideoIds.push(first.videoId)
        writeEvent({
          type: 'clip_done',
          clipIndex: 1,
          totalClips,
          videoId: first.videoId,
        })

        // Clips 2..N — chain extends. Extend supports v6 / v5.6 / grok-imagine.
        // pixverse-c1 doesn't support extend, so we use v6 for continuation.
        let prevId = first.videoId
        let lastResult: VideoClipResult = first
        let failedAtClip: number | null = null
        let lastErrorMessage = ''

        for (let i = 1; i < sortedClips.length; i++) {
          const clip = sortedClips[i]
          writeEvent({
            type: 'clip_start',
            clipIndex: i + 1,
            totalClips,
            message: `Composing scene ${i + 1} of ${totalClips}…`,
          })

          try {
            const extended = await runWithRetry(
              () =>
                extendVideo(prevId, clip.prompt, {
                  model: 'v6',
                  quality: VIDEO_CONFIG.quality,
                  duration: clip.duration ?? VIDEO_CONFIG.clipDurationSecs,
                  cliTimeoutSecs: VIDEO_CONFIG.cliTimeoutSecs,
                }),
              VIDEO_CONFIG.maxRetries,
            )

            clipResults.push({ ...extended, clipIndex: clip.index })
            clipVideoIds.push(extended.videoId)
            prevId = extended.videoId
            lastResult = extended

            writeEvent({
              type: 'clip_done',
              clipIndex: i + 1,
              totalClips,
              videoId: extended.videoId,
            })
          } catch (err) {
            failedAtClip = i + 1
            lastErrorMessage =
              err instanceof Error ? err.message : 'Unknown error during extend'
            console.error(`[/api/video] extend failed at clip ${i + 1}:`, err)
            break
          }
        }

        if (failedAtClip !== null) {
          // Partial success path
          writeEvent({
            type: 'partial',
            videoId,
            finalVideoUrl: lastResult.videoUrl,
            pixverseCdnUrl: lastResult.videoUrl,
            completedClips: clipResults.length,
            totalClips,
            errorMessage: lastErrorMessage,
          })
          cleanup()
          return
        }

        // All clips succeeded — final URL is the last extended video, which
        // contains the complete chain natively.
        writeEvent({
          type: 'processing',
          message: 'Polishing the final cut…',
        })

        const totalDuration = clipResults.reduce(
          (sum, c) => sum + (c.duration || VIDEO_CONFIG.clipDurationSecs),
          0,
        )

        // Best-effort FFmpeg post-processing: download via PixVerse CLI,
        // re-encode to web-friendly H.264/AAC + faststart, generate thumbnail.
        // If ffmpeg or the download fails, we fall back to the PixVerse CDN URL
        // directly (which is already a valid MP4).
        let finalServedUrl = lastResult.videoUrl
        try {
          if (await isFfmpegAvailable()) {
            const workDir = await ensureWorkDir(videoId)
            const downloadedPath = await downloadVideo(lastResult.videoId, workDir)
            const normalizedPath = await normalizeVideo(
              downloadedPath,
              join(workDir, 'final.mp4'),
            )
            if (normalizedPath) {
              await extractThumbnail(
                normalizedPath,
                join(workDir, 'thumb.jpg'),
                0.5,
              )
              finalServedUrl = `/api/video/file?videoId=${encodeURIComponent(videoId)}&kind=video`
            }
          }
        } catch (postErr) {
          console.warn('[/api/video] post-process failed, using CDN URL:', postErr)
        }

        writeEvent({
          type: 'done',
          videoId,
          finalVideoUrl: finalServedUrl,
          pixverseCdnUrl: lastResult.videoUrl,
          duration: totalDuration,
        })
      } catch (err) {
        console.error('[/api/video] generation failed:', err)
        const message =
          err instanceof PixVerseError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Unexpected server error'
        writeEvent({
          type: 'error',
          message,
          code: err instanceof PixVerseError ? 'pixverse_error' : 'server_error',
        })
      } finally {
        cleanup()
      }
    },
    cancel() {
      // client disconnected — server-side generation continues silently
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

async function runWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      // Surface fatal errors immediately (auth / credit / validation)
      if (err instanceof PixVerseError && err.statusCode) {
        const code = err.statusCode
        if (code === 3 || code === 4 || code === 6) {
          throw err
        }
      }
      console.warn(
        `[/api/video] attempt ${attempt + 1} failed, ${
          attempt < maxRetries ? 'retrying' : 'giving up'
        }`,
      )
    }
  }
  throw lastError
}
