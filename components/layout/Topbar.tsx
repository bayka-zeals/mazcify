'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'
import { Settings, LogOut, ChevronDown } from 'lucide-react'

export default function Topbar() {
  const { user, signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      {/* Logo */}
      <Link href="/dashboard" className="font-display text-xl uppercase tracking-widest text-text">
        MAZC<span className="text-accent">I</span>FY
      </Link>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-surface2"
        >
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || 'User'}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/20 text-sm font-semibold text-accent">
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <span className="hidden text-sm font-medium text-text sm:block">
            {user?.displayName?.split(' ')[0] || 'Creator'}
          </span>
          <ChevronDown size={14} className="text-muted" />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-xs font-medium text-text">{user?.displayName}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-text"
              >
                <Settings size={14} /> Settings
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  signOut()
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-text"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
