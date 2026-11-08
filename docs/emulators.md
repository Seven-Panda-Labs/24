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

- **Entrar (emulador)** signs in as `dev@24.local` / `devpassword`, created on first use. Its email is not verified, so it cannot accept invites.
- **Entrar com Google** opens the Auth emulator's account picker: "Add new account" creates a fake Google account with a verified email. Use it to test invites with a second browser profile.
- Email links appear in the `npm run emulators` output instead of being sent.

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
