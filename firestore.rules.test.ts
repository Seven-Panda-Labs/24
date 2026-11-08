import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { assertFails, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { afterAll, beforeAll, describe, it } from 'vitest'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':')
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-24-rules-test',
    firestore: {
      rules: readFileSync(resolve(import.meta.dirname, 'firestore.rules'), 'utf8'),
      host,
      port: Number(port),
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('before the data model', () => {
  it('denies a signed-in user', async () => {
    const db = testEnv.authenticatedContext('ze-ninguem').firestore()
    await assertFails(db.doc('calendars/any').get())
    await assertFails(db.doc('calendars/any').set({ year: 2026 }))
  })
})
