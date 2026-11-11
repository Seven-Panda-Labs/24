import { describe, expect, it } from 'vitest'
import type { Calendar } from '../domain/types.ts'
import { sourcesFor, suggest, type HistoryGift, type SuggestInput } from './engine.ts'

const given = (gift: string, years: number[], person = 'Ana', tagIds: string[] = []): HistoryGift[] =>
  years.map((year) => ({ gift, person, year, tagIds }))

function input(overrides: Partial<SuggestInput> = {}, calendar: Partial<SuggestInput['calendar']> = {}): SuggestInput {
  return {
    history: [],
    calendar: { person: 'Ana', year: 2026, allowRepeats: false, originality: 0, ...calendar },
    current: [],
    ideas: [],
    dismissed: [],
    seed: 'c1:1',
    ...overrides,
  }
}

const gifts = (result: ReturnType<typeof suggest>) => result.map((suggestion) => suggestion.gift)

describe('suggest', () => {
  it('ranks this person’s most frequent gifts first when the slider is on traditional', () => {
    const result = suggest(
      input({ history: [...given('Doces', [2018, 2019, 2020, 2021]), ...given('Vela', [2019]), ...given('Livro', [2020], 'Rui')] }),
    )
    expect(gifts(result)[0]).toBe('Doces')
    expect(result[0]).toMatchObject({ kind: 'forgotten', years: [2021, 2020, 2019, 2018] })
  })

  it('pushes down gifts from the last two years', () => {
    const result = suggest(input({ history: [...given('Meias', [2023, 2024, 2025]), ...given('Puzzle', [2017, 2018, 2019])] }))
    expect(gifts(result)).toEqual(['Puzzle', 'Meias'])
    expect(result[1].kind).toBe('tradition')
  })

  it('puts never-given gifts first when the slider is on original', () => {
    const result = suggest(
      input(
        { history: [...given('Doces', [2023, 2024, 2025]), ...given('Bilhetes de cinema', [2024], 'Rui')], ideas: [{ gift: 'Vela aromática', tagIds: ['home'] }] },
        { originality: 1 },
      ),
    )
    expect(gifts(result).slice(0, 2).sort()).toEqual(['Bilhetes de cinema', 'Vela aromática'])
    expect(result.find((s) => s.gift === 'Bilhetes de cinema')?.kind).toBe('family')
    expect(result.find((s) => s.gift === 'Vela aromática')).toMatchObject({ kind: 'idea', tagIds: ['home'] })
  })

  it('mixes the person’s gifts and new ones between the extremes', () => {
    const history = ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((gift) => given(gift, [2018, 2019, 2020]))
    const result = suggest(input({ history, ideas: [{ gift: 'Ideia', tagIds: [] }] }, { originality: 0.1 }))
    expect(result).toHaveLength(5)
    expect(gifts(result)).toContain('Ideia')
  })

  it('leaves out gifts already in the calendar unless repeats are allowed', () => {
    const history = [...given('Doces', [2020, 2021]), ...given('Vela', [2020])]
    expect(gifts(suggest(input({ history, current: ['doces'] })))).toEqual(['Vela'])
    expect(gifts(suggest(input({ history, current: ['doces'] }, { allowRepeats: true })))).toContain('Doces')
  })

  it('leaves out dismissed gifts and later years', () => {
    const history = [...given('Doces', [2020]), ...given('Vela', [2020]), ...given('Luvas', [2027])]
    expect(gifts(suggest(input({ history, dismissed: ['DOCES'] })))).toEqual(['Vela'])
  })

  it('matches people and gifts ignoring case and accents, keeping the newest wording', () => {
    const history = [...given('pai natal de choco', [2019], 'ana'), ...given('Pai Natal de Choco ', [2021], 'Âna', ['sweets'])]
    const [first] = suggest(input({ history }))
    expect(first).toMatchObject({ gift: 'Pai Natal de Choco', years: [2021, 2019], tagIds: ['sweets'] })
  })

  it('is deterministic for the same seed', () => {
    const ideas = ['Um', 'Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete'].map((gift) => ({ gift, tagIds: [] }))
    const run = (seed: string) => gifts(suggest(input({ ideas, seed }, { originality: 1 })))
    expect(run('c1:1')).toEqual(run('c1:1'))
  })
})

describe('sourcesFor', () => {
  const calendar = (id: string, person: string, memberIds: string[]) => ({ id, person, memberIds }) as Calendar
  // Ana and Bruno fill the children's calendar together; Bruno keeps one for Ana secret.
  const shared = calendar('ze-2026', 'Zé', ['ana', 'bruno'])
  const secret = calendar('ana-2026', 'Ana', ['bruno'])
  const lastYear = calendar('ze-2025', 'ZÉ', ['bruno'])
  const together = calendar('rita-2026', 'Rita', ['ana', 'bruno'])

  it('leaves a calendar kept secret from someone out of the ones they share', () => {
    expect(sourcesFor(shared, [shared, secret, lastYear, together]).map(({ id }) => id)).toEqual(['ze-2025', 'rita-2026'])
  })

  it('uses every calendar in one nobody else sees', () => {
    expect(sourcesFor(secret, [shared, secret, lastYear, together]).map(({ id }) => id)).toEqual(['ze-2026', 'ze-2025', 'rita-2026'])
  })
})
