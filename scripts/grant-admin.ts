/**
 * Makes an account the admin, who approves the others in Settings, and
 * approves it; --revoke takes the role away. The app never writes the admin
 * flag, so this is the only way to set it. See docs/self-hosting.md.
 *
 *   npm run admin:grant -- --email <Google account> [--project <id>] [--revoke] [--confirm]
 */
import { parseArgs } from 'node:util'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    project: { type: 'string' },
    revoke: { type: 'boolean', default: false },
    confirm: { type: 'boolean', default: false },
  },
})

const projectId = values.project ?? process.env.GCLOUD_PROJECT
if (!values.email || !projectId) {
  console.error(
    'Usage: npm run admin:grant -- --email <Google account> --project <id> [--revoke] [--confirm]\n' +
      'Against the emulators, set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 and FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099, and use --project demo-24.',
  )
  process.exit(1)
}

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

const person = getFirestore().doc(`people/${user.uid}`)
const current = (await person.get()).data()
console.log(`${projectId} / ${values.email}: status ${current?.status ?? 'none'}, admin ${current?.admin === true}`)

if (!values.confirm) {
  console.log(`Dry run: would ${values.revoke ? 'revoke the admin role' : 'make it the admin and approve it'}. Add --confirm.`)
  process.exit(0)
}
await person.set(
  values.revoke
    ? { admin: FieldValue.delete() }
    : { name: user.displayName ?? '', email: values.email.toLowerCase(), status: 'approved', admin: true },
  { merge: true },
)
console.log(values.revoke ? 'Admin role revoked.' : 'Admin and approved.')
