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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl border border-border bg-surface2"
          />
        ))}
      </div>
    )
  }

  if (mascots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <div className="mb-3 text-4xl">🎭</div>
        <h3 className="mb-2 text-base font-semibold text-text">No mascots yet</h3>
        <p className="mx-auto mb-6 max-w-xs text-sm text-muted">
          Create or upload a mascot first, then come back to bring it to life.
        </p>
        <a
          href="/dashboard/creation/new"
          className="inline-flex rounded-md bg-accent px-6 py-3 text-xs font-bold uppercase tracking-wider text-bg transition-all hover:shadow-accent-glow"
        >
          Create Mascot
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {mascots.map((m) => {
        const key = `${m.brandId}-${m.mascotId}`
        const selected = selectedKey === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(m)}
            className={[
              'group relative overflow-hidden rounded-xl border-2 bg-surface2 text-left transition-all',
              selected
                ? 'border-accent shadow-accent-glow ring-2 ring-accent/40'
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
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🎭</div>
              )}
              {selected && (
                <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-bg shadow-accent-glow">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="bg-surface p-3">
              <p className="truncate text-sm font-semibold text-text">{m.name}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] capitalize text-muted">
                <User2 size={10} /> {m.gender}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
