'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function LandingNav() {
  const { user } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 h-[68px] border-b border-border bg-bg/85 backdrop-blur-md">
      {/* Logo */}
      <Link href="/" className="font-display text-2xl tracking-widest text-text uppercase">
        MAZC<span className="text-accent">I</span>FY
      </Link>

      {/* Nav links */}
      <ul className="hidden md:flex gap-9 list-none">
        {['How It Works', 'Features'].map((item) => (
          <li key={item}>
            <a
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-muted text-xs font-medium tracking-widest uppercase hover:text-text transition-colors"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {user ? (
        <Link
          href="/dashboard"
          className="border border-accent text-accent text-xs font-semibold tracking-widest uppercase px-6 py-2.5 rounded-md hover:bg-accent hover:text-bg transition-all"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          href="/login"
          className="border border-accent text-accent text-xs font-semibold tracking-widest uppercase px-6 py-2.5 rounded-md hover:bg-accent hover:text-bg transition-all"
        >
          Login / Sign Up
        </Link>
      )}
    </nav>
  )
}
