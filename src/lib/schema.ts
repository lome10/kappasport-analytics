import type { ColumnMapping, ColumnRole, MetricCategory } from '@/types/data'

const SAMPLE_SIZE = 30

function sample(rows: Record<string, string>[], header: string): string[] {
  return rows
    .slice(0, SAMPLE_SIZE)
    .map((r) => r[header] ?? '')
    .filter(Boolean)
}

function isDateLike(values: string[]): boolean {
  if (!values.length) return false
  const ok = values.map((v) => {
    const n = v.replace(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/, '$3-$2-$1')
    return !isNaN(Date.parse(n))
  })
  return ok.filter(Boolean).length / values.length > 0.7
}

function isNumeric(values: string[]): boolean {
  if (!values.length) return false
  const ok = values.map(
    (v) => v.trim() !== '' && !isNaN(parseFloat(v.replace(',', '.')))
  )
  return ok.filter(Boolean).length / values.length > 0.7
}

function isTimeLike(values: string[]): boolean {
  if (!values.length) return false
  const timeRe = /^\d+:\d{2}$/
  const ok = values.filter((v) => timeRe.test(v.trim()))
  return ok.length / values.length > 0.5
}

function isLowCardinality(values: string[], max = 6): boolean {
  const u = new Set(values.filter(Boolean))
  return u.size > 0 && u.size <= max && values.length > u.size
}

// ── KappaSport format detection ───────────────────────────────────────────────

const KS_DIMENSION_MAP: Record<string, Partial<ColumnMapping>> = {
  Giocatore:       { role: 'player' },
  Atleta:          { role: 'player' },
  Data:            { role: 'date' },
  'AM/PM':         { role: 'ampm' },
  Categoria:       { role: 'sessionType' },
  Esercizio:       { role: 'exercise' },
  'Ciclo Gara':    { role: 'matchCycle' },
  Ruolo:           { role: 'metadata' },
  Squadra:         { role: 'ignore' },
  'n.maglia':      { role: 'metadata' },
  Sessione:        { role: 'ignore' },
  'Giorno settimana': { role: 'ignore' },
  'IN/OUT':        { role: 'ignore' },
  Torneo:          { role: 'ignore' },
  'Casa/Trasferta': { role: 'ignore' },
  Esito:           { role: 'ignore' },
  Gara:            { role: 'ignore' },
  Avversario:      { role: 'ignore' },
  'Giorni prima/dopo la gara': { role: 'ignore' },
  Colonna1:        { role: 'ignore' },
  Colonna2:        { role: 'ignore' },
  Colonna3:        { role: 'ignore' },
  Colonna4:        { role: 'ignore' },
  Colonna5:        { role: 'ignore' },
  'DRILL PROGRESSIVO': { role: 'ignore' },
  'DATA/AMPM':     { role: 'ignore' },
}

const KS_MARKERS = ['Esercizio', 'Ciclo Gara', 'AM/PM', 'Categoria']

export function isKappaSportFormat(headers: string[]): boolean {
  const h = new Set(headers.map((s) => s.trim()))
  return KS_MARKERS.filter((m) => h.has(m)).length >= 3
}

// ── Category inference ────────────────────────────────────────────────────────

export function inferMetricCategory(header: string): MetricCategory {
  const h = header.toLowerCase()
  if (/\b(hr|fc|heart|cardio|z[345]|zona|%hr|bpm|hravg|hrmax|%hravg|%hrmax)\b/i.test(h))
    return 'hr'
  if (/\b(rpe|carico|acwr|monoton|strain|hrv|load|tl|training.load|minutaggio|t_mphi)\b/i.test(h))
    return 'workload'
  if (/\b(salto|jump|sj|cmj|test|forza|force|rm|vj|vo2|fms)\b/i.test(h))
    return 'test'
  return 'gps'
}

/** Volume metrics (distance, counts) → sum; intensity metrics → avg or max. */
function inferAggregation(header: string): 'sum' | 'avg' | 'max' {
  const h = header.toLowerCase()
  if (/\b(distanza|distance|dist|n°|numero|count|sprint|events|acc|dec|energy|an index|dist.eq)\b/i.test(h))
    return 'sum'
  if (/\b(max|massim|peak|vmax|velmax|vel max|mpmax)\b/i.test(h))
    return 'max'
  return 'avg'
}

// ── Generic inference ─────────────────────────────────────────────────────────

function inferColumnRole(header: string, values: string[]): ColumnRole {
  const h = header.toLowerCase().trim()
  if (/\b(giocator[ei]?|player|atleta|athlete|nome|name|cognome|surname)\b/i.test(h))
    return 'player'
  if (/\b(data|date|giorno|day|datum)\b/i.test(h) || isDateLike(values))
    return 'date'
  if (/\b(tipo|type|sessione|session|categoria|category|fase|phase|modality)\b/i.test(h))
    return 'sessionType'
  if (isTimeLike(values)) return 'metric'   // mm:ss cols are still metrics (seconds)
  if (isNumeric(values)) return 'metric'
  if (isLowCardinality(values)) return 'sessionType'
  return 'ignore'
}

// ── Public API ────────────────────────────────────────────────────────────────

export function inferMappings(
  headers: string[],
  rows: Record<string, string>[],
  forceKappaSport = false
): ColumnMapping[] {
  const useKS = forceKappaSport || isKappaSportFormat(headers)

  return headers.map((columnName) => {
    const trimmed = columnName.trim()

    // KappaSport known dimensions
    if (useKS && KS_DIMENSION_MAP[trimmed]) {
      return { columnName, ...KS_DIMENSION_MAP[trimmed] } as ColumnMapping
    }

    const values = sample(rows, columnName)
    const timeCol = isTimeLike(values)
    const role = inferColumnRole(trimmed, values)

    if (role === 'metric') {
      return {
        columnName,
        role: 'metric',
        metricLabel: trimmed,
        metricUnit: timeCol ? 's' : '',
        metricCategory: inferMetricCategory(trimmed),
        metricAggregation: timeCol ? 'sum' : inferAggregation(trimmed),
        isTimeFormat: timeCol,
      }
    }

    return { columnName, role }
  })
}
