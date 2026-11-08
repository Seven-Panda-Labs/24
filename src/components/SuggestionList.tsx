import { useTranslation } from 'react-i18next'
import type { Suggestion } from '../suggestions/engine.ts'

export default function SuggestionList({
  suggestions,
  onApply,
  onDismiss,
}: {
  suggestions: Suggestion[]
  onApply: (suggestion: Suggestion) => void
  onDismiss: (suggestion: Suggestion) => void
}) {
  const { t } = useTranslation()

  function reason(suggestion: Suggestion): string {
    if (suggestion.kind === 'tradition') return t('suggestions.tradition', { count: suggestion.years.length, year: suggestion.years[0] })
    if (suggestion.kind === 'forgotten') return t('suggestions.forgotten', { year: suggestion.years[0] })
    return t(`suggestions.${suggestion.kind}`)
  }

  return (
    <section aria-labelledby="suggestions-title" className="flex flex-col gap-2 rounded-2xl bg-accent/15 p-3">
      <h3 id="suggestions-title" className="text-sm font-bold">
        ✨ {t('suggestions.title')}
      </h3>
      <ul className="flex flex-col gap-1.5">
        {suggestions.map((suggestion) => (
          <li key={suggestion.gift} className="flex items-center gap-1 rounded-xl bg-background pl-3">
            <button type="button" onClick={() => onApply(suggestion)} className="flex flex-1 flex-col py-2 text-left">
              <span className="font-semibold">{suggestion.gift}</span>
              <span className="text-xs text-foreground/60">{reason(suggestion)}</span>
            </button>
            <button
              type="button"
              onClick={() => onDismiss(suggestion)}
              aria-label={t('suggestions.dismiss', { gift: suggestion.gift })}
              className="btn-ghost px-3"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
