import { dayNumbers, dayOf, sackOf } from './days.ts'
import { STATUSES, type Calendar } from './types.ts'

export interface Placement {
  id: string
  day: number
}

/**
 * Which gift from the sack goes on which empty day, spread over the calendar
 * (see `spread`). When the sack holds more gifts than there are empty days, the
 * furthest along go.
 *
 * Gifts that share a tag are spread out, counting the days already filled. Each
 * day prefers a gift that is far enough from the last one with its tag (the
 * days left divided by how many gifts have that tag), then the most common
 * tag, so it does not bunch up at the end, then the gift furthest from its tag.
 */
export function distribute(calendar: Calendar): Placement[] {
  const empty = dayNumbers(calendar).filter((day) => !dayOf(calendar, day))
  const left = sackOf(calendar)
    .sort(([, a], [, b]) => STATUSES.indexOf(b.status) - STATUSES.indexOf(a.status))
    .slice(0, empty.length)
  const tagsOn = new Map(dayNumbers(calendar).map((day) => [day, dayOf(calendar, day)?.tagIds ?? []]))
  const days = spread(calendar, left.length)
  const plan: Placement[] = []

  for (const day of days) {
    const daysLeft = days[days.length - 1] - day + 1
    const count = (tag: string) => left.filter(([, gift]) => gift.tagIds.includes(tag)).length
    const gap = (tag: string) =>
      Math.min(Infinity, ...[...tagsOn].filter(([, tags]) => tags.includes(tag)).map(([other]) => Math.abs(other - day)))
    const score = (tags: string[]) => [
      tags.every((tag) => gap(tag) >= Math.floor(daysLeft / count(tag))) ? 1 : 0,
      Math.max(0, ...tags.map(count)),
      Math.min(Infinity, ...tags.map(gap)),
    ]
    let best = 0
    for (let index = 1; index < left.length; index++) {
      if (compare(score(left[index][1].tagIds), score(left[best][1].tagIds)) > 0) best = index
    }
    const [[id, gift]] = left.splice(best, 1)
    tagsOn.set(day, gift.tagIds)
    plan.push({ id, day })
  }
  return plan
}

/**
 * The empty days for `count` gifts, in order. Each gift goes to the longest
 * stretch between filled days, the calendar's ends counting as filled, and
 * each stretch splits evenly between its gifts.
 */
function spread(calendar: Calendar, count: number): number[] {
  const filled = [0, ...dayNumbers(calendar).filter((day) => dayOf(calendar, day)), calendar.dayCount + 1]
  const stretches = filled.slice(1).map((end, index) => ({ start: filled[index], span: end - filled[index], gifts: 0 }))
  const longest = (a: (typeof stretches)[number], b: (typeof stretches)[number]) =>
    b.span / (b.gifts + 1) > a.span / (a.gifts + 1) ? b : a
  for (let placed = 0; placed < count; placed++) stretches.reduce(longest).gifts++
  return stretches.flatMap(({ start, span, gifts }) =>
    Array.from({ length: gifts }, (_, index) => start + Math.round(((index + 1) * span) / (gifts + 1))),
  )
}

function compare(a: number[], b: number[]): number {
  const index = a.findIndex((value, i) => value !== b[i])
  return index === -1 ? 0 : a[index] - b[index]
}
