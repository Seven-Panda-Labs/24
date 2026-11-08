import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import type { Day, Slot } from '../domain/types.ts'
import { storage } from '../services/firestore.ts'
import { report } from './report.ts'

const MAX_SIDE = 1280
// Doors and list rows are at most a few hundred pixels wide; 24 full photos on a grid would be megabytes.
const THUMB_SIDE = 320

export type Photo = Required<Pick<Day, 'photoPath' | 'photoUrl' | 'thumbUrl'>>

const thumbPathOf = (path: string) => path.replace(/\.jpg$/, '-thumb.jpg')

/** Shrinks the photo to a JPEG of at most 1280px a side, plus a thumbnail, and uploads both. Needs a connection. */
export async function uploadPhoto(wid: string, calendarId: string, slot: Slot, file: File): Promise<Photo> {
  const name = 'day' in slot ? slot.day : `sack-${slot.sack}`
  const path = `workspaces/${wid}/photos/${calendarId}/${name}-${Date.now()}.jpg`
  const bitmap = await createImageBitmap(file)
  const [photoUrl, thumbUrl] = await Promise.all([
    upload(path, await shrink(bitmap, MAX_SIDE)),
    upload(thumbPathOf(path), await shrink(bitmap, THUMB_SIDE)),
  ])
  return { photoPath: path, photoUrl, thumbUrl }
}

/** Photos from before thumbnails have none to delete. */
export function deletePhoto({ photoPath, thumbUrl }: Pick<Day, 'photoPath' | 'thumbUrl'>): void {
  if (!photoPath) return
  for (const path of thumbUrl ? [photoPath, thumbPathOf(photoPath)] : [photoPath]) {
    void deleteObject(ref(storage, path)).catch(report)
  }
}

async function upload(path: string, blob: Blob): Promise<string> {
  const photo = ref(storage, path)
  await uploadBytes(photo, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(photo)
}

async function shrink(bitmap: ImageBitmap, maxSide: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the photo'))), 'image/jpeg', 0.85),
  )
}
