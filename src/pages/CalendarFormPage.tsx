import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useUser } from '../auth/AuthContext.tsx'
import { useCalendars } from '../calendars/CalendarsContext.tsx'
import { createCalendar, deleteCalendar, updateCalendar } from '../data/calendars.ts'
import { deletePhoto } from '../data/photos.ts'
import { currentYear } from '../domain/days.ts'
import { defaultTags } from '../domain/tags.ts'
import type { CalendarFields } from '../domain/types.ts'

export default function CalendarFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const [params] = useSearchParams()
  const user = useUser()
  const { calendars } = useCalendars()
  const existing = calendars.find((calendar) => calendar.id === id)
  const initialYear = Number(params.get('year')) || currentYear()

  const [fields, setFields] = useState<CalendarFields>(() =>
    existing
      ? {
          year: existing.year,
          person: existing.person,
          name: existing.name,
          startDate: existing.startDate,
          dayCount: existing.dayCount,
          allowRepeats: existing.allowRepeats,
          originality: existing.originality,
        }
      : {
          year: initialYear,
          person: '',
          name: '',
          startDate: `${initialYear}-12-01`,
          dayCount: 24,
          allowRepeats: false,
          originality: 0.5,
        },
  )
  // The calendar a new one copies its tags from, '' for the defaults. Until one is picked: the latest
  // for the same person, else the latest of all, so tags made by hand carry over to the next year.
  const [pickedSource, pickSource] = useState<string>()
  const tagSource = pickedSource ?? (calendars.find((calendar) => calendar.person === fields.person.trim()) ?? calendars[0])?.id ?? ''
  const people = [...new Set(calendars.map((calendar) => calendar.person))].sort()
  const filled = existing ? Object.keys(existing.days).map(Number) : []
  const minDays = Math.max(1, ...filled)

  if (id && !existing) return <p>{t('calendar.notFound')}</p>

  function set<K extends keyof CalendarFields>(key: K, value: CalendarFields[K]) {
    setFields((current) => {
      const next = { ...current, [key]: value }
      // Keep the default start date in step with the year until it is edited.
      if (key === 'year' && current.startDate === `${current.year}-12-01`) next.startDate = `${value}-12-01`
      return next
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const clean = { ...fields, person: fields.person.trim(), name: fields.name.trim() }
    if (existing) {
      updateCalendar(existing.id, clean)
      navigate(`/calendars/${existing.id}`)
      return
    }
    const tags = calendars.find((calendar) => calendar.id === tagSource)?.tags ?? defaultTags((tag) => t(`tags.defaults.${tag}`))
    navigate(`/calendars/${createCalendar(user, clean, tags)}`, { replace: true })
  }

  function remove() {
    if (!existing || !window.confirm(t('calendarForm.confirmDelete', { person: existing.person, year: existing.year }))) return
    for (const gift of [...Object.values(existing.days), ...Object.values(existing.sack)]) deletePhoto(gift)
    deleteCalendar(existing.id)
    navigate(`/?year=${existing.year}`)
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="font-display text-3xl font-bold text-primary">
        {existing ? t('calendarForm.editTitle') : t('calendarForm.newTitle')}
      </h1>

      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t('calendarForm.person')}
        <input
          required
          autoFocus={!existing}
          maxLength={80}
          pattern=".*\S.*"
          list="people"
          value={fields.person}
          onChange={(event) => set('person', event.target.value)}
          className="input"
        />
        <datalist id="people">
          {people.map((person) => (
            <option key={person} value={person} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t('calendarForm.name')}
        <input maxLength={80} value={fields.name} onChange={(event) => set('name', event.target.value)} className="input" />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t('calendarForm.year')}
          <input
            type="number"
            required
            min={2000}
            max={2100}
            value={fields.year}
            onChange={(event) => set('year', Number(event.target.value))}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t('calendarForm.startDate')}
          <input
            type="date"
            required
            value={fields.startDate}
            onChange={(event) => set('startDate', event.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t('calendarForm.dayCount')}
          <input
            type="number"
            required
            min={minDays}
            max={31}
            value={fields.dayCount}
            onChange={(event) => set('dayCount', Number(event.target.value))}
            className="input"
          />
        </label>
      </div>

      {!existing && calendars.length > 0 && (
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t('calendarForm.tagsFrom')}
          <select value={tagSource} onChange={(event) => pickSource(event.target.value)} className="input">
            {calendars.map((calendar) => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.person} · {calendar.year}
              </option>
            ))}
            <option value="">{t('calendarForm.defaultTags')}</option>
          </select>
        </label>
      )}

      <fieldset className="card flex flex-col gap-4">
        <legend className="px-1 text-sm font-semibold">{t('calendarForm.suggestions')}</legend>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={fields.allowRepeats}
            onChange={(event) => set('allowRepeats', event.target.checked)}
            className="h-5 w-5 accent-primary"
          />
          {t('calendarForm.allowRepeats')}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          {t('calendarForm.originality')}
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={fields.originality}
            onChange={(event) => set('originality', Number(event.target.value))}
            className="accent-primary"
          />
          <span className="flex justify-between text-xs text-foreground/70">
            <span>{t('calendarForm.traditional')}</span>
            <span>{t('calendarForm.original')}</span>
          </span>
        </label>
      </fieldset>

      {existing && (
        <div className="flex flex-wrap gap-2">
          <Link to={`/calendars/${existing.id}/share`} className="btn-secondary">
            <span aria-hidden>👥</span> {t('share.title')}
          </Link>
          <Link to={`/calendars/${existing.id}/tags`} className="btn-secondary">
            <span aria-hidden>🏷️</span> {t('tags.title')}
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {existing && (
          <button type="button" onClick={remove} className="btn-ghost text-secondary">
            {t('calendarForm.delete')}
          </button>
        )}
        <span className="flex-1" />
        <Link to={existing ? `/calendars/${existing.id}` : '/'} className="btn-ghost">
          {t('common.cancel')}
        </Link>
        <button type="submit" className="btn-primary">
          {t('common.save')}
        </button>
      </div>
    </form>
  )
}
