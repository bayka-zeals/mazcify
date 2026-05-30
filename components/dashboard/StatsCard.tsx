interface StatsCardProps {
  icon: string
  title: string
  value: string
  subValue?: string
  progressValue?: number
  progressMax?: number
}

export default function StatsCard({
  icon,
  title,
  value,
  subValue,
  progressValue,
  progressMax,
}: StatsCardProps) {
  const pct =
    progressValue !== undefined && progressMax
      ? Math.round((progressValue / progressMax) * 100)
      : null

  return (
    <div className="rounded-xl border border-border bg-surface p-6 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-lg">
          {icon}
        </div>
        {pct !== null && <span className="text-xs font-medium text-muted">{pct}%</span>}
      </div>

      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <p className="mb-1 text-2xl font-semibold text-text">{value}</p>
      {subValue && <p className="text-xs text-muted">{subValue}</p>}

      {/* Progress bar */}
      {pct !== null && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
