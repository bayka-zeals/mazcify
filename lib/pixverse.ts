import { execFile } from 'child_process'
import type { MascotVariation, PromptClip } from '@/types'

const PIXVERSE_BIN = 'pixverse'
const VIDEO_TIMEOUT_MS = 600_000 // 10 minutes per CLI invocation

export class PixVerseError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message)
    this.name = 'PixVerseError'
  }
}

interface CliImageResult {
  image_id: number
  status: string
  image_url: string
  prompt: string
  model: string
}

function runPixverse(args: string[], timeoutMs = 300_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      PIXVERSE_BIN,
      args,
      { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const msg = stderr?.trim() || err.message
          // surface CLI exit code when available (e.g. 4 = insufficient credits)
          const code = typeof (err as NodeJS.ErrnoException).code === 'number'
            ? ((err as NodeJS.ErrnoException).code as unknown as number)
            : undefined
          reject(new PixVerseError(`pixverse CLI failed: ${msg}`, code))
          return
        }
        resolve(stdout)
      },
    )
  })
}

async function runPixverseJson<T>(args: string[], timeoutMs = 300_000): Promise<T> {
  const stdout = await runPixverse([...args, '--json'], timeoutMs)
  try {
    return JSON.parse(stdout) as T
  } catch {
    throw new PixVerseError(`Failed to parse pixverse output: ${stdout.slice(0, 200)}`)
  }
}

async function generateSingleImage(
  prompt: string,
  maxRetries = 2,
): Promise<CliImageResult> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await runPixverseJson<CliImageResult>([
        'create', 'image',
        '--prompt', prompt,
        '--model', 'gpt-image-2.0',
        '--quality', '1440p',
        '--aspect-ratio', '1:1',
        '--detail-level', 'high',
        '--timeout', '240',
      ])
    } catch (err) {
      lastError = err as Error
      console.warn(`[pixverse] image attempt ${attempt + 1} failed: ${lastError.message}`)
    }
  }
  throw lastError!
}

export async function generateImages(
  prompt: string,
  count: number,
): Promise<MascotVariation[]> {
  const settled = await Promise.allSettled(
    Array.from({ length: count }, () => generateSingleImage(prompt)),
  )

  const results: MascotVariation[] = []
  for (const s of settled) {
    if (s.status === 'fulfilled') {
      results.push({
        id: String(s.value.image_id),
        imageUrl: s.value.image_url,
        prompt,
      })
    }
  }

  if (results.length === 0) {
    const firstErr = settled.find((s) => s.status === 'rejected') as PromiseRejectedResult
    throw firstErr.reason
  }

  return results
}

