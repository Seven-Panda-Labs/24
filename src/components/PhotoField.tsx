import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setDayPhoto } from '../data/calendars.ts'
import { deletePhoto, uploadPhoto } from '../data/photos.ts'
import type { Day } from '../domain/types.ts'
import { useWorkspace } from '../workspace/WorkspaceContext.tsx'

/** Uploads straight away, outside the editor's Save: Storage has no offline queue to wait in. */
export default function PhotoField({ calendarId, day, value }: { calendarId: string; day: number; value: Day }) {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function choose(file: File | undefined) {
    if (!file) return
    if (!navigator.onLine) {
      setError(t('photo.offline'))
      return
    }
    setBusy(true)
    setError('')
    try {
      setDayPhoto(workspace.id, calendarId, day, await uploadPhoto(workspace.id, calendarId, day, file))
      if (value.photoPath) deletePhoto(value.photoPath)
    } catch (cause) {
      console.error(cause)
      setError(navigator.onLine ? t('photo.failed') : t('photo.offline'))
    } finally {
      setBusy(false)
    }
  }

  function remove() {
    if (!value.photoPath) return
    deletePhoto(value.photoPath)
    setDayPhoto(workspace.id, calendarId, day, null)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{t('photo.label')}</span>
      {value.photoUrl && <img src={value.photoUrl} alt={value.gift} className="max-h-48 w-fit rounded-2xl object-cover" />}
      <div className="flex flex-wrap items-center gap-2">
        <label className={`btn-secondary cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>
          {busy ? t('photo.uploading') : value.photoUrl ? t('photo.replace') : t('photo.add')}
          <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(event) => void choose(event.target.files?.[0])} />
        </label>
        {value.photoUrl && (
          <button type="button" onClick={remove} className="btn-ghost text-secondary">
            {t('photo.remove')}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-secondary">
          {error}
        </p>
      )}
    </div>
  )
}
