import { useTranslation } from 'react-i18next'
import { useAccount } from '../account/AccessGate.tsx'
import { decide, people } from '../data/people.ts'
import { useDocs } from '../data/useDocs.ts'
import { statusOf, type Person } from '../domain/types.ts'

const ORDER = { pending: 0, approved: 1, rejected: 2 }

/** The admin's list of accounts, those waiting first. */
export default function AccountsSettings() {
  const { t } = useTranslation()
  const me = useAccount()
  const everyone = useDocs<Person>('people', people) ?? []
  const sorted = [...everyone].sort(
    (a, b) => ORDER[statusOf(a)] - ORDER[statusOf(b)] || (a.name || a.email).localeCompare(b.name || b.email),
  )

  const reject = (person: Person) =>
    window.confirm(t('accounts.confirmReject', { name: person.name || person.email })) && decide(person, 'rejected')

  return (
    <section className="card flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold">{t('accounts.title')}</h2>
      <p className="text-sm text-foreground/70">{t('accounts.intro')}</p>
      <ul className="flex flex-col divide-y divide-foreground/10">
        {sorted.map((person) => {
          const status = statusOf(person)
          return (
            <li key={person.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 break-words">
                <span className="font-semibold">{person.name || person.email}</span>
                {person.name && <span className="text-foreground/70"> · {person.email}</span>}
                <span className="block text-xs text-foreground/70">
                  {t(`accounts.status.${status}`)}
                  {person.admin && ` · ${t('accounts.admin')}`}
                </span>
              </span>
              {/* Nobody can lock themselves out: their own row has no actions. */}
              {person.id !== me.id && status !== 'approved' && (
                <button type="button" className="btn-secondary" onClick={() => decide(person, 'approved')}>
                  {t('accounts.approve')}
                </button>
              )}
              {person.id !== me.id && status !== 'rejected' && (
                <button type="button" className="btn-ghost text-secondary" onClick={() => reject(person)}>
                  {t(status === 'approved' ? 'accounts.block' : 'accounts.reject')}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
