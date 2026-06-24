export type MetricCategory = 'gps' | 'workload' | 'test'

export type ColumnRole = 'player' | 'date' | 'sessionType' | 'metric' | 'ignore'

export interface ColumnMapping {
  columnName: string
  role: ColumnRole
  metricLabel?: string
  metricUnit?: string
  metricCategory?: MetricCategory
}

export interface ParseResult {
  headers: string[]
  rows: Record<string, string>[]
}

export interface MetricDefinition {
  key: string
  label: string
  unit: string
  category: MetricCategory
}

export interface DataPoint {
  playerId: string
  date: string
  sessionType: string
  values: Record<string, number | null>
}

export interface Player {
  id: string
  name: string
  position?: string
  group?: string
}

export interface Dataset {
  players: Player[]
  metrics: MetricDefinition[]
  points: DataPoint[]
  dateRange: { from: string; to: string }
}
