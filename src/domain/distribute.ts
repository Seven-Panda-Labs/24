import { dayNumbers, dayOf, sackOf } from './days.ts'
import { STATUSES, type Calendar } from './types.ts'

export interface Placement {
  id: string
  day: number
}

/**
 * Which gift from the sack goes on which empty day, earliest days first. When
 * the sack holds more gifts than there are empty days, the furthest along go.
 *
 * Gifts that share a tag are spread out, counting the days already filled. Each
 * day prefers a gift that is far enough from the last one with its tag (the
 * gifts left divided by how many of them have that tag), then the most common
 * tag, so it does not bunch up at the end, then the gift furthest from its tag.
 */
export function distribute(calendar: Calendar): Placement[] {
  const empty = dayNumbers(calendar).filter((day) => !dayOf(calendar, day))
  const left = sackOf(calendar)
    .sort(([, a], [, b]) => STATUSES.indexOf(b.status) - STATUSES.indexOf(a.status))
    .slice(0, empty.length)
  const tagsOn = new Map(dayNumbers(calendar).map((day) => [day, dayOf(calendar, day)?.tagIds ?? []]))
  const plan: Placement[] = []

  for (const day of empty.slice(0, left.length)) {
    const count = (tag: string) => left.filter(([, gift]) => gift.tagIds.includes(tag)).length
    const gap = (tag: string) =>
      Math.min(Infinity, ...[...tagsOn].filter(([, tags]) => tags.includes(tag)).map(([other]) => Math.abs(other - day)))
    const score = (tags: string[]) => [
      tags.every((tag) => gap(tag) >= Math.floor(left.length / count(tag))) ? 1 : 0,
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

function compare(a: number[], b: number[]): number {
  const index = a.findIndex((value, i) => value !== b[i])
  return index === -1 ? 0 : a[index] - b[index]
}
