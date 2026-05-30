import 'server-only'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execFileAsync = promisify(execFile)

const FFMPEG_BIN = process.env.FFMPEG_BIN || 'ffmpeg'
const FFPROBE_BIN = process.env.FFPROBE_BIN || 'ffprobe'

let _ffmpegAvailable: boolean | null = null

/**
 * Check whether ffmpeg is on the PATH (or at FFMPEG_BIN). Cached after first call.
 */
export async function isFfmpegAvailable(): Promise<boolean> {
  if (_ffmpegAvailable !== null) return _ffmpegAvailable
  try {
    await execFileAsync(FFMPEG_BIN, ['-version'], { timeout: 5_000 })
    _ffmpegAvailable = true
  } catch {
    _ffmpegAvailable = false
  }
  return _ffmpegAvailable
}

export async function ensureWorkDir(videoId: string): Promise<string> {
  const dir = join(tmpdir(), 'mazcify-videos', videoId)
  await mkdir(dir, { recursive: true })
  return dir
}

/**
 * Download a remote video URL into a local temp file. Returns the absolute path.
 */
export async function downloadToTemp(url: string, destPath: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to download video (${res.status})`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(destPath, buf)
  return destPath
}

/**
 * Re-encode a video to web-friendly H.264/AAC MP4 with faststart so the
 * `<video>` element can begin playback before the file is fully buffered.
 *
 * Returns the output path, or null if ffmpeg is unavailable / fails (caller
 * should fall back to the original input).
 */
export async function normalizeVideo(
  inputPath: string,
  outputPath: string,
): Promise<string | null> {
  if (!(await isFfmpegAvailable())) {
    console.warn('[ffmpeg] not available, skipping normalization')
    return null
  }

  try {
    await execFileAsync(
      FFMPEG_BIN,
      [
        '-y',
        '-i', inputPath,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '20',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputPath,
      ],
      { timeout: 5 * 60_000, maxBuffer: 10 * 1024 * 1024 },
    )
    return outputPath
  } catch (err) {
    console.warn('[ffmpeg] normalize failed:', err)
    return null
  }
}

/**
 * Extract a single JPEG frame from a video at the given timestamp (seconds).
 * Returns the output path, or null if ffmpeg is unavailable / fails.
 */
export async function extractThumbnail(
  inputPath: string,
  outputPath: string,
  timestampSecs = 0.5,
): Promise<string | null> {
  if (!(await isFfmpegAvailable())) {
    return null
  }
  try {
    await execFileAsync(
      FFMPEG_BIN,
      [
        '-y',
        '-ss', String(timestampSecs),
        '-i', inputPath,
        '-frames:v', '1',
        '-q:v', '3',
        outputPath,
      ],
      { timeout: 60_000 },
    )
    return outputPath
  } catch (err) {
    console.warn('[ffmpeg] thumbnail extract failed:', err)
    return null
  }
}

export interface VideoProbeResult {
  durationSecs: number | null
  width: number | null
  height: number | null
}

/**
 * Probe a local video for duration + dimensions using ffprobe (best-effort).
 */
export async function probeVideo(path: string): Promise<VideoProbeResult> {
  const empty: VideoProbeResult = { durationSecs: null, width: null, height: null }
  try {
    const { stdout } = await execFileAsync(
      FFPROBE_BIN,
      [
        '-v', 'error',
        '-show_entries', 'stream=width,height:format=duration',
        '-of', 'json',
        path,
      ],
      { timeout: 30_000 },
    )
    const parsed = JSON.parse(stdout)
    const stream = parsed.streams?.[0] ?? {}
    const duration = parseFloat(parsed.format?.duration ?? '')
    return {
      durationSecs: Number.isFinite(duration) ? duration : null,
      width: typeof stream.width === 'number' ? stream.width : null,
      height: typeof stream.height === 'number' ? stream.height : null,
    }
  } catch {
    return empty
  }
}
