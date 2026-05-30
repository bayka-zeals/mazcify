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
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8">
        <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text">
              Pick Your Mascot
            </h3>
            <p className="text-xs text-muted mt-1">
              Choose the variation that best matches your brand.
            </p>
          </div>
          {selectedId && (
            <span className="text-xs text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full font-medium">
              Selected
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="text-xs font-medium text-muted border border-border px-5 py-3 rounded-md hover:text-text hover:border-white/15 transition-colors disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted border border-border px-5 py-3 rounded-md hover:text-text hover:border-white/15 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} /> Regenerate
          </button>
        </div>

        <button
          type="button"
          disabled={!selected || loading}
          onClick={() => selected && onConfirm(selected)}
          className="inline-flex items-center gap-2 bg-accent text-bg text-sm font-bold tracking-wider uppercase px-8 py-3.5 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
        'group relative aspect-square rounded-xl overflow-hidden border-2 bg-surface2 transition-all',
        selected
          ? 'border-accent ring-2 ring-accent/40 shadow-accent-glow'
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
            'text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md',
            selected ? 'bg-accent text-bg' : 'bg-bg/80 text-text',
          ].join(' ')}
        >
          {selected ? 'Selected' : 'Select'}
        </span>
      </div>

      {selected && (
        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-bg">
          <Check size={16} strokeWidth={3} />
        </div>
      )}
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="aspect-square rounded-xl border border-border bg-surface2 flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      <Loader2 size={22} className="animate-spin text-muted relative z-10" />
    </div>
  )
}
