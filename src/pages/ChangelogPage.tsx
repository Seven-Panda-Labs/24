import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadChangelog, parseChangelog, type Release } from '../changelog.ts'

export default function ChangelogPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'pt-PT'
  const [releases, setReleases] = useState<Release[]>([])

  useEffect(() => {
    let current = true
    void loadChangelog(language).then((markdown) => current && setReleases(parseChangelog(markdown)))
    return () => {
      current = false
    }
  }, [language])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-3xl font-bold text-primary">{t('changelog.title')}</h1>
      {releases.map((release) => (
        <section key={release.version} id={release.version} className="card flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">
            {release.version}{' '}
            <span className="font-sans text-sm font-normal text-foreground/70">
              · {new Date(release.date).toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </span>
          </h2>
          {release.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="list-disc pl-5 text-sm">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
