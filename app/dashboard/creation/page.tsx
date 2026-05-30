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
  softDeleteVideo,
  type SavedMascotCard,
  type SavedVideoCard,
} from '@/lib/firestore-client'
import { PLAN_LIMITS } from '@/config/constants'
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

  const fetchMascots = (uid: string) => {
    setError(null)

    const timeout = new Promise<SavedMascotCard[]>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000),
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
      setTimeout(() => reject(new Error('timeout')), 8000),
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

  const hasMascot = mascots.length > 0
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-accent text-xs font-semibold tracking-[3px] uppercase mb-1">
          Creation Studio
        </p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-text">
          Your Brand Assets
        </h1>
      </div>

      {/* Mascot Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-widest">
            Mascot
          </h2>
          {hasMascot && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 text-xs font-medium text-muted border border-border px-4 py-2 rounded-md hover:text-text hover:border-white/15 transition-colors"
              >
                <Upload size={14} /> Upload
              </button>
              <a
                href="/dashboard/creation/new"
                className="inline-flex items-center gap-2 bg-accent text-bg text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-md hover:shadow-accent-glow transition-all"
              >
                Generate New
              </a>
            </div>
          )}
        </div>
        {showLoading ? (
          <div className="bg-surface border border-border rounded-xl p-16 text-center">
            <p className="text-sm text-muted animate-pulse">Loading mascots…</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        ) : hasMascot ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-widest">
            Video
          </h2>
          {hasMascot && videos.length > 0 && (
            <a
              href="/dashboard/creation/video"
              className={[
                'inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-md transition-all',
                videos.length >= PLAN_LIMITS.free.videosMax
                  ? 'bg-surface2 text-muted border border-border cursor-not-allowed pointer-events-none'
                  : 'bg-accent text-bg hover:shadow-accent-glow',
              ].join(' ')}
            >
              <VideoIcon size={14} /> Create Video
            </a>
          )}
        </div>

        {hasMascot ? (
          <VideoSection
            videos={videos}
            loading={!videosFetched}
            onSelect={(v) => setSelectedVideo(v)}
          />
        ) : (
          <div className="bg-surface border border-dashed border-border rounded-xl p-10 text-center opacity-40 cursor-not-allowed select-none">
            <p className="text-4xl mb-3">🎬</p>
            <p className="text-sm font-medium text-muted">
              Create your mascot first to unlock video generation.
            </p>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {selectedMascot && (
        <MascotDetailModal
          mascot={selectedMascot}
          onClose={() => setSelectedMascot(null)}
        />
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
    </div>
  )
}

function MascotEmptyState({ onUpload, loading }: { onUpload: () => void; loading?: boolean }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-xl p-16 text-center">
      <div className="text-5xl mb-5">🎭</div>
      <h3 className="text-lg font-semibold text-text mb-2">No mascot yet</h3>
      <p className="text-sm text-muted max-w-xs mx-auto mb-8 leading-relaxed">
        {loading
          ? 'Checking for existing mascots…'
          : 'Create your first AI mascot from your brand\u2019s DNA — or upload an existing mascot image.'}
      </p>
      <div className="flex items-center justify-center gap-3">
        <a
          href="/dashboard/creation/new"
          className="inline-flex bg-accent text-bg text-sm font-bold tracking-wider uppercase px-8 py-3.5 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200"
        >
          Generate Mascot
        </a>
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex items-center gap-2 text-sm font-bold tracking-wider uppercase text-text border border-border px-8 py-3.5 rounded-md hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Upload size={16} /> Upload Image
        </button>
      </div>
    </div>
  )
}

function MascotCard({
  mascot,
  onClick,
}: {
  mascot: SavedMascotCard
  onClick: () => void
}) {
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
      className="group bg-surface border border-border rounded-xl overflow-hidden text-left hover:border-accent/40 transition-all"
    >
      <div className="relative aspect-square bg-surface2">
        {mascot.chosenImageUrl ? (
          <Image
            src={mascot.chosenImageUrl}
            alt={mascot.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            🎭
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text truncate">
            {mascot.name}
          </h3>
          <span className="text-xs text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full font-medium shrink-0">
            Ready
          </span>
        </div>
        <p className="text-[11px] text-muted mt-1">{dateStr}</p>
      </div>
    </button>
  )
}

function MascotDetailModal({
  mascot,
  onClose,
}: {
  mascot: SavedMascotCard
  onClose: () => void
}) {
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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-muted hover:text-text transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header with mascot image */}
          <div className="flex items-start gap-5">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border bg-surface2 shrink-0">
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
                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                  🎭
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-text">{mascot.name}</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} /> {dateStr}
                </span>
                <span className="inline-flex items-center gap-1 capitalize">
                  <User2 size={12} /> {mascot.gender}
                </span>
              </div>
              {mascot.description && (
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  {mascot.description}
                </p>
              )}
            </div>
          </div>

          {/* Character Sheet */}
          {mascot.characterSheetUrl && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
                Character Sheet
              </p>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-surface2">
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2 inline-flex items-center gap-1.5">
                <Sparkles size={12} /> Image Prompt
              </p>
              <div className="bg-surface2 border border-border rounded-lg p-4 text-xs text-muted whitespace-pre-wrap leading-relaxed font-mono max-h-48 overflow-auto">
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
}: {
  videos: SavedVideoCard[]
  loading: boolean
  onSelect: (video: SavedVideoCard) => void
}) {
  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="text-sm text-muted animate-pulse">Loading videos…</p>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-border rounded-xl p-16 text-center">
        <div className="text-5xl mb-5">🎬</div>
        <h3 className="text-lg font-semibold text-text mb-2">No videos yet</h3>
        <p className="text-sm text-muted max-w-xs mx-auto mb-8 leading-relaxed">
          Turn your mascot into a 30-second story video. Pick a template, hit
          generate, and watch it come to life.
        </p>
        <a
          href="/dashboard/creation/video"
          className="inline-flex items-center gap-2 bg-accent text-bg text-sm font-bold tracking-wider uppercase px-8 py-3.5 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200"
        >
          <VideoIcon size={16} /> Create Your First Video
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-muted hover:text-text transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-text">{video.templateName}</h2>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} /> {dateStr}
              </span>
              <span>· {video.mascotName}</span>
              <span>· {video.duration}s</span>
              {video.partial && (
                <span className="inline-flex items-center gap-1 text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  Partial
                </span>
              )}
            </div>
          </div>

          {url ? (
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black">
              <video
                src={url}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-video rounded-xl border border-border bg-surface2 flex items-center justify-center">
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
              className="inline-flex items-center gap-2 text-xs font-medium text-muted border border-border px-4 py-2.5 rounded-md hover:text-red-300 hover:border-red-500/40 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
            {url && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 bg-accent text-bg text-xs font-bold tracking-wider uppercase px-5 py-2.5 rounded-md hover:shadow-accent-glow transition-all"
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

      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-muted hover:text-text transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-text">Upload Mascot</h2>
            <p className="text-xs text-muted mt-1">
              Upload your existing mascot image. PNG, JPG, or WebP up to {MAX_MB} MB.
            </p>
          </div>

          {/* Drop zone / preview */}
          {preview ? (
            <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-surface2">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-bg/80 border border-border flex items-center justify-center text-muted hover:text-text transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={[
                'block aspect-square rounded-xl border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-3',
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
                <p className="text-sm text-text font-medium">
                  Drop image here or <span className="text-accent">browse</span>
                </p>
                <p className="text-xs text-muted mt-1">PNG · JPG · WebP</p>
              </div>
            </label>
          )}

          {/* Name input */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 block">
              Mascot Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mazzy, Foxy, Rocket…"
              className="w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-3 py-2 text-xs">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="text-xs font-medium text-muted border border-border px-5 py-3 rounded-md hover:text-text hover:border-white/15 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="inline-flex items-center gap-2 bg-accent text-bg text-sm font-bold tracking-wider uppercase px-6 py-3 rounded-md hover:shadow-accent-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
