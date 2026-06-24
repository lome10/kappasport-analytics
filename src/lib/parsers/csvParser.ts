import Papa from 'papaparse'
import type { ParseResult } from '@/types/data'

/** Auto-detects delimiter (handles both ',' and ';' Italian exports). */
export async function parseCSV(file: File): Promise<ParseResult> {
  // Read a small sample to detect delimiter
  const sample = await file.slice(0, 4096).text()
  const semicolons = (sample.match(/;/g) ?? []).length
  const commas = (sample.match(/,/g) ?? []).length
  const delimiter = semicolons > commas ? ';' : ','

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (value) => value.trim(),
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
