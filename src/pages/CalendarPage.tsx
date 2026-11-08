import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import DayCard from '../components/DayCard.tsx'
import DayEditor from '../components/DayEditor.tsx'
import ProgressBar from '../components/ProgressBar.tsx'
import TagChip from '../components/TagChip.tsx'
import { saveDay, setDayStatus } from '../data/calendars.ts'
import { currentYear, dayNumbers, dayOf, matchesFilter, nextStatus, progressOf, type DayFilter } from '../domain/days.ts'
import type { Day, Tag } from '../domain/types.ts'
import { useWorkspace } from '../workspace/WorkspaceContext.tsx'

const VIEW_KEY = '24:calendar-view'

export default function CalendarPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { workspace, calendars, tags } = useWorkspace()
  const [view, setView] = useState<'grid' | 'list'>(() => (localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'))
  const [filter, setFilter] = useState<DayFilter>('all')
  const calendar = calendars.find((candidate) => candidate.id === id)

  if (!calendar) {
    return (
      <p className="card">
        {t('calendar.notFound')} <Link to="/" className="underline">{t('nav.calendars')}</Link>
      </p>
    )
  }

  const progress = progressOf(calendar)
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]))
  const openDay = Number(params.get('day')) || null
  const days = dayNumbers(calendar)

  const open = (day: number | null) => setParams(day ? { day: String(day) } : {}, { replace: openDay !== null })
  const save = (day: number, value: Day | null) => saveDay(workspace.id, calendar.id, day, value)
  const nextEmpty = (after: number) => days.find((day) => day > after && !dayOf(calendar, day)) ?? null

  function changeView(next: 'grid' | 'list') {
    localStorage.setItem(VIEW_KEY, next)
    setView(next)
  }

  const filters: { value: DayFilter; label: string }[] = [
    { value: 'all', label: t('filters.all') },
    { value: 'empty', label: t('filters.empty', { count: progress.empty }) },
    { value: 'toBuy', label: t('filters.toBuy', { count: progress.planned }) },
    { value: 'toWrap', label: t('filters.toWrap', { count: progress.bought }) },
  ]
  const sameFilter = (a: DayFilter, b: DayFilter) =>
    typeof a === 'string' || typeof b === 'string' ? a === b : a.tagId === b.tagId

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start gap-2">
        <div className="flex-1">
          <Link to={calendar.year === currentYear() ? '/' : `/?year=${calendar.year}`} className="text-sm text-foreground/60">
            ← {calendar.year}
            {calendar.year < currentYear() && ` · 📦 ${t('home.archivedShort')}`}
          </Link>
          <h1 className="font-display text-3xl font-bold text-primary">{calendar.person}</h1>
          {calendar.name && <p className="text-sm text-foreground/60">{calendar.name}</p>}
        </div>
        <Link to={`/calendars/${calendar.id}/edit`} className="btn-ghost" aria-label={t('calendar.edit')}>
          ⚙️
        </Link>
      </header>

      <ProgressBar progress={progress} showLegend />

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t('filters.label')} className="flex flex-wrap gap-1.5">
          {filters.map((option) => (
            <FilterButton key={String(option.value)} active={sameFilter(filter, option.value)} onClick={() => setFilter(option.value)}>
              {option.label}
            </FilterButton>
          ))}
          {tags.map((tag) => (
            <FilterButton
              key={tag.id}
              active={sameFilter(filter, { tagId: tag.id })}
              onClick={() => setFilter({ tagId: tag.id })}
            >
              <span aria-hidden>{tag.emoji}</span> {tag.name}
            </FilterButton>
          ))}
        </div>
        <div role="group" aria-label={t('calendar.view')} className="ml-auto flex rounded-xl bg-foreground/5 p-0.5">
          {(['grid', 'list'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => changeView(option)}
              className="rounded-lg px-3 py-1 text-xs font-bold aria-pressed:bg-background aria-pressed:shadow-sm"
            >
              {t(`calendar.${option}`)}
            </button>
          ))}
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {days.map((day) => (
            <DayCard
              key={day}
              number={day}
              day={dayOf(calendar, day)}
              tags={tagsById}
              dimmed={!matchesFilter(dayOf(calendar, day), filter)}
              onOpen={() => open(day)}
            />
          ))}
        </div>
      ) : (
        <ol className="flex flex-col divide-y divide-foreground/10 rounded-3xl border border-foreground/10 bg-surface">
          {days
            .filter((day) => matchesFilter(dayOf(calendar, day), filter))
            .map((day) => (
              <ListRow
                key={day}
                number={day}
                day={dayOf(calendar, day)}
                tags={tagsById}
                onSave={(value) => save(day, value)}
                onAdvance={(value) => setDayStatus(workspace.id, calendar.id, day, nextStatus(value.status))}
                onOpen={() => open(day)}
              />
            ))}
        </ol>
      )}

      {openDay !== null && openDay <= calendar.dayCount && (
        <DayEditor
          key={openDay}
          calendar={calendar}
          number={openDay}
          tags={tags}
          onSave={(value) => save(openDay, value)}
          onClose={() => open(null)}
          onNext={nextEmpty(openDay) === null ? undefined : () => open(nextEmpty(openDay))}
        />
      )}
    </div>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-background"
    >
      {children}
    </button>
  )
}

function ListRow({
  number,
  day,
  tags,
  onSave,
  onAdvance,
  onOpen,
}: {
  number: number
  day: Day | undefined
  tags: Map<string, Tag>
  onSave: (value: Day | null) => void
  onAdvance: (value: Day) => void
  onOpen: () => void
}) {
  const { t } = useTranslation()

  function commit(gift: string) {
    const trimmed = gift.trim()
    if (trimmed === (day?.gift ?? '')) return
    onSave(trimmed ? { ...(day ?? { status: 'planned', tagIds: [], notes: '' }), gift: trimmed } : null)
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <button type="button" onClick={onOpen} className="w-8 font-display font-bold text-primary" aria-label={t('day.open', { number })}>
        {String(number).padStart(2, '0')}
      </button>
      <input
        key={day?.gift ?? ''}
        defaultValue={day?.gift ?? ''}
        aria-label={t('day.giftFor', { number })}
        placeholder={t('day.giftPlaceholder')}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.currentTarget.blur()
          const next = event.currentTarget.closest('li')?.nextElementSibling?.querySelector('input')
          next?.focus()
        }}
        className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 outline-none focus:bg-background"
      />
      <span className="hidden gap-1 sm:flex">
        {day?.tagIds.flatMap((id) => tags.get(id) ?? []).map((tag) => <TagChip key={tag.id} tag={tag} />)}
      </span>
      {day && (
        <button
          type="button"
          onClick={() => onAdvance(day)}
          disabled={day.status === 'wrapped'}
          title={day.status === 'wrapped' ? undefined : t('day.advance')}
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${
            day.status === 'planned'
              ? 'bg-foreground/10'
              : day.status === 'bought'
                ? 'bg-accent/30 text-carvao'
                : 'bg-primary text-background'
          }`}
        >
          {t(`status.${day.status}`)}
        </button>
      )}
    </li>
  )
}
