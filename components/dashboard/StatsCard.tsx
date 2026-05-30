interface StatsCardProps {
  icon: string
  title: string
  value: string
  subValue?: string
  progressValue?: number
  progressMax?: number
}

export default function StatsCard({
  icon, title, value, subValue, progressValue, progressMax
}: StatsCardProps) {
  const pct = progressValue !== undefined && progressMax
    ? Math.round((progressValue / progressMax) * 100)
    : null

  return (
    <div className="bg-surface border border-border rounded-xl p-6 hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-lg">
          {icon}
        </div>
        {pct !== null && (
          <span className="text-xs text-muted font-medium">{pct}%</span>
        )}
      </div>

      <p className="text-xs text-muted font-medium tracking-wide uppercase mb-1">{title}</p>
      <p className="text-2xl font-semibold text-text mb-1">{value}</p>
      {subValue && <p className="text-xs text-muted">{subValue}</p>}

      {/* Progress bar */}
      {pct !== null && (
        <div className="mt-4 h-1 bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
