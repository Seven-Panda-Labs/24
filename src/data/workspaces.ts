import type { User } from 'firebase/auth'
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import type { Member, Tag, Workspace } from '../domain/types.ts'
import { db } from '../services/firebase.ts'
import { report } from './report.ts'

function memberOf(user: User): Member {
  return { name: user.displayName ?? '', email: user.email?.toLowerCase() ?? '' }
}

export function createWorkspace(user: User, name: string, tags: Tag[]): string {
  const ref = doc(collection(db, 'workspaces'))
  void setDoc(ref, {
    name,
    ownerId: user.uid,
    memberIds: [user.uid],
    members: { [user.uid]: memberOf(user) },
    invitedEmails: [],
    createdAt: serverTimestamp(),
  }).catch(report)
  // A separate write: the tag rules check membership with get(), which cannot
  // see a workspace created in the same batch.
  const batch = writeBatch(db)
  for (const { id, ...tag } of tags) batch.set(doc(ref, 'tags', id), tag)
  void batch.commit().catch(report)
  return ref.id
}

export function acceptInvite(workspace: Workspace, user: User): void {
  void updateDoc(doc(db, 'workspaces', workspace.id), {
    memberIds: arrayUnion(user.uid),
    [`members.${user.uid}`]: memberOf(user),
    invitedEmails: arrayRemove(user.email?.toLowerCase()),
  }).catch(report)
}

export function renameWorkspace(workspace: Workspace, name: string): void {
  void updateDoc(doc(db, 'workspaces', workspace.id), { name }).catch(report)
}

export function invite(workspace: Workspace, email: string): void {
  void updateDoc(doc(db, 'workspaces', workspace.id), { invitedEmails: arrayUnion(email.trim().toLowerCase()) }).catch(report)
}

export function cancelInvite(workspace: Workspace, email: string): void {
  void updateDoc(doc(db, 'workspaces', workspace.id), { invitedEmails: arrayRemove(email) }).catch(report)
}

export function removeMember(workspace: Workspace, uid: string): void {
  void updateDoc(doc(db, 'workspaces', workspace.id), {
    memberIds: arrayRemove(uid),
    [`members.${uid}`]: deleteField(),
  }).catch(report)
}
