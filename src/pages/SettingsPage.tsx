import { signOut } from 'firebase/auth'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useUser } from '../auth/AuthContext.tsx'
import { cancelInvite, invite, removeMember, renameWorkspace } from '../data/workspaces.ts'
import { LANGUAGES } from '../i18n/index.ts'
import RemindersSettings from '../components/RemindersSettings.tsx'
import { auth } from '../services/firebase.ts'
import { pushConfigured } from '../services/push.ts'
import { applyTheme, storedTheme, THEMES, type Theme } from '../theme.ts'
import { useWorkspace } from '../workspace/WorkspaceContext.tsx'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const user = useUser()
  const { workspace, workspaces, selectWorkspace } = useWorkspace()
  const [email, setEmail] = useState('')
  const [theme, setTheme] = useState(storedTheme)
  const isOwner = workspace.ownerId === user.uid

  function chooseTheme(choice: Theme) {
    applyTheme(choice)
    setTheme(choice)
  }

  function sendInvite(event: FormEvent) {
    event.preventDefault()
    invite(workspace, email)
    setEmail('')
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="font-display text-3xl font-bold text-primary">{t('settings.title')}</h1>

      <section className="card flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">{t('settings.workspace')}</h2>
        {workspaces.length > 1 && (
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {t('settings.switchWorkspace')}
            <select value={workspace.id} onChange={(event) => selectWorkspace(event.target.value)} className="input">
              {workspaces.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t('settings.workspaceName')}
          <input
            key={workspace.name}
            defaultValue={workspace.name}
            maxLength={60}
            onBlur={(event) => {
              const name = event.target.value.trim()
              if (name && name !== workspace.name) renameWorkspace(workspace, name)
            }}
            className="input"
          />
        </label>

        <h3 className="mt-2 text-sm font-semibold">{t('settings.members')}</h3>
        <ul className="flex flex-col gap-1">
          {workspace.memberIds.map((uid) => {
            const member = workspace.members[uid]
            return (
              <li key={uid} className="flex items-center gap-2 text-sm">
                <span className="flex-1">
                  {member?.name || member?.email}
                  {member?.name && <span className="text-foreground/70"> · {member.email}</span>}
                  {uid === workspace.ownerId && <span className="text-foreground/70"> · {t('settings.owner')}</span>}
                </span>
                {isOwner && uid !== user.uid && (
                  <button
                    type="button"
                    className="btn-ghost text-secondary"
                    onClick={() => window.confirm(t('settings.confirmRemove', { name: member?.name || member?.email })) && removeMember(workspace, uid)}
                  >
                    {t('settings.remove')}
                  </button>
                )}
              </li>
            )
          })}
          {workspace.invitedEmails.map((invited) => (
            <li key={invited} className="flex items-center gap-2 text-sm text-foreground/70">
              <span className="flex-1">
                {invited} · {t('settings.pending')}
              </span>
              <button type="button" className="btn-ghost" onClick={() => cancelInvite(workspace, invited)}>
                {t('settings.cancelInvite')}
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={sendInvite} className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">{t('settings.inviteEmail')}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('settings.inviteEmail')}
              className="input"
            />
          </label>
          {/* The rules cap pending invites at 20. */}
          <button type="submit" disabled={workspace.invitedEmails.length >= 20} className="btn-secondary">
            {t('settings.invite')}
          </button>
        </form>
        <p className="text-xs text-foreground/70">{t('settings.inviteHelp')}</p>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">{t('tags.title')}</h2>
        <p className="text-sm text-foreground/70">{t('settings.tagsHelp')}</p>
        <Link to="/tags" className="btn-secondary self-start">
          {t('settings.manageTags')}
        </Link>
      </section>

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
