import { useTranslation } from 'react-i18next'
import { setGiftPhoto, updateGift } from '../data/calendars.ts'
import { deletePhoto } from '../data/photos.ts'
import type { Day, Slot } from '../domain/types.ts'
import { useWorkspace } from '../workspace/WorkspaceContext.tsx'
import { PHOTO_TYPES, usePhotoUpload } from './usePhotoUpload.ts'

/**
 * The gift's photo. A photo for a gift not saved yet creates it, with `draft`
 * (what the editor has so far), so a photo alone is enough for a gift.
 */
export default function PhotoField({ calendarId, slot, value, draft }: { calendarId: string; slot: Slot; value: Day | undefined; draft: Partial<Day> }) {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()
  const { busy, error, upload } = usePhotoUpload(calendarId)

  async function choose(file: File | undefined) {
    const photo = await upload(slot, file)
    if (!photo) return
    if (!value) {
      updateGift(workspace.id, calendarId, slot, { ...draft, ...photo })
      return
    }
    setGiftPhoto(workspace.id, calendarId, slot, photo)
    deletePhoto(value)
  }

  function remove() {
    if (!value) return
    deletePhoto(value)
    setGiftPhoto(workspace.id, calendarId, slot, null)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{t('photo.label')}</span>
      {value?.photoUrl && <img src={value.photoUrl} alt={value.gift || t('photo.untitled')} className="max-h-72 w-full rounded-2xl object-cover" />}
      <div className="flex flex-wrap items-center gap-2">
        <label className={`btn-secondary cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>
          {busy ? t('photo.uploading') : value?.photoUrl ? t('photo.replace') : `📷 ${t('photo.add')}`}
          <input type="file" accept={PHOTO_TYPES} className="sr-only" disabled={busy} onChange={(event) => void choose(event.target.files?.[0])} />
        </label>
        {/* A gift that is only a photo is deleted as a whole, from the editor's footer. */}
        {value?.photoUrl && value.gift && (
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
