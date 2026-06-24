export function formatMetric(value: number | null, unit: string): string {
  if (value === null) return '—'
  return `${value.toLocaleString('it-IT', { maximumFractionDigits: 2 })} ${unit}`.trim()
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}
