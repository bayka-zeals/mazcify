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
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text">
            Character Sheet
          </h3>
          <p className="text-xs text-muted mt-1">
            {loading
              ? 'Generating your character sheet — this may take a minute…'
              : 'Your mascot\u2019s multi-angle reference sheet is ready.'}
          </p>
        </div>

        {loading ? (
          <div className="aspect-video rounded-xl border border-border bg-surface2 flex flex-col items-center justify-center gap-4 py-12">
            <GenerationProgress messages={SHEET_GENERATION_MESSAGES} variant="block" intervalMs={6000} />
          </div>
        ) : characterSheetUrl ? (
          <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-surface2">
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
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-surface2 shrink-0">
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
              <p className="text-[11px] text-muted mt-0.5">
                This mascot and character sheet will be saved to your brand.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && characterSheetUrl && (
        <div className="flex items-center justify-end gap-4">
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
              'Save Character'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
