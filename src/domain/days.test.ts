import { describe, expect, it } from 'vitest'
import { dateOfDay, daysWithStatus, matchesFilter, progressOf } from './days.ts'
import type { Calendar, Day } from './types.ts'

function calendar(days: Calendar['days'], overrides: Partial<Calendar> = {}): Calendar {
  return {
    id: 'c1',
    year: 2026,
    person: 'Zé Ninguém',
    name: '',
    startDate: '2026-12-01',
    dayCount: 24,
    allowRepeats: false,
    originality: 0.5,
    days,
    ...overrides,
  }
}

const day = (gift: string, status: Day['status'], tagIds: string[] = []): Day => ({ gift, status, tagIds, notes: '' })

describe('progressOf', () => {
  it('counts each status and treats days without a gift as empty', () => {
    const progress = progressOf(
      calendar({
        '1': day('Meias', 'planned'),
        '2': day('Chocolate', 'bought'),
        '3': day('Vela', 'wrapped'),
        '4': day('', 'planned'),
      }),
    )
    expect(progress).toEqual({ total: 24, empty: 21, planned: 1, bought: 1, wrapped: 1 })
  })

  it('ignores days beyond dayCount', () => {
    const progress = progressOf(calendar({ '5': day('Meias', 'wrapped') }, { dayCount: 4 }))
    expect(progress).toEqual({ total: 4, empty: 4, planned: 0, bought: 0, wrapped: 0 })
  })
})

describe('matchesFilter', () => {
  it('matches by status and by tag', () => {
    const socks = day('Meias', 'planned', ['clothes'])
    expect(matchesFilter(socks, 'toBuy')).toBe(true)
    expect(matchesFilter(socks, 'toWrap')).toBe(false)
    expect(matchesFilter(socks, { tagId: 'clothes' })).toBe(true)
    expect(matchesFilter(undefined, 'empty')).toBe(true)
    expect(matchesFilter(undefined, { tagId: 'clothes' })).toBe(false)
  })
})

describe('dateOfDay', () => {
  it('counts from the start date across month boundaries', () => {
    const date = dateOfDay({ startDate: '2026-11-28' }, 5)
    expect([date.getFullYear(), date.getMonth() + 1, date.getDate()]).toEqual([2026, 12, 2])
  })
})

describe('daysWithStatus', () => {
  it('lists matching days across calendars in order', () => {
    const a = calendar({ '3': day('Meias', 'planned'), '1': day('Doces', 'planned'), '2': day('Vela', 'bought') })
    const b = calendar({ '1': day('Livro', 'planned') }, { id: 'c2' })
    expect(daysWithStatus([a, b], 'planned').map((ref) => `${ref.calendar.id}:${ref.day}`)).toEqual([
      'c1:1',
      'c1:3',
      'c2:1',
    ])
  })
})
