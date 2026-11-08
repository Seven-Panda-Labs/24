import { onAuthStateChanged, type User } from 'firebase/auth'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { auth } from '../services/firebase.ts'

const AuthContext = createContext<User | null | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
}

/** `undefined` while Firebase restores the session, `null` when signed out. */
export function useAuth(): User | null | undefined {
  return useContext(AuthContext)
}

export function useUser(): User {
  const user = useAuth()
  if (!user) throw new Error('useUser() needs a signed-in user')
  return user
}
