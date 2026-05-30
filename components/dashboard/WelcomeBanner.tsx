'use client'

import { useAuth } from '@/lib/auth-context'

export default function WelcomeBanner() {
  const { user } = useAuth()
  const firstName = user?.displayName?.split(' ')[0] || 'Creator'

  return (
    <div className="mb-8">
      <h1 className="font-display text-4xl uppercase leading-none tracking-wide text-text">
        WELCOME BACK,
        <br />
        <span className="text-accent">{firstName.toUpperCase()}</span>
      </h1>
      <p className="mt-3 text-sm text-muted">Here&apos;s your brand overview.</p>
    </div>
  )
}
