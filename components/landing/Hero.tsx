import Link from 'next/link'
import Image from 'next/image'
import { Zap, Wand2, Video, ArrowRight, ChevronDown } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-[68px] bg-black">
      <div className="relative w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center">
        {/* Left: Text content */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10">
          {/* Eyebrow */}
          <div
            className="mb-8 text-accent text-xs font-semibold tracking-[3px] uppercase border border-accent/30 px-4 py-1.5 rounded-full animate-fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            AI-Powered Brand Mascot Creator
          </div>

          {/* Headline */}
          <h1
            className="font-display uppercase leading-[0.92] tracking-widest text-text animate-fade-up"
            style={{
              fontSize: 'clamp(56px, 8vw, 120px)',
              animationDelay: '0.2s',
            }}
          >
            GIVE YOUR<br />
            BRAND A<br />
            <span className="text-accent">FACE</span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-7 text-lg font-light text-muted max-w-md leading-relaxed animate-fade-up"
            style={{ animationDelay: '0.35s' }}
          >
            Paste your URL. We scrape your brand DNA, generate a{' '}
            <strong className="text-text font-medium">custom mascot</strong>, and produce a{' '}
            <strong className="text-text font-medium">30-second video</strong> — in minutes.
          </p>

          {/* CTA */}
          <div
            className="mt-11 flex flex-wrap gap-4 items-center animate-fade-up"
            style={{ animationDelay: '0.5s' }}
          >
            <Link
              href="/login"
              className="bg-accent text-bg text-sm font-bold tracking-wider uppercase px-8 py-4 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200 min-w-[200px] text-center"
            >
              Mazcify It Now!
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center justify-center gap-2 text-muted text-sm font-medium px-8 py-4 rounded-md border border-border hover:text-text hover:border-text/20 transition-all min-w-[200px]"
            >
              How? <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Badges */}
          <div
            className="mt-14 flex gap-8 items-center animate-fade-up"
            style={{ animationDelay: '0.65s' }}
          >
            {[
              { label: 'Free to start', icon: Zap },
              { label: 'No design skills needed', icon: Wand2 },
              { label: 'PixVerse powered', icon: Video },
            ].map(({ label, icon: Icon }, i) => (
              <div key={label} className="flex items-center gap-2 text-muted text-xs">
                {i > 0 && <span className="text-border text-lg mr-4">|</span>}
                <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Mascot — blended into background */}
        <div
          className="relative flex items-center justify-center animate-fade-up"
          style={{ animationDelay: '0.3s' }}
        >
          <Image
            src="/mascot-hero.png"
            alt="Mazcify mascot"
            width={520}
            height={520}
            priority
            className="relative w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] lg:w-[780px] lg:h-[780px] object-contain"
          />
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted text-[10px] tracking-[2px] uppercase animate-fade-up" style={{ animationDelay: '1s' }}>
        <span>Scroll</span>
        <ChevronDown className="w-4 h-4 text-accent animate-bounce" />
      </div>
    </section>
  )
}
