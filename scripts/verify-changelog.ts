/**
 * Checks that package.json's version is the top entry of every changelog.
 * Usage: npm run check:changelog
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const CHANGELOGS = ['change-log.md', 'change-log.en.md', 'change-log.de.md', 'change-log.fr.md']

const { version } = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as { version: string }

let failed = false
for (const file of CHANGELOGS) {
  const top = readFileSync(resolve(ROOT, file), 'utf8').match(/^## \[([^\]]+)\]/m)?.[1]
  if (top !== version) {
    console.error(`${file}: top entry is "${top ?? 'missing'}", package.json is "${version}".`)
    failed = true
  }
}

if (failed) {
  console.error(`Add a ## [${version}] - YYYY-MM-DD section at the top of ${CHANGELOGS.join(', ')}.`)
  process.exit(1)
}
console.log(`Changelogs aligned with package.json (${version})`)