export async function generateCharacterSheet(
  chosenImageUrl: string,
  params: { mascotName?: string; gender: string; description?: string },
): Promise<{ imageId: number; url: string }> {
  const charAnchor = params.mascotName
    ? `${params.mascotName} — a ${params.gender} brand mascot character`
    : `a ${params.gender} brand mascot character`
  const descLine = params.description ? ` ${params.description}.` : ''

  const prompt = [
    `A 6-panel character reference sheet arranged as a 3-column by 2-row grid`,
    `in a single horizontal frame, separated by thin clean white gutters between panels.`,
    `Each panel shows the same single mascot character — ${charAnchor}.${descLine}`,
    `Same character from the reference image — match the exact colors, proportions, features, clothing, and accessories.`,
    ``,
    `Panel 1 (top-left): Full body front view — character standing upright facing camera,`,
    `neutral relaxed pose, arms at sides, weight evenly distributed, full styling readable head to feet.`,
    `Panel 2 (top-center): Left side profile — full body side view, character's left side facing camera,`,
    `silhouette and proportions clearly readable, tail and back details visible.`,
    `Panel 3 (top-right): Full body back view — character with back to camera,`,
    `showing tail, back markings, rear of any clothing or accessories.`,
    `Panel 4 (bottom-left): Right side profile — full body side view, character's right side facing camera,`,
    `mirror of Panel 2 from the opposite side.`,
    `Panel 5 (bottom-center): Front face close-up — head and upper body filling the panel,`,
    `face centered, eyes forward, expression and facial features clearly readable at full detail.`,
    `Panel 6 (bottom-right): Detail shot — close-up of the character's most distinctive feature`,
    `(paws, tail tip, accessory, collar, markings, or held prop), filling the panel cleanly.`,
    ``,
    `Pure solid white (#FFFFFF) background applied uniformly across all six panels — no gradient,`,
    `no texture, no colored tint, no environment. The white background extends edge-to-edge behind`,
    `every panel and through all gutters. Only a subtle drop shadow directly beneath the character's`,
    `feet is allowed. Consistent soft studio lighting from above-left applied uniformly across all six panels.`,
    ``,
    `Identical character identity locked across all six panels — same face, same body proportions,`,
    `same colors, same clothing, same accessories, same style in every cell. High-quality 3D rendered`,
    `character with soft matte materials, subtle ambient occlusion, clean global illumination, no harsh`,
    `shadows. Surfaces read as premium toy-quality — smooth, tactile, slightly rounded edges. No specular`,
    `hotspots, no reflective surfaces, no photorealistic textures. Clean, balanced, professional, brand-ready.`,
  ].join(' ')

  const FALLBACK_MODELS = ['gpt-image-2.0', 'gemini-3.1-flash', 'seedream-5.0-lite']
  let lastError: Error | null = null

  for (const model of FALLBACK_MODELS) {
    try {
      const args = [
        'create', 'image',
        '--prompt', prompt,
        '--image', chosenImageUrl,
        '--model', model,
        '--quality', model === 'gpt-image-2.0' ? '1440p' : '1440p',
        '--aspect-ratio', '16:9',
        '--timeout', '240',
      ]
      if (model === 'gpt-image-2.0') {
        args.push('--detail-level', 'high')
      }

      const result = await runPixverseJson<CliImageResult>(args)

      if (result.status === 'completed' && result.image_url) {
        return { imageId: result.image_id, url: result.image_url }
      }
      throw new PixVerseError(`Generation returned status: ${result.status}`)
    } catch (err) {
      lastError = err as Error
      continue
    }
  }

  throw lastError ?? new PixVerseError('All character sheet models failed')
}

interface CliVideoResult {
  video_id: number
  status: string
  video_url: string
  cover_url: string
  prompt: string
  model: string
  duration: number
  width?: number
  height?: number
}

interface CliDownloadResult {
  id: number
  type: string
  file: string
}

export interface VideoClipResult {
  clipIndex: number
  videoId: string
  videoUrl: string
  coverUrl: string
  duration: number
}

export interface VideoReferenceOptions {
  model?: string         // default 'pixverse-c1'
  quality?: string       // default '1080p'
  aspectRatio?: string   // default '16:9'
  duration?: number      // default 5
  cliTimeoutSecs?: number
}

export interface VideoExtendOptions {
  model?: string         // default 'v6' (extend supports v6, v5.6, grok-imagine)
  quality?: string       // default '1080p'
  duration?: number      // default 5 (extend supports 4, 5, 8, 10)
  cliTimeoutSecs?: number
}

/**
 * Generate the FIRST clip from a mascot reference image using PixVerse fusion.
 * Uses `pixverse create reference` which keeps character identity consistent.
 */
export async function generateVideoFromReference(
  imageUrl: string,
  prompt: string,
  options: VideoReferenceOptions = {},
): Promise<VideoClipResult> {
  const model = options.model ?? 'pixverse-c1'
  const quality = options.quality ?? '1080p'
  const aspectRatio = options.aspectRatio ?? '16:9'
  const duration = options.duration ?? 5
  const cliTimeout = options.cliTimeoutSecs ?? 300

  const args = [
    'create', 'reference',
    '--images', imageUrl,
    '--prompt', prompt,
    '--model', model,
    '--quality', quality,
    '--aspect-ratio', aspectRatio,
    '--duration', String(duration),
    '--timeout', String(cliTimeout),
  ]

  const result = await runPixverseJson<CliVideoResult>(args, VIDEO_TIMEOUT_MS)

  if (result.status !== 'completed' || !result.video_url) {
    throw new PixVerseError(
      `Reference clip generation failed: status=${result.status}`,
    )
  }

  return {
    clipIndex: 1,
    videoId: String(result.video_id),
    videoUrl: result.video_url,
    coverUrl: result.cover_url,
    duration: result.duration ?? duration,
  }
}

