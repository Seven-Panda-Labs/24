import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUser } from '../auth/AuthContext.tsx'
import { disablePush, enablePush, PushDenied, pushEnabledHere, pushSupported } from '../services/push.ts'

export default function RemindersSettings() {
  const { t, i18n } = useTranslation()
  const user = useUser()
  const [supported, setSupported] = useState<boolean>()
  const [enabled, setEnabled] = useState(() => pushEnabledHere())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void pushSupported().then(setSupported)
  }, [])

  async function toggle() {
    setBusy(true)
    setError('')
    try {
      if (enabled) await disablePush(user.uid)
      else await enablePush(user.uid, i18n.language)
      setEnabled(!enabled)
    } catch (cause) {
      console.error(cause)
      setError(t(cause instanceof PushDenied ? 'reminders.denied' : 'reminders.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold">{t('reminders.title')}</h2>
      <p className="text-sm text-foreground/70">{t('reminders.help')}</p>
      {supported === false ? (
        <p className="text-sm text-foreground/70">{t('reminders.unsupported')}</p>
      ) : (
        <button type="button" onClick={() => void toggle()} disabled={busy || supported === undefined} className="btn-secondary self-start">
          {enabled ? t('reminders.disable') : t('reminders.enable')}
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-secondary">
          {error}
        </p>
      )}
    </section>
  )
}
