import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Logo from '../components/Logo.tsx'
import { auth } from '../services/firebase.ts'

// Google is the only sign-in method; the rules refuse any other provider.
export default function LoginPage() {
  const { t } = useTranslation()
  const [error, setError] = useState('')

  function signInWithGoogle() {
    setError('')
    signInWithPopup(auth, new GoogleAuthProvider()).catch((cause: { code?: string }) => {
      if (cause.code !== 'auth/popup-closed-by-user') setError(t('login.googleFailed'))
    })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1>
          <Logo size={120} alt="24" />
        </h1>
        <p>{t('tagline')}</p>
      </div>

      <button type="button" onClick={signInWithGoogle} className="btn-primary">
        {t('login.google')}
      </button>

      {error && (
        <p role="alert" className="text-center text-sm text-secondary">
          {error}
        </p>
      )}
    </main>
  )
}
