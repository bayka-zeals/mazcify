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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface border-b border-border flex items-center justify-between px-6">
      {/* Logo */}
      <Link href="/dashboard" className="font-display text-xl tracking-widest uppercase text-text">
        MAZC<span className="text-accent">I</span>FY
      </Link>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 hover:bg-surface2 px-3 py-1.5 rounded-lg transition-colors"
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
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-sm font-semibold">
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <span className="text-sm text-text font-medium hidden sm:block">
            {user?.displayName?.split(' ')[0] || 'Creator'}
          </span>
          <ChevronDown size={14} className="text-muted" />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl overflow-hidden z-20 shadow-xl">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-medium text-text truncate">{user?.displayName}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-text hover:bg-surface2 transition-colors"
              >
                <Settings size={14} /> Settings
              </Link>
              <button
                onClick={() => { setDropdownOpen(false); signOut() }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-text hover:bg-surface2 transition-colors"
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
