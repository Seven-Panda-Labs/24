import { onSnapshot } from 'firebase/firestore'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useUser } from '../auth/AuthContext.tsx'
import Splash from '../components/Splash.tsx'
import { addPerson, personRef, updatePerson } from '../data/people.ts'
import { memberOf } from '../data/sharing.ts'
import { statusOf, type Person } from '../domain/types.ts'
import WaitingPage from '../pages/WaitingPage.tsx'

const AccountContext = createContext<Person | null>(null)

/**
 * Lets the user in once the admin has approved their account, and switches as
 * soon as that changes. A first sign-in lists the account as pending.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const user = useUser()
  // undefined until the server answers, null when the account is not listed yet.
  const [person, setPerson] = useState<Person | null>()

  useEffect(
    () =>
      onSnapshot(personRef(user.uid), { includeMetadataChanges: true }, (snapshot) => {
        // On a fresh install the cache knows nothing: only the server can say the entry is missing.
        if (!snapshot.exists() && snapshot.metadata.fromCache) return
        setPerson(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Person) : null)
      }),
    [user],
  )

  useEffect(() => {
    const { name, email } = memberOf(user)
    if (person === null) addPerson(user)
    else if (person && (person.name !== name || person.email !== email)) updatePerson(user)
  }, [person, user])

  if (!person) return <Splash />
  if (statusOf(person) !== 'approved') return <WaitingPage rejected={person.status === 'rejected'} />
  return <AccountContext.Provider value={person}>{children}</AccountContext.Provider>
}

/** The signed-in, approved account. */
export function useAccount(): Person {
  const person = useContext(AccountContext)
  if (!person) throw new Error('useAccount() outside <AccessGate>')
  return person
}
