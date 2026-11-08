import { STATUSES, type Calendar, type Day, type Slot, type Status } from './types.ts'

export function currentYear(): number {
  return new Date().getFullYear()
}

export function dayNumbers(calendar: Pick<Calendar, 'dayCount'>): number[] {
  return Array.from({ length: calendar.dayCount }, (_, index) => index + 1)
}

export function dayOf(calendar: Calendar, day: number): Day | undefined {
  const value = calendar.days[String(day)]
  return value?.gift ? value : undefined
}

export function giftAt(calendar: Calendar, slot: Slot): Day | undefined {
  return 'day' in slot ? dayOf(calendar, slot.day) : calendar.sack[slot.sack]
}

/** The gifts in the sack with their ids, in the order they went in. */
export function sackOf(calendar: Pick<Calendar, 'sack'>): [string, Day][] {
  return Object.entries(calendar.sack).sort(([a], [b]) => (a < b ? -1 : 1))
}

export function newSackId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function dateOfDay(calendar: Pick<Calendar, 'startDate'>, day: number): Date {
  const [year, month, date] = calendar.startDate.split('-').map(Number)
  return new Date(year, month - 1, date + day - 1)
}

export interface Progress {
  total: number
  empty: number
  planned: number
  bought: number
  wrapped: number
}

/**
 * Gifts in the sack count towards the empty days, the furthest along first.
 * Past the number of empty days they are spare ideas and do not count.
 */
export function progressOf(calendar: Calendar): Progress {
  const progress: Progress = { total: calendar.dayCount, empty: 0, planned: 0, bought: 0, wrapped: 0 }
  for (const day of dayNumbers(calendar)) {
    const value = dayOf(calendar, day)
    if (value) progress[value.status]++
    else progress.empty++
  }
  const counted = Object.values(calendar.sack)
    .sort((a, b) => STATUSES.indexOf(b.status) - STATUSES.indexOf(a.status))
    .slice(0, progress.empty)
  for (const gift of counted) progress[gift.status]++
  progress.empty -= counted.length
  return progress
}

export type DayFilter = 'all' | 'empty' | 'toBuy' | 'toWrap' | { tagId: string }

export function matchesFilter(day: Day | undefined, filter: DayFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'empty') return !day
  if (!day) return false
  if (filter === 'toBuy') return day.status === 'planned'
  if (filter === 'toWrap') return day.status === 'bought'
  return day.tagIds.includes(filter.tagId)
}

const NEXT: Record<Status, Status> = { planned: 'bought', bought: 'wrapped', wrapped: 'wrapped' }

export function nextStatus(status: Status): Status {
  return NEXT[status]
}

export interface GiftRef {
  calendar: Calendar
  slot: Slot
  value: Day
}

/** Every gift with the given status across calendars: each calendar's days in order, then its sack. */
export function giftsWithStatus(calendars: Calendar[], status: Status): GiftRef[] {
  return calendars.flatMap((calendar) => {
    const gifts: GiftRef[] = [
      ...dayNumbers(calendar).flatMap((day) => {
        const value = dayOf(calendar, day)
        return value ? [{ calendar, slot: { day }, value }] : []
      }),
      ...sackOf(calendar).map(([id, value]) => ({ calendar, slot: { sack: id }, value })),
    ]
    return gifts.filter((gift) => gift.value.status === status)
  })
}

export type DayDraft = Pick<Day, 'gift' | 'status' | 'tagIds' | 'notes'> & { fromSuggestion: boolean }

/**
 * What saving an edited day writes: only the fields that differ from the day as
 * it was when the editor opened, so whatever someone else changed meanwhile
 * survives. `null` empties the day; `{}` means there is nothing to write.
 */
export function dayChanges(before: Day | undefined, draft: DayDraft): Partial<Day> | null {
  const gift = draft.gift.trim()
  const notes = draft.notes.trim()
  if (!gift) return before ? null : {}
  if (!before) {
    return { gift, status: draft.status, tagIds: draft.tagIds, notes, ...(draft.fromSuggestion && { fromSuggestion: true }) }
  }
  const changes: Partial<Day> = {}
  if (gift !== before.gift) changes.gift = gift
  if (draft.status !== before.status) changes.status = draft.status
  if ([...draft.tagIds].sort().join() !== [...before.tagIds].sort().join()) changes.tagIds = draft.tagIds
  if (notes !== before.notes) changes.notes = notes
  if (draft.fromSuggestion !== (before.fromSuggestion ?? false)) changes.fromSuggestion = draft.fromSuggestion
  return changes
}

/**
 * The days, or the sack, of a calendar document as the app expects them. The
 * rules can check that `days` is a map but not what is inside it, and a day
 * without `tagIds` from a buggy client would otherwise break every screen, for
 * the whole family and from the offline cache too. Days without a gift are dropped.
 */
export function cleanDays(days: unknown): Record<string, Day> {
  if (!days || typeof days !== 'object') return {}
  const clean: Record<string, Day> = {}
  for (const [key, raw] of Object.entries(days)) {
    const day = (raw ?? {}) as Partial<Record<keyof Day, unknown>>
    if (typeof day.gift !== 'string' || !day.gift) continue
    clean[key] = {
      ...(day as Day),
      status: STATUSES.includes(day.status as Status) ? (day.status as Status) : 'planned',
      tagIds: Array.isArray(day.tagIds) ? day.tagIds.filter((id): id is string => typeof id === 'string') : [],
      notes: typeof day.notes === 'string' ? day.notes : '',
    }
  }
  return clean
}
