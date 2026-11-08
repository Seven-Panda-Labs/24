import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { dayNumbers, dayOf, sackOf } from '../domain/days.ts'
import type { Calendar, Day, Tag } from '../domain/types.ts'
import StatusButton from './StatusButton.tsx'
import TagChip from './TagChip.tsx'

/** Gifts and ideas without a day yet, to put on one later. */
export default function Sack({
  calendar,
  tags,
  onAdd,
  onAdvance,
  onOpen,
}: {
  calendar: Calendar
  tags: Map<string, Tag>
  onAdd: (gift: string) => void
  onAdvance: (id: string, value: Day) => void
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const gifts = sackOf(calendar)
  const spare = gifts.length - dayNumbers(calendar).filter((day) => !dayOf(calendar, day)).length

  function add(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    onAdd(draft.trim())
    setDraft('')
  }

  return (
    <section aria-labelledby="sack-title" className="card flex flex-col gap-3">
      <header>
        <h2 id="sack-title" className="font-display text-xl font-bold">
          {t('sack.title')} {gifts.length > 0 && <span className="text-foreground/70">({gifts.length})</span>}
        </h2>
        <p className="text-sm text-foreground/70">{t('sack.intro')}</p>
      </header>

      <form onSubmit={add} className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={t('sack.add')}
          placeholder={t('day.giftPlaceholder')}
          className="input min-w-0 flex-1"
        />
        <button type="submit" className="btn-secondary">
          {t('sack.add')}
        </button>
      </form>

      {gifts.length > 0 && (
        <ul className="flex flex-col divide-y divide-foreground/10">
          {gifts.map(([id, gift]) => (
            <li key={id} className="flex items-center gap-2 py-2">
              <button type="button" onClick={() => onOpen(id)} className="min-w-0 flex-1 text-left font-semibold break-words">
                {gift.gift}
              </button>
              <span className="hidden gap-1 sm:flex">
                {gift.tagIds.flatMap((tagId) => tags.get(tagId) ?? []).map((tag) => (
                  <TagChip key={tag.id} tag={tag} />
                ))}
              </span>
              <StatusButton status={gift.status} onAdvance={() => onAdvance(id, gift)} />
            </li>
          ))}
        </ul>
      )}

      {spare > 0 && <p className="text-xs text-foreground/70">{t('sack.spare', { count: spare })}</p>}
    </section>
  )
}
