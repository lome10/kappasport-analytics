export type MetricCategory = 'gps' | 'workload' | 'test'

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
