import { collection, deleteField, doc, updateDoc } from 'firebase/firestore'
import type { Tag } from '../domain/types.ts'
import { db } from '../services/firestore.ts'
import { report } from './report.ts'

export function saveTag(calendarId: string, { id, ...tag }: Tag): void {
  void updateDoc(doc(db, 'calendars', calendarId), { [`tags.${id}`]: tag }).catch(report)
}

export function newTagId(): string {
  return doc(collection(db, 'calendars')).id
}

export function deleteTag(calendarId: string, id: string): void {
  void updateDoc(doc(db, 'calendars', calendarId), { [`tags.${id}`]: deleteField() }).catch(report)
}
