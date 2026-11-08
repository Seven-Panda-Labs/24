import { useTranslation } from 'react-i18next'
import { TAG_STYLES } from '../domain/tags.ts'
import type { Day, Tag } from '../domain/types.ts'

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
    ? 'border-2 border-dashed border-foreground/15 text-foreground/40'
    : day.status === 'planned'
      ? 'jute border-2 border-dashed border-foreground/25'
      : day.status === 'bought'
        ? `border-2 border-primary/30 ${dayTags[0] ? TAG_STYLES[dayTags[0].color].soft : 'bg-surface'} text-carvao`
        : 'bg-primary text-background shadow-md'

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={`relative flex aspect-square flex-col gap-1 overflow-hidden rounded-2xl p-2 text-left transition hover:scale-[1.02] ${look} ${dimmed ? 'opacity-30' : ''}`}
    >
      <span className="flex items-center justify-between">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-bold ${
            day?.status === 'wrapped' ? 'bg-accent text-carvao' : 'bg-foreground/10'
          }`}
        >
          {String(number).padStart(2, '0')}
        </span>
        <span aria-hidden className="text-sm">
          {!day ? '' : day.status === 'planned' ? '✏️' : day.status === 'bought' ? '✅' : '🎀'}
        </span>
      </span>
      {day ? (
        <span className="line-clamp-3 text-xs leading-tight font-semibold">{day.gift}</span>
      ) : (
        <span aria-hidden className="m-auto text-2xl">
          +
        </span>
      )}
      {dayTags.length > 0 && (
        <span className="mt-auto flex gap-0.5" aria-hidden>
          {dayTags.slice(0, 3).map((tag) => (
            <span key={tag.id} className="text-xs">
              {tag.emoji}
            </span>
          ))}
        </span>
      )}
    </button>
  )
}
