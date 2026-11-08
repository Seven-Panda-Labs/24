import type { Calendar, Day, Status } from './types.ts'

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

export function progressOf(calendar: Calendar): Progress {
  const progress: Progress = { total: calendar.dayCount, empty: 0, planned: 0, bought: 0, wrapped: 0 }
  for (const day of dayNumbers(calendar)) {
    const value = dayOf(calendar, day)
    if (value) progress[value.status]++
    else progress.empty++
  }
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

export interface DayRef {
  calendar: Calendar
  day: number
  value: Day
}

/** Every filled day with the given status across calendars, in calendar then day order. */
export function daysWithStatus(calendars: Calendar[], status: Status): DayRef[] {
  return calendars.flatMap((calendar) =>
    dayNumbers(calendar).flatMap((day) => {
      const value = dayOf(calendar, day)
      return value?.status === status ? [{ calendar, day, value }] : []
    }),
  )
}
