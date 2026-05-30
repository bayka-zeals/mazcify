import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="flex items-center justify-between border-t border-border px-12 py-8">
      <Link href="/" className="font-display text-xl uppercase tracking-widest text-text">
        MAZC<span className="text-accent">I</span>FY
      </Link>
      <p className="text-xs text-muted">© 2026 Mazcify. All rights reserved.</p>
    </footer>
  )
}
