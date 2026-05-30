import Link from 'next/link'

export default function LandingCTA() {
  return (
    <section className="max-w-6xl mx-auto px-12 pb-28">
      <div className="relative bg-surface border border-border rounded-2xl px-16 py-20 text-center overflow-hidden">
        {/* Glow behind */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[radial-gradient(circle,rgba(255,140,0,0.1)_0%,transparent_70%)] pointer-events-none" />

        <p className="text-accent text-xs font-semibold tracking-[3px] uppercase mb-4">Ready?</p>
        <h2
          className="font-display uppercase leading-none tracking-wide mb-4"
          style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}
        >
          Your mascot<br />is waiting.
        </h2>
        <p className="text-muted text-base max-w-sm mx-auto mb-10 leading-relaxed">
          Give your brand a face in minutes. No designers, no briefs, no waiting.
        </p>
        <Link
          href="/login"
          className="inline-flex bg-accent text-bg text-sm font-bold tracking-wider uppercase px-10 py-4 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200"
        >
          Mazcify It Now!
        </Link>
      </div>
    </section>
  )
}
