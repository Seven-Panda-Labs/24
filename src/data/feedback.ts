import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase.ts'
import { report } from './report.ts'

export interface Feedback {
  id: string
  calendarId: string
  gift: string
  action: 'accepted' | 'dismissed'
}

export function feedbackOf(wid: string) {
  return collection(db, 'workspaces', wid, 'feedback')
}

/** Implicit feedback on a suggestion. Dismissed ones stop being suggested for that calendar. */
export function recordFeedback(wid: string, calendarId: string, gift: string, action: Feedback['action']): void {
  void addDoc(feedbackOf(wid), { calendarId, gift, action, at: serverTimestamp() }).catch(report)
}
