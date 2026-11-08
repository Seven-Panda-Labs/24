import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext.tsx'
import Layout from './components/Layout.tsx'
import Splash from './components/Splash.tsx'
import CalendarFormPage from './pages/CalendarFormPage.tsx'
import CalendarPage from './pages/CalendarPage.tsx'
import HistoryPage from './pages/HistoryPage.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import ShoppingPage from './pages/ShoppingPage.tsx'
import TagsPage from './pages/TagsPage.tsx'
import { WorkspaceGate } from './workspace/WorkspaceContext.tsx'

export default function App() {
  const user = useAuth()
  if (user === undefined) return <Splash />
  if (user === null) return <LoginPage />

  return (
    <WorkspaceGate>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="calendars/new" element={<CalendarFormPage />} />
          <Route path="calendars/:id" element={<CalendarPage />} />
          <Route path="calendars/:id/edit" element={<CalendarFormPage />} />
          <Route path="shopping" element={<ShoppingPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </WorkspaceGate>
  )
}
