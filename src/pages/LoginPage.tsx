import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
} from 'firebase/auth'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { auth, useEmulators } from '../services/firebase.ts'

const EMAIL_KEY = '24:sign-in-email'
const DEV_ACCOUNT = { email: 'dev@24.local', password: 'devpassword' }

export default function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) ?? '')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const linkHandled = useRef(false)

  useEffect(() => {
    if (linkHandled.current || !isSignInWithEmailLink(auth, window.location.href)) return
    linkHandled.current = true
    // The link opened on another device has no stored address; ask for it.
    const address = localStorage.getItem(EMAIL_KEY) ?? window.prompt(t('login.confirmEmail'))
    if (!address) return
    signInWithEmailLink(auth, address, window.location.href)
      .then(() => {
        localStorage.removeItem(EMAIL_KEY)
        window.history.replaceState(null, '', '/')
      })
      .catch(() => setError(t('login.linkFailed')))
  }, [t])

  async function sendLink(event: FormEvent) {
    event.preventDefault()
    setState('sending')
    setError('')
    try {
      const address = email.trim()
      await sendSignInLinkToEmail(auth, address, { url: `${window.location.origin}/login`, handleCodeInApp: true })
      localStorage.setItem(EMAIL_KEY, address)
      setState('sent')
    } catch {
      setState('idle')
      setError(t('login.sendFailed'))
    }
  }

  function signInWithGoogle() {
    setError('')
    signInWithPopup(auth, new GoogleAuthProvider()).catch((cause: { code?: string }) => {
      if (cause.code !== 'auth/popup-closed-by-user') setError(t('login.googleFailed'))
    })
  }

  function signInForDevelopment() {
    signInWithEmailAndPassword(auth, DEV_ACCOUNT.email, DEV_ACCOUNT.password).catch(() =>
      createUserWithEmailAndPassword(auth, DEV_ACCOUNT.email, DEV_ACCOUNT.password),
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src="/logo.webp" alt="" width={120} height={120} className="rounded-3xl" />
        <h1 className="font-display text-5xl font-bold text-primary">24</h1>
        <p>{t('tagline')}</p>
      </div>

      <button type="button" onClick={signInWithGoogle} className="btn-primary">
        {t('login.google')}
      </button>

      <div className="flex items-center gap-3 text-sm text-foreground/70">
        <span className="h-px flex-1 bg-foreground/15" />
        {t('login.or')}
        <span className="h-px flex-1 bg-foreground/15" />
      </div>

      {state === 'sent' ? (
        <p role="status" className="card text-center">
          {t('login.linkSent', { email })}
        </p>
      ) : (
        <form onSubmit={sendLink} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {t('login.email')}
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
            />
          </label>
          <button type="submit" disabled={state === 'sending'} className="btn-secondary">
            {t('login.sendLink')}
          </button>
        </form>
      )}

      {useEmulators && (
        <button type="button" onClick={signInForDevelopment} className="text-sm underline">
          {t('login.emulator')}
        </button>
      )}

      {error && (
        <p role="alert" className="text-center text-sm text-secondary">
          {error}
        </p>
      )}
    </main>
  )
}
