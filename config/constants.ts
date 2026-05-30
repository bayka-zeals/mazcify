// ============================================================
// Mazcify — App Constants
// ============================================================

export const APP_CONFIG = {
  name: 'Mazcify',
  tagline: 'Give Your Brand a Face',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const

// ------------------------------------------------------------
// Plan limits
// ------------------------------------------------------------
export const PLAN_LIMITS = {
  free: {
    mascotsMax: 1,
    videosMax: 1,
    tokensMax: 1000,
  },
  pro: {
    mascotsMax: Infinity,
    videosMax: Infinity,
    tokensMax: 10000,
  },
} as const

// ------------------------------------------------------------
// Admin bypass
// ------------------------------------------------------------
// The admin UID is read from NEXT_PUBLIC_ADMIN_UID so the same helper works
// on both client and server. Empty string disables the bypass entirely.
export const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID ?? ''

export function isAdmin(uid: string | null | undefined): boolean {
  return !!uid && !!ADMIN_UID && uid === ADMIN_UID
}

// ------------------------------------------------------------
// Mascot generation
// ------------------------------------------------------------
export const MASCOT_CONFIG = {
  variationCount: 3,       // number of variations to generate
  imageSize: '1024x1024',  // PixVerse image size
} as const

// ------------------------------------------------------------
// Video generation
// ------------------------------------------------------------
export const VIDEO_CONFIG = {
  clipCount: 6,            // clips per video (1 reference + 5 extends)
  clipDurationSecs: 5,     // seconds per clip
  totalDurationSecs: 30,   // total duration target
  defaultModel: 'pixverse-c1',
  quality: '1080p',
  aspectRatio: '16:9',
  maxRetries: 2,
  cliTimeoutSecs: 300,
} as const

// User-facing rotating status messages during generation
export const VIDEO_GENERATION_MESSAGES = [
  'Warming up the studio…',
  'Casting your mascot in scene one…',
  'Lighting the set, framing the shot…',
  'Rolling cameras…',
  'Composing the next scene…',
  'Adding cinematic transitions…',
  'Polishing motion details…',
  'Stitching the story together…',
  'Almost there — final touches…',
] as const

// ------------------------------------------------------------
// Personality trait options (mascot creation form)
// ------------------------------------------------------------
export const PERSONALITY_TRAITS = [
  'Friendly',
  'Bold',
  'Playful',
  'Professional',
  'Adventurous',
  'Trustworthy',
  'Energetic',
  'Witty',
  'Calm',
  'Innovative',
] as const

export type PersonalityTrait = (typeof PERSONALITY_TRAITS)[number]

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------
export const ROUTES = {
  home:        '/',
  login:       '/login',
  dashboard:   '/dashboard',
  creation:    '/dashboard/creation',
  creationNew: '/dashboard/creation/new',
  videoNew:    '/dashboard/creation/video',
  settings:    '/dashboard/settings',
} as const
