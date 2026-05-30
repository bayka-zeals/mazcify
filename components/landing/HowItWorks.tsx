const steps = [
  {
    num: '01',
    title: 'Drop your URL',
    desc: 'We scrape your website and extract brand colors, tone of voice, taglines, and products. Upload your logo. We do the rest.',
  },
  {
    num: '02',
    title: 'Pick your mascot',
    desc: 'AI generates 4 mascot variations built from your brand DNA. Choose the one that feels right. We build out the full character sheet.',
  },
  {
    num: '03',
    title: 'Get your video',
    desc: 'Your mascot stars in a 30-second branded introduction video — 5 cinematic clips, stitched and ready to post anywhere.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-12 py-28">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[3px] text-accent">The Process</p>
      <h2
        className="mb-16 font-display uppercase leading-none tracking-wide"
        style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}
      >
        Three steps.
        <br />
        One mascot.
      </h2>

      <div className="grid grid-cols-1 gap-0.5 md:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`group relative overflow-hidden bg-surface p-10 transition-colors hover:bg-surface2 ${i === 0 ? 'rounded-l-xl' : ''} ${i === steps.length - 1 ? 'rounded-r-xl' : ''} `}
          >
            {/* Top bar */}
            <div className="absolute left-0 right-0 top-0 h-0.5 bg-border transition-colors duration-300 group-hover:bg-accent" />

            <div className="mb-6 font-display text-5xl leading-none text-accent/20 transition-colors group-hover:text-accent/30">
              {step.num}
            </div>
            <h3 className="mb-3 text-lg font-semibold text-text">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
