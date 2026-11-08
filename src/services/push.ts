import { arrayRemove, arrayUnion, doc, setDoc } from 'firebase/firestore'
import { app } from './firebase.ts'
import { db } from './firestore.ts'

const TOKEN_KEY = '24:push-token'
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

/** Reminders need a Web Push key; without one the option is hidden. */
export const pushConfigured = Boolean(VAPID_KEY)

async function messaging() {
  const { deleteToken, getMessaging, getToken, isSupported } = await import('firebase/messaging')
  // No service worker in `npm run dev`: vite-plugin-pwa only registers it in builds.
  const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
  if (!registration || !(await isSupported())) return null
  return { messaging: getMessaging(app), registration, getToken, deleteToken }
}

export async function pushSupported(): Promise<boolean> {
  return pushConfigured && (await messaging()) !== null
}

export function pushEnabledHere(): boolean {
  return localStorage.getItem(TOKEN_KEY) !== null && Notification.permission === 'granted'
}

export class PushDenied extends Error {}

export async function enablePush(uid: string, language: string): Promise<void> {
  const api = await messaging()
  if (!api) throw new Error('Push is not supported here')
  if ((await Notification.requestPermission()) !== 'granted') throw new PushDenied()
  const token = await api.getToken(api.messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: api.registration })
  await setDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token), language }, { merge: true })
  localStorage.setItem(TOKEN_KEY, token)
}

export async function disablePush(uid: string): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  const api = await messaging()
  if (api) await api.deleteToken(api.messaging).catch(() => undefined)
  if (token) await setDoc(doc(db, 'users', uid), { fcmTokens: arrayRemove(token) }, { merge: true })
}
