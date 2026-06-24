export type MetricCategory = 'gps' | 'workload' | 'hr' | 'test'

export type ColumnRole =
  | 'player'
  | 'date'
  | 'sessionType'
  | 'exercise'
  | 'ampm'
  | 'matchCycle'
  | 'metric'
  | 'metadata'
  | 'ignore'

export interface ColumnMapping {
  columnName: string
  role: ColumnRole
  metricLabel?: string
  metricUnit?: string
  metricCategory?: MetricCategory
  /** How to aggregate drills → day for this metric */
  metricAggregation?: 'sum' | 'avg' | 'max'
  /** Values are in mm:ss format → converted to seconds on import */
  isTimeFormat?: boolean
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
  aggregation: 'sum' | 'avg' | 'max'
}

export interface DataPoint {
  playerId: string
  date: string
  sessionType: string
  exercise?: string
  ampm?: 'AM' | 'PM' | string
  matchCycle?: string
  isTeamAverage?: boolean
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
  /** Team Average rows from KappaSport — kept as benchmark, excluded from player lists */
  teamAverage?: DataPoint[]
  dateRange: { from: string; to: string }
}
