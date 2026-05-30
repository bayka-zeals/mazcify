'use client'

import { useState } from 'react'
import { Download, Trash2, ThumbsUp, ThumbsDown, Save, Loader2 } from 'lucide-react'
import type { VideoFeedback } from '@/types'

interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string | null
  templateName: string
  mascotName: string
  duration: number
  liked?: VideoFeedback
  saving?: boolean
  saved?: boolean
  partial?: boolean
  onSave?: () => void
  onDownload?: () => void
  onDelete?: () => void
  onLike?: (liked: VideoFeedback) => void
}

export default function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  templateName,
  mascotName,
  duration,
  liked = null,
  saving = false,
  saved = false,
  partial = false,
  onSave,
  onDownload,
  onDelete,
  onLike,
}: VideoPlayerProps) {
  const [downloadStarted, setDownloadStarted] = useState(false)

  const handleDownload = async () => {
    setDownloadStarted(true)
    try {
      const res = await fetch(videoUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${mascotName.replace(/\s+/g, '_').toLowerCase()}-${templateName
        .replace(/\s+/g, '_')
        .toLowerCase()}.mp4`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      onDownload?.()
    } catch (err) {
      console.error('Download failed:', err)
      // Fallback: open in new tab
      window.open(videoUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloadStarted(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="relative aspect-video bg-black">
          <video
            key={videoUrl}
            src={videoUrl}
            poster={thumbnailUrl ?? undefined}
            controls
            playsInline
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 border-t border-border p-5 sm:p-6">
          <div>
            <h3 className="text-base font-semibold text-text">{templateName}</h3>
            <p className="mt-1 text-xs text-muted">
              {mascotName} · {duration}s
              {partial && (
                <span className="ml-2 rounded border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-yellow-300">
                  Partial
                </span>
              )}
              {saved && (
                <span className="ml-2 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
                  Saved
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              icon={<ThumbsUp size={14} />}
              label="Like"
              active={liked === 'like'}
              onClick={() => onLike?.(liked === 'like' ? null : 'like')}
            />
            <ActionButton
              icon={<ThumbsDown size={14} />}
              label="Dislike"
              active={liked === 'dislike'}
              onClick={() => onLike?.(liked === 'dislike' ? null : 'dislike')}
            />
            <ActionButton
              icon={
                downloadStarted ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )
              }
              label="Download"
              disabled={downloadStarted}
              onClick={handleDownload}
            />
            <ActionButton
              icon={<Trash2 size={14} />}
              label="Delete"
              onClick={onDelete}
              variant="danger"
            />
          </div>
        </div>
      </div>

      {!saved && onSave && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-accent-glow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={16} /> Save Video
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  variant = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  variant?: 'default' | 'danger'
}) {
  const base =
    'inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider px-3.5 py-2 rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const styles = active
    ? 'bg-accent text-bg border-accent'
    : variant === 'danger'
      ? 'text-muted border-border hover:text-red-300 hover:border-red-500/40'
      : 'text-muted border-border hover:text-text hover:border-white/15'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[base, styles].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}
