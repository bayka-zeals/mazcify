'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import type { BrandMeta, MascotVariation } from '@/types'
import GenerationProgress, { MASCOT_GENERATION_MESSAGES } from './GenerationProgress'

interface PromptEditorProps {
  imagePrompt: string
  brandbook: string
  meta: BrandMeta
  brandId: string
  mascotId: string
  onPromptChange: (next: string) => void
  onSuccess: (variations: MascotVariation[], prompt: string) => void
  onBack: () => void
}

export default function PromptEditor({
  imagePrompt,
  brandbook,
  meta,
  brandId,
  mascotId,
  onPromptChange,
  onSuccess,
  onBack,
}: PromptEditorProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setError(null)
    if (!imagePrompt.trim()) {
      setError('Prompt cannot be empty.')
      return
    }
    if (!user) {
      setError('You must be signed in.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/mascot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          brandId,
          mascotId,
          imagePrompt,
        }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `Request failed with ${res.status}`)
      }
      const data = await res.json()
      onSuccess(data.variations, imagePrompt)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Brandbook summary (collapsible) */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-surface2"
        >
          <div className="text-left">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
              Brand Summary
            </p>
            <p className="truncate text-sm font-medium text-text">
              {meta.companyName || 'Unknown company'}
            </p>
          </div>
          {open ? (
            <ChevronUp size={18} className="shrink-0 text-muted" />
          ) : (
            <ChevronDown size={18} className="shrink-0 text-muted" />
          )}
        </button>

        {open && (
          <div className="space-y-4 border-t border-border px-6 pb-6 pt-2">
            {/* Meta row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MetaItem label="Company" value={meta.companyName} />
              <MetaItem label="Tone" value={meta.tone} />
            </div>

            {/* Colors */}
            {meta.colors?.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Palette
                </p>
                <div className="flex flex-wrap gap-2">
                  {meta.colors.map((c) => (
                    <div
                      key={c}
                      className="flex items-center gap-2 rounded-md border border-border bg-surface2 py-1 pl-2 pr-3"
                    >
                      <span
                        className="h-3 w-3 rounded-sm border border-white/10"
                        style={{ backgroundColor: c }}
                      />
                      <span className="font-mono text-xs text-text">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Taglines */}
            {meta.taglines?.length > 0 && <ChipRow label="Taglines" items={meta.taglines} />}

            {/* Products */}
            {meta.productNames?.length > 0 && (
              <ChipRow label="Products" items={meta.productNames} />
            )}

            {/* Brandbook excerpt */}
            {brandbook && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Brandbook
                </p>
                <div className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface2 p-4 text-xs leading-relaxed text-muted">
                  {brandbook}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editable prompt */}
      <div className="space-y-4 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text">Image Prompt</h3>
        </div>
        <p className="text-xs text-muted">
          We crafted this prompt from your brand. Edit it freely before generating.
        </p>

        <textarea
          value={imagePrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={10}
          className="w-full resize-y rounded-lg border border-border bg-surface2 px-4 py-3 font-mono text-sm leading-relaxed text-text transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
          placeholder="A friendly cartoon fox mascot…"
        />

        <div className="flex items-center justify-between text-xs text-muted">
          <span>{imagePrompt.length} characters</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* CTAs */}
      <div className="flex items-center justify-between gap-4">
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
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-accent-glow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {loading ? (
            <GenerationProgress messages={MASCOT_GENERATION_MESSAGES} variant="inline" />
          ) : (
            'Generate Mascot'
          )}
        </button>
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-sm text-text">{value}</p>
    </div>
  )
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-md border border-border bg-surface2 px-2.5 py-1 text-xs text-text"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
