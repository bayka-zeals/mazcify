'use client'

import { useEffect, useRef, useState, DragEvent } from 'react'
import Image from 'next/image'
import {
  X,
  Calendar,
  Sparkles,
  User2,
  Upload,
  Loader2,
  Video as VideoIcon,
  Trash2,
  Download,
} from 'lucide-react'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import {
  getMascots,
  getVideos,
  saveUploadedMascot,
  saveUploadedVideo,
  softDeleteVideo,
  type SavedMascotCard,
  type SavedVideoCard,
} from '@/lib/firestore-client'
import { PLAN_LIMITS, isAdmin } from '@/config/constants'
import VideoCard from '@/components/video/VideoCard'

export default function CreationPage() {
  const { user, loading: authLoading } = useAuth()
  const [mascots, setMascots] = useState<SavedMascotCard[]>([])
  const [videos, setVideos] = useState<SavedVideoCard[]>([])
  const [fetched, setFetched] = useState(false)
  const [videosFetched, setVideosFetched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMascot, setSelectedMascot] = useState<SavedMascotCard | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<SavedVideoCard | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showUploadVideo, setShowUploadVideo] = useState(false)

  const fetchMascots = (uid: string) => {
    setError(null)

    const timeout = new Promise<SavedMascotCard[]>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000)
    )

    Promise.race([getMascots(uid), timeout])
      .then(setMascots)
      .catch((err) => {
        if (err?.message !== 'timeout') {
          console.error('Failed to load mascots:', err)
          setError(err instanceof Error ? err.message : 'Failed to load mascots.')
        }
      })
      .finally(() => setFetched(true))
  }

  const fetchVideos = (uid: string) => {
    const timeout = new Promise<SavedVideoCard[]>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000)
    )

    Promise.race([getVideos(uid), timeout])
      .then(setVideos)
      .catch((err) => {
        if (err?.message !== 'timeout') {
          console.error('Failed to load videos:', err)
        }
      })
      .finally(() => setVideosFetched(true))
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setFetched(true)
      setVideosFetched(true)
      return
    }
    fetchMascots(user.uid)
    fetchVideos(user.uid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const admin = isAdmin(user?.uid)
  const hasMascot = mascots.length > 0
  const mascotLimitReached = !admin && mascots.length >= PLAN_LIMITS.free.mascotsMax
  const videoLimitReached = !admin && videos.length >= PLAN_LIMITS.free.videosMax
  const showLoading = !fetched && authLoading

  const handleVideoDelete = async (video: SavedVideoCard) => {
    if (!user) return
    if (!confirm('Delete this video? It will disappear from your gallery.')) return
    try {
      await softDeleteVideo(user.uid, video.brandId, video.id)
      setVideos((prev) => prev.filter((v) => v.id !== video.id))
      setSelectedVideo(null)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[3px] text-accent">
          Creation Studio
        </p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-text">
          Your Brand Assets
        </h1>
      </div>

      {/* Mascot Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Mascot</h2>
          {hasMascot && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                disabled={mascotLimitReached}
                title={mascotLimitReached ? 'Mascot limit reached. Delete one first.' : undefined}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-white/15 hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload size={14} /> Upload
              </button>
              {mascotLimitReached ? (
                <span
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-border bg-surface2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted"
                  title="Mascot limit reached. Delete your existing mascot first."
                >
                  Limit Reached
                </span>
              ) : (
                <a
                  href="/dashboard/creation/new"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-bg transition-all hover:shadow-accent-glow"
                >
                  Generate New
                </a>
              )}
            </div>
          )}
        </div>
        {showLoading ? (
          <div className="rounded-xl border border-border bg-surface p-16 text-center">
            <p className="animate-pulse text-sm text-muted">Loading mascots…</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : hasMascot ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mascots.map((m) => (
              <MascotCard
                key={`${m.brandId}-${m.mascotId}`}
                mascot={m}
                onClick={() => setSelectedMascot(m)}
              />
            ))}
          </div>
        ) : (
          <MascotEmptyState onUpload={() => setShowUpload(true)} loading={!fetched} />
        )}
      </section>

      {/* Video Section — gated */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Video</h2>
          {hasMascot && videos.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUploadVideo(true)}
                disabled={videoLimitReached}
                title={videoLimitReached ? 'Video limit reached. Delete one first.' : undefined}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-white/15 hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload size={14} /> Upload
              </button>
              {videoLimitReached ? (
                <span
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-border bg-surface2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted"
                  title="Video limit reached. Delete your existing video first."
                >
                  <VideoIcon size={14} /> Limit Reached
                </span>
              ) : (
                <a
                  href="/dashboard/creation/video"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-bg transition-all hover:shadow-accent-glow"
                >
                  <VideoIcon size={14} /> Create Video
                </a>
              )}
            </div>
          )}
        </div>

        {hasMascot ? (
          <VideoSection
            videos={videos}
            loading={!videosFetched}
            onSelect={(v) => setSelectedVideo(v)}
            onUpload={() => setShowUploadVideo(true)}
            canUpload={!videoLimitReached}
          />
        ) : (
          <div className="cursor-not-allowed select-none rounded-xl border border-dashed border-border bg-surface p-10 text-center opacity-40">
            <p className="mb-3 text-4xl">🎬</p>
            <p className="text-sm font-medium text-muted">
              Create your mascot first to unlock video generation.
            </p>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {selectedMascot && (
        <MascotDetailModal mascot={selectedMascot} onClose={() => setSelectedMascot(null)} />
      )}

      {/* Video Detail Modal */}
      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDelete={handleVideoDelete}
        />
      )}

      {/* Upload Modal */}
      {showUpload && user && (
        <UploadMascotModal
          uid={user.uid}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false)
            fetchMascots(user.uid)
          }}
        />
      )}

      {/* Upload Video Modal */}
      {showUploadVideo && user && (
        <UploadVideoModal
          uid={user.uid}
          mascots={mascots}
          onClose={() => setShowUploadVideo(false)}
          onSuccess={() => {
            setShowUploadVideo(false)
            fetchVideos(user.uid)
          }}
        />
      )}
    </div>
  )
}

