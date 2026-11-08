import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let testEnv: RulesTestEnvironment

const WORKSPACE = {
  name: 'Família Ninguém',
  ownerId: 'alice',
  memberIds: ['alice', 'bob'],
  members: {
    alice: { name: 'Alice', email: 'alice@example.com' },
    bob: { name: 'Bob', email: 'bob@example.com' },
  },
  invitedEmails: ['carol@example.com'],
}

const CALENDAR = {
  year: 2026,
  person: 'Zé Ninguém',
  name: '',
  startDate: '2026-12-01',
  dayCount: 24,
  allowRepeats: false,
  originality: 0.5,
  days: {},
}

function as(uid: string, email = `${uid}@example.com`, verified = true) {
  return testEnv.authenticatedContext(uid, { email, email_verified: verified }).firestore()
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
    await db.doc('workspaces/w1').set(WORKSPACE)
    await db.doc('workspaces/w1/calendars/c1').set(CALENDAR)
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('workspaces', () => {
  it('lets members read and keeps outsiders out', async () => {
    await assertSucceeds(as('bob').doc('workspaces/w1').get())
    await assertSucceeds(as('alice').collection('workspaces').where('memberIds', 'array-contains', 'alice').get())
    await assertFails(as('eve').doc('workspaces/w1').get())
  })

  it('lets someone create a workspace they own, alone', async () => {
    const own = { ...WORKSPACE, ownerId: 'eve', memberIds: ['eve'], members: { eve: { name: 'Eve', email: 'eve@example.com' } }, invitedEmails: [] }
    await assertSucceeds(as('eve').doc('workspaces/w2').set(own))
    await assertFails(as('eve').doc('workspaces/w3').set({ ...own, memberIds: ['eve', 'alice'] }))
    await assertFails(as('eve').doc('workspaces/w4').set({ ...own, ownerId: 'alice' }))
  })

  it('lets members rename and invite, and only the owner remove members', async () => {
    await assertSucceeds(as('bob').doc('workspaces/w1').update({ name: 'Natal', invitedEmails: ['carol@example.com', 'dan@example.com'] }))
    await assertFails(as('bob').doc('workspaces/w1').update({ memberIds: ['bob'], members: { bob: WORKSPACE.members.bob } }))
    await assertSucceeds(as('alice').doc('workspaces/w1').update({ memberIds: ['alice'], members: { alice: WORKSPACE.members.alice } }))
  })

  it('does not let the owner leave members and memberIds out of step', async () => {
    await assertFails(as('alice').doc('workspaces/w1').update({ memberIds: ['alice'] }))
  })

  it('keeps outsiders from adding themselves', async () => {
    await assertFails(as('eve').doc('workspaces/w1').update({ memberIds: [...WORKSPACE.memberIds, 'eve'] }))
  })
})

describe('invites', () => {
  const accept = {
    memberIds: ['alice', 'bob', 'carol'],
    members: { ...WORKSPACE.members, carol: { name: 'Carol', email: 'carol@example.com' } },
    invitedEmails: [],
  }

  it('lets the invited person find and read the workspace', async () => {
    const carol = as('carol')
    await assertSucceeds(carol.collection('workspaces').where('invitedEmails', 'array-contains', 'carol@example.com').get())
    await assertSucceeds(carol.doc('workspaces/w1').get())
  })

  it('lets the invited person join', async () => {
    await assertSucceeds(as('carol').doc('workspaces/w1').update(accept))
  })

  it('refuses an unverified account with the invited address', async () => {
    await assertFails(as('mallory', 'carol@example.com', false).doc('workspaces/w1').get())
    await assertFails(as('mallory', 'carol@example.com', false).doc('workspaces/w1').update(accept))
  })

  it('refuses a join that shows another email to the family', async () => {
    const spoofed = { ...accept, members: { ...accept.members, carol: { name: 'Carol', email: 'alice@example.com' } } }
    await assertFails(as('carol').doc('workspaces/w1').update(spoofed))
  })

  it('refuses a join that changes anything else', async () => {
    await assertFails(as('carol').doc('workspaces/w1').update({ ...accept, name: 'Minha' }))
    await assertFails(as('carol').doc('workspaces/w1').update({ ...accept, memberIds: ['carol'] }))
  })
})

describe('calendars', () => {
  it('lets members create, edit and read calendars', async () => {
    const bob = as('bob')
    await assertSucceeds(bob.doc('workspaces/w1/calendars/c2').set({ ...CALENDAR, person: 'Ana' }))
    await assertSucceeds(
      bob.doc('workspaces/w1/calendars/c1').update({
        'days.1': { gift: 'Meias', status: 'planned', tagIds: ['clothes'], notes: '' },
      }),
    )
    await assertSucceeds(bob.collection('workspaces/w1/calendars').get())
  })

  it('refuses malformed calendars', async () => {
    const bob = as('bob')
    await assertFails(bob.doc('workspaces/w1/calendars/c3').set({ ...CALENDAR, year: '2026' }))
    await assertFails(bob.doc('workspaces/w1/calendars/c3').set({ ...CALENDAR, person: '' }))
    await assertFails(bob.doc('workspaces/w1/calendars/c3').set({ ...CALENDAR, owner: 'bob' }))
  })

  it('keeps outsiders out', async () => {
    await assertFails(as('eve').doc('workspaces/w1/calendars/c1').get())
    await assertFails(as('eve').doc('workspaces/w1/calendars/c2').set(CALENDAR))
  })
})

describe('tags', () => {
  it('lets members manage valid tags', async () => {
    await assertSucceeds(as('bob').doc('workspaces/w1/tags/sweets').set({ name: 'Doces', color: 'amber', emoji: '🍬' }))
    await assertFails(as('bob').doc('workspaces/w1/tags/x').set({ name: 'Doces', color: 'gold', emoji: '🍬' }))
    await assertFails(as('eve').doc('workspaces/w1/tags/y').set({ name: 'Doces', color: 'amber', emoji: '🍬' }))
  })
})

describe('feedback', () => {
  const feedback = () => ({ calendarId: 'c1', gift: 'Doces', action: 'dismissed', at: serverTimestamp() })

  it('lets members add feedback and read it, but never change it', async () => {
    const bob = as('bob')
    await assertSucceeds(setDoc(doc(bob, 'workspaces/w1/feedback/f1'), feedback()))
    await assertSucceeds(getDocs(query(collection(bob, 'workspaces/w1/feedback'), where('calendarId', '==', 'c1'))))
    await assertFails(updateDoc(doc(bob, 'workspaces/w1/feedback/f1'), { action: 'accepted' }))
    await assertFails(deleteDoc(doc(bob, 'workspaces/w1/feedback/f1')))
  })

  it('refuses unknown actions, client timestamps and outsiders', async () => {
    await assertFails(setDoc(doc(as('bob'), 'workspaces/w1/feedback/f2'), { ...feedback(), action: 'loved' }))
    await assertFails(setDoc(doc(as('bob'), 'workspaces/w1/feedback/f3'), { ...feedback(), at: new Date() }))
    await assertFails(setDoc(doc(as('eve'), 'workspaces/w1/feedback/f4'), feedback()))
  })
})

describe('gift photos', () => {
  const storage = (uid: string) => testEnv.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: true }).storage()
  const photo = new Uint8Array([0xff, 0xd8, 0xff])
  const path = 'workspaces/w1/photos/c1/1-1.jpg'

  it('lets members upload, read and delete images', async () => {
    await assertSucceeds(uploadBytes(ref(storage('bob'), path), photo, { contentType: 'image/jpeg' }))
    await assertSucceeds(getBytes(ref(storage('alice'), path)))
    await assertSucceeds(deleteObject(ref(storage('bob'), path)))
  })

  it('refuses other files and outsiders', async () => {
    await assertFails(uploadBytes(ref(storage('bob'), 'workspaces/w1/photos/c1/notes.txt'), photo, { contentType: 'text/plain' }))
    await assertFails(uploadBytes(ref(storage('eve'), path), photo, { contentType: 'image/jpeg' }))
    await assertFails(getBytes(ref(storage('eve'), path)))
  })
})
