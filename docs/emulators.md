# Firebase emulators

Develop without a cloud project using the [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite).

Requirements: Node.js 24, Java JDK 21+ (Firestore emulator), `firebase-tools` (in `devDependencies`, run as `npx firebase`).

## Quick start

```bash
npm install
cp .env.emulator.example .env.local

npm run emulators    # terminal 1
npm run dev          # terminal 2, http://localhost:5173
```

Project ID is `demo-24`, so no `.firebaserc` is needed and nothing reaches a real project. Google sign-in does not work against the Auth emulator; create test users in the Emulator UI.

Ports (set in [`firebase.json`](../firebase.json), wired in [`src/services/firebase.ts`](../src/services/firebase.ts)): UI 4000, Auth 9099, Firestore 8080, Storage 9199.

## Rules tests

`npm run test:rules` runs [`firestore.rules.test.ts`](../firestore.rules.test.ts) against a Firestore emulator it starts and stops itself. Part of `npm run check` and CI.

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
| `Missing VITE_FIREBASE_…` on start | `.env.local` missing; copy `.env.emulator.example` |
| Every read denied | Expected until the data model lands: `firestore.rules` denies everything |
