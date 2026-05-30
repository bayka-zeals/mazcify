'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Step1Form from '@/components/creation/Step1Form'
import PromptEditor from '@/components/creation/PromptEditor'
import MascotVariations from '@/components/creation/MascotVariations'
import CharacterSheetView from '@/components/creation/CharacterSheetView'
import { useAuth } from '@/lib/auth-context'
import {
  getMascots,
  saveBrand,
  saveMascot,
  savePromptVersion,
  updateMascotChosen,
} from '@/lib/firestore-client'
import { PLAN_LIMITS, isAdmin } from '@/config/constants'
import type { BrandMeta, MascotVariation } from '@/types'

type Phase = 'form' | 'prompt' | 'variations' | 'sheet'

interface ScrapeResult {
  brandbook: string
  meta: BrandMeta
  imagePrompt: string
  brandId: string
  mascotId: string
  mascotName: string
  gender: 'male' | 'female' | 'neutral'
  description: string
}

export default function CreationNewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('form')
  const [scrape, setScrape] = useState<ScrapeResult | null>(null)
  const [editedPrompt, setEditedPrompt] = useState<string>('')
  const [variations, setVariations] = useState<MascotVariation[]>([])
  const [formGender, setFormGender] = useState<'male' | 'female' | 'neutral'>('neutral')
  const [formName, setFormName] = useState<string>('')
  const [formDescription, setFormDescription] = useState<string>('')

  const [chosenVariation, setChosenVariation] = useState<MascotVariation | null>(null)
  const [characterSheetUrl, setCharacterSheetUrl] = useState<string | null>(null)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [mascotCount, setMascotCount] = useState<number>(0)
  const [mascotCountLoaded, setMascotCountLoaded] = useState(false)

  const phaseContentRef = useRef<HTMLDivElement>(null)
  const sheetAbortRef = useRef<AbortController | null>(null)

  const admin = isAdmin(user?.uid)
  const mascotLimit = PLAN_LIMITS.free.mascotsMax
  const limitReached = !admin && mascotCount >= mascotLimit

  useEffect(() => {
    if (!user) {
      setMascotCountLoaded(true)
      return
    }
    let cancelled = false
    getMascots(user.uid)
      .then((m) => {
        if (!cancelled) setMascotCount(m.length)
      })
      .catch((err) => {
        console.warn('Failed to load mascot count:', err)
      })
      .finally(() => {
        if (!cancelled) setMascotCountLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (phase !== 'form' && phaseContentRef.current) {
      phaseContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [phase])

  useEffect(() => {
    return () => {
      sheetAbortRef.current?.abort()
    }
  }, [])

  const handleScrapeSuccess = async (data: ScrapeResult) => {
    setScrape(data)
    setEditedPrompt(data.imagePrompt)
    setFormName(data.mascotName)
    setFormGender(data.gender)
    setFormDescription(data.description)
    setPhase('prompt')

    if (user) {
      try {
        await saveBrand(user.uid, data.brandId, {
          ...data.meta,
          brandbook: data.brandbook,
        })
        await saveMascot(user.uid, data.brandId, data.mascotId, {
          name: data.mascotName,
          gender: data.gender,
          description: data.description,
          imagePrompt: data.imagePrompt,
          status: 'generating',
        })
      } catch (err) {
        console.error('Firestore save failed:', err)
      }
    }
  }

  const handleVariationsSuccess = async (vars: MascotVariation[], prompt: string) => {
    setVariations(vars)
    setEditedPrompt(prompt)
    setPhase('variations')

    if (user && scrape) {
      try {
        await savePromptVersion(user.uid, scrape.brandId, prompt)
        await saveMascot(user.uid, scrape.brandId, scrape.mascotId, {
          imagePrompt: prompt,
          status: 'selecting',
        })
      } catch (err) {
        console.error('Firestore save failed:', err)
      }
    }
  }

  const handleGenerateSheet = async (variation: MascotVariation) => {
    if (!user || !scrape) return

    sheetAbortRef.current?.abort()
    const controller = new AbortController()
    sheetAbortRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000)

    setChosenVariation(variation)
    setCharacterSheetUrl(null)
    setSheetError(null)
    setSheetLoading(true)
    setPhase('sheet')

    try {
      const res = await fetch('/api/mascot', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          userId: user.uid,
          brandId: scrape.brandId,
          mascotId: scrape.mascotId,
          chosenVariationId: variation.id,
          chosenImageUrl: variation.imageUrl,
          gender: formGender,
          mascotName: formName || undefined,
          description: formDescription || undefined,
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `Request failed with ${res.status}`)
      }

      const data = await res.json()
      setCharacterSheetUrl(data.characterSheetUrl)
    } catch (err) {
      if (controller.signal.aborted) {
        setSheetError('Request timed out. Please try again.')
      } else {
        console.error(err)
        setSheetError(err instanceof Error ? err.message : 'Failed to generate character sheet.')
      }
    } finally {
      clearTimeout(timeoutId)
      setSheetLoading(false)
    }
  }

  const handleSaveCharacter = async () => {
    if (!user || !scrape || !chosenVariation || !characterSheetUrl) return

    setSaving(true)
    try {
      const savePromise = updateMascotChosen(
        user.uid,
        scrape.brandId,
        scrape.mascotId,
        chosenVariation.imageUrl,
        characterSheetUrl,
        formName || undefined
      )
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Save timed out after 30s. Please try again.')), 30_000)
      )
      await Promise.race([savePromise, timeout])
      router.push('/dashboard/creation')
    } catch (err) {
      console.error('Save failed:', err)
      setSheetError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link
          href="/dashboard/creation"
          className="mb-4 inline-flex items-center gap-2 text-xs text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={14} /> Back to Creation
        </Link>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[3px] text-accent">
          Step 1 — Image Generation
        </p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-text">
          Mazcot Generation
        </h1>
      </div>

      <PhaseIndicator phase={phase} />

      <div ref={phaseContentRef} />
      {phase === 'form' &&
        (limitReached ? (
          <div className="space-y-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-6 text-yellow-200">
            <p className="text-sm font-semibold">
              You&apos;ve reached your free plan limit of {mascotLimit} mascot
              {mascotLimit === 1 ? '' : 's'}.
            </p>
            <p className="text-xs text-yellow-200/80">
              Delete your existing mascot from the gallery to make room for a new one.
            </p>
            <Link
              href="/dashboard/creation"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-bg transition-all hover:shadow-accent-glow"
            >
              Back to Gallery
            </Link>
          </div>
        ) : mascotCountLoaded ? (
          <Step1Form currentMascotCount={mascotCount} onSuccess={handleScrapeSuccess} />
        ) : (
          <div className="rounded-xl border border-border bg-surface p-10 text-center">
            <p className="animate-pulse text-sm text-muted">Checking your plan…</p>
          </div>
        ))}

      {phase === 'prompt' && scrape && (
        <PromptEditor
          imagePrompt={editedPrompt}
          brandbook={scrape.brandbook}
          meta={scrape.meta}
          brandId={scrape.brandId}
          mascotId={scrape.mascotId}
          onPromptChange={setEditedPrompt}
          onSuccess={handleVariationsSuccess}
          onBack={() => setPhase('form')}
        />
      )}

      {phase === 'variations' && scrape && (
        <MascotVariations
          variations={variations}
          onConfirm={handleGenerateSheet}
          onRegenerate={() => setPhase('prompt')}
          onBack={() => setPhase('form')}
          loading={sheetLoading}
        />
      )}

      {phase === 'sheet' && chosenVariation && (
        <CharacterSheetView
          characterSheetUrl={characterSheetUrl}
          mascotImageUrl={chosenVariation.imageUrl}
          loading={sheetLoading}
          saving={saving}
          error={sheetError}
          onSave={handleSaveCharacter}
        />
      )}
    </div>
  )
}

function PhaseIndicator({ phase }: { phase: Phase }) {
  const steps: { id: Phase; label: string }[] = [
    { id: 'form', label: '01 · Brand' },
    { id: 'prompt', label: '02 · Prompt' },
    { id: 'variations', label: '03 · Mascot' },
    { id: 'sheet', label: '04 · Sheet' },
  ]

  const activeIndex = steps.findIndex((s) => s.id === phase)

  return (
    <div className="flex items-center gap-3">
      {steps.map((step, idx) => {
        const isActive = idx === activeIndex
        const isDone = idx < activeIndex
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div
              className={[
                'rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors',
                isActive
                  ? 'border-accent bg-accent text-bg'
                  : isDone
                    ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-border bg-surface text-muted',
              ].join(' ')}
            >
              {step.label}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={[
                  'h-px w-8 transition-colors',
                  idx < activeIndex ? 'bg-accent/40' : 'bg-border',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
