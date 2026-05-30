'use client'

import { useEffect, useState } from 'react'
import StatsCard from '@/components/dashboard/StatsCard'
import WelcomeBanner from '@/components/dashboard/WelcomeBanner'
import { useAuth } from '@/lib/auth-context'
import { getMascots, getVideos } from '@/lib/firestore-client'
import { PLAN_LIMITS, isAdmin } from '@/config/constants'

export default function DashboardHome() {
  const { user, loading: authLoading } = useAuth()
  const [mascotsCount, setMascotsCount] = useState(0)
  const [videosCount, setVideosCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoaded(true)
      return
    }
    let cancelled = false
    Promise.all([getMascots(user.uid), getVideos(user.uid)])
      .then(([mascots, videos]) => {
        if (cancelled) return
        setMascotsCount(mascots.length)
        setVideosCount(videos.length)
      })
      .catch((err) => {
        console.warn('Failed to load dashboard stats:', err)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  const admin = isAdmin(user?.uid)
  const mascotLimit = PLAN_LIMITS.free.mascotsMax
  const videoLimit = PLAN_LIMITS.free.videosMax

  const mascotValue = admin
    ? `${mascotsCount} / ∞`
    : `${mascotsCount} / ${mascotLimit}`
  const videoValue = admin
    ? `${videosCount} / ∞`
    : `${videosCount} / ${videoLimit}`
  const planSubValue = admin ? 'Admin · Unlimited' : 'Free plan limit'

  return (
    <div className="max-w-5xl mx-auto">
      <WelcomeBanner />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatsCard
          icon="🎭"
          title="Mascots Created"
          value={loaded ? mascotValue : '…'}
          subValue={planSubValue}
          progressValue={admin ? undefined : mascotsCount}
          progressMax={admin ? undefined : mascotLimit}
        />
        <StatsCard
          icon="🎬"
          title="Videos Generated"
          value={loaded ? videoValue : '…'}
          subValue={planSubValue}
          progressValue={admin ? undefined : videosCount}
          progressMax={admin ? undefined : videoLimit}
        />
        <StatsCard
          icon="⚡"
          title="Plan"
          value={admin ? 'Admin' : 'Free'}
          subValue={admin ? 'Unlimited generations' : `${mascotLimit} mascot · ${videoLimit} video`}
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
