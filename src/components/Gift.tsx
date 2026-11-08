import { useTranslation } from 'react-i18next'
import type { Day } from '../domain/types.ts'

/** The gift's name, or a placeholder for a gift that is only a photo. */
export function GiftName({ value }: { value: Day }) {
  const { t } = useTranslation()
  return value.gift || <i className="font-normal text-foreground/70">{t('photo.untitled')}</i>
}

export function GiftThumb({ value }: { value: Day }) {
  const src = value.thumbUrl ?? value.photoUrl
  return src ? <img src={src} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : null
}
