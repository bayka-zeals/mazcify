'use client'

import Image from 'next/image'
import { Check, User2 } from 'lucide-react'
import type { SavedMascotCard } from '@/lib/firestore-client'

interface MascotSelectorProps {
  mascots: SavedMascotCard[]
  selectedKey: string | null
  onSelect: (mascot: SavedMascotCard) => void
  loading?: boolean
}

export default function MascotSelector({
  mascots,
  selectedKey,
  onSelect,
  loading = false,
}: MascotSelectorProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-xl border border-border bg-surface2 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (mascots.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-xl p-12 text-center">
        <div className="text-4xl mb-3">🎭</div>
        <h3 className="text-base font-semibold text-text mb-2">No mascots yet</h3>
        <p className="text-sm text-muted max-w-xs mx-auto mb-6">
          Create or upload a mascot first, then come back to bring it to life.
        </p>
        <a
          href="/dashboard/creation/new"
          className="inline-flex bg-accent text-bg text-xs font-bold tracking-wider uppercase px-6 py-3 rounded-md hover:shadow-accent-glow transition-all"
        >
          Create Mascot
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {mascots.map((m) => {
        const key = `${m.brandId}-${m.mascotId}`
        const selected = selectedKey === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(m)}
            className={[
              'group relative rounded-xl overflow-hidden border-2 bg-surface2 transition-all text-left',
              selected
                ? 'border-accent ring-2 ring-accent/40 shadow-accent-glow'
                : 'border-border hover:border-accent/40',
            ].join(' ')}
          >
            <div className="relative aspect-square bg-surface2">
              {m.chosenImageUrl ? (
                <Image
                  src={m.chosenImageUrl}
                  alt={m.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                  🎭
                </div>
              )}
              {selected && (
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-bg shadow-accent-glow">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="p-3 bg-surface">
              <p className="text-sm font-semibold text-text truncate">{m.name}</p>
              <p className="text-[11px] text-muted mt-0.5 inline-flex items-center gap-1 capitalize">
                <User2 size={10} /> {m.gender}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
