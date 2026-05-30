import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border px-12 py-8 flex items-center justify-between">
      <Link href="/" className="font-display text-xl tracking-widest uppercase text-text">
        MAZC<span className="text-accent">I</span>FY
      </Link>
      <p className="text-muted text-xs">© 2026 Mazcify. All rights reserved.</p>
    </footer>
  )
}
