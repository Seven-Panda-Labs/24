export interface Release {
  version: string
  date: string
  sections: { title: string; items: string[] }[]
}

// The changelogs only use "## [version] - date", "### Section" and "- item" lines
// (scripts/verify-changelog.ts checks the top entry), so no Markdown library.
export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = []
  for (const line of markdown.split('\n')) {
    const release = /^## \[([^\]]+)\] - (\S+)/.exec(line)
    if (release) releases.push({ version: release[1], date: release[2], sections: [] })
    else if (line.startsWith('### ')) releases.at(-1)?.sections.push({ title: line.slice(4).trim(), items: [] })
    else if (line.startsWith('- ')) releases.at(-1)?.sections.at(-1)?.items.push(line.slice(2).trim())
  }
  return releases
}

const CHANGELOGS: Record<string, () => Promise<{ default: string }>> = {
  'pt-PT': () => import('../change-log.md?raw'),
  en: () => import('../change-log.en.md?raw'),
  de: () => import('../change-log.de.md?raw'),
  fr: () => import('../change-log.fr.md?raw'),
}

export function loadChangelog(language: string): Promise<string> {
  return (CHANGELOGS[language] ?? CHANGELOGS['pt-PT'])().then((module) => module.default)
}
