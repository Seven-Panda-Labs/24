import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.tsx'
import TagChip from '../components/TagChip.tsx'
import { dayNumbers, dayOf } from '../domain/days.ts'
import { normalize } from '../domain/text.ts'
import { useWorkspace } from '../workspace/WorkspaceContext.tsx'

/** Every gift ever planned, searchable across years and people. */
export default function HistoryPage() {
  const { t } = useTranslation()
  const { calendars, tags } = useWorkspace()
  const [search, setSearch] = useState('')
  const [person, setPerson] = useState('')
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]))
  const people = [...new Set(calendars.map((calendar) => calendar.person))].sort()
  const needle = normalize(search)

  const entries = calendars
    .filter((calendar) => !person || calendar.person === person)
    .flatMap((calendar) =>
      dayNumbers(calendar).flatMap((day) => {
        const value = dayOf(calendar, day)
        if (!value) return []
        if (needle && !normalize(`${value.gift} ${value.notes}`).includes(needle)) return []
        return [{ calendar, day, value }]
      }),
    )

  const years = [...new Set(entries.map((entry) => entry.calendar.year))].sort((a, b) => b - a)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-3xl font-bold text-primary">{t('history.title')}</h1>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">{t('history.search')}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('history.search')}
            className="input"
          />
        </label>
        <label>
          <span className="sr-only">{t('history.person')}</span>
          <select value={person} onChange={(event) => setPerson(event.target.value)} className="input sm:w-48">
            <option value="">{t('history.everyone')}</option>
            {people.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-foreground/60" role="status">
        {t('history.count', { count: entries.length })}
      </p>

      {entries.length === 0 ? (
        <EmptyState illustration="cocoa" title={t(calendars.length ? 'history.noMatch' : 'history.empty')} />
      ) : (
        years.map((year) => (
          <section key={year} className="flex flex-col gap-2">
            <h2 className="flex items-baseline gap-2 font-display text-xl font-bold">
              <Link to={`/?year=${year}`}>{year}</Link>
            </h2>
            <ul className="card flex flex-col divide-y divide-foreground/10 py-2">
              {entries
                .filter((entry) => entry.calendar.year === year)
                .map(({ calendar, day, value }) => (
                  <li key={`${calendar.id}-${day}`}>
                    <Link to={`/calendars/${calendar.id}?day=${day}`} className="flex flex-col gap-1 py-2">
                      <span className="font-semibold">{value.gift}</span>
                      <span className="flex flex-wrap items-center gap-1 text-xs text-foreground/60">
                        {calendar.person} · {t('day.number', { number: day })}
                        {value.tagIds.flatMap((id) => tagsById.get(id) ?? []).map((tag) => (
                          <TagChip key={tag.id} tag={tag} />
                        ))}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
