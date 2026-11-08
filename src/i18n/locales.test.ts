import { expect, it } from 'vitest'
import en from './locales/en.json'
import pt from './locales/pt.json'

function keys(messages: object, prefix = ''): string[] {
  return Object.entries(messages)
    .flatMap(([key, value]) =>
      typeof value === 'object' && value !== null ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
    )
    .sort()
}

it('has the same keys in every locale', () => {
  expect(keys(en)).toEqual(keys(pt))
})
