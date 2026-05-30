'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.push('/dashboard')
  }, [user, loading, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(255,140,0,0.06)_0%,transparent_70%)]" />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-10 py-12 text-center">
          {/* Top accent line */}
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />

          {/* Logo */}
          <Link
            href="/"
            className="mb-2 inline-block font-display text-3xl uppercase tracking-[4px] text-text"
          >
            MAZC<span className="text-accent">I</span>FY
          </Link>

          <h1 className="mb-2 mt-4 text-xl font-semibold text-text">Welcome to Mazcify</h1>
          <p className="mb-10 text-sm leading-relaxed text-muted">
            Sign in to start building your brand mascot and video.
          </p>

          {/* Google Sign-In */}
          <button
            onClick={signInWithGoogle}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface2 py-4 text-sm font-medium text-text transition-all duration-200 hover:border-white/15 hover:shadow-lg"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-border" />
            <span>or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-xs text-muted">More sign-in options coming soon</p>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            By continuing, you agree to Mazcify&apos;s{' '}
            <a href="#" className="text-accent hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-accent hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="transition-colors hover:text-text">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
