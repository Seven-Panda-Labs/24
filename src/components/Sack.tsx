import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { dayNumbers, dayOf, newSackId, sackOf } from '../domain/days.ts'
import type { Placement } from '../domain/distribute.ts'
import type { Calendar, Day, Tag } from '../domain/types.ts'
import DistributeDialog from './DistributeDialog.tsx'
import { GiftName, GiftThumb } from './Gift.tsx'
import StatusButton from './StatusButton.tsx'
import TagChip from './TagChip.tsx'
import { PHOTO_TYPES, usePhotoUpload } from './usePhotoUpload.ts'

// It sits above the days, so a long sack must not push them off the screen.
const SHOWN = 3

/** Gifts and ideas without a day yet, to put on one later. */
export default function Sack({
  calendar,
  tags,
  onAdd,
  onAdvance,
  onOpen,
  onDistribute,
}: {
  calendar: Calendar
  tags: Map<string, Tag>
  onAdd: (id: string, value: Day) => void
  onAdvance: (id: string, value: Day) => void
  onOpen: (id: string) => void
  onDistribute: (plan: Placement[]) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const photo = usePhotoUpload(calendar.id)
  // Newest first, so a gift just added is always among the ones shown.
  const gifts = sackOf(calendar).reverse()
  const shown = expanded ? gifts : gifts.slice(0, SHOWN)
  const emptyDays = dayNumbers(calendar).filter((day) => !dayOf(calendar, day)).length
  const spare = gifts.length - emptyDays

  const newGift = (gift: string): Day => ({ gift, status: 'planned', tagIds: [], notes: '' })

  function add(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    onAdd(newSackId(), newGift(draft.trim()))
    setDraft('')
  }

  async function addPhoto(file: File | undefined) {
    const id = newSackId()
    const uploaded = await photo.upload({ sack: id }, file)
    if (!uploaded) return
    onAdd(id, { ...newGift(draft.trim()), ...uploaded })
    setDraft('')
  }

  return (
    <section aria-labelledby="sack-title" className="card flex flex-col gap-3">
      <header>
        <h2 id="sack-title" className="font-display text-xl font-bold">
          {t('sack.title')} {gifts.length > 0 && <span className="text-foreground/70">({gifts.length})</span>}
        </h2>
        {gifts.length === 0 && <p className="text-sm text-foreground/70">{t('sack.intro')}</p>}
      </header>

      {/* The buttons wrap below where their label is long (French) rather than squeeze the field. */}
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={t('sack.add')}
          placeholder={t('day.giftPlaceholder')}
          className="input min-w-28 flex-1"
        />
        <label
          aria-label={t('sack.addPhoto')}
          title={t('sack.addPhoto')}
          className={`btn-secondary cursor-pointer px-3 ${photo.busy ? 'pointer-events-none opacity-50' : ''}`}
        >
          {photo.busy ? '…' : '📷'}
          <input
            type="file"
            accept={PHOTO_TYPES}
            className="sr-only"
            disabled={photo.busy}
            onChange={(event) => {
              void addPhoto(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
        <button type="submit" className="btn-secondary">
          {t('sack.add')}
        </button>
      </form>
      {photo.error && (
        <p role="alert" className="text-sm text-secondary">
          {photo.error}
        </p>
      )}

      {gifts.length > 0 && (
        <ul className="flex flex-col divide-y divide-foreground/10">
          {shown.map(([id, gift]) => (
            <li key={id} className="flex items-center gap-2 py-2">
              <GiftThumb value={gift} />
              <button type="button" onClick={() => onOpen(id)} className="min-w-0 flex-1 text-left font-semibold break-words">
                <GiftName value={gift} />
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

      {(gifts.length > SHOWN || (gifts.length > 0 && emptyDays > 0)) && (
        <div className="flex flex-wrap items-center gap-2">
          {gifts.length > SHOWN && (
            <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="btn-ghost">
              {expanded ? t('sack.showLess') : t('sack.showMore', { count: gifts.length - SHOWN })}
            </button>
          )}
          {gifts.length > 0 && emptyDays > 0 && (
            <button type="button" onClick={() => setPreviewing(true)} className="btn-secondary">
              {t('sack.distribute')}
            </button>
          )}
        </div>
      )}

      {spare > 0 && <p className="text-xs text-foreground/70">{t('sack.spare', { count: spare })}</p>}

      {previewing && <DistributeDialog calendar={calendar} tags={tags} onApply={onDistribute} onClose={() => setPreviewing(false)} />}
    </section>
  )
}
