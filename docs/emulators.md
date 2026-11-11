# Firebase emulators

Develop without a cloud project using the [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite).

Requirements: Node.js 24, Java JDK 21+ (Firestore emulator), `firebase-tools` (in `devDependencies`, run as `npx firebase`).

## Quick start

```bash
npm install && npm --prefix functions install
cp .env.emulator.example .env.development.local

npm run emulators    # terminal 1
npm run dev          # terminal 2, http://localhost:5173
```

Project ID is `demo-24`, so no `.firebaserc` is needed and nothing reaches a real project.

## Signing in

Google is the only sign-in method, and the rules refuse any other provider. **Entrar com Google** opens the Auth emulator's account picker: "Add new account" creates a fake Google account with a verified email. Use a second browser profile with another fake account to test invites.

A new account waits for approval. Make your first fake account the admin, then approve the others in Settings:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  npm run admin:grant -- --email <fake email> --project demo-24 --confirm
```

Ports (set in [`firebase.json`](../firebase.json), wired in [`src/services/firebase.ts`](../src/services/firebase.ts)): UI 4000, Auth 9099, Firestore 8080, Storage 9199.

## Reminders

The Functions emulator loads `sendReminders` but does not run it: scheduled functions need the Pub/Sub emulator, and FCM is not emulated. The reminder option in Settings appears when `VITE_FIREBASE_VAPID_KEY` is set, and says notifications are unsupported in `npm run dev`, which has no service worker. Test push against a real project with a build (`npm run build && npm run preview`).

## Rules tests

`npm run test:rules` runs [`firestore.rules.test.ts`](../firestore.rules.test.ts) against Firestore and Storage emulators it starts and stops itself, so stop `npm run emulators` first. Part of `npm run check` and CI.

The tests use the `demo-24` project, because Storage rules read memberships from the Firestore of the emulator's own project, and they clear its data. Pointed at your running emulators (`FIRESTORE_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST`), they wipe what you were working on.

## Testing offline

The Firestore cache is persistent with the emulators too. Stop `npm run emulators`, or use airplane mode in DevTools, and the app keeps reading and queues writes until the emulator is back. Emulator data is wiped on restart unless you persist it.

## Persist data

```bash
npx firebase emulators:start --project demo-24 --import=./emulator-data --export-on-exit=./emulator-data
```

`emulator-data/` is gitignored.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Java version before 21` | Install JDK 21+ |
| Page says `Missing VITE_FIREBASE_…` | `.env.development.local` missing; copy `.env.emulator.example` |
| Stuck on the loading screen after sign-in | Check the browser console for `permission-denied`; the listeners retry, but a rules change needs a reload |
