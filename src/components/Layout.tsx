import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { version } from '../../package.json'
import { useWorkspace } from '../workspace/WorkspaceContext.tsx'
import Logo from './Logo.tsx'
import StatusBanner from './StatusBanner.tsx'

const NAV = [
  { to: '/', key: 'calendars', icon: '🎄', end: true },
  { to: '/shopping', key: 'shopping', icon: '🛍️', end: false },
  { to: '/history', key: 'history', icon: '📜', end: false },
  { to: '/settings', key: 'settings', icon: '⚙️', end: false },
] as const

export default function Layout() {
  const { t } = useTranslation()
  const { workspace } = useWorkspace()

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
      <header className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <NavLink to="/" className="shrink-0">
          <Logo size={36} alt="24" />
        </NavLink>
        <span className="truncate text-sm text-foreground/70">{workspace.name}</span>
        <nav className="ml-auto hidden gap-1 sm:flex" aria-label={t('nav.label')}>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="btn-ghost aria-[current=page]:bg-primary/10 aria-[current=page]:text-primary">
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
      </header>

      <StatusBanner />

      <main className="flex-1 px-4 pt-2 pb-6">
        <Outlet />
      </main>

      <footer className="px-4 pb-28 text-center text-xs text-foreground/70 sm:pb-8">
        24 ·{' '}
        <Link to="/changelog" aria-label={t('footer.changelog', { version })} className="font-semibold underline-offset-2 hover:underline">
          v{version}
        </Link>
      </footer>

      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-foreground/10 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-foreground/70 aria-[current=page]:text-primary"
          >
            <span aria-hidden className="text-xl">
              {item.icon}
            </span>
            {t(`nav.${item.key}`)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
