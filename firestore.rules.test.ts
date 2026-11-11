import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, deleteDoc, deleteField, doc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let testEnv: RulesTestEnvironment

const MEMBERS = {
  alice: { name: 'Alice', email: 'alice@example.com' },
  bob: { name: 'Bob', email: 'bob@example.com' },
}

// Shared by Alice and Bob, with Carol and Dan invited.
const CALENDAR = {
  year: 2026,
  person: 'Zé Ninguém',
  name: '',
  startDate: '2026-12-01',
  dayCount: 24,
  allowRepeats: false,
  originality: 0.5,
  days: {},
  tags: { sweets: { name: 'Doces', color: 'amber', emoji: '🍬' } },
  memberIds: ['alice', 'bob'],
  members: MEMBERS,
  invitedEmails: ['carol@example.com', 'dan@example.com'],
}

// Bob's secret calendar for Alice.
const SECRET = { ...CALENDAR, person: 'Alice', memberIds: ['bob'], members: { bob: MEMBERS.bob }, invitedEmails: [] }

type Provider = 'google.com' | 'password' | 'email'

function token(uid: string, email = `${uid}@example.com`, verified = true, provider: Provider = 'google.com') {
  return testEnv.authenticatedContext(uid, { email, email_verified: verified, firebase: { sign_in_provider: provider } })
}

function as(uid: string, email?: string, verified?: boolean, provider?: Provider) {
  return token(uid, email, verified, provider).firestore()
}

