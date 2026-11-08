import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WRITE_REFUSED } from '../data/report.ts'

/** Offline notice, and a dismissible alert when the server refuses a change. */
export default function StatusBanner() {
  const { t } = useTranslation()
  const [online, setOnline] = useState(() => navigator.onLine)
  const [refused, setRefused] = useState(false)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    const onRefused = () => setRefused(true)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    window.addEventListener(WRITE_REFUSED, onRefused)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      window.removeEventListener(WRITE_REFUSED, onRefused)
    }
  }, [])

  return (
    <>
      {!online && (
        <p role="status" className="mx-4 mb-2 rounded-2xl bg-foreground/10 px-4 py-2 text-sm">
          📡 {t('connection.offline')}
        </p>
      )}
      {refused && (
        <div role="alert" className="mx-4 mb-2 flex items-start gap-3 rounded-2xl bg-secondary/15 px-4 py-2 text-sm">
          <p className="flex-1">{t('connection.refused')}</p>
          <button type="button" onClick={() => setRefused(false)} className="font-semibold" aria-label={t('common.close')}>
            ✕
          </button>
        </div>
      )}
    </>
  )
}
