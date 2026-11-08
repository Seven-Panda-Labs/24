import { useTranslation } from 'react-i18next'
import type { Progress } from '../domain/days.ts'

export default function ProgressBar({ progress, showLegend = false }: { progress: Progress; showLegend?: boolean }) {
  const { t } = useTranslation()
  const width = (count: number) => `${(count / Math.max(progress.total, 1)) * 100}%`

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="img"
        aria-label={t('progress.summary', { ...progress })}
        className="flex h-3 overflow-hidden rounded-full bg-foreground/10"
      >
        <span className="bg-primary" style={{ width: width(progress.wrapped) }} />
        <span className="bg-accent" style={{ width: width(progress.bought) }} />
        <span className="bg-secondary/60" style={{ width: width(progress.planned) }} />
      </div>
      {showLegend && (
        <p className="flex flex-wrap gap-x-3 text-xs text-foreground/70">
          <Legend className="bg-primary" label={t('progress.wrapped', { count: progress.wrapped })} />
          <Legend className="bg-accent" label={t('progress.bought', { count: progress.bought })} />
          <Legend className="bg-secondary/60" label={t('progress.planned', { count: progress.planned })} />
          <Legend className="bg-foreground/10" label={t('progress.empty', { count: progress.empty })} />
        </p>
      )}
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  )
}
