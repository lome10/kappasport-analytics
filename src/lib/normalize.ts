import type {
  ColumnMapping,
  Dataset,
  DataPoint,
  MetricDefinition,
  Player,
} from '@/types/data'

function parseDate(raw: string): string | null {
  if (!raw) return null
  const cleaned = raw.trim()

  // ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    const d = new Date(cleaned)
    return isNaN(d.getTime()) ? null : cleaned.slice(0, 10)
  }

  // dd/mm/yyyy or dd-mm-yyyy (Italian format)
  const match = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (match) {
    const [, day, month, yearRaw] = match
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw
    const d = new Date(
      `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    )
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }

  // Fallback
  const d = new Date(cleaned)
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function toId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export interface NormalizeResult {
  dataset: Dataset
  warnings: string[]
}

export function normalize(
  rows: Record<string, string>[],
  mapping: ColumnMapping[]
): NormalizeResult {
  const warnings: string[] = []

  const playerCol = mapping.find((m) => m.role === 'player')?.columnName
  const dateCol = mapping.find((m) => m.role === 'date')?.columnName
  const sessionTypeCol = mapping.find((m) => m.role === 'sessionType')?.columnName
  const metricCols = mapping.filter((m) => m.role === 'metric')

  if (!playerCol) warnings.push('Nessuna colonna "Giocatore" selezionata.')
  if (!dateCol) warnings.push('Nessuna colonna "Data" selezionata.')

  const playersMap = new Map<string, Player>()
  const points: DataPoint[] = []
  let skippedRows = 0

  for (const row of rows) {
    const playerName = playerCol ? row[playerCol]?.trim() : undefined
    if (!playerName) {
      skippedRows++
      continue
    }

    const dateRaw = dateCol ? row[dateCol]?.trim() : undefined
    const dateStr = dateRaw ? parseDate(dateRaw) : null
    if (!dateStr) {
      skippedRows++
      continue
    }

    const playerId = toId(playerName)
    if (!playersMap.has(playerId)) {
      playersMap.set(playerId, { id: playerId, name: playerName })
    }

    const values: Record<string, number | null> = {}
    for (const col of metricCols) {
      const raw = row[col.columnName]?.trim()
      if (!raw || raw === '') {
        values[col.columnName] = null
        continue
      }
      const num = parseFloat(raw.replace(',', '.'))
      values[col.columnName] = isNaN(num) ? null : num
    }

    points.push({
      playerId,
      date: dateStr,
      sessionType:
        sessionTypeCol ? (row[sessionTypeCol]?.trim() || 'unknown') : 'unknown',
      values,
    })
  }

  if (skippedRows > 0) {
    warnings.push(
      `${skippedRows} rig${skippedRows === 1 ? 'a ignorata' : 'he ignorate'} (giocatore o data mancante/non valida).`
    )
  }

  // Deduplication: same playerId + date + sessionType
  const seen = new Set<string>()
  let dupes = 0
  const deduped = points.filter((p) => {
    const key = `${p.playerId}|${p.date}|${p.sessionType}`
    if (seen.has(key)) {
      dupes++
      return false
    }
    seen.add(key)
    return true
  })
  if (dupes > 0) {
    warnings.push(`${dupes} rig${dupes === 1 ? 'a duplicata rimossa' : 'he duplicate rimosse'}.`)
  }

  const metrics: MetricDefinition[] = metricCols.map((col) => ({
    key: col.columnName,
    label: col.metricLabel || col.columnName,
    unit: col.metricUnit || '',
    category: col.metricCategory || 'gps',
  }))

  const dates = deduped.map((p) => p.date).sort()

  return {
    dataset: {
      players: Array.from(playersMap.values()),
      metrics,
      points: deduped,
      dateRange: {
        from: dates[0] || '',
        to: dates[dates.length - 1] || '',
      },
    },
    warnings,
  }
}
