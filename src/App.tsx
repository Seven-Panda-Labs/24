import { lazy, Suspense } from 'react'
import { useAuth } from './auth/AuthContext.tsx'
import Splash from './components/Splash.tsx'
import LoginPage from './pages/LoginPage.tsx'

// Firestore and Storage load with the signed-in app, not on the sign-in page.
const SignedInApp = lazy(() => import('./SignedInApp.tsx'))

export default function App() {
  const user = useAuth()
  if (user === undefined) return <Splash />
  if (user === null) return <LoginPage />

  return (
    <Suspense fallback={<Splash />}>
      <SignedInApp />
    </Suspense>
  )
}
