import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { dateOfDay, dayChanges, dayNumbers, dayOf, giftAt, newSackId, sackOf } from '../domain/days.ts'
import { TAG_STYLES } from '../domain/tags.ts'
import { STATUSES, type Calendar, type Day, type Slot, type Tag } from '../domain/types.ts'
import type { Suggestion } from '../suggestions/engine.ts'
import PhotoField from './PhotoField.tsx'
import SuggestionList from './SuggestionList.tsx'

export interface DayEditorProps {
  calendar: Calendar
  slot: Slot
  tags: Tag[]
  /** The fields to write (see dayChanges), or `null` to empty the slot. */
  onSave: (changes: Partial<Day> | null) => void
  /** Moves a gift to another slot, with the given edits. */
  onMove: (from: Slot, to: Slot, changes: Partial<Day>) => void
  onClose: () => void
  onNext?: () => void
  /** Shown while the gift is empty. */
  suggestions?: Suggestion[]
  onDismiss?: (suggestion: Suggestion) => void
}

export default function DayEditor({ calendar, slot, tags, onSave, onMove, onClose, onNext, suggestions = [], onDismiss }: DayEditorProps) {
  const { t, i18n } = useTranslation()
  const saved = giftAt(calendar, slot)
  // The day as it was when the editor opened: saving writes only what differs from it.
  const [before] = useState(saved)
  const [gift, setGift] = useState(before?.gift ?? '')
  const [status, setStatus] = useState(before?.status ?? 'planned')
  const [tagIds, setTagIds] = useState(before?.tagIds ?? [])
  const [notes, setNotes] = useState(before?.notes ?? '')
  const [fromSuggestion, setFromSuggestion] = useState(before?.fromSuggestion ?? false)
  const [targetDay, setTargetDay] = useState(0)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const changes = () => dayChanges(before, { gift, status, tagIds, notes, fromSuggestion })

  function submit(event: FormEvent) {
    event.preventDefault()
    const edits = changes()
    if (targetDay && edits) onMove(slot, { day: targetDay }, edits)
    else onSave(edits)
    onClose()
  }

  const date =
    'day' in slot &&
    dateOfDay(calendar, slot.day).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })
  const emptyDays = dayNumbers(calendar).filter((day) => !dayOf(calendar, day))
  const sack = 'day' in slot && !saved ? sackOf(calendar) : []

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-carvao/50 sm:items-center" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-editor-title"
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-3xl bg-background p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-2">
          <div>
            <h2 id="day-editor-title" className="font-display text-2xl font-bold text-primary">
              {'day' in slot ? t('day.number', { number: slot.day }) : t('sack.title')}
            </h2>
            <p className="text-sm text-foreground/70 first-letter:uppercase">{date || t('sack.noDay')}</p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost" aria-label={t('common.close')}>
            ✕
          </button>
        </header>

        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t('day.gift')}
          <input
            autoFocus
            value={gift}
            onChange={(event) => {
              setGift(event.target.value)
              setFromSuggestion(false)
            }}
            placeholder={t('day.giftPlaceholder')}
            className="input"
          />
        </label>

        {!gift.trim() && sack.length > 0 && (
          <section aria-labelledby="from-sack-title" className="flex flex-col gap-2 rounded-2xl bg-foreground/5 p-3">
            <h3 id="from-sack-title" className="text-sm font-bold">
              {t('sack.fromSack')}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {sack.map(([id, value]) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      onMove({ sack: id }, slot, {})
                      onClose()
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl bg-background px-3 py-2 text-left"
                  >
                    <span className="font-semibold">{value.gift}</span>
                    <span className="text-xs text-foreground/70">{t(`status.${value.status}`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!gift.trim() && suggestions.length > 0 && (
          <SuggestionList
            suggestions={suggestions}
            onApply={(suggestion) => {
              setGift(suggestion.gift)
              setTagIds(suggestion.tagIds.filter((id) => tags.some((tag) => tag.id === id)))
              setFromSuggestion(true)
            }}
            onDismiss={(suggestion) => onDismiss?.(suggestion)}
          />
        )}

        <fieldset className="flex flex-col gap-1" disabled={!gift.trim()}>
          <legend className="mb-1 text-sm font-semibold">{t('day.status')}</legend>
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-foreground/5 p-1">
            {STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={status === option}
                onClick={() => setStatus(option)}
                className="rounded-xl px-2 py-2 text-xs font-bold text-foreground/70 aria-pressed:bg-primary aria-pressed:text-background disabled:opacity-40"
              >
                {t(`status.${option}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {tags.length > 0 && (
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">{t('day.tags')}</legend>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = tagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTagIds(selected ? tagIds.filter((id) => id !== tag.id) : [...tagIds, tag.id])}
                    className={`chip py-1 ${TAG_STYLES[tag.color].chip} ${selected ? 'font-bold ring-2 ring-primary ring-inset' : 'opacity-60'}`}
                  >
                    {tag.emoji} {tag.name}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t('day.notes')}
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder={t('day.notesPlaceholder')}
            className="input"
          />
        </label>

        {saved && <PhotoField calendarId={calendar.id} slot={slot} value={saved} />}

        {'sack' in slot && emptyDays.length > 0 && (
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {t('sack.putOnDay')}
            <select value={targetDay} onChange={(event) => setTargetDay(Number(event.target.value))} className="input">
              <option value={0}>{t('sack.keepInSack')}</option>
              {emptyDays.map((day) => (
                <option key={day} value={day}>
                  {t('day.number', { number: day })}
                </option>
              ))}
            </select>
          </label>
        )}

        <footer className="flex flex-wrap items-center gap-2 pt-2">
          {saved && (
            <button
              type="button"
              className="btn-ghost text-secondary"
              onClick={() => {
                onSave(null)
                onClose()
              }}
            >
              {'day' in slot ? t('day.clear') : t('sack.remove')}
            </button>
          )}
          {saved && 'day' in slot && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                onMove(slot, { sack: newSackId() }, changes() ?? {})
                onClose()
              }}
            >
              {t('sack.backToSack')}
            </button>
          )}
          <span className="flex-1" />
          {onNext && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onSave(changes())
                onNext()
              }}
            >
              {t('day.saveAndNext')}
            </button>
          )}
          <button type="submit" className="btn-primary">
            {t('common.save')}
          </button>
        </footer>
      </form>
    </div>
  )
}
