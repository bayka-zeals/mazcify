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
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="relative aspect-video bg-black">
          <video
            key={videoUrl}
            src={videoUrl}
            poster={thumbnailUrl ?? undefined}
            controls
            playsInline
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>

        <div className="p-5 sm:p-6 border-t border-border flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-text">{templateName}</h3>
            <p className="text-xs text-muted mt-1">
              {mascotName} · {duration}s
              {partial && (
                <span className="ml-2 text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  Partial
                </span>
              )}
              {saved && (
                <span className="ml-2 text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  Saved
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
            className="inline-flex items-center gap-2 bg-accent text-bg text-sm font-bold tracking-wider uppercase px-8 py-3.5 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
