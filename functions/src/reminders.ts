// No Firebase imports here: the root Vitest suite tests this file directly.

type GiftDoc = { gift?: unknown; status?: unknown } | null

export interface CalendarDoc {
  dayCount: number
  days?: Record<string, GiftDoc>
  sack?: Record<string, GiftDoc>
}

export interface Counts {
  toBuy: number
  toWrap: number
  empty: number
}

const hasGift = (value: GiftDoc | undefined) => typeof value?.gift === 'string' && value.gift !== ''
const FURTHEST_FIRST: Record<string, number> = { wrapped: 0, bought: 1 }

/**
 * What is left across a workspace's calendars for the year. Gifts in the sack
 * fill the empty days, the furthest along first, as in the app's progress.
 */
export function countsFor(calendars: CalendarDoc[]): Counts {
  const counts: Counts = { toBuy: 0, toWrap: 0, empty: 0 }
  const count = (value: GiftDoc | undefined) => {
    if (value?.status === 'bought') counts.toWrap++
    else if (value?.status !== 'wrapped') counts.toBuy++
  }
  for (const calendar of calendars) {
    let empty = 0
    for (let day = 1; day <= calendar.dayCount; day++) {
      const value = calendar.days?.[String(day)]
      if (hasGift(value)) count(value)
      else empty++
    }
    const sack = Object.values(calendar.sack ?? {})
      .filter(hasGift)
      .sort((a, b) => (FURTHEST_FIRST[String(a?.status)] ?? 2) - (FURTHEST_FIRST[String(b?.status)] ?? 2))
      .slice(0, empty)
    sack.forEach(count)
    counts.empty += empty - sack.length
  }
  return counts
}

/** Sundays from 1 November to 24 December. The schedule picks the Sunday; this the season. */
export function inReminderSeason(date: Date): boolean {
  const month = date.getUTCMonth() + 1
  return month === 11 || (month === 12 && date.getUTCDate() <= 24)
}

const TEXT = {
  'pt-PT': { title: '24 · Ponto da situação', toBuy: 'Por comprar', toWrap: 'Por embrulhar', empty: 'Dias por preencher' },
  en: { title: '24 · Where things stand', toBuy: 'To buy', toWrap: 'To wrap', empty: 'Days to fill' },
  de: { title: '24 · Wie es aussieht', toBuy: 'Zu kaufen', toWrap: 'Zu verpacken', empty: 'Leere Tage' },
  fr: { title: '24 · Où en est-on', toBuy: 'À acheter', toWrap: 'À emballer', empty: 'Jours à remplir' },
}

/** The push data for one person, or null when nothing is left to do. */
export function reminderFor(counts: Counts, language: unknown): { title: string; body: string; url: string } | null {
  const text = TEXT[language as keyof typeof TEXT] ?? TEXT['pt-PT']
  const parts = (['toBuy', 'toWrap', 'empty'] as const).filter((key) => counts[key] > 0).map((key) => `${text[key]}: ${counts[key]}`)
  if (!parts.length) return null
  return { title: text.title, body: parts.join(' · '), url: counts.toBuy + counts.toWrap > 0 ? '/shopping' : '/' }
}
