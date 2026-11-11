/**
 * Moves an instance from family spaces to calendars shared one by one (0.18.0).
 * Each workspace's calendars are copied to calendars/{same id} with the
 * space's tags and people, and its suggestion feedback goes under the calendar
 * it is about. It only copies: workspaces stays as a backup, photos stay where
 * they are, and calendars already copied are skipped. Pending invites to a
 * space are listed, not copied: send them again from each calendar.
 * See docs/self-hosting.md.
 *
 *   npm run migrate:calendars -- --project <id> [--confirm]
 */
import { parseArgs } from 'node:util'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const { values } = parseArgs({
  options: {
    project: { type: 'string' },
    confirm: { type: 'boolean', default: false },
  },
})

const projectId = values.project ?? process.env.GCLOUD_PROJECT
if (!projectId) {
  console.error(
    'Usage: npm run migrate:calendars -- --project <id> [--confirm]\n' +
      'Against the emulators, set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 and use --project demo-24.',
  )
  process.exit(1)
}

initializeApp({ projectId })
const db = getFirestore()
const writer = db.bulkWriter()
let total = 0

for (const workspace of (await db.collection('workspaces').get()).docs) {
  const { name, memberIds = [], members = {}, invitedEmails = [] } = workspace.data()
  const tags = Object.fromEntries((await workspace.ref.collection('tags').get()).docs.map((doc) => [doc.id, doc.data()]))
  const feedback = (await workspace.ref.collection('feedback').get()).docs
  let copied = 0
  let skipped = 0
  let entries = 0

  for (const calendar of (await workspace.ref.collection('calendars').get()).docs) {
    const target = db.doc(`calendars/${calendar.id}`)
    if ((await target.get()).exists) {
      skipped++
      continue
    }
    copied++
    if (values.confirm) void writer.create(target, { ...calendar.data(), tags, memberIds, members, invitedEmails: [] })
    for (const entry of feedback.filter((doc) => doc.get('calendarId') === calendar.id)) {
      const { gift, action, at } = entry.data()
      entries++
      if (values.confirm) void writer.create(target.collection('feedback').doc(entry.id), { gift, action, at })
    }
  }

  total += copied
  console.log(`${name} (${workspace.id}): ${memberIds.length} people, ${Object.keys(tags).length} tags`)
  console.log(`  ${copied} calendars to copy, ${skipped} already copied, ${entries} feedback entries`)
  if (invitedEmails.length) console.log(`  pending invites, not copied: ${invitedEmails.join(', ')}`)
}

if (!values.confirm) {
  console.log(`Dry run: ${total} calendars to copy. Add --confirm to write them.`)
  process.exit(0)
}
await writer.close()
console.log(`Copied ${total} calendars.`)
