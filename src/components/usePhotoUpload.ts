import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { uploadPhoto, type Photo } from '../data/photos.ts'
import type { Slot } from '../domain/types.ts'

// When every accepted type is an image, Chrome on Android 14+ opens the system photo picker, which has no camera
// (https://issues.chromium.org/issues/40937303). A type no file has brings back its chooser with the camera,
// whose file browser still lists only images.
export const PHOTO_TYPES = 'image/*,android/allowCamera'

/** Uploads straight away, outside any Save: Storage has no offline queue to wait in. */
export function usePhotoUpload(calendarId: string) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function upload(slot: Slot, file: File | undefined): Promise<Photo | null> {
    if (!file) return null
    if (!navigator.onLine) {
      setError(t('photo.offline'))
      return null
    }
    setBusy(true)
    setError('')
    try {
      return await uploadPhoto(calendarId, slot, file)
    } catch (cause) {
      console.error(cause)
      setError(navigator.onLine ? t('photo.failed') : t('photo.offline'))
      return null
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, upload }
}
