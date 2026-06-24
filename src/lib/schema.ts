import type { ColumnMapping, ColumnRole, MetricCategory } from '@/types/data'

const SAMPLE_SIZE = 20

function sampleValues(rows: Record<string, string>[], header: string): string[] {
  return rows
    .slice(0, SAMPLE_SIZE)
    .map((r) => r[header] ?? '')
    .filter(Boolean)
}

function isDateLike(values: string[]): boolean {
  if (values.length === 0) return false
  const parsed = values.map((v) => {
    const normalized = v.replace(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/, '$3-$2-$1')
    return !isNaN(Date.parse(normalized))
  })
  return parsed.filter(Boolean).length / values.length > 0.7
}

function isNumeric(values: string[]): boolean {
  if (values.length === 0) return false
  const nums = values.map(
    (v) => v.trim() !== '' && !isNaN(parseFloat(v.replace(',', '.')))
  )
  return nums.filter(Boolean).length / values.length > 0.7
}

function isLowCardinality(values: string[], maxUnique = 6): boolean {
  const unique = new Set(values.filter(Boolean))
  return unique.size > 0 && unique.size <= maxUnique && values.length > unique.size
}

function inferColumnRole(header: string, values: string[]): ColumnRole {
  const h = header.toLowerCase().trim()

  if (/\b(giocator[ei]?|player|nome|name|atleta|athlete|cognome|surname)\b/i.test(h))
    return 'player'

  if (/\b(data|date|giorno|day|datum)\b/i.test(h) || isDateLike(values))
    return 'date'

  if (/\b(tipo|type|sessione|session|categoria|category|fase|phase|modality)\b/i.test(h))
    return 'sessionType'

  if (isNumeric(values)) return 'metric'

  if (isLowCardinality(values)) return 'sessionType'

  return 'ignore'
}

export function inferMetricCategory(header: string): MetricCategory {
  const h = header.toLowerCase()
  if (
    /\b(rpe|carico|acwr|monoton|strain|hrv|hr|heart|fc|bpm|perceived|sforzo|load|tl)\b/i.test(
      h
    )
  )
    return 'workload'
  if (
    /\b(salto|jump|sj|cmj|test|sprint.*test|test.*sprint|forza|force|rm|rep|vj|vo2|fms)\b/i.test(
      h
    )
  )
    return 'test'
  return 'gps'
}

export function inferMappings(
  headers: string[],
  rows: Record<string, string>[]
): ColumnMapping[] {
  return headers.map((columnName) => {
    const values = sampleValues(rows, columnName)
    const role = inferColumnRole(columnName, values)
    const mapping: ColumnMapping = { columnName, role }
    if (role === 'metric') {
      mapping.metricLabel = columnName
      mapping.metricUnit = ''
      mapping.metricCategory = inferMetricCategory(columnName)
    }
    return mapping
  })
}
