'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface GenerationProgressProps {
  messages: string[]
  intervalMs?: number
  variant?: 'inline' | 'block'
}

export default function GenerationProgress({
  messages,
  intervalMs = 5000,
  variant = 'inline',
}: GenerationProgressProps) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    setMsgIndex(0)
    setElapsed(0)
  }, [messages])

  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed((prev) => prev + 100)
    }, 100)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (messages.length <= 1) return
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [messages, intervalMs])

  const currentMsg = messages[msgIndex] || messages[0]
  const progressPercent = Math.min(
    ((msgIndex * intervalMs + (elapsed % intervalMs)) / (messages.length * intervalMs)) * 95,
    95
  )

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span className="transition-opacity duration-300">{currentMsg}</span>
      </span>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5">
      <Loader2 size={32} className="animate-spin text-accent" />

      <p className="h-5 text-center text-sm text-muted transition-all duration-500 ease-in-out">
        {currentMsg}
      </p>

      <div className="w-full space-y-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full border border-border bg-surface2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted">
          <span>
            Step {msgIndex + 1} of {messages.length}
          </span>
          <span>{Math.round(elapsed / 1000)}s</span>
        </div>
      </div>
    </div>
  )
}

export const MASCOT_GENERATION_MESSAGES = [
  'Warming up the AI engine…',
  'Interpreting your brand identity…',
  'Designing mascot concepts…',
  'Rendering character details…',
  'Adding final touches…',
  'Almost there — polishing results…',
]

export const SHEET_GENERATION_MESSAGES = [
  'Preparing character references…',
  'Generating multi-angle views…',
  'Designing expression variations…',
  'Composing the character sheet…',
  'Rendering final layout…',
  'Wrapping up — almost done…',
]

export const PROMPT_GENERATION_MESSAGES = [
  'Scraping your website…',
  'Extracting brand signals…',
  'Analyzing visual identity…',
  'Crafting the perfect prompt…',
  'Finalizing brand blueprint…',
]
