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

  const mascotValue = admin ? `${mascotsCount} / ∞` : `${mascotsCount} / ${mascotLimit}`
  const videoValue = admin ? `${videosCount} / ∞` : `${videosCount} / ${videoLimit}`
  const planSubValue = admin ? 'Admin · Unlimited' : 'Free plan limit'

  return (
    <div className="mx-auto max-w-5xl">
      <WelcomeBanner />

      {/* Stats grid */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      <div className="flex flex-col items-center justify-between gap-6 rounded-xl border border-border bg-surface p-8 sm:flex-row">
        <div>
          <h3 className="mb-1 text-base font-semibold text-text">Ready to build your mascot?</h3>
          <p className="text-sm text-muted">
            Start with your website URL and we&apos;ll handle the rest.
          </p>
        </div>
        <a
          href="/dashboard/creation"
          className="shrink-0 whitespace-nowrap rounded-md bg-accent px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-accent-glow"
        >
          + Create Mascot
        </a>
      </div>
    </div>
  )
}
