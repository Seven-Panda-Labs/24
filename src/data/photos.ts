import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../services/firebase.ts'
import { report } from './report.ts'

const MAX_SIDE = 1280

/** Shrinks the photo to a JPEG of at most 1280px a side and uploads it. Needs a connection. */
export async function uploadPhoto(wid: string, calendarId: string, day: number, file: File): Promise<{ path: string; url: string }> {
  const path = `workspaces/${wid}/photos/${calendarId}/${day}-${Date.now()}.jpg`
  const photo = ref(storage, path)
  await uploadBytes(photo, await shrink(file), { contentType: 'image/jpeg' })
  return { path, url: await getDownloadURL(photo) }
}

export function deletePhoto(path: string): void {
  void deleteObject(ref(storage, path)).catch(report)
}

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the photo'))), 'image/jpeg', 0.85),
  )
}
