import { collection, deleteDoc, deleteField, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import type { CalendarFields, Day, Slot } from '../domain/types.ts'
import { db } from '../services/firestore.ts'
import { report } from './report.ts'

const calendarRef = (wid: string, id: string) => doc(db, 'workspaces', wid, 'calendars', id)
const pathOf = (slot: Slot) => ('day' in slot ? `days.${slot.day}` : `sack.${slot.sack}`)

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
 * Writes the given fields of one gift by path (`days.5.status`), so edits to
 * different gifts, or to different fields of the same gift, never overwrite
 * each other. Missing parents are created, so this also starts a new gift.
 */
export function updateGift(wid: string, id: string, slot: Slot, changes: Partial<Day>): void {
  const fields = Object.fromEntries(Object.entries(changes).map(([key, value]) => [`${pathOf(slot)}.${key}`, value]))
  void updateDoc(calendarRef(wid, id), { ...fields, updatedAt: serverTimestamp() }).catch(report)
}

export function clearGift(wid: string, id: string, slot: Slot): void {
  void updateDoc(calendarRef(wid, id), { [pathOf(slot)]: deleteField(), updatedAt: serverTimestamp() }).catch(report)
}

/** Takes a gift out of one slot and puts it in another, in one write. */
export function moveGift(wid: string, id: string, from: Slot, to: Slot, value: Day): void {
  void updateDoc(calendarRef(wid, id), {
    [pathOf(from)]: deleteField(),
    [pathOf(to)]: value,
    updatedAt: serverTimestamp(),
  }).catch(report)
}

export function setGiftPhoto(wid: string, id: string, slot: Slot, photo: { path: string; url: string } | null): void {
  void updateDoc(calendarRef(wid, id), {
    [`${pathOf(slot)}.photoPath`]: photo?.path ?? deleteField(),
    [`${pathOf(slot)}.photoUrl`]: photo?.url ?? deleteField(),
    updatedAt: serverTimestamp(),
  }).catch(report)
}
