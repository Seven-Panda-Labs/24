import type { Cell, Workbook } from 'exceljs'
import type { TagColor } from '../src/domain/types.ts'

/**
 * Column C is the colour of the bag each gift goes in. Bags alternate by day so
 * neighbouring gifts look different; they are not gift categories. The import
 * script adds to each calendar the ones its days use.
 */
export const BAG_TAGS: Record<string, { id: string; name: string; color: TagColor }> = {
  CCCCCC: { id: 'bag-grey', name: 'Saco Cinza', color: 'slate' },
  FFE599: { id: 'bag-yellow', name: 'Saco Amarelo', color: 'amber' },
  '4A86E8': { id: 'bag-blue', name: 'Saco Azul', color: 'sky' },
}

export interface ImportedDay {
  day: number
  gift: string
  tagIds: string[]
  notes: string
}

export interface ImportedCalendar {
  year: number
  days: ImportedDay[]
  /**
   * Days with a comment exceljs found but could not read: it drops text written
   * as a bare <t> without rich-text runs, which is how Google Sheets exports
   * them. The import script lists these so they can be copied by hand.
   */
  unreadNotes: number[]
}

/**
 * One sheet per year, named after it. Row N is day N: the gift in column A,
 * the bag colour in column C, a note on A. Rows past 31, empty rows and the
 * "Em falta:" total at the bottom are skipped.
 */
export function parseWorkbook(workbook: Workbook): ImportedCalendar[] {
  return workbook.worksheets
    .filter((sheet) => /^\d{4}$/.test(sheet.name.trim()))
    .map((sheet) => {
      const days: ImportedDay[] = []
      const unreadNotes: number[] = []
      for (let row = 1; row <= 31; row++) {
        const giftCell = sheet.getCell(row, 1)
        const gift = giftCell.text.trim()
        if (!gift || /^em falta/i.test(gift)) continue
        const bag = BAG_TAGS[fillColor(sheet.getCell(row, 3))]
        const notes = noteText(giftCell)
        if (giftCell.note && !notes) unreadNotes.push(row)
        days.push({ day: row, gift, tagIds: bag ? [bag.id] : [], notes })
      }
      return { year: Number(sheet.name.trim()), days, unreadNotes }
    })
    .sort((a, b) => a.year - b.year)
}

function fillColor(cell: Cell): string {
  const fill = cell.fill
  if (fill?.type !== 'pattern') return ''
  return (fill.fgColor?.argb ?? '').slice(-6).toUpperCase()
}

function noteText(cell: Cell): string {
  const note = cell.note
  if (!note) return ''
  const text = typeof note === 'string' ? note : (note.texts ?? []).map((part) => part.text).join('')
  return text.trim()
}
