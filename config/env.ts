import { z } from 'zod'

// ============================================================
// Server-side env vars (never exposed to browser)
// Import from here instead of process.env directly
// ============================================================
const serverEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  PIXVERSE_API_KEY: z.string().min(1, 'PIXVERSE_API_KEY is required'),
})

// ============================================================
// Client-safe env vars (NEXT_PUBLIC_ prefix)
// ============================================================
const clientEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_ADMIN_UID: z.string().optional().default(''),
})

// Validate client env — safe to run anywhere
const clientEnvParsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_FIREBASE_API_KEY:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_APP_URL:                     process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ADMIN_UID:                   process.env.NEXT_PUBLIC_ADMIN_UID,
})

if (!clientEnvParsed.success) {
  console.error('❌ Missing client environment variables:')
  console.error(clientEnvParsed.error.flatten().fieldErrors)
  throw new Error('Missing required client environment variables. Check .env.example')
}

export const clientEnv = clientEnvParsed.data

// Server env — only validate on server, throws on missing keys
export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    OPENAI_API_KEY:   process.env.OPENAI_API_KEY,
    PIXVERSE_API_KEY: process.env.PIXVERSE_API_KEY,
  })

  if (!parsed.success) {
    console.error('❌ Missing server environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error('Missing required server environment variables. Check .env.example')
  }

  return parsed.data
}
