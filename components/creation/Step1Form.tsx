'use client'

import { useRef, useState, FormEvent, DragEvent } from 'react'
import { Upload, X, Loader2, Link as LinkIcon } from 'lucide-react'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import type { BrandMeta } from '@/types'
import GenerationProgress, { PROMPT_GENERATION_MESSAGES } from './GenerationProgress'

type Gender = 'male' | 'female' | 'neutral'

interface Step1FormProps {
  onSuccess: (data: {
    brandbook: string
    meta: BrandMeta
    imagePrompt: string
    brandId: string
    mascotId: string
    mascotName: string
    gender: Gender
    description: string
  }) => void
}

const ACCEPTED_EXT = ['.pdf', '.png', '.jpg', '.jpeg']
const ACCEPT_ATTR = ACCEPTED_EXT.join(',')
const MAX_FILE_MB = 10

export default function Step1Form({ onSuccess }: Step1FormProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [url, setUrl] = useState('')
  const [mascotName, setMascotName] = useState('')
  const [description, setDescription] = useState('')
  const [gender, setGender] = useState<Gender>('neutral')
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => {
      const ok =
        ACCEPTED_EXT.some((ext) => f.name.toLowerCase().endsWith(ext)) &&
        f.size <= MAX_FILE_MB * 1024 * 1024
      return ok
    })
    setFiles((prev) => [...prev, ...arr])
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('Please enter a business URL.')
      return
    }
    try {
      new URL(url.trim())
    } catch {
      setError('That URL doesn\u2019t look valid.')
      return
    }

    if (!user) {
      setError('You must be signed in.')
      return
    }

    setLoading(true)

    try {
      let assetStorageUrls: string[] = []

      if (files.length > 0) {
        setStatus('Uploading brand assets…')
        const folder = `brands/${user.uid}/${Date.now()}`
        assetStorageUrls = await Promise.all(
          files.map(async (file) => {
            const path = `${folder}/${file.name}`
            const ref = storageRef(storage, path)
            await uploadBytes(ref, file)
            return await getDownloadURL(ref)
          }),
        )
      }

      setStatus('Analyzing brand & generating prompt…')

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          url: url.trim(),
          mascotName: mascotName.trim() || undefined,
          description: description.trim() || undefined,
          gender,
          assetStorageUrls,
          currentMascotCount: 0,
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `Request failed with ${res.status}`)
      }

      const data = await res.json()
      onSuccess({
        ...data,
        mascotName: mascotName.trim(),
        gender,
        description: description.trim(),
      })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 space-y-6">
        {/* URL */}
        <Field label="Business URL" required>
          <div className="relative">
            <LinkIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full bg-surface2 border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </Field>

        {/* Brand asset upload */}
        <Field
          label="Brand Assets (Optional)"
          hint="Brandbook, logo, or screenshots. PDF / PNG / JPG up to 10 MB each."
        >
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={[
              'block border border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors',
              dragActive
                ? 'border-accent bg-accent/5'
                : 'border-border bg-surface2 hover:border-accent/50',
            ].join(' ')}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTR}
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />
            <Upload size={20} className="mx-auto text-muted mb-2" />
            <p className="text-sm text-text font-medium">
              Drop files here or <span className="text-accent">browse</span>
            </p>
            <p className="text-xs text-muted mt-1">
              {ACCEPTED_EXT.join(' · ').toUpperCase()}
            </p>
          </label>

          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between bg-surface2 border border-border rounded-lg px-3 py-2 text-xs"
                >
                  <span className="truncate text-text">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-muted hover:text-text transition-colors ml-3 shrink-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>

        {/* Mascot name */}
        <Field label="Mascot Name (Optional)">
          <input
            type="text"
            value={mascotName}
            onChange={(e) => setMascotName(e.target.value)}
            placeholder="e.g. Mazzy, Foxy, Rocket…"
            className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </Field>

        {/* Gender */}
        <Field label="Gender">
          <div className="grid grid-cols-3 gap-2">
            {(['male', 'female', 'neutral'] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={[
                  'px-4 py-2.5 rounded-lg text-sm font-medium capitalize border transition-colors',
                  gender === g
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-surface2 border-border text-muted hover:text-text hover:border-white/15',
                ].join(' ')}
              >
                {g === 'neutral' ? 'Neutral' : g}
              </button>
            ))}
          </div>
        </Field>

        {/* Description / personality */}
        <Field
          label="Description (Optional)"
          hint="Personality, vibe, or specific traits to guide the mascot."
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Friendly, bold, energetic — describe your mascot's personality"
            className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
          />
        </Field>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted">
          {loading && status ? status : 'We\u2019ll analyze your site & craft a prompt.'}
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-accent text-bg text-sm font-bold tracking-wider uppercase px-8 py-3.5 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {loading ? (
            <GenerationProgress messages={PROMPT_GENERATION_MESSAGES} variant="inline" />
          ) : (
            'Generate Prompt'
          )}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label} {required && <span className="text-accent">*</span>}
        </label>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
