/**
 * Moves an instance from family spaces to calendars shared one by one (0.18.0).
 * Each workspace's calendars are copied to calendars/{same id} with the
 * space's tags and people, their photos to calendars/{id}/photos/ and their
 * suggestion feedback under them. Everyone in a space joins the list of people
 * suggested when inviting. It only copies: workspaces and the old photos stay as
 * a backup, and calendars already copied are skipped. Pending invites to a space
 * are listed, not copied. See docs/self-hosting.md.
 *
 *   npm run migrate:calendars -- --project <id> --bucket <storage bucket> [--confirm]
 */
import { randomUUID } from 'node:crypto'
import { parseArgs } from 'node:util'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

type Gift = { photoPath?: string; photoUrl?: string; thumbUrl?: string }

const { values } = parseArgs({
  options: {
    project: { type: 'string' },
    bucket: { type: 'string' },
    confirm: { type: 'boolean', default: false },
  },
})

const projectId = values.project ?? process.env.GCLOUD_PROJECT
if (!projectId || !values.bucket) {
  console.error(
    'Usage: npm run migrate:calendars -- --project <id> --bucket <VITE_FIREBASE_STORAGE_BUCKET> [--confirm]\n' +
      'Against the emulators, set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 and FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199,\n' +
      'and use --project demo-24 --bucket demo-24.appspot.com.',
  )
  process.exit(1)
}

initializeApp({ projectId, storageBucket: values.bucket })
const db = getFirestore()
const bucket = getStorage().bucket()
const writer = db.bulkWriter()
const thumbOf = (path: string) => path.replace(/\.jpg$/, '-thumb.jpg')
let total = 0
let photos = 0

// Where download URLs point, as the client SDK builds them.
const downloads = process.env.FIREBASE_STORAGE_EMULATOR_HOST
  ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`
  : 'https://firebasestorage.googleapis.com'

/** Copies a photo with a new download token, and gives its download URL. */
async function copy(from: string, to: string): Promise<string> {
  const [bytes] = await bucket.file(from).download()
  const token = randomUUID()
  await bucket.file(to).save(bytes, { contentType: 'image/jpeg', metadata: { metadata: { firebaseStorageDownloadTokens: token } } })
  return `${downloads}/v0/b/${bucket.name}/o/${encodeURIComponent(to)}?alt=media&token=${token}`
}

/** The gift with its photo copied into the calendar's folder, when it still has one under workspaces/. */
async function movePhoto(cid: string, gift: Gift): Promise<Gift> {
  if (!gift.photoPath?.startsWith('workspaces/')) return gift
  const [found] = await bucket.file(gift.photoPath).exists()
  if (!found) {
    console.warn(`  missing ${gift.photoPath}: the gift keeps its old link`)
    return gift
  }
  photos++
  if (!values.confirm) return gift
  const path = `calendars/${cid}/photos/${gift.photoPath.split('/').at(-1)}`
  const moved = { ...gift, photoPath: path, photoUrl: await copy(gift.photoPath, path) }
  if (gift.thumbUrl) moved.thumbUrl = await copy(thumbOf(gift.photoPath), thumbOf(path))
  return moved
}

async function movePhotos(cid: string, gifts: Record<string, Gift>): Promise<Record<string, Gift>> {
  const moved = await Promise.all(Object.entries(gifts).map(async ([key, gift]) => [key, await movePhoto(cid, gift)] as const))
  return Object.fromEntries(moved)
}

for (const workspace of (await db.collection('workspaces').get()).docs) {
  const { name, memberIds = [], members = {}, invitedEmails = [] } = workspace.data()
  const tags = Object.fromEntries((await workspace.ref.collection('tags').get()).docs.map((doc) => [doc.id, doc.data()]))
  const feedback = (await workspace.ref.collection('feedback').get()).docs
  const photosBefore = photos
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
    const data = calendar.data()
    const days = await movePhotos(calendar.id, data.days ?? {})
    const sack = data.sack && (await movePhotos(calendar.id, data.sack))
    if (values.confirm) void writer.create(target, { ...data, days, ...(sack && { sack }), tags, memberIds, members, invitedEmails: [] })
    for (const entry of feedback.filter((doc) => doc.get('calendarId') === calendar.id)) {
      const { gift, action, at } = entry.data()
      entries++
      if (values.confirm) void writer.create(target.collection('feedback').doc(entry.id), { gift, action, at })
    }
  }
  if (values.confirm) for (const uid of memberIds) void writer.set(db.doc(`people/${uid}`), members[uid])

  total += copied
  console.log(`${name} (${workspace.id}): ${memberIds.length} people, ${Object.keys(tags).length} tags`)
  console.log(`  ${copied} calendars to copy, ${skipped} already copied, ${photos - photosBefore} photos, ${entries} feedback entries`)
  if (invitedEmails.length) console.log(`  pending invites, not copied: ${invitedEmails.join(', ')}`)
}

if (!values.confirm) {
  console.log(`Dry run: ${total} calendars and ${photos} photos to copy. Add --confirm to write them.`)
  process.exit(0)
}
await writer.close()
console.log(`Copied ${total} calendars and ${photos} photos.`)
