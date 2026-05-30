'use client'

import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import GenerationProgress, { SHEET_GENERATION_MESSAGES } from './GenerationProgress'

interface CharacterSheetViewProps {
  characterSheetUrl: string | null
  mascotImageUrl: string
  loading: boolean
  saving: boolean
  error: string | null
  onSave: () => void
}

export default function CharacterSheetView({
  characterSheetUrl,
  mascotImageUrl,
  loading,
  saving,
  error,
  onSave,
}: CharacterSheetViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text">
            Character Sheet
          </h3>
          <p className="mt-1 text-xs text-muted">
            {loading
              ? 'Generating your character sheet — this may take a minute…'
              : 'Your mascot\u2019s multi-angle reference sheet is ready.'}
          </p>
        </div>

        {loading ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface2 py-12">
            <GenerationProgress
              messages={SHEET_GENERATION_MESSAGES}
              variant="block"
              intervalMs={6000}
            />
          </div>
        ) : characterSheetUrl ? (
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface2">
            <Image
              src={characterSheetUrl}
              alt="Character sheet"
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-contain"
              unoptimized
            />
          </div>
        ) : null}

        {/* Selected mascot thumbnail */}
        {!loading && characterSheetUrl && (
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface2">
              <Image
                src={mascotImageUrl}
                alt="Selected mascot"
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-text">Selected Mascot</p>
              <p className="mt-0.5 text-[11px] text-muted">
                This mascot and character sheet will be saved to your brand.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && characterSheetUrl && (
        <div className="flex items-center justify-end gap-4">
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
              'Save Character'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
