import Link from 'next/link'
import Image from 'next/image'
import { Zap, Wand2, Video, ArrowRight, ChevronDown } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 pt-[68px]">
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-4">
        {/* Left: Text content */}
        <div className="z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
          {/* Eyebrow */}
          <div
            className="animate-fade-up mb-8 rounded-full border border-accent/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[3px] text-accent"
            style={{ animationDelay: '0.1s' }}
          >
            AI-Powered Brand Mascot Creator
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up font-display uppercase leading-[0.92] tracking-widest text-text"
            style={{
              fontSize: 'clamp(56px, 8vw, 120px)',
              animationDelay: '0.2s',
            }}
          >
            GIVE YOUR
            <br />
            BRAND A<br />
            <span className="text-accent">FACE</span>
          </h1>

          {/* Subtitle */}
          <p
            className="animate-fade-up mt-7 max-w-md text-lg font-light leading-relaxed text-muted"
            style={{ animationDelay: '0.35s' }}
          >
            Paste your URL. We scrape your brand DNA, generate a{' '}
            <strong className="font-medium text-text">custom mascot</strong>, and produce a{' '}
            <strong className="font-medium text-text">30-second video</strong> — in minutes.
          </p>

          {/* CTA */}
          <div
            className="animate-fade-up mt-11 flex flex-wrap items-center gap-4"
            style={{ animationDelay: '0.5s' }}
          >
            <Link
              href="/login"
              className="min-w-[200px] rounded-md bg-accent px-8 py-4 text-center text-sm font-bold uppercase tracking-wider text-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-accent-glow"
            >
              Mazcify It Now!
            </Link>
            <a
              href="#how-it-works"
              className="flex min-w-[200px] items-center justify-center gap-2 rounded-md border border-border px-8 py-4 text-sm font-medium text-muted transition-all hover:border-text/20 hover:text-text"
            >
              How? <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Badges */}
          <div
            className="animate-fade-up mt-14 flex items-center gap-8"
            style={{ animationDelay: '0.65s' }}
          >
            {[
              { label: 'Free to start', icon: Zap },
              { label: 'No design skills needed', icon: Wand2 },
              { label: 'PixVerse powered', icon: Video },
            ].map(({ label, icon: Icon }, i) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted">
                {i > 0 && <span className="mr-4 text-lg text-border">|</span>}
                <Icon className="h-3.5 w-3.5 flex-shrink-0 text-accent" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Mascot — blended into background */}
        <div
          className="animate-fade-up relative flex items-center justify-center"
          style={{ animationDelay: '0.3s' }}
        >
          <Image
            src="/mascot-hero.png"
            alt="Mazcify mascot"
            width={520}
            height={520}
            priority
            className="relative h-[450px] w-[450px] object-contain sm:h-[600px] sm:w-[600px] lg:h-[780px] lg:w-[780px]"
          />
        </div>
      </div>

      {/* Scroll hint */}
      <div
        className="animate-fade-up absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-[10px] uppercase tracking-[2px] text-muted"
        style={{ animationDelay: '1s' }}
      >
        <span>Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce text-accent" />
      </div>
    </section>
  )
}
