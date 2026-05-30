'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Check, Loader2, RefreshCw } from 'lucide-react'
import type { MascotVariation } from '@/types'
import GenerationProgress, { SHEET_GENERATION_MESSAGES } from './GenerationProgress'

interface MascotVariationsProps {
  variations: MascotVariation[]
  onConfirm: (variation: MascotVariation) => void
  onRegenerate: () => void
  onBack: () => void
  loading?: boolean
}

export default function MascotVariations({
  variations,
  onConfirm,
  onRegenerate,
  onBack,
  loading = false,
}: MascotVariationsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const isLoading = variations.length === 0

  const selected = variations.find((v) => v.id === selectedId)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text">
              Pick Your Mascot
            </h3>
            <p className="mt-1 text-xs text-muted">
              Choose the variation that best matches your brand.
            </p>
          </div>
          {selectedId && (
            <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
              Selected
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isLoading
            ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
            : variations.map((v) => (
                <VariationCard
                  key={v.id}
                  variation={v}
                  selected={selectedId === v.id}
                  disabled={loading}
                  onClick={() => setSelectedId(v.id)}
                />
              ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="rounded-md border border-border px-5 py-3 text-xs font-medium text-muted transition-colors hover:border-white/15 hover:text-text disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-xs font-medium text-muted transition-colors hover:border-white/15 hover:text-text disabled:opacity-50"
          >
            <RefreshCw size={14} /> Regenerate
          </button>
        </div>

        <button
          type="button"
          disabled={!selected || loading}
          onClick={() => selected && onConfirm(selected)}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-accent-glow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {loading ? (
            <GenerationProgress messages={SHEET_GENERATION_MESSAGES} variant="inline" />
          ) : (
            'Generate Character Sheet'
          )}
        </button>
      </div>
    </div>
  )
}

function VariationCard({
  variation,
  selected,
  disabled,
  onClick,
}: {
  variation: MascotVariation
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'group relative aspect-square overflow-hidden rounded-xl border-2 bg-surface2 transition-all',
        selected
          ? 'border-accent shadow-accent-glow ring-2 ring-accent/40'
          : 'border-border hover:border-accent/40',
        disabled ? 'pointer-events-none' : '',
      ].join(' ')}
    >
      <Image
        src={variation.imageUrl}
        alt={`Mascot variation ${variation.id}`}
        fill
        sizes="(max-width: 640px) 100vw, 33vw"
        className="object-cover"
        unoptimized
      />

      <div
        className={[
          'absolute inset-0 flex items-end justify-start p-3 transition-opacity',
          selected
            ? 'bg-gradient-to-t from-accent/40 via-transparent to-transparent opacity-100'
            : 'bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100',
        ].join(' ')}
      >
        <span
          className={[
            'rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider',
            selected ? 'bg-accent text-bg' : 'bg-bg/80 text-text',
          ].join(' ')}
        >
          {selected ? 'Selected' : 'Select'}
        </span>
      </div>

      {selected && (
        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-bg">
          <Check size={16} strokeWidth={3} />
        </div>
      )}
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-surface2">
      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <Loader2 size={22} className="relative z-10 animate-spin text-muted" />
    </div>
  )
}
