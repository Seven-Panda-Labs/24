import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../auth/AuthContext.tsx'
import { useCalendars } from '../calendars/CalendarsContext.tsx'
import { cancelInvite, invite, people, removeMember } from '../data/sharing.ts'
import { useDocs } from '../data/useDocs.ts'
import type { Member } from '../domain/types.ts'

/** Who is in the calendar. Everyone in it can invite, take others out and leave. */
export default function SharePage() {
  const { t } = useTranslation()
  const user = useUser()
  const navigate = useNavigate()
  const { id } = useParams()
  const [email, setEmail] = useState('')
  const calendar = useCalendars().calendars.find((candidate) => candidate.id === id)
  const everyone = useDocs<Member & { id: string }>('people', people) ?? []
  if (!calendar) return <p className="card">{t('calendar.notFound')}</p>

  // Others who use the app and are not in or invited yet. Picking one only fills
  // the field: a stray tap must not show a secret calendar to the person it is for.
  const suggestions = everyone.filter(
    (person) => !calendar.memberIds.includes(person.id) && !calendar.invitedEmails.includes(person.email),
  )

  const sendInvite = (event: FormEvent) => {
    event.preventDefault()
    invite(calendar, email)
    setEmail('')
  }

  const leave = () => {
    if (!window.confirm(t('share.confirmLeave', { person: calendar.person }))) return
    removeMember(calendar, user.uid)
    navigate('/')
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link to={`/calendars/${calendar.id}`} className="text-sm text-foreground/70">
        ← {calendar.person} · {calendar.year}
      </Link>
      <h1 className="font-display text-3xl font-bold text-primary">{t('share.title')}</h1>
      <p className="text-sm text-foreground/70">{t('share.intro')}</p>

      <section className="card flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">{t('share.people')}</h2>
        <ul className="flex flex-col gap-1">
          {calendar.memberIds.map((uid) => {
            const member = calendar.members[uid]
            const name = member?.name || member?.email
            return (
              <li key={uid} className="flex items-center gap-2 text-sm">
                <span className="flex-1">
                  {name}
                  {member?.name && <span className="text-foreground/70"> · {member.email}</span>}
                  {uid === user.uid && <span className="text-foreground/70"> · {t('share.you')}</span>}
                </span>
                {uid !== user.uid ? (
                  <button
                    type="button"
                    className="btn-ghost text-secondary"
                    onClick={() => window.confirm(t('share.confirmRemove', { name })) && removeMember(calendar, uid)}
                  >
                    {t('share.remove')}
                  </button>
                ) : (
                  // The last one in deletes the calendar instead, from its settings.
                  calendar.memberIds.length > 1 && (
                    <button type="button" className="btn-ghost text-secondary" onClick={leave}>
                      {t('share.leave')}
                    </button>
                  )
                )}
              </li>
            )
          })}
          {calendar.invitedEmails.map((invited) => (
            <li key={invited} className="flex items-center gap-2 text-sm text-foreground/70">
              <span className="flex-1">
                {invited} · {t('share.pending')}
              </span>
              <button type="button" className="btn-ghost" onClick={() => cancelInvite(calendar, invited)}>
                {t('share.cancelInvite')}
              </button>
            </li>
          ))}
        </ul>
        {calendar.memberIds.length === 1 && <p className="text-sm text-foreground/70">🔒 {t('share.onlyYou')}</p>}

        <form onSubmit={sendInvite} className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">{t('share.inviteEmail')}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('share.inviteEmail')}
              className="input"
            />
          </label>
          {/* The rules cap pending invites at 20. */}
          <button type="submit" disabled={calendar.invitedEmails.length >= 20} className="btn-secondary">
            {t('share.invite')}
          </button>
        </form>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-foreground/70">{t('share.suggested')}</span>
            {suggestions.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setEmail(person.email)}
                className="rounded-full border border-foreground/15 px-3 py-1 text-sm font-semibold"
              >
                {person.name || person.email}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-foreground/70">{t('share.inviteHelp')}</p>
      </section>
    </div>
  )
}
