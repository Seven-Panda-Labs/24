import { collection, query, where } from 'firebase/firestore'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { useUser } from '../auth/AuthContext.tsx'
import type { Calendar, Tag, Workspace } from '../domain/types.ts'
import OnboardingPage from '../pages/OnboardingPage.tsx'
import Splash from '../components/Splash.tsx'
import { useDocs } from '../data/useDocs.ts'
import { db } from '../services/firestore.ts'

interface WorkspaceState {
  workspace: Workspace
  workspaces: Workspace[]
  /** Workspaces that invited the signed-in user's email. */
  invites: Workspace[]
  calendars: Calendar[]
  tags: Tag[]
  selectWorkspace: (id: string) => void
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

const SELECTED_KEY = '24:workspace'

export function WorkspaceGate({ children }: { children: ReactNode }) {
  const user = useUser()
  const email = user.emailVerified ? user.email?.toLowerCase() : undefined
  const workspaces = useDocs<Workspace>(
    `member:${user.uid}`,
    () => query(collection(db, 'workspaces'), where('memberIds', 'array-contains', user.uid)),
    true,
  )
  const invites =
    useDocs<Workspace>(email ? `invited:${email}` : null, () =>
      query(collection(db, 'workspaces'), where('invitedEmails', 'array-contains', email)),
    ) ?? []
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(SELECTED_KEY))

  if (!workspaces) return <Splash />

  const workspace = workspaces.find((candidate) => candidate.id === selectedId) ?? workspaces[0]
  if (!workspace) return <OnboardingPage invites={invites} />

  function selectWorkspace(id: string) {
    localStorage.setItem(SELECTED_KEY, id)
    setSelectedId(id)
  }

  return (
    <WorkspaceData workspace={workspace} workspaces={workspaces} invites={invites} selectWorkspace={selectWorkspace}>
      {children}
    </WorkspaceData>
  )
}

function WorkspaceData({
  children,
  ...state
}: Omit<WorkspaceState, 'calendars' | 'tags'> & { children: ReactNode }) {
  const wid = state.workspace.id
  const calendars = useDocs<Calendar>(`calendars:${wid}`, () => query(collection(db, 'workspaces', wid, 'calendars')))
  const tags = useDocs<Tag>(`tags:${wid}`, () => query(collection(db, 'workspaces', wid, 'tags')))

  if (!calendars || !tags) return <Splash />

  const sorted = [...calendars].sort((a, b) => b.year - a.year || a.person.localeCompare(b.person))
  return (
    <WorkspaceContext.Provider value={{ ...state, calendars: sorted, tags }}>{children}</WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceState {
  const state = useContext(WorkspaceContext)
  if (!state) throw new Error('useWorkspace() outside <WorkspaceGate>')
  return state
}
