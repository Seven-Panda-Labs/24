import { TAG_STYLES } from '../domain/tags.ts'
import type { Tag } from '../domain/types.ts'

export default function TagChip({ tag, className = '' }: { tag: Tag; className?: string }) {
  return (
    <span className={`chip ${TAG_STYLES[tag.color].chip} ${className}`}>
      {tag.emoji && <span aria-hidden>{tag.emoji}</span>}
      {tag.name}
    </span>
  )
}
