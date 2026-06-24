import type { DataPoint } from '@/types/data'

// ── Basic aggregators ────────────────────────────────────────────────────────

export function avg(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null && !isNaN(v))
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

export function sum(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null && !isNaN(v))
  return nums.length ? nums.reduce((a, b) => a + b, 0) : null
}

export function playerMetricAvg(
  points: DataPoint[],
  playerId: string,
  metricKey: string
): number | null {
  return avg(
    points.filter((p) => p.playerId === playerId).map((p) => p.values[metricKey] ?? null)
  )
}

export function groupMetricAvg(points: DataPoint[], metricKey: string): number | null {
  return avg(points.map((p) => p.values[metricKey] ?? null))
}

export function percentChange(
  current: number | null,
  previous: number | null
): number | null {
  if (current === null || previous === null || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

// ── Time series helpers ──────────────────────────────────────────────────────

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = values.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - 1))
}

/** Parametric moving average; returns one value per input element. */
export function movingAverage(
  series: (number | null)[],
  window: number
): (number | null)[] {
  return series.map((_, i) => {
    const start = Math.max(0, i - window + 1)
    const nums = series
      .slice(start, i + 1)
      .filter((v): v is number => v !== null && !isNaN(v))
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
  })
}

/** Build a per-date aggregated time series for one player × one metric. */
export function playerTimeSeries(
  points: DataPoint[],
  playerId: string,
  metricKey: string
): { date: string; value: number | null }[] {
  const byDate = new Map<string, number[]>()
  for (const p of points) {
    if (p.playerId !== playerId) continue
    const v = p.values[metricKey]
    if (v !== null && !isNaN(v)) {
      if (!byDate.has(p.date)) byDate.set(p.date, [])
      byDate.get(p.date)!.push(v)
    }
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      value: vals.reduce((a, b) => a + b, 0) / vals.length,
    }))
}

export interface BaselineStats {
  mean: number
  std: number
  count: number
}

/** Baseline mean+std computed from ALL raw data for a player (not filtered). */
export function playerBaselineStats(
  rawPoints: DataPoint[],
  playerId: string,
  metricKey: string
): BaselineStats | null {
  const values = rawPoints
    .filter((p) => p.playerId === playerId)
    .map((p) => p.values[metricKey])
    .filter((v): v is number => v !== null && !isNaN(v))
  if (values.length < 3) return null
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return { mean, std: stdDev(values), count: values.length }
}

export function zScore(value: number, baseline: BaselineStats): number | null {
  if (baseline.std === 0) return null
  return (value - baseline.mean) / baseline.std
}

// ── ACWR / Workload ──────────────────────────────────────────────────────────

export interface ACWRResult {
  acute: number        // sum of load in last 7 days
  chronic: number      // mean weekly load over last 4 weeks
  acwr: number | null  // acute / chronic
  monotony: number | null
  strain: number | null
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Computes ACWR for a player on a specific metricKey as of endDate.
 * Uses the provided rawPoints (unfiltered by date) for historical context.
 *
 * Formula (Foster 2001 / Gabbett 2016):
 *   Acute  = Σ load last 7 days
 *   Chronic = mean(Σ weekly load weeks 1-4)
 *   ACWR   = Acute / Chronic
 *   Monotony = mean(daily loads last 7d) / std(daily loads last 7d)
 *   Strain   = Acute × Monotony
 */
export function computeACWR(
  rawPoints: DataPoint[],
  playerId: string,
  metricKey: string,
  endDate: string
): ACWRResult {
  const pp = rawPoints.filter((p) => p.playerId === playerId)

  const getSum = (from: string, to: string) =>
    pp
      .filter((p) => p.date >= from && p.date <= to)
      .map((p) => p.values[metricKey])
      .filter((v): v is number => v !== null && !isNaN(v))
      .reduce((a, b) => a + b, 0)

  const acuteStart = addDays(endDate, -6)
  const acute = getSum(acuteStart, endDate)

  const weekSums = Array.from({ length: 4 }, (_, w) => {
    const wEnd = addDays(endDate, -w * 7)
    return getSum(addDays(wEnd, -6), wEnd)
  })
  const chronic = weekSums.reduce((a, b) => a + b, 0) / 4
  const acwr = chronic > 0 ? acute / chronic : null

  // Monotony over last 7 days
  const dailyMap = new Map<string, number>()
  pp
    .filter((p) => p.date >= acuteStart && p.date <= endDate)
    .forEach((p) => {
      const v = p.values[metricKey]
      if (v !== null && !isNaN(v))
        dailyMap.set(p.date, (dailyMap.get(p.date) ?? 0) + v)
    })
  const daily = [...dailyMap.values()]
  const dailyMean = daily.length ? daily.reduce((a, b) => a + b, 0) / daily.length : 0
  const dailyStd = stdDev(daily)
  const monotony = dailyStd > 0 ? dailyMean / dailyStd : null
  const strain = monotony !== null ? acute * monotony : null

  return { acute, chronic, acwr, monotony, strain }
}

// ── Previous period ──────────────────────────────────────────────────────────

// Returns the period of equal length immediately preceding [from, to].
export function getPreviousPeriodRange(
  from: string | null,
  to: string | null
): { from: string; to: string } | null {
  if (!from || !to) return null
  const fromMs = new Date(from).getTime()
  const toMs = new Date(to).getTime()
  const durationMs = toMs - fromMs + 86_400_000 // inclusive day
  const prevToMs = fromMs - 86_400_000
  const prevFromMs = prevToMs - durationMs + 86_400_000
  return {
    from: new Date(prevFromMs).toISOString().slice(0, 10),
    to: new Date(prevToMs).toISOString().slice(0, 10),
  }
}
