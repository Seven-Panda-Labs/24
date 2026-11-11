import type { User } from 'firebase/auth'
import { collection, deleteDoc, deleteField, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import type { Calendar, CalendarFields, Day, Slot } from '../domain/types.ts'
import { db } from '../services/firestore.ts'
import type { Photo } from './photos.ts'
import { report } from './report.ts'
import { memberOf } from './sharing.ts'

const calendarRef = (id: string) => doc(db, 'calendars', id)
const pathOf = (slot: Slot) => ('day' in slot ? `days.${slot.day}` : `sack.${slot.sack}`)

/** A new calendar is only its creator's until they invite someone. */
export function createCalendar(user: User, fields: CalendarFields, tags: Calendar['tags']): string {
  const ref = doc(collection(db, 'calendars'))
  void setDoc(ref, {
    ...fields,
    days: {},
    tags,
    memberIds: [user.uid],
    members: { [user.uid]: memberOf(user) },
    invitedEmails: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(report)
  return ref.id
}

export function updateCalendar(id: string, fields: Partial<CalendarFields>): void {
  void updateDoc(calendarRef(id), { ...fields, updatedAt: serverTimestamp() }).catch(report)
}

export function deleteCalendar(id: string): void {
  void deleteDoc(calendarRef(id)).catch(report)
}

/**
 * Writes the given fields of one gift by path (`days.5.status`), so edits to
 * different gifts, or to different fields of the same gift, never overwrite
 * each other. Missing parents are created, so this also starts a new gift.
 */
export function updateGift(id: string, slot: Slot, changes: Partial<Day>): void {
  const fields = Object.fromEntries(Object.entries(changes).map(([key, value]) => [`${pathOf(slot)}.${key}`, value]))
  void updateDoc(calendarRef(id), { ...fields, updatedAt: serverTimestamp() }).catch(report)
}

export function clearGift(id: string, slot: Slot): void {
  void updateDoc(calendarRef(id), { [pathOf(slot)]: deleteField(), updatedAt: serverTimestamp() }).catch(report)
}

export interface Move {
  from: Slot
  to: Slot
  value: Day
}

/** Takes each gift out of one slot and puts it in another, all in one write. */
export function moveGifts(id: string, moves: Move[]): void {
  const fields = Object.fromEntries(moves.flatMap(({ from, to, value }) => [[pathOf(from), deleteField()], [pathOf(to), value]]))
  void updateDoc(calendarRef(id), { ...fields, updatedAt: serverTimestamp() }).catch(report)
}

export function setGiftPhoto(id: string, slot: Slot, photo: Photo | null): void {
  void updateDoc(calendarRef(id), {
    [`${pathOf(slot)}.photoPath`]: photo?.photoPath ?? deleteField(),
    [`${pathOf(slot)}.photoUrl`]: photo?.photoUrl ?? deleteField(),
    [`${pathOf(slot)}.thumbUrl`]: photo?.thumbUrl ?? deleteField(),
    updatedAt: serverTimestamp(),
  }).catch(report)
}
