import { useTranslation } from 'react-i18next'
import { TAG_STYLES } from '../domain/tags.ts'
import type { Day, Tag } from '../domain/types.ts'

const STATUS_ICON = { planned: '✏️', bought: '✅', wrapped: '🎀' }

export default function DayCard({
  number,
  day,
  tags,
  dimmed,
  onOpen,
}: {
  number: number
  day: Day | undefined
  tags: Map<string, Tag>
  dimmed: boolean
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const dayTags = day?.tagIds.flatMap((id) => tags.get(id) ?? []) ?? []
  const label = day ? `${t('day.number', { number })}: ${day.gift}, ${t(`status.${day.status}`)}` : t('day.emptyLabel', { number })

  const look = !day
    ? 'border-2 border-dashed border-foreground/15 text-foreground/60'
    : day.status === 'planned'
      ? 'jute border-2 border-dashed border-foreground/25'
      : day.status === 'bought'
        ? `border-2 border-primary/30 ${dayTags[0] ? `${TAG_STYLES[dayTags[0].color].soft} text-carvao` : 'bg-surface'}`
        : 'bg-primary text-background shadow-md'

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={`relative flex aspect-square flex-col gap-1 overflow-hidden rounded-2xl p-1.5 text-left transition hover:scale-[1.02] sm:p-2 ${look} ${dimmed ? 'opacity-30' : ''}`}
    >
      <span className="flex items-center gap-0.5">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold ${
            day?.status === 'wrapped' ? 'bg-accent text-carvao' : 'bg-foreground/10'
          }`}
        >
          {String(number).padStart(2, '0')}
        </span>
        {/* Icons share the number's row so the gift keeps the rest of the door. */}
        <span aria-hidden className="ml-auto flex min-w-0 gap-px overflow-hidden text-[11px]">
          {dayTags.slice(0, 2).map((tag) => (
            <span key={tag.id}>{tag.emoji}</span>
          ))}
          {day?.photoUrl && <span>📷</span>}
          {day && <span>{STATUS_ICON[day.status]}</span>}
        </span>
      </span>
      {day ? (
        <span className="line-clamp-3 text-[11px] leading-tight font-semibold break-words hyphens-auto sm:text-xs">{day.gift}</span>
      ) : (
        <span aria-hidden className="m-auto text-2xl">
          +
        </span>
      )}
    </button>
  )
}
