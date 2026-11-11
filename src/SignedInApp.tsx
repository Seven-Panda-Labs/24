import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CalendarsGate } from './calendars/CalendarsContext.tsx'
import Layout from './components/Layout.tsx'
import CalendarFormPage from './pages/CalendarFormPage.tsx'
import CalendarPage from './pages/CalendarPage.tsx'
import ChangelogPage from './pages/ChangelogPage.tsx'
import HistoryPage from './pages/HistoryPage.tsx'
import HomePage from './pages/HomePage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import SharePage from './pages/SharePage.tsx'
import ShoppingPage from './pages/ShoppingPage.tsx'
import TagsPage from './pages/TagsPage.tsx'

export default function SignedInApp() {
  return (
    <CalendarsGate>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="calendars/new" element={<CalendarFormPage />} />
          <Route path="calendars/:id" element={<CalendarPage />} />
          <Route path="calendars/:id/edit" element={<CalendarFormPage />} />
          <Route path="calendars/:id/share" element={<SharePage />} />
          <Route path="calendars/:id/tags" element={<TagsPage />} />
          <Route path="todo" element={<ShoppingPage />} />
          <Route path="shopping" element={<OldShopping />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="changelog" element={<ChangelogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </CalendarsGate>
  )
}

/** Reminders already sent and saved links still open /shopping, with its ?year=. */
function OldShopping() {
  const { search } = useLocation()
  return <Navigate to={`/todo${search}`} replace />
}
