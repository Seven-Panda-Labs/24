import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firestore.ts'
import { report } from './report.ts'

export interface Feedback {
  id: string
  gift: string
  action: 'accepted' | 'dismissed'
}

export function feedbackOf(calendarId: string) {
  return collection(db, 'calendars', calendarId, 'feedback')
}

/** Implicit feedback on a suggestion. Dismissed ones stop being suggested for that calendar. */
export function recordFeedback(calendarId: string, gift: string, action: Feedback['action']): void {
  void addDoc(feedbackOf(calendarId), { gift, action, at: serverTimestamp() }).catch(report)
}
