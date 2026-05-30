// ============================================================
// Mazcify — Shared Types
// ============================================================

// ------------------------------------------------------------
// User & Auth
// ------------------------------------------------------------
export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  createdAt: string
  plan: 'free' | 'pro'
}

// ------------------------------------------------------------
// Brand
// ------------------------------------------------------------
export interface BrandMeta {
  id: string
  companyName: string
  websiteUrl: string
  logoUrl?: string
  colors: string[]
  tone: string
  taglines: string[]
  productNames: string[]
  updatedAt: string
}

export interface Brand {
  id: string
  meta: BrandMeta
  brandbook: string // markdown string
  mascot?: Mascot
  characterSheet?: CharacterSheet
  videos?: Video[]
}

// ------------------------------------------------------------
// Mascot
// ------------------------------------------------------------
export type MascotStatus = 'generating' | 'selecting' | 'chosen'

export interface Mascot {
  id: string
  name: string
  chosenImageUrl: string
  discardedImageUrls: string[]
  prompt: string
  imagePrompt: string
  description?: string
  gender: 'male' | 'female' | 'neutral'
  personalityTraits: string[]
  status: MascotStatus
  createdAt: string
}

export interface MascotVariation {
  id: string
  imageUrl: string
  prompt: string
}

// ------------------------------------------------------------
// Character Sheet
// ------------------------------------------------------------
export interface CharacterSheet {
  frontUrl: string
  sideUrl: string
  backUrl: string
  generatedAt: string
}

// ------------------------------------------------------------
// Video
// ------------------------------------------------------------
export type VideoStatus = 'pending' | 'generating' | 'extending' | 'processing' | 'done' | 'failed'

export type VideoFeedback = 'like' | 'dislike' | null

export interface Video {
  id: string
  brandId: string
  mascotId: string
  mascotName: string
  mascotImageUrl: string
  templateId: string
  templateName: string
  status: VideoStatus
  currentClip: number // 0..clipCount, progress tracker
  totalClips: number // typically 6
  clipVideoIds: string[] // PixVerse video IDs per clip
  finalVideoUrl: string | null // Firebase Storage URL
  pixverseCdnUrl: string | null
  thumbnailUrl: string | null
  duration: number // total seconds
  liked: VideoFeedback // null = no feedback
  deleted: boolean // soft delete flag
  errorMessage?: string
  partial?: boolean // true if generation stopped mid-way
  createdAt: string
  updatedAt: string
}

// ------------------------------------------------------------
// Prompt Templates
// ------------------------------------------------------------
export interface PromptClip {
  clipIndex: number
  description?: string
  prompt: string
  duration?: number
}

export interface PromptTemplate {
  id: string
  name: string
  clips: PromptClip[]
}

// ------------------------------------------------------------
// Video Templates (predefined story arcs)
// ------------------------------------------------------------
export interface VideoTemplateClip {
  index: number // 1-based clip order
  prompt: string // contains {mascot_description} placeholder
  duration: number // seconds (typically 5)
}

export interface VideoTemplate {
  id: string // matches folder UUID
  name: string
  description: string
  thumbnail: string // public path or URL
  model: string // pixverse model id (default pixverse-c1)
  clips: VideoTemplateClip[]
}

// ------------------------------------------------------------
// API Request / Response shapes
// ------------------------------------------------------------
export interface ScrapeRequest {
  url: string
  logoBase64?: string
}

export interface ScrapeResponse {
  brandbook: string
  meta: Omit<BrandMeta, 'id' | 'updatedAt'>
}

export interface MascotGenerateRequest {
  brandbook: string
  prompt: string
  logoUrl?: string
}

export interface MascotGenerateResponse {
  variations: MascotVariation[]
}

export interface VideoGenerateRequest {
  userId: string
  brandId: string
  mascotId: string
  templateId: string
}

export interface VideoGenerateResponse {
  videoId: string
  status: VideoStatus
}

// SSE progress events streamed from POST /api/video
export type VideoProgressEvent =
  | {
      type: 'init'
      videoId: string
      totalClips: number
      templateName: string
    }
  | {
      type: 'clip_start'
      clipIndex: number
      totalClips: number
      message: string
    }
  | {
      type: 'clip_done'
      clipIndex: number
      totalClips: number
      videoId: string
    }
  | {
      type: 'processing'
      message: string
    }
  | {
      type: 'done'
      videoId: string
      finalVideoUrl: string
      pixverseCdnUrl: string
      duration: number
    }
  | {
      type: 'partial'
      videoId: string
      finalVideoUrl: string | null
      pixverseCdnUrl: string | null
      completedClips: number
      totalClips: number
      errorMessage: string
    }
  | {
      type: 'error'
      message: string
      code?: string
    }

// ------------------------------------------------------------
// Stats (dashboard)
// ------------------------------------------------------------
export interface UserStats {
  mascotsCreated: number
  mascotsLimit: number
  videosGenerated: number
  tokensUsed: number
  tokensLimit: number
}
