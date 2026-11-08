import type { Cell, Workbook } from 'exceljs'

/**
 * Fill colour of column C to tag id, as described in the brief (yellow =
 * sweets, grey = clothes, blue = home). The ids are the default tags of
 * src/domain/tags.ts.
 */
export const COLOR_TAGS: Record<string, string> = {
  FFE599: 'sweets',
  CCCCCC: 'clothes',
  '4A86E8': 'home',
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
 * a colour in column C, a note on A. Rows past 31, empty rows and the
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
        const tag = COLOR_TAGS[fillColor(sheet.getCell(row, 3))]
        const notes = noteText(giftCell)
        if (giftCell.note && !notes) unreadNotes.push(row)
        days.push({ day: row, gift, tagIds: tag ? [tag] : [], notes })
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
