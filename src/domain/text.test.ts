import { expect, it } from 'vitest'
import { normalize } from './text.ts'

it('ignores case, accents and extra spaces', () => {
  expect(normalize('  Relógio   de Cozinha ')).toBe('relogio de cozinha')
  expect(normalize('Papel higiénico (x5)')).toBe(normalize('papel higienico (X5)'))
})
