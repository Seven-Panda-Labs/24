import { describe, expect, it } from 'vitest'
import { countsFor, inReminderSeason, reminderFor } from './reminders.ts'

describe('countsFor', () => {
  it('counts what is left to buy, wrap and fill across calendars', () => {
    const counts = countsFor([
      { dayCount: 4, days: { '1': { gift: 'Meias', status: 'planned' }, '2': { gift: 'Vela', status: 'bought' }, '3': { gift: 'Doces', status: 'wrapped' } } },
      { dayCount: 2, days: { '1': { gift: '', status: 'planned' }, '2': null } },
      { dayCount: 1, days: { '1': { gift: '', photoUrl: 'https://example.com/1.jpg', status: 'planned' } } },
    ])
    expect(counts).toEqual({ toBuy: 2, toWrap: 1, empty: 3 })
  })

  it('counts the sack towards the empty days, the furthest along first', () => {
    const counts = countsFor([
      {
        dayCount: 3,
        days: { '1': { gift: 'Meias', status: 'wrapped' } },
        sack: { a: { gift: 'Livro', status: 'planned' }, b: { gift: 'Vela', status: 'bought' }, c: { gift: 'Doces', status: 'planned' } },
      },
    ])
    expect(counts).toEqual({ toBuy: 1, toWrap: 1, empty: 0 })
  })
})

describe('reminderFor', () => {
  it('lists only what is left, in the person’s language', () => {
    expect(reminderFor({ toBuy: 3, toWrap: 0, empty: 5 }, 'pt-PT')).toEqual({
      title: '24 · Ponto da situação',
      body: 'Por comprar: 3 · Dias por preencher: 5',
      url: '/todo',
    })
    expect(reminderFor({ toBuy: 0, toWrap: 0, empty: 2 }, 'en')).toMatchObject({ body: 'Days to fill: 2', url: '/' })
    expect(reminderFor({ toBuy: 0, toWrap: 1, empty: 0 }, 'de')).toMatchObject({ body: 'Zu verpacken: 1' })
    expect(reminderFor({ toBuy: 2, toWrap: 0, empty: 0 }, 'fr')).toMatchObject({ body: 'À acheter: 2' })
  })

  it('stays quiet when everything is wrapped', () => {
    expect(reminderFor({ toBuy: 0, toWrap: 0, empty: 0 }, 'pt-PT')).toBeNull()
  })
})

describe('inReminderSeason', () => {
  it('runs from November to Christmas Eve', () => {
    expect(inReminderSeason(new Date('2026-11-01T18:00:00Z'))).toBe(true)
    expect(inReminderSeason(new Date('2026-12-24T18:00:00Z'))).toBe(true)
    expect(inReminderSeason(new Date('2026-12-27T18:00:00Z'))).toBe(false)
    expect(inReminderSeason(new Date('2026-10-25T18:00:00Z'))).toBe(false)
  })
})
