import StatsCard from '@/components/dashboard/StatsCard'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'

export default function DashboardHome() {
  // TODO: fetch real data from Firestore
  const stats = {
    mascotsCreated: 0,
    mascotsLimit: 3,
    videosGenerated: 0,
    tokensUsed: 0,
    tokensLimit: 1000,
  }

  return (
    <div className="max-w-5xl mx-auto">
      <WelcomeBanner />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatsCard
          icon="🎭"
          title="Mascots Created"
          value={`${stats.mascotsCreated} / ${stats.mascotsLimit}`}
          subValue="Free plan limit"
        />
        <StatsCard
          icon="🎬"
          title="Videos Generated"
          value={String(stats.videosGenerated)}
          subValue="Total all time"
        />
        <StatsCard
          icon="⚡"
          title="Tokens Used"
          value={`${stats.tokensUsed} / ${stats.tokensLimit}`}
          subValue="This month"
          progressValue={stats.tokensUsed}
          progressMax={stats.tokensLimit}
        />
      </div>

      {/* Quick action */}
      <div className="bg-surface border border-border rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-base font-semibold text-text mb-1">Ready to build your mascot?</h3>
          <p className="text-sm text-muted">Start with your website URL and we&apos;ll handle the rest.</p>
        </div>
        <a
          href="/dashboard/creation"
          className="shrink-0 bg-accent text-bg text-sm font-bold tracking-wider uppercase px-8 py-3.5 rounded-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
        >
          + Create Mascot
        </a>
      </div>
    </div>
  )
}
