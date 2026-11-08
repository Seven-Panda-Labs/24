import { describe, expect, it } from 'vitest'
import { cleanDays, dateOfDay, dayChanges, giftsWithStatus, matchesFilter, progressOf, sackOf } from './days.ts'
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
    sack: {},
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

  it('counts the sack towards the empty days, the furthest along first, and no further', () => {
    const sack = { a: day('Livro', 'planned'), b: day('Vela', 'wrapped'), c: day('Doces', 'bought') }
    const progress = progressOf(calendar({ '1': day('Meias', 'planned') }, { dayCount: 3, sack }))
    expect(progress).toEqual({ total: 3, empty: 0, planned: 1, bought: 1, wrapped: 1 })
  })
})

describe('sackOf', () => {
  it('lists the sack in the order the gifts went in', () => {
    const sack = { mb: day('Vela', 'planned'), ma: day('Meias', 'planned') }
    expect(sackOf({ sack }).map(([id]) => id)).toEqual(['ma', 'mb'])
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

describe('giftsWithStatus', () => {
  it('lists matching gifts across calendars, days in order and then the sack', () => {
    const a = calendar(
      { '3': day('Meias', 'planned'), '1': day('Doces', 'planned'), '2': day('Vela', 'bought') },
      { sack: { s1: day('Livro', 'planned'), s2: day('Caneca', 'bought') } },
    )
    const b = calendar({ '1': day('Livro', 'planned') }, { id: 'c2' })
    const where = ({ calendar, slot }: ReturnType<typeof giftsWithStatus>[number]) =>
      `${calendar.id}:${'day' in slot ? slot.day : slot.sack}`
    expect(giftsWithStatus([a, b], 'planned').map(where)).toEqual(['c1:1', 'c1:3', 'c1:s1', 'c2:1'])
  })
})

describe('dayChanges', () => {
  const before = day('Meias', 'bought', ['clothes'])
  const draft = { gift: 'Meias', status: 'bought' as const, tagIds: ['clothes'], notes: '', fromSuggestion: false }

  it('writes nothing when nothing changed, so a day saved without edits keeps what others wrote', () => {
    expect(dayChanges(before, draft)).toEqual({})
    expect(dayChanges(undefined, { ...draft, gift: '  ' })).toEqual({})
  })

  it('writes only the edited fields', () => {
    expect(dayChanges(before, { ...draft, notes: ' tamanho 38 ' })).toEqual({ notes: 'tamanho 38' })
    expect(dayChanges(before, { ...draft, tagIds: ['clothes', 'sweets'], status: 'wrapped' })).toEqual({
      tagIds: ['clothes', 'sweets'],
      status: 'wrapped',
    })
  })

  it('writes every field for a new day and empties a day whose gift was cleared', () => {
    expect(dayChanges(undefined, { ...draft, status: 'planned', fromSuggestion: true })).toEqual({
      gift: 'Meias',
      status: 'planned',
      tagIds: ['clothes'],
      notes: '',
      fromSuggestion: true,
    })
    expect(dayChanges(before, { ...draft, gift: '' })).toBeNull()
  })
})

describe('cleanDays', () => {
  it('repairs malformed days and drops ones without a gift', () => {
    expect(cleanDays({ '1': { gift: 'Meias' }, '2': { gift: 5 }, '3': null, '4': { gift: 'Vela', status: 'lost', tagIds: ['home', 3], notes: 'x' } })).toEqual({
      '1': { gift: 'Meias', status: 'planned', tagIds: [], notes: '' },
      '4': { gift: 'Vela', status: 'planned', tagIds: ['home'], notes: 'x' },
    })
    expect(cleanDays(undefined)).toEqual({})
  })
})
