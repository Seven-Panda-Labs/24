import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.tsx'
import TagChip from '../components/TagChip.tsx'
import { updateDay } from '../data/calendars.ts'
import { currentYear, daysWithStatus, type DayRef } from '../domain/days.ts'
import { useWorkspace } from '../workspace/WorkspaceContext.tsx'

/**
 * The shopping list: every planned gift of the year, grouped by person, to tick
 * off in the shop. A second tab lists bought gifts for whoever wraps them.
 * Both read from the local cache, so they work without signal.
 */
export default function ShoppingPage() {
  const { t } = useTranslation()
  const { workspace, calendars, tags } = useWorkspace()
  const [params] = useSearchParams()
  const year = Number(params.get('year')) || currentYear()
  const [tab, setTab] = useState<'buy' | 'wrap'>('buy')
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]))

  const ofYear = calendars.filter((calendar) => calendar.year === year)
  const toBuy = daysWithStatus(ofYear, 'planned')
  const toWrap = daysWithStatus(ofYear, 'bought')
  const items = tab === 'buy' ? toBuy : toWrap

  const groups = new Map<string, DayRef[]>()
  for (const item of items) groups.set(item.calendar.id, [...(groups.get(item.calendar.id) ?? []), item])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-3xl font-bold text-primary">
        {t('shopping.title')} <span className="text-foreground/70">{year}</span>
      </h1>

      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl bg-foreground/5 p-1">
        {(['buy', 'wrap'] as const).map((option) => (
          <button
            key={option}
            role="tab"
            type="button"
            aria-selected={tab === option}
            onClick={() => setTab(option)}
            className="rounded-xl py-2 text-sm font-bold text-foreground/70 aria-selected:bg-background aria-selected:text-primary aria-selected:shadow-sm"
          >
            {t(`shopping.${option}Tab`, { count: option === 'buy' ? toBuy.length : toWrap.length })}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState illustration={tab === 'buy' ? 'packing' : 'ready'} title={t(`shopping.${tab}Empty`)} />
      ) : (
        [...groups.values()].map((group) => (
          <section key={group[0].calendar.id} className="card flex flex-col gap-2">
            <h2 className="font-display text-lg font-bold">
              <Link to={`/calendars/${group[0].calendar.id}`}>{group[0].calendar.person}</Link>
            </h2>
            <ul className="flex flex-col divide-y divide-foreground/10">
              {group.map(({ calendar, day, value }) => (
                <li key={day}>
                  <label className="flex cursor-pointer items-start gap-3 py-2.5">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 accent-primary"
                      onChange={() => updateDay(workspace.id, calendar.id, day, { status: tab === 'buy' ? 'bought' : 'wrapped' })}
                    />
                    <span className="flex flex-1 flex-col gap-1">
                      <span className="font-semibold">{value.gift}</span>
                      {value.notes && <span className="text-sm text-foreground/70">{value.notes}</span>}
                      <span className="flex flex-wrap gap-1">
                        <span className="text-xs text-foreground/70">{t('day.number', { number: day })}</span>
                        {value.tagIds.flatMap((id) => tagsById.get(id) ?? []).map((tag) => (
                          <TagChip key={tag.id} tag={tag} />
                        ))}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
