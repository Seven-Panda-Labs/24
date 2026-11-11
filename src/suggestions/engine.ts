import { dayNumbers, dayOf } from '../domain/days.ts'
import { normalize } from '../domain/text.ts'
import { ageRangeOf, type Calendar } from '../domain/types.ts'

export interface HistoryGift {
  gift: string
  person: string
  year: number
  tagIds: string[]
}

export interface Idea {
  gift: string
  tagIds: string[]
}

export interface SuggestInput {
  /** Every filled day of every other calendar the user is in. */
  history: HistoryGift[]
  calendar: { person: string; year: number; allowRepeats: boolean; originality: number }
  /** Gifts already in the calendar being filled. */
  current: string[]
  /** The idea catalog, in the interface language. */
  ideas: Idea[]
  /** Gifts dismissed for this calendar. */
  dismissed: string[]
  /** Varies the order of near-equal suggestions from one day to the next. */
  seed: string
  limit?: number
}

/**
 * tradition: given to this person in recent years. forgotten: given to this
 * person, but not for three years or more. family: given to someone else.
 * idea: from the catalog.
 */
export type SuggestionKind = 'tradition' | 'forgotten' | 'family' | 'idea'

export interface Suggestion {
  gift: string
  tagIds: string[]
  kind: SuggestionKind
  /** Years this person got it, newest first. */
  years: number[]
  score: number
}

interface Candidate {
  gift: string
  tagIds: string[]
  latest: number
  years: Set<number>
  family: boolean
}

/** Gifts used within this many years are pushed down. */
const RECENT_YEARS = 2
const RECENT_PENALTY = 0.3
const JITTER = 0.05

/**
 * Deterministic, local scoring of what to put on an empty day: the person's
 * traditions, weighed against new ideas by the calendar's originality slider,
 * with recent gifts penalised and old or never-given ones promoted.
 */
export function suggest(input: SuggestInput): Suggestion[] {
  const { calendar, limit = 5 } = input
  const person = normalize(calendar.person)
  const current = new Set(input.current.map(normalize))
  const dismissed = new Set(input.dismissed.map(normalize))
  const candidates = new Map<string, Candidate>()

  const candidate = (gift: string, tagIds: string[], year: number) => {
    const key = normalize(gift)
    let entry = candidates.get(key)
    if (!entry) {
      entry = { gift: gift.trim(), tagIds, latest: year, years: new Set(), family: false }
      candidates.set(key, entry)
    } else if (year > entry.latest) {
      // The newest wording and tags win: they are what the family uses now.
      Object.assign(entry, { gift: gift.trim(), tagIds, latest: year })
    }
    return entry
  }

  for (const entry of input.history) {
    if (entry.year >= calendar.year) continue
    const found = candidate(entry.gift, entry.tagIds, entry.year)
    if (normalize(entry.person) === person) found.years.add(entry.year)
    else found.family = true
  }
  for (const idea of input.ideas) candidate(idea.gift, idea.tagIds, -Infinity)

  const mostGiven = Math.max(1, ...[...candidates.values()].map((entry) => entry.years.size))
  const o = calendar.originality

  const scored: Suggestion[] = []
  for (const [key, entry] of candidates) {
    if (dismissed.has(key)) continue
    const repeated = current.has(key)
    if (repeated && !calendar.allowRepeats) continue

    const years = [...entry.years].sort((a, b) => b - a)
    const gap = years.length ? calendar.year - years[0] : Infinity
    const tradition = (years.length / mostGiven) * (gap <= RECENT_YEARS ? RECENT_PENALTY : 1)
    const novelty = years.length === 0 ? 1 : gap > RECENT_YEARS ? 0.5 : 0
    let score = (1 - o) * tradition + o * novelty + JITTER * jitter(`${input.seed}:${key}`)
    if (repeated) score *= 0.5

    const kind: SuggestionKind =
      years.length === 0 ? (entry.family ? 'family' : 'idea') : gap > RECENT_YEARS ? 'forgotten' : 'tradition'
    scored.push({ gift: entry.gift, tagIds: entry.tagIds, kind, years, score })
  }

  scored.sort((a, b) => b.score - a.score || a.gift.localeCompare(b.gift))
  const picked = scored.slice(0, limit)

  // Between the extremes of the slider, always show at least one of each:
  // something this person had before and something they never had.
  if (o > 0 && o < 1) {
    const isOwn = (s: Suggestion) => s.years.length > 0
    for (const wanted of [isOwn, (s: Suggestion) => !isOwn(s)]) {
      if (picked.some(wanted)) continue
      const best = scored.find(wanted)
      if (best && picked.length) picked[picked.length - 1] = best
    }
  }
  return picked
}

/** FNV-1a, scaled to [0, 1). */
function jitter(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0) / 2 ** 32
}

/**
 * The calendars whose gifts can be suggested in `calendar`: those for the same
 * person, and those for someone else of the same age range that everyone in it
 * can also see. So no gift for an adult is suggested for a child, and a
 * calendar kept secret from someone never surfaces in one they share, neither
 * on screen nor in the feedback a dismissed suggestion leaves there.
 */
export function sourcesFor(calendar: Calendar, calendars: Calendar[]): Calendar[] {
  const person = normalize(calendar.person)
  return calendars.filter(
    (other) =>
      other.id !== calendar.id &&
      (normalize(other.person) === person ||
        (ageRangeOf(other) === ageRangeOf(calendar) && calendar.memberIds.every((uid) => other.memberIds.includes(uid)))),
  )
}

/** Every named gift on the days of the given calendars, as suggestion history. */
export function historyOf(calendars: Calendar[]): HistoryGift[] {
  return calendars.flatMap((calendar) =>
    dayNumbers(calendar).flatMap((day) => {
      const value = dayOf(calendar, day)
      return value?.gift ? [{ gift: value.gift, person: calendar.person, year: calendar.year, tagIds: value.tagIds }] : []
    }),
  )
}
