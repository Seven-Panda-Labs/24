export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

// index.html reads the same key before first paint, so a chosen theme does not flash.
const STORAGE_KEY = '24:theme'

export function storedTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    localStorage.removeItem(STORAGE_KEY)
    delete root.dataset.theme
  } else {
    localStorage.setItem(STORAGE_KEY, theme)
    root.dataset.theme = theme
  }
  // The browser bar follows the chosen theme too.
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const scheme = meta.dataset.scheme
    meta.media = theme === 'system' ? `(prefers-color-scheme: ${scheme})` : theme === scheme ? 'all' : 'not all'
  }
}
