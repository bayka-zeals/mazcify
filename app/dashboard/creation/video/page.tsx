'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkles, AlertCircle } from 'lucide-react'

import { useAuth } from '@/lib/auth-context'
import {
  getMascots,
  getVideos,
  createVideoDoc,
  updateVideoProgress,
  finalizeVideo,
  failVideo,
  setVideoFeedback,
  softDeleteVideo,
  uploadVideoBackup,
  type SavedMascotCard,
} from '@/lib/firestore-client'
import { PLAN_LIMITS, isAdmin } from '@/config/constants'
import type { VideoFeedback, VideoProgressEvent } from '@/types'
import type { VideoTemplateSummary } from '@/video_templates/templates-client'

import MascotSelector from '@/components/video/MascotSelector'
import TemplateSelector from '@/components/video/TemplateSelector'
import VideoProgress from '@/components/video/VideoProgress'
import VideoPlayer from '@/components/video/VideoPlayer'

type Phase = 'mascot' | 'template' | 'generating' | 'preview'

interface GenerationState {
  videoId: string
  totalClips: number
  currentClip: number
  status: 'pending' | 'generating' | 'extending' | 'processing' | 'done' | 'failed'
  finalVideoUrl: string | null
  pixverseCdnUrl: string | null
  duration: number
  errorMessage: string | null
  partial: boolean
  clipVideoIds: string[]
}