/**
 * Extend an existing video by another N seconds with a new prompt.
 * `pixverse create extend` supports models: v6 (default), v5.6, grok-imagine.
 */
export async function extendVideo(
  videoId: string,
  prompt: string,
  options: VideoExtendOptions = {},
): Promise<VideoClipResult> {
  const model = options.model ?? 'v6'
  const quality = options.quality ?? '1080p'
  const duration = options.duration ?? 5
  const cliTimeout = options.cliTimeoutSecs ?? 300

  const args = [
    'create', 'extend',
    '--video', videoId,
    '--prompt', prompt,
    '--model', model,
    '--quality', quality,
    '--duration', String(duration),
    '--timeout', String(cliTimeout),
  ]

  const result = await runPixverseJson<CliVideoResult>(args, VIDEO_TIMEOUT_MS)

  if (result.status !== 'completed' || !result.video_url) {
    throw new PixVerseError(
      `Extend clip generation failed: status=${result.status}`,
    )
  }

  return {
    clipIndex: -1, // caller assigns
    videoId: String(result.video_id),
    videoUrl: result.video_url,
    coverUrl: result.cover_url,
    duration: result.duration ?? duration,
  }
}

/**
 * Download a generated video to a local destination directory.
 * Returns the absolute path to the downloaded file.
 */
export async function downloadVideo(
  videoId: string,
  destDir: string,
): Promise<string> {
  const result = await runPixverseJson<CliDownloadResult>([
    'asset', 'download', videoId,
    '--type', 'video',
    '--dest', destDir,
  ])

  if (!result.file) {
    throw new PixVerseError(`Download returned no file path for video ${videoId}`)
  }

  return result.file
}

/**
 * Backwards-compatible single-clip generator (used by tests).
 * Routes to the reference-based generator with sensible defaults.
 */
export async function generateVideoClip(
  mascotImageUrl: string,
  clip: PromptClip,
): Promise<VideoClipResult> {
  const result = await generateVideoFromReference(mascotImageUrl, clip.prompt, {
    duration: clip.duration ?? 5,
  })
  return { ...result, clipIndex: clip.clipIndex }
}

/**
 * High-level: generate a complete story video by chaining reference (clip 1)
 * with extends (clips 2..N). Returns each completed clip in order.
 */
export async function generateStoryVideo(
  mascotImageUrl: string,
  clips: PromptClip[],
  options: {
    referenceModel?: string
    extendModel?: string
    quality?: string
    aspectRatio?: string
    onClipStart?: (clipIndex: number, totalClips: number) => void
    onClipDone?: (result: VideoClipResult) => void
  } = {},
): Promise<VideoClipResult[]> {
  const sorted = [...clips].sort((a, b) => a.clipIndex - b.clipIndex)
  const results: VideoClipResult[] = []

  if (sorted.length === 0) return results

  // Clip 1: reference
  options.onClipStart?.(1, sorted.length)
  const first = await generateVideoFromReference(mascotImageUrl, sorted[0].prompt, {
    model: options.referenceModel,
    quality: options.quality,
    aspectRatio: options.aspectRatio,
    duration: sorted[0].duration ?? 5,
  })
  const firstClip: VideoClipResult = { ...first, clipIndex: sorted[0].clipIndex }
  results.push(firstClip)
  options.onClipDone?.(firstClip)

  // Clips 2..N: extend chain
  let prevId = firstClip.videoId
  for (let i = 1; i < sorted.length; i++) {
    const clip = sorted[i]
    options.onClipStart?.(i + 1, sorted.length)
    const extended = await extendVideo(prevId, clip.prompt, {
      model: options.extendModel,
      quality: options.quality,
      duration: clip.duration ?? 5,
    })
    const clipResult: VideoClipResult = { ...extended, clipIndex: clip.clipIndex }
    results.push(clipResult)
    options.onClipDone?.(clipResult)
    prevId = clipResult.videoId
  }

  return results
}
