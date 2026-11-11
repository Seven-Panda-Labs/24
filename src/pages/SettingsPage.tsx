import { signOut } from 'firebase/auth'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAccount } from '../account/AccessGate.tsx'
import { useUser } from '../auth/AuthContext.tsx'
import AccountsSettings from '../components/AccountsSettings.tsx'
import { LANGUAGES } from '../i18n/index.ts'
import RemindersSettings from '../components/RemindersSettings.tsx'
import { auth } from '../services/firebase.ts'
import { pushConfigured } from '../services/push.ts'
import { applyTheme, storedTheme, THEMES, type Theme } from '../theme.ts'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const user = useUser()
  const { admin } = useAccount()
  const [theme, setTheme] = useState(storedTheme)

  function chooseTheme(choice: Theme) {
    applyTheme(choice)
    setTheme(choice)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="font-display text-3xl font-bold text-primary">{t('settings.title')}</h1>

      {admin && <AccountsSettings />}

      {pushConfigured && <RemindersSettings />}

      <section className="card flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">{t('language.label')}</h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((language) => (
            <Choice key={language} pressed={i18n.resolvedLanguage === language} onClick={() => void i18n.changeLanguage(language)}>
              {t(`language.${language}`)}
            </Choice>
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">{t('theme.label')}</h2>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((option) => (
            <Choice key={option} pressed={theme === option} onClick={() => chooseTheme(option)}>
              {t(`theme.${option}`)}
            </Choice>
          ))}
        </div>
      </section>

      <section className="card flex flex-wrap items-center gap-3">
        <p className="flex-1 text-sm">{t('settings.signedInAs', { email: user.email })}</p>
        <button type="button" onClick={() => signOut(auth)} className="btn-ghost text-secondary">
          {t('settings.signOut')}
        </button>
      </section>
    </div>
  )
}

function Choice({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="rounded-2xl border border-primary px-4 py-2 text-sm font-semibold text-primary aria-pressed:bg-primary aria-pressed:text-background"
    >
      {children}
    </button>
  )
}
