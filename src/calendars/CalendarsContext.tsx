import { collection, query, where } from 'firebase/firestore'
import { createContext, useContext, type ReactNode } from 'react'
import { useUser } from '../auth/AuthContext.tsx'
import { cleanDays } from '../domain/days.ts'
import type { Calendar } from '../domain/types.ts'
import Splash from '../components/Splash.tsx'
import { useDocs } from '../data/useDocs.ts'
import { db } from '../services/firestore.ts'

interface CalendarsState {
  /** The calendars the signed-in user is in, newest year first. */
  calendars: Calendar[]
  /** Calendars that invited the signed-in user's email. */
  invites: Calendar[]
}

const CalendarsContext = createContext<CalendarsState | null>(null)

export function CalendarsGate({ children }: { children: ReactNode }) {
  const user = useUser()
  const email = user.emailVerified ? user.email?.toLowerCase() : undefined
  const calendars = useDocs<Calendar>(
    `member:${user.uid}`,
    () => query(collection(db, 'calendars'), where('memberIds', 'array-contains', user.uid)),
    true,
  )
  const invites =
    useDocs<Calendar>(email ? `invited:${email}` : null, () =>
      query(collection(db, 'calendars'), where('invitedEmails', 'array-contains', email)),
    ) ?? []

  if (!calendars) return <Splash />

  return (
    <CalendarsContext.Provider value={{ calendars: sorted(calendars), invites: sorted(invites) }}>{children}</CalendarsContext.Provider>
  )
}

function sorted(calendars: Calendar[]): Calendar[] {
  return calendars
    .map((calendar) => ({ ...calendar, days: cleanDays(calendar.days), sack: cleanDays(calendar.sack) }))
    .sort((a, b) => b.year - a.year || a.person.localeCompare(b.person))
}

export function useCalendars(): CalendarsState {
  const state = useContext(CalendarsContext)
  if (!state) throw new Error('useCalendars() outside <CalendarsGate>')
  return state
}
