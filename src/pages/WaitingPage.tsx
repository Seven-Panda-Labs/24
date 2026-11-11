import { signOut } from 'firebase/auth'
import { useTranslation } from 'react-i18next'
import { useUser } from '../auth/AuthContext.tsx'
import { auth } from '../services/firebase.ts'

/** What an account sees until the admin approves it, or after they reject it. */
export default function WaitingPage({ rejected }: { rejected: boolean }) {
  const { t } = useTranslation()
  const user = useUser()

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <img src="/illustrations/cocoa.webp" alt="" width={160} height={160} />
      <h1 className="font-display text-3xl font-bold text-primary">{t(rejected ? 'account.rejectedTitle' : 'account.waitingTitle')}</h1>
      <p className="text-foreground/70">{t(rejected ? 'account.rejectedText' : 'account.waitingText', { email: user.email })}</p>
      <button type="button" onClick={() => signOut(auth)} className="btn-ghost">
        {t('settings.signOut')}
      </button>
    </main>
  )
}