beforeAll(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':')
  const [storageHost, storagePort] = (process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199').split(':')
  testEnv = await initializeTestEnvironment({
    // The project npm run test:rules starts the emulators with: Storage rules
    // read memberships from the Firestore of the emulator's own project.
    projectId: 'demo-24',
    firestore: {
      rules: readFileSync(resolve(import.meta.dirname, 'firestore.rules'), 'utf8'),
      host,
      port: Number(port),
    },
    storage: {
      rules: readFileSync(resolve(import.meta.dirname, 'storage.rules'), 'utf8'),
      host: storageHost,
      port: Number(storagePort),
    },
  })
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await db.doc('calendars/c1').set(CALENDAR)
    await db.doc('calendars/secret').set(SECRET)
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('calendars', () => {
  it('shows each person only the calendars they are in', async () => {
    await assertSucceeds(as('alice').collection('calendars').where('memberIds', 'array-contains', 'alice').get())
    await assertSucceeds(as('alice').doc('calendars/c1').get())
    await assertFails(as('alice').doc('calendars/secret').get())
    await assertSucceeds(as('bob').doc('calendars/secret').get())
    await assertFails(as('alice').collection('calendars').get())
    await assertFails(as('eve').doc('calendars/c1').get())
  })

  it('lets someone create a calendar that is only theirs', async () => {
    const own = { ...CALENDAR, memberIds: ['eve'], members: { eve: { name: 'Eve', email: 'eve@example.com' } }, invitedEmails: [] }
    await assertSucceeds(as('eve').doc('calendars/c2').set(own))
    await assertFails(as('eve').doc('calendars/c3').set({ ...own, memberIds: ['eve', 'alice'], members: { ...own.members, alice: MEMBERS.alice } }))
    await assertFails(as('eve').doc('calendars/c4').set({ ...own, invitedEmails: ['alice@example.com'] }))
    await assertFails(as('eve').doc('calendars/c5').set({ ...own, members: { eve: { name: 'Eve', email: 'alice@example.com' } } }))
  })

  it('lets everyone in it edit gifts, the sack, tags and settings', async () => {
    const bob = as('bob')
    const gift = { gift: 'Meias', status: 'planned', tagIds: ['sweets'], notes: '' }
    await assertSucceeds(bob.doc('calendars/c1').update({ 'days.1': gift }))
    await assertSucceeds(bob.doc('calendars/c1').update({ 'sack.a1': gift }))
    await assertSucceeds(updateDoc(doc(bob, 'calendars/c1'), { 'sack.a1': deleteField(), 'days.2': gift }))
    await assertSucceeds(bob.doc('calendars/c1').update({ 'tags.books': { name: 'Livros', color: 'purple', emoji: '📚' } }))
    await assertSucceeds(updateDoc(doc(as('alice'), 'calendars/c1'), { person: 'Zé', updatedAt: serverTimestamp() }))
    await assertFails(as('alice').doc('calendars/secret').update({ 'days.1': gift }))
  })

  it('refuses malformed calendars', async () => {
    const bob = as('bob')
    await assertFails(bob.doc('calendars/c1').update({ year: '2026' }))
    await assertFails(bob.doc('calendars/c1').update({ person: '' }))
    await assertFails(bob.doc('calendars/c1').update({ owner: 'bob' }))
    await assertFails(bob.doc('calendars/c1').update({ sack: 'Meias' }))
    await assertFails(bob.doc('calendars/c1').update({ tags: 'Doces' }))
    const tooMany = Object.fromEntries(Array.from({ length: 101 }, (_, index) => [`g${index}`, { gift: 'Meias' }]))
    await assertFails(bob.doc('calendars/c1').update({ sack: tooMany }))
  })

  it('lets anyone in it invite and take others out', async () => {
    await assertSucceeds(as('bob').doc('calendars/c1').update({ invitedEmails: ['erin@example.com'] }))
    await assertSucceeds(as('bob').doc('calendars/c1').update({ memberIds: ['bob'], members: { bob: MEMBERS.bob } }))
    await assertFails(as('alice').doc('calendars/c1').get())
  })

  it('lets someone leave, but not the last one in', async () => {
    await assertSucceeds(as('alice').doc('calendars/c1').update({ memberIds: ['bob'], members: { bob: MEMBERS.bob } }))
    await assertFails(as('bob').doc('calendars/secret').update({ memberIds: [], members: {} }))
  })

  it('never lets anyone add someone else', async () => {
    const eve = { name: 'Eve', email: 'eve@example.com' }
    await assertFails(as('bob').doc('calendars/c1').update({ memberIds: ['alice', 'bob', 'eve'], members: { ...MEMBERS, eve } }))
    await assertFails(as('eve').doc('calendars/c1').update({ memberIds: ['alice', 'bob', 'eve'], members: { ...MEMBERS, eve } }))
    await assertFails(as('bob').doc('calendars/c1').update({ 'members.alice': { name: 'Alice', email: 'eve@example.com' } }))
    await assertFails(as('bob').doc('calendars/c1').update({ memberIds: ['bob'] }))
  })

  it('lets anyone in it delete it, and nobody else', async () => {
    await assertFails(as('alice').doc('calendars/secret').delete())
    await assertSucceeds(as('bob').doc('calendars/c1').delete())
  })

  it('refuses accounts signed in with anything but Google', async () => {
    await assertFails(as('bob', undefined, true, 'password').doc('calendars/c1').get())
    await assertFails(as('bob', undefined, true, 'email').collection('calendars').where('memberIds', 'array-contains', 'bob').get())
  })
})

describe('invites', () => {
  const carol = { name: 'Carol', email: 'carol@example.com' }
  const accept = { memberIds: ['alice', 'bob', 'carol'], members: { ...MEMBERS, carol }, invitedEmails: ['dan@example.com'] }

  it('lets the invited person find and read the calendar, and only that one', async () => {
    await assertSucceeds(as('carol').collection('calendars').where('invitedEmails', 'array-contains', 'carol@example.com').get())
    await assertSucceeds(as('carol').doc('calendars/c1').get())
    await assertFails(as('carol').doc('calendars/secret').get())
  })

  it('lets the invited person join', async () => {
    await assertSucceeds(as('carol').doc('calendars/c1').update(accept))
  })

  it('lets the invited person decline, without touching other invites', async () => {
    await assertFails(as('carol').doc('calendars/c1').update({ invitedEmails: [] }))
    await assertSucceeds(as('carol').doc('calendars/c1').update({ invitedEmails: ['dan@example.com'] }))
  })

  it('refuses an unverified account with the invited address', async () => {
    await assertFails(as('mallory', 'carol@example.com', false).doc('calendars/c1').get())
    await assertFails(as('mallory', 'carol@example.com', false).doc('calendars/c1').update(accept))
  })

  it('refuses a join that shows another email', async () => {
    await assertFails(as('carol').doc('calendars/c1').update({ ...accept, members: { ...MEMBERS, carol: { name: 'Carol', email: 'alice@example.com' } } }))
  })

  it('refuses a join that changes anything else', async () => {
    await assertFails(as('carol').doc('calendars/c1').update({ ...accept, person: 'Carol' }))
    await assertFails(as('carol').doc('calendars/c1').update({ ...accept, memberIds: ['carol'], members: { carol } }))
  })
})

describe('feedback', () => {
  const feedback = () => ({ gift: 'Doces', action: 'dismissed', at: serverTimestamp() })

  it('lets people in the calendar add feedback and read it, but never change it', async () => {
    const bob = as('bob')
    await assertSucceeds(setDoc(doc(bob, 'calendars/c1/feedback/f1'), feedback()))
    await assertSucceeds(getDocs(collection(bob, 'calendars/c1/feedback')))
    await assertFails(updateDoc(doc(bob, 'calendars/c1/feedback/f1'), { action: 'accepted' }))
    await assertFails(deleteDoc(doc(bob, 'calendars/c1/feedback/f1')))
  })

  it('refuses unknown actions, client timestamps and anyone outside the calendar', async () => {
    await assertFails(setDoc(doc(as('bob'), 'calendars/c1/feedback/f2'), { ...feedback(), action: 'loved' }))
    await assertFails(setDoc(doc(as('bob'), 'calendars/c1/feedback/f3'), { ...feedback(), at: new Date() }))
    await assertFails(setDoc(doc(as('alice'), 'calendars/secret/feedback/f4'), feedback()))
    await assertFails(getDocs(collection(as('alice'), 'calendars/secret/feedback')))
  })
})

describe('gift photos', () => {
  const storage = (uid: string, provider?: Provider) => token(uid, undefined, true, provider).storage()
  const photo = new Uint8Array([0xff, 0xd8, 0xff])
  const path = 'calendars/c1/photos/1-1.jpg'

  it('lets people in the calendar upload, read and delete images', async () => {
    await assertSucceeds(uploadBytes(ref(storage('bob'), path), photo, { contentType: 'image/jpeg' }))
    await assertSucceeds(getBytes(ref(storage('alice'), path)))
    await assertSucceeds(deleteObject(ref(storage('bob'), path)))
  })

  it('refuses other files and anyone outside the calendar', async () => {
    await assertFails(uploadBytes(ref(storage('bob'), 'calendars/c1/photos/notes.txt'), photo, { contentType: 'text/plain' }))
    await assertFails(uploadBytes(ref(storage('eve'), path), photo, { contentType: 'image/jpeg' }))
    await assertFails(uploadBytes(ref(storage('alice'), 'calendars/secret/photos/1-1.jpg'), photo, { contentType: 'image/jpeg' }))
    await assertFails(getBytes(ref(storage('eve'), path)))
    await assertFails(uploadBytes(ref(storage('bob', 'password'), path), photo, { contentType: 'image/jpeg' }))
  })

  it('keeps photos from before sharing readable and deletable by the people in their calendar', async () => {
    const old = 'workspaces/w1/photos/c1/2-1.jpg'
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(ref(context.storage(), old), photo, { contentType: 'image/jpeg' })
    })
    await assertSucceeds(getBytes(ref(storage('alice'), old)))
    await assertFails(getBytes(ref(storage('eve'), old)))
    await assertFails(uploadBytes(ref(storage('bob'), 'workspaces/w1/photos/c1/3-1.jpg'), photo, { contentType: 'image/jpeg' }))
    await assertSucceeds(deleteObject(ref(storage('bob'), old)))
  })
})

describe('users', () => {
  it('lets people keep their own push tokens and nobody else read them', async () => {
    await assertSucceeds(as('bob').doc('users/bob').set({ fcmTokens: ['token-1'], language: 'pt-PT' }))
    await assertSucceeds(as('bob').doc('users/bob').get())
    await assertFails(as('alice').doc('users/bob').get())
    await assertFails(as('alice').doc('users/bob').set({ fcmTokens: ['token-2'], language: 'en' }))
    await assertFails(as('bob').doc('users/bob').set({ fcmTokens: ['token-1'], language: 'pt-PT', admin: true }))
  })
})
