import Papa from 'papaparse'
import type { ParseResult } from '@/types/data'

export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const fatal = result.errors.filter(
          (e) => e.type === 'Delimiter' || e.type === 'Quotes'
        )
        if (fatal.length > 0) {
          reject(new Error(fatal[0].message))
          return
        }
        resolve({
          headers: result.meta.fields ?? [],
          rows: result.data,
        })
      },
      error: (err) => reject(new Error(err.message)),
    })
  })
}
