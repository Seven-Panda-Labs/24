import type { Calendar, Day, Tag, TagColor, TagFields } from './types.ts'

/** Full class strings, so Tailwind finds them when it scans the source. */
export const TAG_STYLES: Record<TagColor, { chip: string; soft: string }> = {
  amber: { chip: 'bg-amber-100 text-amber-900 border-amber-300', soft: 'bg-amber-50' },
  slate: { chip: 'bg-slate-200 text-slate-800 border-slate-300', soft: 'bg-slate-100' },
  sky: { chip: 'bg-sky-100 text-sky-900 border-sky-300', soft: 'bg-sky-50' },
  emerald: { chip: 'bg-emerald-100 text-emerald-900 border-emerald-300', soft: 'bg-emerald-50' },
  purple: { chip: 'bg-purple-100 text-purple-900 border-purple-300', soft: 'bg-purple-50' },
  red: { chip: 'bg-red-100 text-red-900 border-red-300', soft: 'bg-red-50' },
  pink: { chip: 'bg-pink-100 text-pink-900 border-pink-300', soft: 'bg-pink-50' },
  orange: { chip: 'bg-orange-100 text-orange-900 border-orange-300', soft: 'bg-orange-50' },
}

/**
 * Tags a calendar starts with when there is no earlier one to copy. The ids
 * double as the categories of the idea catalog (`ideas.*` in the locales), so
 * keep them stable.
 */
export const DEFAULT_TAGS: { id: string; color: TagColor; emoji: string }[] = [
  { id: 'sweets', color: 'amber', emoji: '🍬' },
  { id: 'clothes', color: 'slate', emoji: '🧦' },
  { id: 'home', color: 'sky', emoji: '🏠' },
  { id: 'experiences', color: 'emerald', emoji: '🎟️' },
  { id: 'books', color: 'purple', emoji: '📚' },
]

/** The default tags, named by `nameOf` (the interface language, or the Excel's for an import). */
export function defaultTags(nameOf: (id: string) => string): Record<string, TagFields> {
  return Object.fromEntries(DEFAULT_TAGS.map(({ id, ...tag }) => [id, { ...tag, name: nameOf(id) }]))
}

/** The calendar's tags, by name. */
export function tagsOf(calendar: Pick<Calendar, 'tags'>): Tag[] {
  return Object.entries(calendar.tags)
    .map(([id, tag]) => ({ id, ...tag }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** The gift's tags that the calendar still has. */
export function tagsOfGift(calendar: Pick<Calendar, 'tags'>, gift: Pick<Day, 'tagIds'>): Tag[] {
  return gift.tagIds.flatMap((id) => (calendar.tags[id] ? [{ id, ...calendar.tags[id] }] : []))
}