function MascotEmptyState({ onUpload, loading }: { onUpload: () => void; loading?: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-16 text-center">
      <div className="mb-5 text-5xl">🎭</div>
      <h3 className="mb-2 text-lg font-semibold text-text">No mascot yet</h3>
      <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-muted">
        {loading
          ? 'Checking for existing mascots…'
          : 'Create your first AI mascot from your brand\u2019s DNA — or upload an existing mascot image.'}
      </p>
      <div className="flex items-center justify-center gap-3">
        <a
          href="/dashboard/creation/new"
          className="inline-flex rounded-md bg-accent px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-accent-glow"
        >
          Generate Mascot
        </a>
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex items-center gap-2 rounded-md border border-border px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-text transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40"
        >
          <Upload size={16} /> Upload Image
        </button>
      </div>
    </div>
  )
}

function MascotCard({ mascot, onClick }: { mascot: SavedMascotCard; onClick: () => void }) {
  const date = new Date(mascot.createdAt)
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-xl border border-border bg-surface text-left transition-all hover:border-accent/40"
    >
      <div className="relative aspect-square bg-surface2">
        {mascot.chosenImageUrl ? (
          <Image
            src={mascot.chosenImageUrl}
            alt={mascot.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🎭</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-text">{mascot.name}</h3>
          <span className="shrink-0 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            Ready
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">{dateStr}</p>
      </div>
    </button>
  )
}

function MascotDetailModal({ mascot, onClose }: { mascot: SavedMascotCard; onClose: () => void }) {
  const date = new Date(mascot.createdAt)
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface2 text-muted transition-colors hover:text-text"
        >
          <X size={16} />
        </button>

        <div className="space-y-6 p-6 sm:p-8">
          {/* Header with mascot image */}
          <div className="flex items-start gap-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-surface2">
              {mascot.chosenImageUrl ? (
                <Image
                  src={mascot.chosenImageUrl}
                  alt={mascot.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🎭</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-text">{mascot.name}</h2>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} /> {dateStr}
                </span>
                <span className="inline-flex items-center gap-1 capitalize">
                  <User2 size={12} /> {mascot.gender}
                </span>
              </div>
              {mascot.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted">{mascot.description}</p>
              )}
            </div>
          </div>

          {/* Character Sheet */}
          {mascot.characterSheetUrl && (
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Character Sheet
              </p>
              <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface2">
                <Image
                  src={mascot.characterSheetUrl}
                  alt="Character sheet"
                  fill
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* Prompt */}
          {mascot.imagePrompt && (
            <div>
              <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                <Sparkles size={12} /> Image Prompt
              </p>
              <div className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface2 p-4 font-mono text-xs leading-relaxed text-muted">
                {mascot.imagePrompt}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VideoSection({
  videos,
  loading,
  onSelect,
  onUpload,
  canUpload,
}: {
  videos: SavedVideoCard[]
  loading: boolean
  onSelect: (video: SavedVideoCard) => void
  onUpload: () => void
  canUpload: boolean
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-12 text-center">
        <p className="animate-pulse text-sm text-muted">Loading videos…</p>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-16 text-center">
        <div className="mb-5 text-5xl">🎬</div>
        <h3 className="mb-2 text-lg font-semibold text-text">No videos yet</h3>
        <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-muted">
          Turn your mascot into a 30-second story video — or upload an existing clip you already
          have.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/dashboard/creation/video"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-accent-glow"
          >
            <VideoIcon size={16} /> Create Your First Video
          </a>
          <button
            type="button"
            onClick={onUpload}
            disabled={!canUpload}
            className="inline-flex items-center gap-2 rounded-md border border-border px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-text transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Upload size={16} /> Upload Video
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} onClick={() => onSelect(v)} />
      ))}
    </div>
  )
}

function VideoDetailModal({
  video,
  onClose,
  onDelete,
}: {
  video: SavedVideoCard
  onClose: () => void
  onDelete: (video: SavedVideoCard) => void
}) {
  const url = video.finalVideoUrl ?? video.pixverseCdnUrl
  const date = new Date(video.createdAt)
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const handleDownload = async () => {
    if (!url) return
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${video.mascotName.replace(/\s+/g, '_').toLowerCase()}-${video.templateName.replace(/\s+/g, '_').toLowerCase()}.mp4`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface2 text-muted transition-colors hover:text-text"
        >
          <X size={16} />
        </button>

        <div className="space-y-5 p-6 sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-text">{video.templateName}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} /> {dateStr}
              </span>
              <span>· {video.mascotName}</span>
              <span>· {video.duration}s</span>
              {video.partial && (
                <span className="inline-flex items-center gap-1 rounded border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-yellow-300">
                  Partial
                </span>
              )}
            </div>
          </div>

          {url ? (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
              <video
                src={url}
                controls
                playsInline
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-surface2">
              <p className="text-sm text-muted">
                {video.status === 'failed'
                  ? 'This video failed to generate.'
                  : 'Video not available yet.'}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onDelete(video)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-xs font-medium text-muted transition-colors hover:border-red-500/40 hover:text-red-300"
            >
              <Trash2 size={14} /> Delete
            </button>
            {url && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-bg transition-all hover:shadow-accent-glow"
              >
                <Download size={14} /> Download
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadMascotModal({
  uid,
  onClose,
  onSuccess,
}: {
  uid: string
  onClose: () => void
  onSuccess: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ACCEPTED = '.png,.jpg,.jpeg,.webp'
  const MAX_MB = 10

  const handleFile = (f: File) => {
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum ${MAX_MB} MB.`)
      return
    }
    setFile(f)
    setError(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select an image.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const path = `mascots/${uid}/${Date.now()}_${file.name}`
      const ref = storageRef(storage, path)
      await uploadBytes(ref, file)
      const downloadUrl = await getDownloadURL(ref)

      await saveUploadedMascot(uid, name.trim(), downloadUrl)
      onSuccess()
    } catch (err) {
      console.error('Upload failed:', err)
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface2 text-muted transition-colors hover:text-text"
        >
          <X size={16} />
        </button>

        <div className="space-y-5 p-6 sm:p-8">
          <div>
            <h2 className="text-lg font-bold text-text">Upload Mascot</h2>
            <p className="mt-1 text-xs text-muted">
              Upload your existing mascot image. PNG, JPG, or WebP up to {MAX_MB} MB.
            </p>
          </div>

          {/* Drop zone / preview */}
          {preview ? (
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface2">
              <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-bg/80 text-muted transition-colors hover:text-text"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={[
                'block flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors',
                dragActive
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-surface2 hover:border-accent/50',
              ].join(' ')}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <Upload size={28} className="text-muted" />
              <div className="text-center">
                <p className="text-sm font-medium text-text">
                  Drop image here or <span className="text-accent">browse</span>
                </p>
                <p className="mt-1 text-xs text-muted">PNG · JPG · WebP</p>
              </div>
            </label>
          )}

          {/* Name input */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Mascot Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mazzy, Foxy, Rocket…"
              className="w-full rounded-lg border border-border bg-surface2 px-4 py-3 text-sm text-text transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-md border border-border px-5 py-3 text-xs font-medium text-muted transition-colors hover:border-white/15 hover:text-text disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-bg transition-all hover:shadow-accent-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                'Save Mascot'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadVideoModal({
  uid,
  mascots,
  onClose,
  onSuccess,
}: {
  uid: string
  mascots: SavedMascotCard[]
  onClose: () => void
  onSuccess: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoElRef = useRef<HTMLVideoElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [mascotKey, setMascotKey] = useState<string | null>(
    mascots[0] ? `${mascots[0].brandId}-${mascots[0].mascotId}` : null
  )
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const ACCEPTED = '.mp4,.mov,.webm,.m4v'
  const MAX_MB = 100

  /**
   * Grab a single frame from the in-memory video element, return it as a JPEG
   * Blob (or null if the browser blocks capture, e.g. cross-origin video).
   */
  const captureThumbnail = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const v = videoElRef.current
      if (!v || !v.videoWidth || !v.videoHeight) return resolve(null)

      try {
        const canvas = document.createElement('canvas')
        canvas.width = v.videoWidth
        canvas.height = v.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85)
      } catch (err) {
        console.warn('Thumbnail capture failed:', err)
        resolve(null)
      }
    })

  /**
   * Seek the preview video to a frame we want to use as the cover, then
   * trigger the capture once that frame has rendered.
   */
  const seekToThumbnailFrame = () => {
    const v = videoElRef.current
    if (!v) return
    const target = Math.min(1, Math.max(0, (v.duration || 1) * 0.1))
    if (Number.isFinite(target)) {
      try {
        v.currentTime = target
      } catch {
        // some browsers throw if metadata isn't ready yet; ignore
      }
    }
  }

  const selectedMascot = mascots.find((m) => `${m.brandId}-${m.mascotId}` === mascotKey)

  const cleanupPreview = (url: string | null) => {
    if (url) URL.revokeObjectURL(url)
  }

  const handleFile = (f: File) => {
    if (!f.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v)$/i.test(f.name)) {
      setError('Please choose a video file (MP4, MOV, WebM, M4V).')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum ${MAX_MB} MB.`)
      return
    }
    setError(null)
    setFile(f)
    cleanupPreview(previewUrl)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    setDuration(null)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a video.')
      return
    }
    if (!selectedMascot) {
      setError('Please pick a mascot to attach this video to.')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')

      // Capture a poster frame BEFORE the upload — the in-memory blob URL is
      // same-origin and won't taint the canvas.
      const thumbBlob = await captureThumbnail()

      const path = `videos/${uid}/${timestamp}_${safeName}`
      const ref = storageRef(storage, path)
      await uploadBytes(ref, file, { contentType: file.type || 'video/mp4' })
      setProgress(60)
      const downloadUrl = await getDownloadURL(ref)

      let thumbnailUrl: string | null = null
      if (thumbBlob) {
        try {
          const thumbPath = `videos/${uid}/${timestamp}_thumb.jpg`
          const thumbRef = storageRef(storage, thumbPath)
          await uploadBytes(thumbRef, thumbBlob, { contentType: 'image/jpeg' })
          thumbnailUrl = await getDownloadURL(thumbRef)
        } catch (thumbErr) {
          console.warn('Thumbnail upload failed (will fall back):', thumbErr)
        }
      }
      setProgress(100)

      await saveUploadedVideo(
        uid,
        {
          brandId: selectedMascot.brandId,
          mascotId: selectedMascot.mascotId,
          mascotName: selectedMascot.name,
          mascotImageUrl: selectedMascot.chosenImageUrl,
        },
        {
          videoUrl: downloadUrl,
          name: name.trim() || undefined,
          duration: duration ?? undefined,
          thumbnailUrl,
        }
      )

      onSuccess()
    } catch (err) {
      console.error('Video upload failed:', err)
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    return () => {
      cleanupPreview(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface2 text-muted transition-colors hover:text-text"
        >
          <X size={16} />
        </button>

        <div className="space-y-5 p-6 sm:p-8">
          <div>
            <h2 className="text-lg font-bold text-text">Upload Video</h2>
            <p className="mt-1 text-xs text-muted">
              Upload an existing video clip. MP4, MOV, or WebM up to {MAX_MB} MB.
            </p>
          </div>

          {mascots.length === 0 ? (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
              You need at least one mascot before uploading a video.
            </div>
          ) : null}

          {/* Drop zone / preview */}
          {previewUrl ? (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
              <video
                ref={videoElRef}
                src={previewUrl}
                controls
                playsInline
                muted
                preload="metadata"
                onLoadedMetadata={(e) => {
                  const d = (e.target as HTMLVideoElement).duration
                  if (Number.isFinite(d)) setDuration(d)
                  seekToThumbnailFrame()
                }}
                className="absolute inset-0 h-full w-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  cleanupPreview(previewUrl)
                  setFile(null)
                  setPreviewUrl(null)
                  setDuration(null)
                }}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-bg/80 text-muted transition-colors hover:text-text"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={[
                'block flex aspect-video cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors',
                dragActive
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-surface2 hover:border-accent/50',
              ].join(' ')}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <Upload size={28} className="text-muted" />
              <div className="text-center">
                <p className="text-sm font-medium text-text">
                  Drop video here or <span className="text-accent">browse</span>
                </p>
                <p className="mt-1 text-xs text-muted">MP4 · MOV · WebM</p>
              </div>
            </label>
          )}

          {file && duration !== null && (
            <p className="text-[11px] text-muted">
              Detected duration: {Math.round(duration)}s ·{' '}
              {Math.round((file.size / (1024 * 1024)) * 10) / 10} MB
            </p>
          )}

          {/* Mascot selector (only if 2+) */}
          {mascots.length > 1 && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
                Attach to Mascot
              </label>
              <select
                value={mascotKey ?? ''}
                onChange={(e) => setMascotKey(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface2 px-4 py-3 text-sm text-text transition-colors focus:border-accent focus:outline-none"
              >
                {mascots.map((m) => (
                  <option key={`${m.brandId}-${m.mascotId}`} value={`${m.brandId}-${m.mascotId}`}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Video name */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Video Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brand Intro, Behind the Scenes…"
              className="w-full rounded-lg border border-border bg-surface2 px-4 py-3 text-sm text-text transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {uploading && progress > 0 && progress < 100 && (
            <div className="h-1 overflow-hidden rounded-full bg-surface2">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-md border border-border px-5 py-3 text-xs font-medium text-muted transition-colors hover:border-white/15 hover:text-text disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!file || !selectedMascot || uploading}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-bg transition-all hover:shadow-accent-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                'Save Video'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
