import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import DayCard from '../components/DayCard.tsx'
import DayEditor from '../components/DayEditor.tsx'
import { GiftThumb } from '../components/Gift.tsx'
import ProgressBar from '../components/ProgressBar.tsx'
import Celebration from '../components/Celebration.tsx'
import Sack from '../components/Sack.tsx'
import StatusButton from '../components/StatusButton.tsx'
import TagChip from '../components/TagChip.tsx'
import { clearGift, moveGifts, updateGift } from '../data/calendars.ts'
import { feedbackOf, recordFeedback, type Feedback } from '../data/feedback.ts'
import { deletePhoto } from '../data/photos.ts'
import { useDocs } from '../data/useDocs.ts'
import {
  currentYear,
  dayNumbers,
  dayOf,
  giftAt,
  matchesFilter,
  nextStatus,
  progressOf,
  sackOf,
  type DayFilter,
} from '../domain/days.ts'
import { tagsOf } from '../domain/tags.ts'
import type { Day, Slot, Tag } from '../domain/types.ts'
import { historyOf, suggest, type Idea } from '../suggestions/engine.ts'
import { useCalendars } from '../calendars/CalendarsContext.tsx'

const VIEW_KEY = '24:calendar-view'

export default function CalendarPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { calendars } = useCalendars()
  const [view, setView] = useState<'grid' | 'list'>(() => (localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'))
  const [filter, setFilter] = useState<DayFilter>('all')
  const calendar = calendars.find((candidate) => candidate.id === id)
  const feedback = useDocs<Feedback>(id ? `feedback:${id}` : null, () => feedbackOf(String(id))) ?? []

  if (!calendar) {
    return (
      <p className="card">
        {t('calendar.notFound')} <Link to="/" className="underline">{t('nav.calendars')}</Link>
      </p>
    )
  }

  const progress = progressOf(calendar)
  const tags = tagsOf(calendar)
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]))
  const days = dayNumbers(calendar)
  const openDay = Number(params.get('day'))
  const openSack = params.get('sack')
  const openSlot: Slot | null =
    openDay > 0 && openDay <= calendar.dayCount ? { day: openDay } : openSack && calendar.sack[openSack] ? { sack: openSack } : null

  const open = (slot: Slot | null) =>
    setParams(slot ? ('day' in slot ? { day: String(slot.day) } : { sack: slot.sack }) : {}, { replace: openSlot !== null })
  const save = (slot: Slot, changes: Partial<Day> | null) => {
    const current = giftAt(calendar, slot)
    if (changes === null) {
      if (current) deletePhoto(current)
      clearGift(calendar.id, slot)
      return
    }
    if (Object.keys(changes).length === 0) return
    updateGift(calendar.id, slot, changes)
    if (changes.fromSuggestion) {
      recordFeedback(calendar.id, changes.gift ?? current?.gift ?? '', 'accepted')
    }
  }
  const move = (from: Slot, to: Slot, changes: Partial<Day>) => {
    const current = giftAt(calendar, from)
    if (current) moveGifts(calendar.id, [{ from, to, value: { ...current, ...changes } }])
  }

  const ideas: Idea[] = Object.entries(t('ideas', { returnObjects: true }) as Record<string, string[]>).flatMap(
    ([category, gifts]) => gifts.map((gift) => ({ gift, tagIds: [category] })),
  )
  const suggestions =
    openSlot && 'day' in openSlot && !dayOf(calendar, openSlot.day)
      ? suggest({
          history: historyOf(calendars.filter((other) => other.id !== calendar.id)),
          calendar,
          current: [...days.flatMap((day) => dayOf(calendar, day)?.gift ?? []), ...sackOf(calendar).map(([, gift]) => gift.gift)],
          ideas,
          dismissed: feedback.filter((entry) => entry.action === 'dismissed').map((entry) => entry.gift),
          seed: `${calendar.id}:${openSlot.day}`,
        })
      : []
  const nextDay = openSlot && 'day' in openSlot ? (days.find((day) => day > openSlot.day && !dayOf(calendar, day)) ?? null) : null

  function changeView(next: 'grid' | 'list') {
    localStorage.setItem(VIEW_KEY, next)
    setView(next)
  }

  // Counts of days only: the progress also counts the sack.
  const countOf = (filter: DayFilter) => days.filter((day) => matchesFilter(dayOf(calendar, day), filter)).length
  const filters: { value: DayFilter; label: string }[] = [
    { value: 'all', label: t('filters.all') },
    { value: 'empty', label: t('filters.empty', { count: countOf('empty') }) },
    { value: 'toBuy', label: t('filters.toBuy', { count: countOf('toBuy') }) },
    { value: 'toWrap', label: t('filters.toWrap', { count: countOf('toWrap') }) },
  ]
  const sameFilter = (a: DayFilter, b: DayFilter) =>
    typeof a === 'string' || typeof b === 'string' ? a === b : a.tagId === b.tagId

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start gap-2">
        <div className="flex-1">
          <Link to={calendar.year === currentYear() ? '/' : `/?year=${calendar.year}`} className="text-sm text-foreground/70">
            ← {calendar.year}
            {calendar.year < currentYear() && ` · 📦 ${t('home.archivedShort')}`}
          </Link>
          <h1 className="font-display text-3xl font-bold text-primary">{calendar.person}</h1>
          {calendar.name && <p className="text-sm text-foreground/70">{calendar.name}</p>}
        </div>
        <Link to={`/calendars/${calendar.id}/share`} className="btn-ghost">
          <span aria-hidden>👥</span> {t('share.title')}
        </Link>
        <Link to={`/calendars/${calendar.id}/edit`} className="btn-ghost" aria-label={t('calendar.edit')}>
          ⚙️
        </Link>
      </header>

      <ProgressBar progress={progress} showLegend />

      <Celebration
        person={calendar.person}
        days={progress.total}
        complete={days.every((day) => dayOf(calendar, day)?.status === 'wrapped')}
      />

      <Sack
        calendar={calendar}
        tags={tagsById}
        onAdd={(id, value) => updateGift(calendar.id, { sack: id }, value)}
        onAdvance={(id, value) => updateGift(calendar.id, { sack: id }, { status: nextStatus(value.status) })}
        onOpen={(id) => open({ sack: id })}
        onDistribute={(plan) =>
          moveGifts(
            calendar.id,
            plan.map(({ id, day }) => ({ from: { sack: id }, to: { day }, value: calendar.sack[id] })),
          )
        }
      />

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
              onOpen={() => open({ day })}
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
                onSave={(value) => save({ day }, value)}
                onAdvance={(value) => updateGift(calendar.id, { day }, { status: nextStatus(value.status) })}
                onOpen={() => open({ day })}
              />
            ))}
        </ol>
      )}

      {openSlot && (
        <DayEditor
          key={'day' in openSlot ? openSlot.day : openSlot.sack}
          calendar={calendar}
          slot={openSlot}
          tags={tags}
          onSave={(value) => save(openSlot, value)}
          onMove={move}
          onClose={() => open(null)}
          onNext={nextDay === null ? undefined : () => open({ day: nextDay })}
          suggestions={suggestions}
          onDismiss={(suggestion) => recordFeedback(calendar.id, suggestion.gift, 'dismissed')}
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
  onSave: (changes: Partial<Day> | null) => void
  onAdvance: (value: Day) => void
  onOpen: () => void
}) {
  const { t } = useTranslation()

  function commit(gift: string) {
    const trimmed = gift.trim()
    if (trimmed === (day?.gift ?? '')) return
    if (!trimmed && !day?.photoUrl) onSave(null)
    else onSave(day ? { gift: trimmed } : { gift: trimmed, status: 'planned', tagIds: [], notes: '' })
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <button type="button" onClick={onOpen} className="w-8 font-display font-bold text-primary" aria-label={t('day.open', { number })}>
        {String(number).padStart(2, '0')}
      </button>
      {day && <GiftThumb value={day} />}
      <input
        key={day?.gift ?? ''}
        defaultValue={day?.gift ?? ''}
        aria-label={t('day.giftFor', { number })}
        placeholder={day && !day.gift ? t('photo.untitled') : t('day.giftPlaceholder')}
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
      {day && <StatusButton status={day.status} onAdvance={() => onAdvance(day)} />}
    </li>
  )
}
