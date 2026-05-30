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
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface2 transition-colors"
        >
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Brand Summary
            </p>
            <p className="text-sm text-text font-medium truncate">
              {meta.companyName || 'Unknown company'}
            </p>
          </div>
          {open ? (
            <ChevronUp size={18} className="text-muted shrink-0" />
          ) : (
            <ChevronDown size={18} className="text-muted shrink-0" />
          )}
        </button>

        {open && (
          <div className="px-6 pb-6 pt-2 border-t border-border space-y-4">
            {/* Meta row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetaItem label="Company" value={meta.companyName} />
              <MetaItem label="Tone" value={meta.tone} />
            </div>

            {/* Colors */}
            {meta.colors?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
                  Palette
                </p>
                <div className="flex flex-wrap gap-2">
                  {meta.colors.map((c) => (
                    <div
                      key={c}
                      className="flex items-center gap-2 bg-surface2 border border-border rounded-md pl-2 pr-3 py-1"
                    >
                      <span
                        className="w-3 h-3 rounded-sm border border-white/10"
                        style={{ backgroundColor: c }}
                      />
                      <span className="text-xs text-text font-mono">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Taglines */}
            {meta.taglines?.length > 0 && (
              <ChipRow label="Taglines" items={meta.taglines} />
            )}

            {/* Products */}
            {meta.productNames?.length > 0 && (
              <ChipRow label="Products" items={meta.productNames} />
            )}

            {/* Brandbook excerpt */}
            {brandbook && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
                  Brandbook
                </p>
                <div className="bg-surface2 border border-border rounded-lg p-4 max-h-48 overflow-auto text-xs text-muted whitespace-pre-wrap leading-relaxed">
                  {brandbook}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editable prompt */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text">
            Image Prompt
          </h3>
        </div>
        <p className="text-xs text-muted">
          We crafted this prompt from your brand. Edit it freely before generating.
        </p>

        <textarea
          value={imagePrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={10}
          className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-y font-mono leading-relaxed"
          placeholder="A friendly cartoon fox mascot…"
        />

        <div className="flex items-center justify-between text-xs text-muted">
          <span>{imagePrompt.length} characters</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* CTAs */}
      <div className="flex items-center justify-between gap-4">
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
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-accent text-bg text-sm font-bold tracking-wider uppercase px-8 py-3.5 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
        {label}
      </p>
      <p className="text-sm text-text">{value}</p>
    </div>
  )
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="text-xs text-text bg-surface2 border border-border rounded-md px-2.5 py-1"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
