import { NextRequest, NextResponse } from 'next/server'
import { stat, readFile } from 'fs/promises'
import { join, normalize } from 'path'
import { tmpdir } from 'os'

export const runtime = 'nodejs'

/**
 * GET /api/video/file?videoId=...&kind=video|thumb
 *
 * Streams a temporarily-cached, FFmpeg-normalized video or thumbnail back to
 * the client. The path is constrained to the mazcify-videos temp directory
 * to prevent path traversal.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const videoId = url.searchParams.get('videoId')
  const kind = url.searchParams.get('kind') === 'thumb' ? 'thumb' : 'video'

  if (!videoId || !/^[a-zA-Z0-9_-]+$/.test(videoId)) {
    return NextResponse.json({ error: 'invalid videoId' }, { status: 400 })
  }

  const baseDir = join(tmpdir(), 'mazcify-videos', videoId)
  const fileName = kind === 'thumb' ? 'thumb.jpg' : 'final.mp4'
  const filePath = normalize(join(baseDir, fileName))

  if (!filePath.startsWith(baseDir)) {
    return NextResponse.json({ error: 'invalid path' }, { status: 400 })
  }

  try {
    await stat(filePath)
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const data = await readFile(filePath)
  const contentType = kind === 'thumb' ? 'image/jpeg' : 'video/mp4'

  return new NextResponse(data, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(data.byteLength),
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
