import type {
  ColumnMapping,
  Dataset,
  DataPoint,
  MetricDefinition,
  Player,
} from '@/types/data'

// ── Date parsing ──────────────────────────────────────────────────────────────

function parseDate(raw: string): string | null {
  if (!raw) return null
  const s = raw.trim().split(' ')[0] // strip time part if present

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : s.slice(0, 10)
  }
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (m) {
    const [, day, month, y] = m
    const year = y.length === 2 ? `20${y}` : y
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

/** "4:32" → 272 seconds. Returns null if not parseable. */
function parseTimeToSeconds(raw: string): number | null {
  const m = raw.trim().match(/^(\d+):(\d{2})$/)
  if (!m) return null
  return parseInt(m[1]) * 60 + parseInt(m[2])
}

function toId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function parseNumeric(raw: string): number | null {
  if (!raw || raw.trim() === '') return null
  const n = parseFloat(raw.replace(',', '.'))
  return isNaN(n) ? null : n
}

// ── Team Average detection ────────────────────────────────────────────────────

const TEAM_AVG_LABELS = ['team average', 'team avg', 'squadra media', 'media squadra']

function isTeamAverageName(name: string): boolean {
  return TEAM_AVG_LABELS.includes(name.toLowerCase().trim())
}

// ── Public ────────────────────────────────────────────────────────────────────

export interface NormalizeResult {
  dataset: Dataset
  warnings: string[]
}

export function normalize(
  rows: Record<string, string>[],
  mapping: ColumnMapping[]
): NormalizeResult {
  const warnings: string[] = []

  const playerCol    = mapping.find((m) => m.role === 'player')?.columnName
  const dateCol      = mapping.find((m) => m.role === 'date')?.columnName
  const sessionCol   = mapping.find((m) => m.role === 'sessionType')?.columnName
  const exerciseCol  = mapping.find((m) => m.role === 'exercise')?.columnName
  const ampmCol      = mapping.find((m) => m.role === 'ampm')?.columnName
  const cycleCol     = mapping.find((m) => m.role === 'matchCycle')?.columnName
  const metricCols   = mapping.filter((m) => m.role === 'metric')

  if (!playerCol) warnings.push('Nessuna colonna "Giocatore" selezionata.')
  if (!dateCol)   warnings.push('Nessuna colonna "Data" selezionata.')

  const playersMap   = new Map<string, Player>()
  const points:       DataPoint[] = []
  const teamAvgPoints: DataPoint[] = []
  let skipped = 0

  for (const row of rows) {
    const rawName = playerCol ? row[playerCol]?.trim() : undefined
    if (!rawName) { skipped++; continue }

    const rawDate = dateCol ? row[dateCol]?.trim() : undefined
    const date    = rawDate ? parseDate(rawDate) : null
    if (!date) { skipped++; continue }

    const isTA = isTeamAverageName(rawName)
    const playerId = isTA ? '__team_average__' : toId(rawName)

    if (!isTA && !playersMap.has(playerId)) {
      playersMap.set(playerId, { id: playerId, name: rawName })
    }

    const values: Record<string, number | null> = {}
    for (const col of metricCols) {
      const raw = row[col.columnName]?.trim() ?? ''
      if (col.isTimeFormat) {
        values[col.columnName] = parseTimeToSeconds(raw)
      } else {
        values[col.columnName] = parseNumeric(raw)
      }
    }

    const point: DataPoint = {
      playerId,
      date,
      sessionType: sessionCol ? (row[sessionCol]?.trim() || 'unknown') : 'unknown',
      values,
      ...(isTA         && { isTeamAverage: true }),
      ...(exerciseCol  && { exercise:   row[exerciseCol]?.trim()  || undefined }),
      ...(ampmCol      && { ampm:        row[ampmCol]?.trim()     || undefined }),
      ...(cycleCol     && { matchCycle:  row[cycleCol]?.trim()    || undefined }),
    }

    if (isTA) {
      teamAvgPoints.push(point)
    } else {
      points.push(point)
    }
  }

  if (skipped > 0) {
    warnings.push(
      `${skipped} rig${skipped === 1 ? 'a ignorata' : 'he ignorate'} (giocatore o data mancante/non valida).`
    )
  }

  // Deduplication key includes exercise to preserve drill-level granularity
  const seen = new Set<string>()
  let dupes = 0
  const deduped = points.filter((p) => {
    const key = `${p.playerId}|${p.date}|${p.sessionType}|${p.exercise ?? ''}|${p.ampm ?? ''}`
    if (seen.has(key)) { dupes++; return false }
    seen.add(key)
    return true
  })
  if (dupes > 0) {
    warnings.push(`${dupes} rig${dupes === 1 ? 'a duplicata rimossa' : 'he duplicate rimosse'}.`)
  }

  const metrics: MetricDefinition[] = metricCols.map((col) => ({
    key:         col.columnName,
    label:       col.metricLabel  || col.columnName,
    unit:        col.metricUnit   || (col.isTimeFormat ? 's' : ''),
    category:    col.metricCategory  || 'gps',
    aggregation: col.metricAggregation || 'avg',
  }))

  const dates = deduped.map((p) => p.date).sort()

  return {
    dataset: {
      players:     Array.from(playersMap.values()),
      metrics,
      points:      deduped,
      teamAverage: teamAvgPoints.length > 0 ? teamAvgPoints : undefined,
      dateRange: {
        from: dates[0] ?? '',
        to:   dates[dates.length - 1] ?? '',
      },
    },
    warnings,
  }
}
