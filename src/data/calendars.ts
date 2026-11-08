import { collection, deleteDoc, deleteField, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import type { CalendarFields, Day, Status } from '../domain/types.ts'
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
 * Writes one day by field path, so two people editing different days of the
 * same calendar never overwrite each other. `null` empties the day.
 */
export function saveDay(wid: string, id: string, day: number, value: Day | null): void {
  void updateDoc(calendarRef(wid, id), {
    [`days.${day}`]: value ?? deleteField(),
    updatedAt: serverTimestamp(),
  }).catch(report)
}

export function setDayStatus(wid: string, id: string, day: number, status: Status): void {
  void updateDoc(calendarRef(wid, id), { [`days.${day}.status`]: status, updatedAt: serverTimestamp() }).catch(report)
}

export function setDayPhoto(wid: string, id: string, day: number, photo: { path: string; url: string } | null): void {
  void updateDoc(calendarRef(wid, id), {
    [`days.${day}.photoPath`]: photo?.path ?? deleteField(),
    [`days.${day}.photoUrl`]: photo?.url ?? deleteField(),
    updatedAt: serverTimestamp(),
  }).catch(report)
}
