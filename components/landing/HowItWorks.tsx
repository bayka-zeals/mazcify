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
    <section id="how-it-works" className="max-w-6xl mx-auto px-12 py-28">
      <p className="text-accent text-xs font-semibold tracking-[3px] uppercase mb-4">The Process</p>
      <h2
        className="font-display uppercase leading-none tracking-wide mb-16"
        style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}
      >
        Three steps.<br />One mascot.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`
              group bg-surface hover:bg-surface2 transition-colors relative overflow-hidden p-10
              ${i === 0 ? 'rounded-l-xl' : ''}
              ${i === steps.length - 1 ? 'rounded-r-xl' : ''}
            `}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-border group-hover:bg-accent transition-colors duration-300" />

            <div className="font-display text-5xl text-accent/20 group-hover:text-accent/30 transition-colors mb-6 leading-none">
              {step.num}
            </div>
            <h3 className="text-lg font-semibold text-text mb-3">{step.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
