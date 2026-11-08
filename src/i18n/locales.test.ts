import { expect, it } from 'vitest'
import de from './locales/de.json'
import en from './locales/en.json'
import fr from './locales/fr.json'
import pt from './locales/pt.json'

/** Every key with the {{placeholders}} its text uses, so a translation can't drop one. */
function placeholders(messages: object, prefix = ''): [string, string[]][] {
  return Object.entries(messages)
    .flatMap(([key, value]): [string, string[]][] =>
      typeof value === 'object' && value !== null
        ? placeholders(value, `${prefix}${key}.`)
        : [[`${prefix}${key}`, String(value).match(/{{\w+}}/g)?.sort() ?? []]],
    )
    .sort(([a], [b]) => a.localeCompare(b))
}

it.each(Object.entries({ pt, de, fr }))('%s has the same keys and placeholders as en', (_, messages) => {
  expect(placeholders(messages)).toEqual(placeholders(en))
})
