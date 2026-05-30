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
      className="group bg-surface border border-border rounded-xl overflow-hidden text-left hover:border-accent/40 transition-all disabled:cursor-not-allowed"
    >
      <div className="relative aspect-video bg-surface2 overflow-hidden">
        {video.thumbnailUrl || video.mascotImageUrl ? (
          <Image
            src={video.thumbnailUrl || video.mascotImageUrl}
            alt={video.templateName}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            🎬
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

        <div className="absolute inset-0 flex items-center justify-center">
          {isPlayable ? (
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-bg shadow-accent-glow group-hover:scale-110 transition-transform">
              <Play size={20} fill="currentColor" />
            </div>
          ) : video.status === 'failed' ? (
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-300">
              <AlertTriangle size={22} />
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-bg/70 border border-border rounded-full text-xs text-muted backdrop-blur">
              {video.status === 'pending' || video.status === 'generating'
                ? 'Generating…'
                : video.status === 'extending'
                  ? `Extending ${video.currentClip}/${video.totalClips}`
                  : video.status}
            </div>
          )}
        </div>

        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-bg/80 border border-border rounded px-2 py-0.5 text-[10px] text-text backdrop-blur">
            <Clock size={10} />
            {video.duration}s
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-text truncate">
          {video.templateName}
        </h3>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="text-[11px] text-muted truncate">{video.mascotName}</p>
          <p className="text-[11px] text-muted shrink-0">{dateStr}</p>
        </div>
      </div>
    </button>
  )
}
