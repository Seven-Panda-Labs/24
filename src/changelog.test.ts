import { expect, it } from 'vitest'
import { parseChangelog } from './changelog.ts'

it('splits the changelog into releases, sections and items', () => {
  const markdown = [
    '# Changelog',
    '',
    '## [0.2.0] - 2026-11-08',
    '',
    '### Added',
    '',
    '- Bags.',
    '- Themes.',
    '',
    '### Fixed',
    '',
    '- A stuck splash.',
    '',
    '## [0.1.0] - 2026-11-01',
    '',
    '### Added',
    '',
    '- Calendars.',
  ].join('\n')

  expect(parseChangelog(markdown)).toEqual([
    {
      version: '0.2.0',
      date: '2026-11-08',
      sections: [
        { title: 'Added', items: ['Bags.', 'Themes.'] },
        { title: 'Fixed', items: ['A stuck splash.'] },
      ],
    },
    { version: '0.1.0', date: '2026-11-01', sections: [{ title: 'Added', items: ['Calendars.'] }] },
  ])
})
