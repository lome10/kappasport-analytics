import type { DataPoint } from '@/types/data'

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
