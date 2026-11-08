import { collection, deleteDoc, doc, setDoc } from 'firebase/firestore'
import type { Tag } from '../domain/types.ts'
import { db } from '../services/firestore.ts'
import { report } from './report.ts'

export function saveTag(wid: string, { id, ...tag }: Tag): void {
  void setDoc(doc(db, 'workspaces', wid, 'tags', id), tag).catch(report)
}

export function newTagId(wid: string): string {
  return doc(collection(db, 'workspaces', wid, 'tags')).id
}

export function deleteTag(wid: string, id: string): void {
  void deleteDoc(doc(db, 'workspaces', wid, 'tags', id)).catch(report)
}
