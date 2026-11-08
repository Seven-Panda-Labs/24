import ExcelJS from 'exceljs'
import { expect, it } from 'vitest'
import { parseWorkbook } from './excel.ts'

function fill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

it('reads one calendar per year sheet with gifts, colour tags and notes', async () => {
  const source = new ExcelJS.Workbook()
  const sheet = source.addWorksheet('2023')
  sheet.getCell('A1').value = 'Meias de lã '
  sheet.getCell('C1').fill = fill('FFCCCCCC')
  sheet.getCell('A2').value = 'Chocolate'
  sheet.getCell('C2').fill = fill('FFFFE599')
  sheet.getCell('A2').note = 'comprar no mercado'
  sheet.getCell('A4').value = 'Vela'
  sheet.getCell('C4').fill = fill('FF00FF00')
  sheet.getCell('A25').value = 'Em falta:'
  source.addWorksheet('Ideias').getCell('A1').value = 'not a year'
  source.addWorksheet('2021').getCell('A1').value = 'Puzzle'

  // Round-trip through the file format, as the import script reads a real file.
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await source.xlsx.writeBuffer())

  expect(parseWorkbook(workbook)).toEqual([
    { year: 2021, days: [{ day: 1, gift: 'Puzzle', tagIds: [], notes: '' }], unreadNotes: [] },
    {
      year: 2023,
      days: [
        { day: 1, gift: 'Meias de lã', tagIds: ['clothes'], notes: '' },
        { day: 2, gift: 'Chocolate', tagIds: ['sweets'], notes: 'comprar no mercado' },
        { day: 4, gift: 'Vela', tagIds: [], notes: '' },
      ],
      unreadNotes: [],
    },
  ])
})
