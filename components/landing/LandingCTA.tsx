import Link from 'next/link'

export default function LandingCTA() {
  return (
    <section className="mx-auto max-w-6xl px-12 pb-28">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-16 py-20 text-center">
        {/* Glow behind */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 bg-[radial-gradient(circle,rgba(255,140,0,0.1)_0%,transparent_70%)]" />

        <p className="mb-4 text-xs font-semibold uppercase tracking-[3px] text-accent">Ready?</p>
        <h2
          className="mb-4 font-display uppercase leading-none tracking-wide"
          style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}
        >
          Your mascot
          <br />
          is waiting.
        </h2>
        <p className="mx-auto mb-10 max-w-sm text-base leading-relaxed text-muted">
          Give your brand a face in minutes. No designers, no briefs, no waiting.
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-md bg-accent px-10 py-4 text-sm font-bold uppercase tracking-wider text-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-accent-glow"
        >
          Mazcify It Now!
        </Link>
      </div>
    </section>
  )
}
