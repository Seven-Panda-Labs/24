import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUser } from '../auth/AuthContext.tsx'
import EmptyState from '../components/EmptyState.tsx'
import ProgressBar from '../components/ProgressBar.tsx'
import { acceptInvite } from '../data/workspaces.ts'
import { currentYear, progressOf } from '../domain/days.ts'
import { useWorkspace } from '../workspace/WorkspaceContext.tsx'

export default function HomePage() {
  const { t } = useTranslation()
  const user = useUser()
  const { calendars, invites, selectWorkspace } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const year = Number(params.get('year')) || currentYear()
  const years = [...new Set([currentYear(), ...calendars.map((calendar) => calendar.year)])].sort((a, b) => b - a)
  const ofYear = calendars.filter((calendar) => calendar.year === year)
  const archived = year < currentYear()

  const totals = ofYear.map(progressOf).reduce(
    (sum, progress) => ({ planned: sum.planned + progress.planned, bought: sum.bought + progress.bought }),
    { planned: 0, bought: 0 },
  )

  return (
    <div className="flex flex-col gap-5">
      {invites.map((workspace) => (
        <div key={workspace.id} className="card flex flex-wrap items-center gap-3">
          <p className="flex-1">{t('onboarding.invited', { name: workspace.name })}</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              acceptInvite(workspace, user)
              selectWorkspace(workspace.id)
            }}
          >
            {t('onboarding.join')}
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <h1 className="font-display text-3xl font-bold text-primary">{t('home.title')}</h1>
        <label className="ml-auto">
          <span className="sr-only">{t('home.year')}</span>
          <select
            value={year}
            onChange={(event) => setParams(Number(event.target.value) === currentYear() ? {} : { year: event.target.value })}
            className="input w-auto py-1.5 font-display font-bold"
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {archived && <p className="text-sm text-foreground/70">📦 {t('home.archived')}</p>}

      {ofYear.length > 0 && (totals.planned > 0 || totals.bought > 0) && (
        <Link to={year === currentYear() ? '/todo' : `/todo?year=${year}`} className="card flex flex-wrap gap-x-4 gap-y-1 py-3 text-sm font-semibold">
          <span>🛍️ {t('home.toBuy', { count: totals.planned })}</span>
          <span>🎁 {t('home.toWrap', { count: totals.bought })}</span>
        </Link>
      )}

      {ofYear.length === 0 ? (
        <EmptyState illustration="search" title={t('home.emptyTitle')}>
          <p className="text-sm text-foreground/70">{t('home.emptyText', { year })}</p>
          <Link to={`/calendars/new?year=${year}`} className="btn-primary">
            {t('home.newCalendar')}
          </Link>
        </EmptyState>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {ofYear.map((calendar) => {
              const progress = progressOf(calendar)
              return (
                <li key={calendar.id}>
                  <Link to={`/calendars/${calendar.id}`} className="card flex flex-col gap-3 transition hover:border-primary/40">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="font-display text-xl font-bold">{calendar.person}</h2>
                      <span className="text-sm text-foreground/70">
                        {t('home.filled', { count: progress.total - progress.empty, total: progress.total })}
                      </span>
                    </div>
                    {calendar.name && <p className="-mt-2 text-sm text-foreground/70">{calendar.name}</p>}
                    <ProgressBar progress={progress} showLegend />
                  </Link>
                </li>
              )
            })}
          </ul>
          <Link to={`/calendars/new?year=${year}`} className="btn-secondary self-start">
            + {t('home.newCalendar')}
          </Link>
        </>
      )}
    </div>
  )
}
