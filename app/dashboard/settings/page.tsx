'use client'

import { useAuth } from '@/lib/auth-context'
import Image from 'next/image'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[3px] text-accent">Account</p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-text">Settings</h1>
      </div>

      {/* Account card */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted">Profile</h2>
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <Image src={user.photoURL} alt="" width={56} height={56} className="rounded-full" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/20 text-xl font-semibold text-accent">
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-text">{user?.displayName}</p>
            <p className="text-xs text-muted">{user?.email}</p>
            <p className="mt-0.5 text-xs text-muted">Signed in with Google</p>
          </div>
        </div>
      </div>

      {/* Brandbook card */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted">
          Brandbook
        </h2>
        <p className="mb-4 text-xs text-muted">
          Your brand&apos;s scraped data in markdown format. Edit and save to update your brand
          context.
        </p>
        <textarea
          className="h-48 w-full resize-none rounded-lg border border-border bg-surface2 p-4 font-mono text-sm text-text transition-colors placeholder:text-muted focus:border-accent/50 focus:outline-none"
          placeholder="No brandbook yet. Create a mascot to generate your brandbook."
          disabled
        />
        <button
          disabled
          className="mt-3 cursor-not-allowed rounded-md bg-accent px-5 py-2 text-xs font-semibold text-bg opacity-40"
        >
          Save Brandbook
        </button>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-900/30 bg-surface p-6">
        <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-red-400">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Delete Account</p>
            <p className="text-xs text-muted">Permanently delete your account and all data.</p>
          </div>
          <button className="rounded-md border border-red-900/50 px-4 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-900/20">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
