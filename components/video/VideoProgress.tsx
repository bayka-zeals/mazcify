'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, Film } from 'lucide-react'
import { VIDEO_GENERATION_MESSAGES } from '@/config/constants'

interface VideoProgressProps {
  totalClips: number
  currentClip: number
  /** 'pending' before clip 1 starts, 'clip' during clip generation, 'processing' near end, 'done' or 'error' */
  phase: 'pending' | 'clip' | 'processing' | 'done' | 'error'
  customMessage?: string
}

export default function VideoProgress({
  totalClips,
  currentClip,
  phase,
  customMessage,
}: VideoProgressProps) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (phase === 'done' || phase === 'error') return
    const tick = setInterval(() => setElapsed((p) => p + 1), 1000)
    return () => clearInterval(tick)
  }, [phase])

  useEffect(() => {
    if (phase === 'done' || phase === 'error') return
    const t = setInterval(() => {
      setMsgIndex((p) => (p + 1) % VIDEO_GENERATION_MESSAGES.length)
    }, 5500)
    return () => clearInterval(t)
  }, [phase])

  const safeCurrent = Math.max(0, Math.min(currentClip, totalClips))
  const progress =
    phase === 'done'
      ? 100
      : phase === 'processing'
        ? 95
        : Math.min(95, (safeCurrent / Math.max(1, totalClips)) * 92)

  const statusText =
    phase === 'done'
      ? 'Your video is ready!'
      : phase === 'error'
        ? customMessage || 'Generation hit a snag.'
        : phase === 'processing'
          ? 'Polishing the final cut…'
          : customMessage || VIDEO_GENERATION_MESSAGES[msgIndex]

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const elapsedStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="bg-surface border border-border rounded-xl p-8 sm:p-10">
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
        {phase === 'done' ? (
          <CheckCircle2 size={44} className="text-accent" />
        ) : phase === 'error' ? (
          <div className="w-11 h-11 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Film size={22} className="text-red-300" />
          </div>
        ) : (
          <Loader2 size={44} className="animate-spin text-accent" />
        )}

        <div className="text-center">
          <p className="text-base font-semibold text-text mb-1.5 transition-opacity duration-500">
            {statusText}
          </p>
          {phase !== 'done' && phase !== 'error' && (
            <p className="text-xs text-muted">
              Scene {Math.max(1, safeCurrent)} of {totalClips}
              {' · '}
              <span className="tabular-nums">{elapsedStr}</span> elapsed
            </p>
          )}
        </div>

        <div className="w-full">
          <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden border border-border">
            <div
              className={[
                'h-full transition-all duration-700 ease-out',
                phase === 'error' ? 'bg-red-400' : 'bg-accent',
              ].join(' ')}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between mt-3">
            {Array.from({ length: totalClips }).map((_, i) => {
              const reached = i < safeCurrent || phase === 'done'
              const active = i === safeCurrent - 1 && phase === 'clip'
              return (
                <div
                  key={i}
                  className={[
                    'h-1.5 flex-1 mx-0.5 rounded-full transition-colors',
                    reached
                      ? 'bg-accent'
                      : active
                        ? 'bg-accent/60 animate-pulse'
                        : 'bg-border',
                  ].join(' ')}
                />
              )
            })}
          </div>
        </div>

        {phase !== 'done' && phase !== 'error' && (
          <p className="text-[11px] text-muted text-center max-w-xs leading-relaxed">
            Generating cinematic scenes one at a time. This usually takes
            2–5 minutes total. Keep this tab open.
          </p>
        )}
      </div>
    </div>
  )
}
