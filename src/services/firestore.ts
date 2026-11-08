import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { app, useEmulators } from './firebase.ts'

// Apart from firebase.ts so the sign-in page loads without these SDKs: only
// the signed-in part of the app (SignedInApp.tsx, loaded lazily) imports this.

// Offline-first: reads and queued writes live in IndexedDB. The SDK falls back
// to a memory cache on its own when IndexedDB is unavailable.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

export const storage = getStorage(app)
// The SDK retries a failing upload for ten minutes, with the button spinning.
storage.maxUploadRetryTime = 60_000

if (useEmulators) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}
