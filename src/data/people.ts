import type { User } from 'firebase/auth'
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore'
import type { Person } from '../domain/types.ts'
import { db } from '../services/firestore.ts'
import { report } from './report.ts'
import { memberOf } from './sharing.ts'

/** Everyone who has signed in: suggested on the Share page, approved by the admin. */
export const people = () => collection(db, 'people')

export const personRef = (uid: string) => doc(db, 'people', uid)

/** A first sign-in lists the account, waiting for the admin. */
export function addPerson(user: User): void {
  void setDoc(personRef(user.uid), { ...memberOf(user), status: 'pending' }).catch(report)
}

/** Keeps the name and email as Google has them. */
export function updatePerson(user: User): void {
  void updateDoc(personRef(user.uid), { ...memberOf(user) }).catch(report)
}

export function decide(person: Person, status: 'approved' | 'rejected'): void {
  void updateDoc(personRef(person.id), { status }).catch(report)
}
