'use client'

import Image from 'next/image'
import { Play, Clock, AlertTriangle } from 'lucide-react'
import type { SavedVideoCard } from '@/lib/firestore-client'

interface VideoCardProps {
  video: SavedVideoCard
  onClick?: () => void
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const dateStr = new Date(video.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const url = video.finalVideoUrl ?? video.pixverseCdnUrl
  const isPlayable = !!url && (video.status === 'done' || video.partial)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isPlayable}
      className="group overflow-hidden rounded-xl border border-border bg-surface text-left transition-all hover:border-accent/40 disabled:cursor-not-allowed"
    >
      <div className="relative aspect-video overflow-hidden bg-surface2">
        {video.thumbnailUrl || video.mascotImageUrl ? (
          <Image
            src={video.thumbnailUrl || video.mascotImageUrl}
            alt={video.templateName}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🎬</div>
        )}

        <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/30" />

        <div className="absolute inset-0 flex items-center justify-center">
          {isPlayable ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-bg shadow-accent-glow transition-transform group-hover:scale-110">
              <Play size={20} fill="currentColor" />
            </div>
          ) : video.status === 'failed' ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/40 bg-red-500/20 text-red-300">
              <AlertTriangle size={22} />
            </div>
          ) : (
            <div className="rounded-full border border-border bg-bg/70 px-3 py-1.5 text-xs text-muted backdrop-blur">
              {video.status === 'pending' || video.status === 'generating'
                ? 'Generating…'
                : video.status === 'extending'
                  ? `Extending ${video.currentClip}/${video.totalClips}`
                  : video.status}
            </div>
          )}
        </div>

        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded border border-border bg-bg/80 px-2 py-0.5 text-[10px] text-text backdrop-blur">
            <Clock size={10} />
            {video.duration}s
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-text">{video.templateName}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-[11px] text-muted">{video.mascotName}</p>
          <p className="shrink-0 text-[11px] text-muted">{dateStr}</p>
        </div>
      </div>
    </button>
  )
}
