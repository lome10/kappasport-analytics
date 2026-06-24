import * as XLSX from 'xlsx'
import type { ParseResult } from '@/types/data'

export function getSheetNames(buffer: ArrayBuffer): string[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  return wb.SheetNames
}

export function parseSheet(buffer: ArrayBuffer, sheetName: string): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = wb.Sheets[sheetName]

  if (!ws) throw new Error(`Foglio "${sheetName}" non trovato nel file.`)

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    raw: false,
    dateNF: 'yyyy-mm-dd',
    defval: '',
  })

  if (json.length === 0) return { headers: [], rows: [] }

  const headers = Object.keys(json[0]).map((h) => String(h).trim())
  const rows = json.map((row) =>
    Object.fromEntries(headers.map((h) => [h, String(row[h] ?? '')]))
  )

  return { headers, rows }
}
