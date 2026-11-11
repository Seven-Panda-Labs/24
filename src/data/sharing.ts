import type { User } from 'firebase/auth'
import { arrayRemove, arrayUnion, collection, deleteField, doc, setDoc, updateDoc } from 'firebase/firestore'
import type { Calendar, Member } from '../domain/types.ts'
import { db } from '../services/firestore.ts'
import { report } from './report.ts'

export function memberOf(user: User): Member {
  return { name: user.displayName ?? '', email: user.email?.toLowerCase() ?? '' }
}

const calendarRef = (calendar: Calendar) => doc(db, 'calendars', calendar.id)

/** Everyone who has signed in, suggested on the Share page. */
export const people = () => collection(db, 'people')

/** Puts the user on that list, or updates their name. */
export function listPerson(user: User): void {
  void setDoc(doc(db, 'people', user.uid), memberOf(user)).catch(report)
}

export function acceptInvite(calendar: Calendar, user: User): void {
  void updateDoc(calendarRef(calendar), {
    memberIds: arrayUnion(user.uid),
    [`members.${user.uid}`]: memberOf(user),
    invitedEmails: arrayRemove(user.email?.toLowerCase()),
  }).catch(report)
}

export function declineInvite(calendar: Calendar, user: User): void {
  void updateDoc(calendarRef(calendar), { invitedEmails: arrayRemove(user.email?.toLowerCase()) }).catch(report)
}

export function invite(calendar: Calendar, email: string): void {
  void updateDoc(calendarRef(calendar), { invitedEmails: arrayUnion(email.trim().toLowerCase()) }).catch(report)
}

export function cancelInvite(calendar: Calendar, email: string): void {
  void updateDoc(calendarRef(calendar), { invitedEmails: arrayRemove(email) }).catch(report)
}

/** Takes someone out of the calendar, or the user themselves when they leave. */
export function removeMember(calendar: Calendar, uid: string): void {
  void updateDoc(calendarRef(calendar), {
    memberIds: arrayRemove(uid),
    [`members.${uid}`]: deleteField(),
  }).catch(report)
}
