import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
  inMemoryPersistence,
  type Auth,
} from 'firebase/auth'

function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    const message = `Missing ${name}. Copy .env.emulator.example to .env.development.local for npm run dev, or .env.example to .env.production.local for a build. See docs/configuration.md.`
    // This runs before React mounts, so without it the page stays blank.
    document.getElementById('root')!.textContent = message
    throw new Error(message)
  }
  return value
}

export const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

export const app = initializeApp({
  apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('VITE_FIREBASE_APP_ID'),
})

// getAuth() without its popup resolver: with it, mobile browsers load Google's sign-in
// iframe before restoring the session, so on a weak signal the app never leaves the splash.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
})

if (useEmulators) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })

let signInInstance: Auth | undefined

/**
 * A second, memory-only Auth that loads the sign-in iframe for the Google popup. Mobile
 * browsers block a popup opened after a network wait, so it starts with the sign-in page.
 */
export function signInAuth(): Auth {
  if (!signInInstance) {
    signInInstance = initializeAuth(initializeApp(app.options, 'sign-in'), {
      persistence: inMemoryPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    })
    if (useEmulators) connectAuthEmulator(signInInstance, 'http://127.0.0.1:9099', { disableWarnings: true })
  }
  return signInInstance
}
