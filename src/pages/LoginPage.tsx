import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Logo from '../components/Logo.tsx'
import { auth, signInAuth } from '../services/firebase.ts'

// Google is the only sign-in method; the rules refuse any other provider.
export default function LoginPage() {
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void signInAuth().authStateReady().then(() => setReady(true))
  }, [])

  function signInWithGoogle() {
    setError('')
    signInWithPopup(signInAuth(), new GoogleAuthProvider())
      .then((result) => signInWithCredential(auth, GoogleAuthProvider.credentialFromResult(result)!))
      .catch((cause: { code?: string }) => {
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

      <button type="button" onClick={signInWithGoogle} disabled={!ready} className="btn-primary">
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
