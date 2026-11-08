import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { dateOfDay, dayOf } from '../domain/days.ts'
import { TAG_STYLES } from '../domain/tags.ts'
import { STATUSES, type Calendar, type Day, type Tag } from '../domain/types.ts'
import type { Suggestion } from '../suggestions/engine.ts'
import SuggestionList from './SuggestionList.tsx'

export interface DayEditorProps {
  calendar: Calendar
  number: number
  tags: Tag[]
  onSave: (value: Day | null) => void
  onClose: () => void
  onNext?: () => void
  /** Shown while the gift is empty. */
  suggestions?: Suggestion[]
  onDismiss?: (suggestion: Suggestion) => void
}

export default function DayEditor({ calendar, number, tags, onSave, onClose, onNext, suggestions = [], onDismiss }: DayEditorProps) {
  const { t, i18n } = useTranslation()
  const saved = dayOf(calendar, number)
  const [gift, setGift] = useState(saved?.gift ?? '')
  const [status, setStatus] = useState(saved?.status ?? 'planned')
  const [tagIds, setTagIds] = useState(saved?.tagIds ?? [])
  const [notes, setNotes] = useState(saved?.notes ?? '')
  const [fromSuggestion, setFromSuggestion] = useState(saved?.fromSuggestion ?? false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function value(): Day | null {
    if (!gift.trim()) return null
    return {
      gift: gift.trim(),
      status,
      tagIds,
      notes: notes.trim(),
      ...(fromSuggestion && { fromSuggestion }),
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    onSave(value())
    onClose()
  }

  const date = dateOfDay(calendar, number).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })

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
              {t('day.number', { number })}
            </h2>
            <p className="text-sm text-foreground/60 first-letter:uppercase">{date}</p>
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
                    className={`chip py-1 ${TAG_STYLES[tag.color].chip} ${selected ? 'ring-2 ring-primary' : 'opacity-60'}`}
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
              {t('day.clear')}
            </button>
          )}
          <span className="flex-1" />
          {onNext && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onSave(value())
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
