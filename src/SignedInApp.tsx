import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import CalendarFormPage from './pages/CalendarFormPage.tsx'
import CalendarPage from './pages/CalendarPage.tsx'
import ChangelogPage from './pages/ChangelogPage.tsx'
import HistoryPage from './pages/HistoryPage.tsx'
import HomePage from './pages/HomePage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import ShoppingPage from './pages/ShoppingPage.tsx'
import TagsPage from './pages/TagsPage.tsx'
import { WorkspaceGate } from './workspace/WorkspaceContext.tsx'

export default function SignedInApp() {
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
          <Route path="changelog" element={<ChangelogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </WorkspaceGate>
  )
}
