import { describe, expect, it } from 'vitest'
import { distribute } from './distribute.ts'
import type { Calendar, Day } from './types.ts'

const gift = (name: string, tagIds: string[] = [], status: Day['status'] = 'planned'): Day => ({ gift: name, status, tagIds, notes: '' })

function calendar(dayCount: number, sack: Calendar['sack'], days: Calendar['days'] = {}): Calendar {
  return {
    id: 'c1',
    year: 2026,
    person: 'Zé Ninguém',
    name: '',
    startDate: '2026-12-01',
    dayCount,
    allowRepeats: false,
    originality: 0.5,
    days,
    sack,
  }
}

/** Each day's first tag once the plan is applied: `-` for a gift without tags, `.` for an empty day. */
function layout(of: Calendar): string {
  const planned = new Map(distribute(of).map(({ id, day }) => [day, of.sack[id]]))
  return Array.from({ length: of.dayCount }, (_, index) => {
    const value = of.days[String(index + 1)] ?? planned.get(index + 1)
    return value ? (value.tagIds[0] ?? '-') : '.'
  }).join(' ')
}

describe('distribute', () => {
  it('spreads the most common tag instead of leaving it for the end', () => {
    const sack = {
      g1: gift('Chocolate', ['sweets']),
      g2: gift('Rebuçados', ['sweets']),
      g3: gift('Bolachas', ['sweets']),
      g4: gift('Amêndoas', ['sweets']),
      g5: gift('Livro', ['books']),
      g6: gift('Meias', ['clothes']),
      g7: gift('Vela', ['home']),
      g8: gift('Cinema', ['experiences']),
    }
    expect(layout(calendar(8, sack))).toBe('sweets books sweets clothes sweets home experiences sweets')
  })

  it('keeps two gifts with the same tag far apart', () => {
    const sack = {
      g1: gift('Chocolate', ['sweets']),
      g2: gift('Rebuçados', ['sweets']),
      ...Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`h${index}`, gift(`Ideia ${index}`)])),
    }
    expect(layout(calendar(8, sack))).toBe('sweets - - - sweets - - -')
  })

  it('counts the days already filled and leaves them alone', () => {
    const sack = { g1: gift('Chocolate', ['sweets']), g2: gift('Livro'), g3: gift('Vela'), g4: gift('Meias') }
    expect(layout(calendar(5, sack, { '3': gift('Bolachas', ['sweets']) }))).toBe('- - sweets - sweets')
  })

  it('takes the furthest along when the sack holds more gifts than empty days', () => {
    const sack = { a: gift('Livro'), b: gift('Vela', [], 'wrapped'), c: gift('Meias', [], 'bought') }
    expect(distribute(calendar(2, sack)).map(({ id }) => id)).toEqual(['b', 'c'])
  })

  it('fills the earliest empty days when the sack holds fewer gifts', () => {
    const sack = { a: gift('Livro'), b: gift('Vela') }
    expect(distribute(calendar(4, sack, { '1': gift('Meias') }))).toEqual([
      { id: 'a', day: 2 },
      { id: 'b', day: 3 },
    ])
  })
})
