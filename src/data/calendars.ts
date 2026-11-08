import { collection, deleteDoc, deleteField, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import type { CalendarFields, Day } from '../domain/types.ts'
import { db } from '../services/firestore.ts'
import { report } from './report.ts'

const calendarRef = (wid: string, id: string) => doc(db, 'workspaces', wid, 'calendars', id)

export function createCalendar(wid: string, fields: CalendarFields): string {
  const ref = doc(collection(db, 'workspaces', wid, 'calendars'))
  void setDoc(ref, { ...fields, days: {}, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }).catch(report)
  return ref.id
}

export function updateCalendar(wid: string, id: string, fields: Partial<CalendarFields>): void {
  void updateDoc(calendarRef(wid, id), { ...fields, updatedAt: serverTimestamp() }).catch(report)
}

export function deleteCalendar(wid: string, id: string): void {
  void deleteDoc(calendarRef(wid, id)).catch(report)
}

/**
 * Writes the given fields of one day by path (`days.5.status`), so edits to
 * different days, or to different fields of the same day, never overwrite
 * each other. Missing parents are created, so this also starts a new day.
 */
export function updateDay(wid: string, id: string, day: number, changes: Partial<Day>): void {
  const fields = Object.fromEntries(Object.entries(changes).map(([key, value]) => [`days.${day}.${key}`, value]))
  void updateDoc(calendarRef(wid, id), { ...fields, updatedAt: serverTimestamp() }).catch(report)
}

export function clearDay(wid: string, id: string, day: number): void {
  void updateDoc(calendarRef(wid, id), { [`days.${day}`]: deleteField(), updatedAt: serverTimestamp() }).catch(report)
}

export function setDayPhoto(wid: string, id: string, day: number, photo: { path: string; url: string } | null): void {
  void updateDoc(calendarRef(wid, id), {
    [`days.${day}.photoPath`]: photo?.path ?? deleteField(),
    [`days.${day}.photoUrl`]: photo?.url ?? deleteField(),
    updatedAt: serverTimestamp(),
  }).catch(report)
}
