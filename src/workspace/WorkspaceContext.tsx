import { collection, onSnapshot, query, where, type Query } from 'firebase/firestore'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useUser } from '../auth/AuthContext.tsx'
import type { Calendar, Tag, Workspace } from '../domain/types.ts'
import OnboardingPage from '../pages/OnboardingPage.tsx'
import Splash from '../components/Splash.tsx'
import { db } from '../services/firebase.ts'

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

/**
 * Subscribes to the query `build` returns and gives its documents, or
 * `undefined` until the first snapshot for `key`. `key` names the query: a new
 * key resubscribes. A `null` key subscribes to nothing and gives `[]`. With
 * `waitForServer`, an empty snapshot from the local cache does not count: on a
 * fresh install it says nothing about what the server has.
 *
 * A listener the server refuses is dead for good, so it resubscribes with
 * backoff. That happens right after creating a workspace: the listen on its
 * calendars can reach the server before the workspace write does, and the
 * membership rule refuses it.
 */
function useDocs<T>(key: string | null, build: () => Query, waitForServer = false): T[] | undefined {
  const [state, setState] = useState<{ key: string; docs: T[] }>()
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!key) return
    let retry: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = onSnapshot(
      build(),
      (snapshot) => {
        if (waitForServer && snapshot.empty && snapshot.metadata.fromCache) return
        setState({ key, docs: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T) })
      },
      (error) => {
        console.warn(`Listener ${key} failed, retrying`, error.code)
        retry = setTimeout(() => setAttempt((count) => count + 1), Math.min(30_000, 1000 * 2 ** attempt))
      },
    )
    return () => {
      clearTimeout(retry)
      unsubscribe()
    }
    // `build` is a fresh closure every render; `key` is what identifies the query.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])
  if (!key) return []
  return state?.key === key ? state.docs : undefined
}

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
