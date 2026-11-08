import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { dayNumbers, dayOf } from '../domain/days.ts'
import { distribute, type Placement } from '../domain/distribute.ts'
import type { Calendar, Tag } from '../domain/types.ts'

/** What distributing the sack would do, day by day, before it does it. */
export default function DistributeDialog({
  calendar,
  tags,
  onApply,
  onClose,
}: {
  calendar: Calendar
  tags: Map<string, Tag>
  onApply: (plan: Placement[]) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  // Worked out on every render, so a change someone else makes meanwhile shows up here.
  const plan = distribute(calendar)
  const planned = new Map(plan.map(({ id, day }) => [day, calendar.sack[id]]))
  const kept = Object.keys(calendar.sack).length - plan.length

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-carvao/50 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="distribute-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-3xl bg-background p-5 shadow-xl sm:rounded-3xl"
      >
        <header>
          <h2 id="distribute-title" className="font-display text-2xl font-bold text-primary">
            {t('sack.distributeTitle')}
          </h2>
          <p className="text-sm text-foreground/70">{t('sack.distributeIntro')}</p>
        </header>

        <ol className="flex flex-col divide-y divide-foreground/10 rounded-2xl border border-foreground/10">
          {dayNumbers(calendar).map((day) => {
            const fromSack = planned.get(day)
            const value = fromSack ?? dayOf(calendar, day)
            return (
              <li key={day} className={`flex items-center gap-2 px-3 py-1.5 text-sm ${fromSack ? 'bg-accent/15 font-semibold' : 'text-foreground/70'}`}>
                <span className="w-6 font-display font-bold text-primary">{String(day).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1 truncate">{value?.gift ?? <i>{t('sack.staysEmpty')}</i>}</span>
                <span aria-hidden>{value?.tagIds.map((id) => tags.get(id)?.emoji).join('')}</span>
                {fromSack && <span className="text-xs font-normal">{t('sack.fromSack')}</span>}
              </li>
            )
          })}
        </ol>

        {kept > 0 && <p className="text-sm text-foreground/70">{t('sack.kept', { count: kept })}</p>}

        <footer className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={plan.length === 0}
            onClick={() => {
              onApply(plan)
              onClose()
            }}
          >
            {t('sack.apply')}
          </button>
        </footer>
      </div>
    </div>
  )
}
