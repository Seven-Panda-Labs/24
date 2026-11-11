import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.tsx'
import { GiftName, GiftThumb } from '../components/Gift.tsx'
import TagChip from '../components/TagChip.tsx'
import { updateGift } from '../data/calendars.ts'
import { currentYear, giftsWithStatus, type GiftRef } from '../domain/days.ts'
import { tagsOfGift } from '../domain/tags.ts'
import { useCalendars } from '../calendars/CalendarsContext.tsx'

/**
 * The To do page. Its buy tab is the shopping list: every planned gift of the year, on a day or in the sack,
 * grouped by person, to tick off in the shop. A second tab lists bought gifts
 * for whoever wraps them.
 * Both read from the local cache, so they work without signal.
 */
export default function ShoppingPage() {
  const { t } = useTranslation()
  const { calendars } = useCalendars()
  const [params] = useSearchParams()
  const year = Number(params.get('year')) || currentYear()
  const [tab, setTab] = useState<'buy' | 'wrap'>('buy')

  const ofYear = calendars.filter((calendar) => calendar.year === year)
  const toBuy = giftsWithStatus(ofYear, 'planned')
  const toWrap = giftsWithStatus(ofYear, 'bought')
  const items = tab === 'buy' ? toBuy : toWrap

  const groups = new Map<string, GiftRef[]>()
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
              {group.map(({ calendar, slot, value }) => (
                <li key={'day' in slot ? slot.day : slot.sack}>
                  <label className="flex cursor-pointer items-start gap-3 py-2.5">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 accent-primary"
                      onChange={() => updateGift(calendar.id, slot, { status: tab === 'buy' ? 'bought' : 'wrapped' })}
                    />
                    <span className="flex flex-1 flex-col gap-1">
                      <span className="font-semibold">
                        <GiftName value={value} />
                      </span>
                      {value.notes && <span className="text-sm text-foreground/70">{value.notes}</span>}
                      <span className="flex flex-wrap gap-1">
                        <span className="text-xs text-foreground/70">
                          {'day' in slot ? t('day.number', { number: slot.day }) : t('sack.inSack')}
                        </span>
                        {tagsOfGift(calendar, value).map((tag) => (
                          <TagChip key={tag.id} tag={tag} />
                        ))}
                      </span>
                    </span>
                    <GiftThumb value={value} />
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
