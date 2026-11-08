import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * The seal for a calendar with every day wrapped. Confetti only on the change
 * to complete while the page is open, so opening an archived year stays quiet.
 */
export default function Celebration({ person, days, complete }: { person: string; days: number; complete: boolean }) {
  const { t } = useTranslation()
  const wasComplete = useRef(complete)

  useEffect(() => {
    if (complete && !wasComplete.current) {
      void import('canvas-confetti').then(({ default: confetti }) =>
        confetti({
          particleCount: 160,
          spread: 80,
          origin: { y: 0.35 },
          colors: ['#1D6B4F', '#C8353F', '#E3A82B', '#FAF6EF'],
          disableForReducedMotion: true,
        }),
      )
    }
    wasComplete.current = complete
  }, [complete])

  if (!complete) return null

  return (
    <div className="card flex items-center gap-4 border-accent/60">
      <SantaSeal />
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-bold text-primary">{t('celebration.title')}</h2>
        <p className="text-sm">{t('celebration.text', { person, days })}</p>
      </div>
    </div>
  )
}

function SantaSeal() {
  const { t } = useTranslation()
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={t('celebration.seal')} className="h-24 w-24 shrink-0 drop-shadow-md">
      <defs>
        <path id="seal-ring" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
      </defs>
      <circle cx="60" cy="60" r="58" fill="#E3A82B" />
      <circle cx="60" cy="60" r="53" fill="none" stroke="#FAF6EF" strokeWidth="1.5" strokeDasharray="2 3" />
      <circle cx="60" cy="60" r="33" fill="#C8353F" stroke="#FAF6EF" strokeWidth="2" />
      <text fill="#2E2A26" fontSize="8.5" fontWeight="700" letterSpacing="0.5">
        <textPath href="#seal-ring" textLength="276" lengthAdjust="spacing">
          {t('celebration.sealText')}
        </textPath>
      </text>
      <text x="60" y="69" textAnchor="middle" fill="#FAF6EF" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="26">
        24
      </text>
    </svg>
  )
}
