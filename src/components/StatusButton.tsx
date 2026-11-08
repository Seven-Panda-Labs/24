import { useTranslation } from 'react-i18next'
import type { Status } from '../domain/types.ts'

export default function StatusButton({ status, onAdvance }: { status: Status; onAdvance: () => void }) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onAdvance}
      disabled={status === 'wrapped'}
      title={status === 'wrapped' ? undefined : t('day.advance')}
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${
        status === 'planned' ? 'bg-foreground/10' : status === 'bought' ? 'bg-accent/30 text-carvao' : 'bg-primary text-background'
      }`}
    >
      {t(`status.${status}`)}
    </button>
  )
}
