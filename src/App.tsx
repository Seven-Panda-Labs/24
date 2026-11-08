import { useTranslation } from 'react-i18next'
import { LANGUAGES } from './i18n/index.ts'

export default function App() {
  const { t, i18n } = useTranslation()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <img src="/pwa-192x192.png" alt="" width={144} height={144} className="rounded-3xl" />
      <h1 className="font-display text-6xl font-bold text-primary">24</h1>
      <p className="text-lg">{t('tagline')}</p>
      <div role="group" aria-label={t('language.label')} className="flex gap-2">
        {LANGUAGES.map((language) => (
          <button
            key={language}
            type="button"
            aria-pressed={i18n.resolvedLanguage === language}
            onClick={() => void i18n.changeLanguage(language)}
            className="rounded-2xl border border-primary px-4 py-2 text-sm font-semibold text-primary aria-pressed:bg-primary aria-pressed:text-background"
          >
            {t(`language.${language}`)}
          </button>
        ))}
      </div>
    </main>
  )
}
