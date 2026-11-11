/**
 * Imports the original Excel calendars, one calendar per year sheet, every day
 * marked as wrapped. Each calendar is only the given account's until they share
 * it in the app. See docs/importing-the-excel.md.
 *
 *   npm run import:excel -- --file "private/Calendario de Natal.xlsx" \
 *     --person "Ana" --email <Google account> [--project <id>] [--confirm]
 */
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import ExcelJS from 'exceljs'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { defaultTags } from '../src/domain/tags.ts'
import { BAG_TAGS, parseWorkbook } from './excel.ts'

const { values } = parseArgs({
  options: {
    file: { type: 'string' },
    person: { type: 'string' },
    email: { type: 'string' },
    project: { type: 'string' },
    confirm: { type: 'boolean', default: false },
  },
})

const projectId = values.project ?? process.env.GCLOUD_PROJECT
if (!values.file || !values.person || !values.email || !projectId) {
  console.error(
    'Usage: npm run import:excel -- --file <xlsx> --person <name> --email <Google account> --project <id> [--confirm]\n' +
      'Against the emulators, set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 and FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099, and use --project demo-24.',
  )
  process.exit(1)
}

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(values.file)
const calendars = parseWorkbook(workbook)

initializeApp({ projectId })
const user = await getAuth()
  .getUserByEmail(values.email)
  .catch((error) => {
    if (error.code !== 'auth/user-not-found') throw error
    return null
  })
if (!user) {
  console.error(`No account for ${values.email} in ${projectId}: sign in to the app with it once first.`)
  process.exit(1)
}

const db = getFirestore()
const existing = await db.collection('calendars').where('memberIds', 'array-contains', user.uid).get()
const importedYears = new Set(existing.docs.filter((doc) => doc.get('person') === values.person).map((doc) => doc.get('year') as number))
const pending = calendars.filter((calendar) => !importedYears.has(calendar.year))

console.log(`${projectId} / ${values.email} / ${values.person}`)
for (const calendar of calendars) {
  const tagged = calendar.days.filter((day) => day.tagIds.length).length
  const notes = calendar.days.filter((day) => day.notes).length
  const skipped = importedYears.has(calendar.year) ? ', already imported, skipped' : ''
  console.log(`  ${calendar.year}: ${calendar.days.length} days, ${tagged} tagged, ${notes} with notes${skipped}`)
  if (calendar.unreadNotes.length) {
    console.warn(`    unreadable comments on day ${calendar.unreadNotes.join(', ')}: copy them into the app by hand`)
  }
}

if (!values.confirm) {
  console.log(`Dry run: ${pending.length} calendars to write. Add --confirm to write them.`)
  process.exit(0)
}

// The Excel is in Portuguese, so the default tags are too. Each calendar adds the bags it uses.
const names = JSON.parse(readFileSync(new URL('../src/i18n/locales/pt.json', import.meta.url), 'utf8')).tags.defaults
const tags = defaultTags((id) => names[id])
const bags = Object.values(BAG_TAGS).map(({ id, name, color }) => [id, { name, color, emoji: '🛍️' }] as const)

const batch = db.batch()
for (const calendar of pending) {
  const used = new Set(calendar.days.flatMap((day) => day.tagIds))
  batch.set(db.collection('calendars').doc(), {
    year: calendar.year,
    person: values.person,
    name: '',
    startDate: `${calendar.year}-12-01`,
    dayCount: Math.max(24, ...calendar.days.map((day) => day.day)),
    allowRepeats: false,
    originality: 0.5,
    days: Object.fromEntries(
      calendar.days.map((day) => [String(day.day), { gift: day.gift, status: 'wrapped', tagIds: day.tagIds, notes: day.notes }]),
    ),
    tags: { ...tags, ...Object.fromEntries(bags.filter(([id]) => used.has(id))) },
    memberIds: [user.uid],
    members: { [user.uid]: { name: user.displayName ?? '', email: values.email.toLowerCase() } },
    invitedEmails: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
}
await batch.commit()
console.log(`Wrote ${pending.length} calendars.`)
