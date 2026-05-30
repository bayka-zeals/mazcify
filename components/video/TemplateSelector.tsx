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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-video rounded-xl border border-border bg-surface2 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-xl p-12 text-center">
        <p className="text-sm text-muted">No templates available right now.</p>
      </div>
    )
  }

  const selected = templates.find((t) => t.id === selectedId)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => {
          const isSelected = selectedId === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={[
                'group relative rounded-xl overflow-hidden border-2 bg-surface2 transition-all text-left',
                isSelected
                  ? 'border-accent ring-2 ring-accent/40 shadow-accent-glow'
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
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-bg shadow-accent-glow">
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="p-4 bg-surface">
                <h4 className="text-sm font-semibold text-text">{t.name}</h4>
                <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                  {t.description}
                </p>
                <div className="flex items-center gap-3 mt-3 text-[11px] text-muted">
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
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
            Scene Breakdown — {selected.name}
          </p>
          <ol className="space-y-2">
            {selected.clipPreviews.map((preview, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold">
                  {idx + 1}
                </span>
                <p className="text-xs text-muted leading-relaxed">{preview}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
