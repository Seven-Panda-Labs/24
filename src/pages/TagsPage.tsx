import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import TagChip from '../components/TagChip.tsx'
import { deleteTag, newTagId, saveTag } from '../data/tags.ts'
import { TAG_STYLES } from '../domain/tags.ts'
import { TAG_COLORS, type Tag } from '../domain/types.ts'
import { useWorkspace } from '../workspace/WorkspaceContext.tsx'

export default function TagsPage() {
  const { t } = useTranslation()
  const { workspace, tags } = useWorkspace()
  const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name))

  function add() {
    saveTag(workspace.id, { id: newTagId(workspace.id), name: t('tags.newName'), color: 'red', emoji: '🎁' })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link to="/settings" className="text-sm text-foreground/60">
        ← {t('settings.title')}
      </Link>
      <h1 className="font-display text-3xl font-bold text-primary">{t('tags.title')}</h1>
      <p className="text-sm text-foreground/70">{t('tags.intro')}</p>

      <ul className="flex flex-col gap-3">
        {sorted.map((tag) => (
          <TagRow key={tag.id} tag={tag} onChange={(next) => saveTag(workspace.id, next)} onDelete={() => deleteTag(workspace.id, tag.id)} />
        ))}
      </ul>

      <button type="button" onClick={add} className="btn-secondary self-start">
        + {t('tags.add')}
      </button>
    </div>
  )
}

function TagRow({ tag, onChange, onDelete }: { tag: Tag; onChange: (tag: Tag) => void; onDelete: () => void }) {
  const { t } = useTranslation()

  return (
    <li className="card flex flex-col gap-3 py-4">
      <div className="flex items-center gap-2">
        <TagChip tag={tag} className="text-sm" />
        <span className="flex-1" />
        <button
          type="button"
          className="btn-ghost text-secondary"
          onClick={() => window.confirm(t('tags.confirmDelete', { name: tag.name })) && onDelete()}
        >
          {t('tags.delete')}
        </button>
      </div>
      <div className="flex gap-2">
        <label className="w-20">
          <span className="sr-only">{t('tags.emoji')}</span>
          <input
            key={tag.emoji}
            defaultValue={tag.emoji}
            maxLength={8}
            aria-label={t('tags.emoji')}
            onBlur={(event) => event.target.value !== tag.emoji && onChange({ ...tag, emoji: event.target.value.trim() })}
            className="input text-center"
          />
        </label>
        <label className="flex-1">
          <span className="sr-only">{t('tags.name')}</span>
          <input
            key={tag.name}
            defaultValue={tag.name}
            maxLength={40}
            aria-label={t('tags.name')}
            onBlur={(event) => {
              const name = event.target.value.trim()
              if (name && name !== tag.name) onChange({ ...tag, name })
            }}
            className="input"
          />
        </label>
      </div>
      <div role="radiogroup" aria-label={t('tags.color')} className="flex flex-wrap gap-2">
        {TAG_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={tag.color === color}
            aria-label={t(`tags.colors.${color}`)}
            onClick={() => onChange({ ...tag, color })}
            className={`h-8 w-8 rounded-full border-2 ${TAG_STYLES[color].chip} aria-checked:ring-2 aria-checked:ring-primary aria-checked:ring-offset-2`}
          />
        ))}
      </div>
    </li>
  )
}
