'use client'

import Image from 'next/image'
import { Check, Clock, Film } from 'lucide-react'
import type { VideoTemplateSummary } from '@/video_templates/templates-client'

interface TemplateSelectorProps {
  templates: VideoTemplateSummary[]
  selectedId: string | null
  onSelect: (templateId: string) => void
  loading?: boolean
}

export default function TemplateSelector({
  templates,
  selectedId,
  onSelect,
  loading = false,
}: TemplateSelectorProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-video animate-pulse rounded-xl border border-border bg-surface2"
          />
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="text-sm text-muted">No templates available right now.</p>
      </div>
    )
  }

  const selected = templates.find((t) => t.id === selectedId)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => {
          const isSelected = selectedId === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={[
                'group relative overflow-hidden rounded-xl border-2 bg-surface2 text-left transition-all',
                isSelected
                  ? 'border-accent shadow-accent-glow ring-2 ring-accent/40'
                  : 'border-border hover:border-accent/40',
              ].join(' ')}
            >
              <div className="relative aspect-video bg-surface2">
                {t.thumbnail ? (
                  <Image
                    src={t.thumbnail}
                    alt={t.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    🎬
                  </div>
                )}
                {isSelected && (
                  <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-bg shadow-accent-glow">
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="bg-surface p-4">
                <h4 className="text-sm font-semibold text-text">{t.name}</h4>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                  {t.description}
                </p>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} /> {t.totalDuration}s
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Film size={11} /> {t.clipCount} scenes
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Scene Breakdown — {selected.name}
          </p>
          <ol className="space-y-2">
            {selected.clipPreviews.map((preview, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/15 text-[10px] font-bold text-accent">
                  {idx + 1}
                </span>
                <p className="text-xs leading-relaxed text-muted">{preview}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
