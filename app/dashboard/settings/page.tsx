'use client'

import { useAuth } from '@/lib/auth-context'
import Image from 'next/image'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-accent text-xs font-semibold tracking-[3px] uppercase mb-1">Account</p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-text">Settings</h1>
      </div>

      {/* Account card */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-5">Profile</h2>
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <Image src={user.photoURL} alt="" width={56} height={56} className="rounded-full" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xl font-semibold">
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-text">{user?.displayName}</p>
            <p className="text-xs text-muted">{user?.email}</p>
            <p className="text-xs text-muted mt-0.5">Signed in with Google</p>
          </div>
        </div>
      </div>

      {/* Brandbook card */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-5">Brandbook</h2>
        <p className="text-xs text-muted mb-4">
          Your brand&apos;s scraped data in markdown format. Edit and save to update your brand context.
        </p>
        <textarea
          className="w-full h-48 bg-surface2 border border-border rounded-lg p-4 text-sm text-text font-mono resize-none focus:outline-none focus:border-accent/50 transition-colors placeholder:text-muted"
          placeholder="No brandbook yet. Create a mascot to generate your brandbook."
          disabled
        />
        <button
          disabled
          className="mt-3 text-xs font-semibold text-bg bg-accent px-5 py-2 rounded-md opacity-40 cursor-not-allowed"
        >
          Save Brandbook
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-surface border border-red-900/30 rounded-xl p-6">
        <h2 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-5">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Delete Account</p>
            <p className="text-xs text-muted">Permanently delete your account and all data.</p>
          </div>
          <button className="text-xs font-semibold text-red-400 border border-red-900/50 px-4 py-2 rounded-md hover:bg-red-900/20 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
