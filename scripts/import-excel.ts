/**
 * Imports the original Excel calendars into a workspace, one calendar per year
 * sheet, every day marked as wrapped. See docs/importing-the-excel.md.
 *
 *   npm run import:excel -- --file "private/Calendario de Natal.xlsx" \
 *     --person "Ana" --workspace <id> [--project <id>] [--confirm]
 */
import { parseArgs } from 'node:util'
import ExcelJS from 'exceljs'
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { parseWorkbook } from './excel.ts'

const { values } = parseArgs({
  options: {
    file: { type: 'string' },
    person: { type: 'string' },
    workspace: { type: 'string' },
    project: { type: 'string' },
    confirm: { type: 'boolean', default: false },
  },
})

const projectId = values.project ?? process.env.GCLOUD_PROJECT
if (!values.file || !values.person || !values.workspace || !projectId) {
  console.error(
    'Usage: npm run import:excel -- --file <xlsx> --person <name> --workspace <id> --project <id> [--confirm]\n' +
      'Against the emulators, set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 and use --project demo-24.',
  )
  process.exit(1)
}

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(values.file)
const calendars = parseWorkbook(workbook)

initializeApp({ projectId })
const workspace = getFirestore().doc(`workspaces/${values.workspace}`)
if (!(await workspace.get()).exists) {
  console.error(`Workspace ${values.workspace} not found in ${projectId}.`)
  process.exit(1)
}

const tags = new Set((await workspace.collection('tags').get()).docs.map((doc) => doc.id))
const existing = await workspace.collection('calendars').where('person', '==', values.person).get()
const importedYears = new Set(existing.docs.map((doc) => doc.get('year') as number))
const pending = calendars.filter((calendar) => !importedYears.has(calendar.year))

console.log(`${projectId} / ${values.workspace} / ${values.person}`)
for (const calendar of calendars) {
  const tagged = calendar.days.filter((day) => day.tagIds.length).length
  const notes = calendar.days.filter((day) => day.notes).length
  const skipped = importedYears.has(calendar.year) ? ', already imported, skipped' : ''
  console.log(`  ${calendar.year}: ${calendar.days.length} days, ${tagged} tagged, ${notes} with notes${skipped}`)
  if (calendar.unreadNotes.length) {
    console.warn(`    unreadable comments on day ${calendar.unreadNotes.join(', ')}: copy them into the app by hand`)
  }
}
const missing = new Set(calendars.flatMap((calendar) => calendar.days.flatMap((day) => day.tagIds)).filter((id) => !tags.has(id)))
if (missing.size) console.warn(`Tags missing from the workspace, days keep the ids: ${[...missing].join(', ')}`)

if (!values.confirm) {
  console.log(`Dry run: ${pending.length} calendars to write. Add --confirm to write them.`)
  process.exit(0)
}

const batch = workspace.firestore.batch()
for (const calendar of pending) {
  batch.set(workspace.collection('calendars').doc(), {
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
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
}
await batch.commit()
console.log(`Wrote ${pending.length} calendars.`)
