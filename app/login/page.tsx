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
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,140,0,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl px-10 py-12 text-center relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />

          {/* Logo */}
          <Link href="/" className="font-display text-3xl tracking-[4px] uppercase text-text inline-block mb-2">
            MAZC<span className="text-accent">I</span>FY
          </Link>

          <h1 className="text-xl font-semibold text-text mt-4 mb-2">
            Welcome to Mazcify
          </h1>
          <p className="text-sm text-muted mb-10 leading-relaxed">
            Sign in to start building your brand mascot and video.
          </p>

          {/* Google Sign-In */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-surface2 border border-border text-text text-sm font-medium py-4 rounded-lg hover:border-white/15 hover:shadow-lg transition-all duration-200 mb-4"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5 text-muted text-xs">
            <div className="flex-1 h-px bg-border" />
            <span>or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-muted text-xs">More sign-in options coming soon</p>

          <p className="mt-6 text-xs text-muted leading-relaxed">
            By continuing, you agree to Mazcify&apos;s{' '}
            <a href="#" className="text-accent hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-accent hover:underline">Privacy Policy</a>.
          </p>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          <Link href="/" className="hover:text-text transition-colors">← Back to home</Link>
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