export default function VideoGenerationPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('mascot')

  const [mascots, setMascots] = useState<SavedMascotCard[]>([])
  const [templates, setTemplates] = useState<VideoTemplateSummary[]>([])
  const [videoCount, setVideoCount] = useState<number>(0)
  const [loadingState, setLoadingState] = useState<{
    mascots: boolean
    templates: boolean
  }>({ mascots: true, templates: true })
  const [error, setError] = useState<string | null>(null)

  const [selectedMascot, setSelectedMascot] = useState<SavedMascotCard | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const [generation, setGeneration] = useState<GenerationState | null>(null)
  const [feedback, setFeedback] = useState<VideoFeedback>(null)
  const [savedToFirestore, setSavedToFirestore] = useState(false)
  const [saving, setSaving] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Auth guard
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Initial data load
  useEffect(() => {
    if (!user) return

    let cancelled = false
    const load = async () => {
      try {
        const [mascotList, videoList, templateRes] = await Promise.all([
          getMascots(user.uid),
          getVideos(user.uid),
          fetch('/api/video', { method: 'GET' }).then((r) => r.json()),
        ])
        if (cancelled) return
        setMascots(mascotList)
        setVideoCount(videoList.length)
        setTemplates(
          (templateRes.templates as VideoTemplateSummary[] | undefined) ?? [],
        )
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load video page data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load page data.')
      } finally {
        if (!cancelled) {
          setLoadingState({ mascots: false, templates: false })
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user])

  // Cancel any in-flight stream when navigating away
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const admin = isAdmin(user?.uid)
  const limitReached = !admin && videoCount >= PLAN_LIMITS.free.videosMax

  const handleGenerate = async () => {
    if (!user || !selectedMascot || !selectedTemplateId) return
    if (limitReached) {
      setError(
        `You've reached your free plan limit of ${PLAN_LIMITS.free.videosMax} video${PLAN_LIMITS.free.videosMax === 1 ? '' : 's'}. Delete an existing video first.`,
      )
      return
    }

    setError(null)
    setFeedback(null)
    setSavedToFirestore(false)
    setPhase('generating')

    let videoId: string
    try {
      videoId = await createVideoDoc(user.uid, {
        brandId: selectedMascot.brandId,
        mascotId: selectedMascot.mascotId,
        mascotName: selectedMascot.name,
        mascotImageUrl: selectedMascot.chosenImageUrl,
        templateId: selectedTemplateId,
        templateName:
          templates.find((t) => t.id === selectedTemplateId)?.name ?? 'Video',
        totalClips: 6,
      })
    } catch (err) {
      console.error('Failed to create video doc:', err)
      setError('Failed to start the video. Please try again.')
      setPhase('template')
      return
    }

    setGeneration({
      videoId,
      totalClips: 6,
      currentClip: 0,
      status: 'pending',
      finalVideoUrl: null,
      pixverseCdnUrl: null,
      duration: 0,
      errorMessage: null,
      partial: false,
      clipVideoIds: [],
    })

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          userId: user.uid,
          brandId: selectedMascot.brandId,
          mascotId: selectedMascot.mascotId,
          mascotName: selectedMascot.name,
          mascotImageUrl: selectedMascot.chosenImageUrl,
          mascotDescription: selectedMascot.description,
          templateId: selectedTemplateId,
          videoId,
          currentVideoCount: videoCount,
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        const message =
          errBody.message || errBody.error || `Request failed (${res.status})`
        throw new Error(message)
      }

      if (!res.body) throw new Error('Streaming not supported by this browser.')

      await consumeSseStream(res.body, async (event) => {
        await handleProgressEvent(
          event,
          videoId,
          selectedMascot.brandId,
          user.uid,
        )
      })
    } catch (err) {
      if (controller.signal.aborted) {
        console.warn('Video generation aborted by user.')
        return
      }
      console.error('Video generation failed:', err)
      const message = err instanceof Error ? err.message : 'Generation failed.'
      setGeneration((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              errorMessage: message,
            }
          : prev,
      )
      try {
        await failVideo(user.uid, selectedMascot.brandId, videoId, message)
      } catch {
        // best effort
      }
      setError(message)
      setPhase('preview')
    }
  }

  const handleProgressEvent = async (
    event: VideoProgressEvent,
    videoId: string,
    brandId: string,
    uid: string,
  ) => {
    setGeneration((prev) => {
      if (!prev) return prev
      switch (event.type) {
        case 'init':
          return { ...prev, totalClips: event.totalClips, status: 'generating' }
        case 'clip_start':
          return {
            ...prev,
            currentClip: event.clipIndex,
            totalClips: event.totalClips,
            status: event.clipIndex === 1 ? 'generating' : 'extending',
          }
        case 'clip_done':
          return {
            ...prev,
            currentClip: event.clipIndex,
            totalClips: event.totalClips,
            clipVideoIds: [...prev.clipVideoIds, event.videoId],
          }
        case 'processing':
          return { ...prev, status: 'processing' }
        case 'done':
          return {
            ...prev,
            status: 'done',
            finalVideoUrl: event.finalVideoUrl,
            pixverseCdnUrl: event.pixverseCdnUrl,
            duration: event.duration,
            currentClip: prev.totalClips,
          }
        case 'partial':
          return {
            ...prev,
            status: 'failed',
            partial: true,
            finalVideoUrl: event.finalVideoUrl,
            pixverseCdnUrl: event.pixverseCdnUrl,
            currentClip: event.completedClips,
            totalClips: event.totalClips,
            errorMessage: event.errorMessage,
            duration: event.completedClips * 5,
          }
        case 'error':
          return {
            ...prev,
            status: 'failed',
            errorMessage: event.message,
          }
        default:
          return prev
      }
    })

    // Persist intermediate progress to Firestore (best-effort)
    try {
      if (event.type === 'clip_done') {
        await updateVideoProgress(uid, brandId, videoId, {
          currentClip: event.clipIndex,
          status: event.clipIndex === event.totalClips ? 'processing' : 'extending',
        })
      } else if (event.type === 'done') {
        await finalizeVideo(uid, brandId, videoId, {
          finalVideoUrl: event.finalVideoUrl,
          pixverseCdnUrl: event.pixverseCdnUrl,
          thumbnailUrl: null,
          duration: event.duration,
          clipVideoIds: [],
        })
        setPhase('preview')
        setVideoCount((c) => c + 1)
      } else if (event.type === 'partial') {
        await finalizeVideo(uid, brandId, videoId, {
          finalVideoUrl: event.finalVideoUrl,
          pixverseCdnUrl: event.pixverseCdnUrl,
          thumbnailUrl: null,
          duration: event.completedClips * 5,
          clipVideoIds: [],
          partial: true,
          errorMessage: event.errorMessage,
        })
        setPhase('preview')
      } else if (event.type === 'error') {
        await failVideo(uid, brandId, videoId, event.message)
        setPhase('preview')
      }
    } catch (persistErr) {
      console.warn('Failed to persist progress event:', persistErr)
    }
  }

  const handleSave = async () => {
    if (!user || !generation || !selectedMascot) return
    if (!generation.finalVideoUrl && !generation.pixverseCdnUrl) return

    setSaving(true)
    try {
      const sourceUrl =
        generation.finalVideoUrl ?? generation.pixverseCdnUrl!
      // Best-effort: back up to Firebase Storage
      let backupUrl: string | null = null
      try {
        backupUrl = await uploadVideoBackup(
          user.uid,
          generation.videoId,
          sourceUrl,
        )
      } catch (uploadErr) {
        console.warn('Storage backup failed (will keep PixVerse URL):', uploadErr)
      }

      await finalizeVideo(user.uid, selectedMascot.brandId, generation.videoId, {
        finalVideoUrl: backupUrl ?? sourceUrl,
        pixverseCdnUrl: generation.pixverseCdnUrl ?? sourceUrl,
        thumbnailUrl: selectedMascot.chosenImageUrl,
        duration: generation.duration,
        clipVideoIds: generation.clipVideoIds,
        partial: generation.partial,
      })
      setSavedToFirestore(true)
    } catch (err) {
      console.error('Save failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to save the video.')
    } finally {
      setSaving(false)
    }
  }

  const handleLike = async (next: VideoFeedback) => {
    if (!user || !generation || !selectedMascot) return
    setFeedback(next)
    try {
      await setVideoFeedback(
        user.uid,
        selectedMascot.brandId,
        generation.videoId,
        next,
      )
    } catch (err) {
      console.warn('Failed to save feedback:', err)
    }
  }

  const handleDelete = async () => {
    if (!user || !generation || !selectedMascot) return
    if (!confirm('Delete this video? It will disappear from your gallery.')) return

    try {
      await softDeleteVideo(
        user.uid,
        selectedMascot.brandId,
        generation.videoId,
      )
      router.push('/dashboard/creation')
    } catch (err) {
      console.error('Delete failed:', err)
      setError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  const phaseFromGeneration: 'pending' | 'clip' | 'processing' | 'done' | 'error' =
    !generation || generation.status === 'pending'
      ? 'pending'
      : generation.status === 'failed'
        ? 'error'
        : generation.status === 'processing'
          ? 'processing'
          : generation.status === 'done'
            ? 'done'
            : 'clip'

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <Link
          href="/dashboard/creation"
          className="inline-flex items-center gap-2 text-xs text-muted hover:text-text transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to Creation
        </Link>
        <p className="text-accent text-xs font-semibold tracking-[3px] uppercase mb-1">
          Step 2 — Video Generation
        </p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-text">
          Bring Your Mascot to Life
        </h1>
      </div>

      <PhaseIndicator phase={phase} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {limitReached && phase !== 'preview' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 rounded-lg px-4 py-3 text-sm">
          You&apos;ve reached the free plan limit of{' '}
          {PLAN_LIMITS.free.videosMax} video
          {PLAN_LIMITS.free.videosMax === 1 ? '' : 's'}. Delete an existing video to make
          room or upgrade.
        </div>
      )}

      {phase === 'mascot' && (
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text mb-1">
              01 · Choose a mascot
            </h2>
            <p className="text-xs text-muted">
              Pick the mascot you want to star in the video.
            </p>
          </div>
          <MascotSelector
            mascots={mascots}
            selectedKey={
              selectedMascot
                ? `${selectedMascot.brandId}-${selectedMascot.mascotId}`
                : null
            }
            onSelect={setSelectedMascot}
            loading={loadingState.mascots}
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!selectedMascot}
              onClick={() => setPhase('template')}
              className="inline-flex items-center gap-2 bg-accent text-bg text-sm font-bold tracking-wider uppercase px-8 py-3.5 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {phase === 'template' && (
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text mb-1">
              02 · Choose a video template
            </h2>
            <p className="text-xs text-muted">
              Each template is a 30-second story split into 6 cinematic scenes.
            </p>
          </div>
          <TemplateSelector
            templates={templates}
            selectedId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
            loading={loadingState.templates}
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPhase('mascot')}
              className="text-xs font-medium text-muted border border-border px-5 py-3 rounded-md hover:text-text hover:border-white/15 transition-colors"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedTemplateId || limitReached}
              className="inline-flex items-center gap-2 bg-accent text-bg text-sm font-bold tracking-wider uppercase px-8 py-3.5 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <Sparkles size={16} /> Generate Video
            </button>
          </div>
        </section>
      )}

      {phase === 'generating' && generation && (
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text mb-1">
              03 · Generating
            </h2>
            <p className="text-xs text-muted">
              Bringing {selectedMascot?.name} to life one scene at a time.
            </p>
          </div>
          <VideoProgress
            totalClips={generation.totalClips}
            currentClip={generation.currentClip}
            phase={phaseFromGeneration}
            customMessage={generation.errorMessage ?? undefined}
          />
        </section>
      )}

      {phase === 'preview' && generation && selectedMascot && (
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text mb-1">
              04 · Preview
            </h2>
            <p className="text-xs text-muted">
              {generation.partial
                ? 'A partial video was generated. You can save what we got, or try again.'
                : 'Your video is ready. Save it to keep it in your gallery.'}
            </p>
          </div>

          {(generation.finalVideoUrl || generation.pixverseCdnUrl) ? (
            <VideoPlayer
              videoUrl={
                (generation.finalVideoUrl || generation.pixverseCdnUrl) as string
              }
              thumbnailUrl={selectedMascot.chosenImageUrl}
              templateName={
                templates.find((t) => t.id === selectedTemplateId)?.name ??
                'Video'
              }
              mascotName={selectedMascot.name}
              duration={generation.duration}
              liked={feedback}
              saving={saving}
              saved={savedToFirestore}
              partial={generation.partial}
              onSave={handleSave}
              onDelete={handleDelete}
              onLike={handleLike}
            />
          ) : (
            <div className="bg-surface border border-border rounded-xl p-10 text-center">
              <p className="text-sm text-muted">
                {generation.errorMessage ??
                  'No video was produced. Please try again.'}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setPhase('template')
                setGeneration(null)
                setFeedback(null)
                setSavedToFirestore(false)
              }}
              className="text-xs font-medium text-muted border border-border px-5 py-3 rounded-md hover:text-text hover:border-white/15 transition-colors"
            >
              Generate Another
            </button>
            {savedToFirestore && (
              <Link
                href="/dashboard/creation"
                className="inline-flex items-center gap-2 bg-accent text-bg text-sm font-bold tracking-wider uppercase px-6 py-3 rounded-md hover:shadow-accent-glow transition-all"
              >
                Back to Gallery
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function PhaseIndicator({ phase }: { phase: Phase }) {
  const steps: { id: Phase; label: string }[] = [
    { id: 'mascot', label: '01 · Mascot' },
    { id: 'template', label: '02 · Template' },
    { id: 'generating', label: '03 · Generate' },
    { id: 'preview', label: '04 · Preview' },
  ]

  const activeIndex = steps.findIndex((s) => s.id === phase)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {steps.map((step, idx) => {
        const isActive = idx === activeIndex
        const isDone = idx < activeIndex
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div
              className={[
                'px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border transition-colors',
                isActive
                  ? 'bg-accent text-bg border-accent'
                  : isDone
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'bg-surface text-muted border-border',
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

/**
 * Parse a `text/event-stream` body into VideoProgressEvent objects and call
 * the handler for each one.
 */
async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: VideoProgressEvent) => Promise<void>,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sepIdx: number
    while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sepIdx)
      buffer = buffer.slice(sepIdx + 2)

      const dataLines = rawEvent
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())

      if (dataLines.length === 0) continue

      const json = dataLines.join('\n')
      try {
        const parsed = JSON.parse(json) as VideoProgressEvent
        await onEvent(parsed)
      } catch (err) {
        console.warn('Failed to parse SSE event:', err, json)
      }
    }
  }
}
