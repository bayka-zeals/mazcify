'use client'

import { useAuth } from '@/lib/auth-context'

export default function WelcomeBanner() {
  const { user } = useAuth()
  const firstName = user?.displayName?.split(' ')[0] || 'Creator'

  return (
    <div className="mb-8">
      <h1 className="font-display text-4xl uppercase tracking-wide text-text leading-none">
        WELCOME BACK,<br />
        <span className="text-accent">{firstName.toUpperCase()}</span>
      </h1>
      <p className="text-muted text-sm mt-3">Here&apos;s your brand overview.</p>
    </div>
  )
}
