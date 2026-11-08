import { signOut } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useUser } from '../auth/AuthContext.tsx'
import { acceptInvite, createWorkspace } from '../data/workspaces.ts'
import { DEFAULT_TAGS } from '../domain/tags.ts'
import type { Workspace } from '../domain/types.ts'
import { auth } from '../services/firebase.ts'

export default function OnboardingPage({ invites }: { invites: Workspace[] }) {
  const { t } = useTranslation()
  const user = useUser()
  const firstName = user.displayName?.split(' ')[0]
  const [name, setName] = useState(firstName ? t('onboarding.defaultName', { name: firstName }) : '')

  function create(event: FormEvent) {
    event.preventDefault()
    createWorkspace(
      user,
      name.trim(),
      DEFAULT_TAGS.map((tag) => ({ ...tag, name: t(`tags.defaults.${tag.id}`) })),
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <img src="/illustrations/cocoa.webp" alt="" className="h-28 w-auto" />
        <h1 className="font-display text-3xl font-bold text-primary">{t('onboarding.title')}</h1>
        <p className="text-foreground/70">{t('onboarding.intro')}</p>
      </div>

      {invites.map((workspace) => (
        <div key={workspace.id} className="card flex flex-col gap-3">
          <p>{t('onboarding.invited', { name: workspace.name })}</p>
          <button type="button" className="btn-primary" onClick={() => acceptInvite(workspace, user)}>
            {t('onboarding.join')}
          </button>
        </div>
      ))}

      <form onSubmit={create} className="card flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t('onboarding.nameLabel')}
          <input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} className="input" />
        </label>
        <button type="submit" className={invites.length ? 'btn-secondary' : 'btn-primary'}>
          {t('onboarding.create')}
        </button>
        <p className="text-xs text-foreground/70">{t('onboarding.waitingForInvite', { email: user.email })}</p>
      </form>

      <button type="button" onClick={() => signOut(auth)} className="btn-ghost self-center">
        {t('settings.signOut')}
      </button>
    </main>
  )
}
