'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function LandingNav() {
  const { user } = useAuth()

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex h-[68px] items-center justify-between border-b border-border bg-black/85 px-12 backdrop-blur-md">
      {/* Logo */}
      <Link href="/" className="font-display text-2xl uppercase tracking-widest text-text">
        MAZC<span className="text-accent">I</span>FY
      </Link>

      {/* Nav links */}
      <ul className="hidden list-none gap-9 md:flex">
        {['How It Works', 'Features'].map((item) => (
          <li key={item}>
            <a
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-xs font-medium uppercase tracking-widest text-muted transition-colors hover:text-text"
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
          className="rounded-md border border-accent px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-accent transition-all hover:bg-accent hover:text-bg"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          href="/login"
          className="rounded-md border border-accent px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-accent transition-all hover:bg-accent hover:text-bg"
        >
          Login / Sign Up
        </Link>
      )}
    </nav>
  )
}
