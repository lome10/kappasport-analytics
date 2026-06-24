import type { Dataset, DataPoint, MetricDefinition, Player } from '@/types/data'
import type { FilterState } from '@/store/filterStore'

export function applyFilters(dataset: Dataset, filters: FilterState): Dataset {
  const { dateRange, selectedPlayerIds, selectedCategories, selectedSessionTypes } = filters

  const points: DataPoint[] = dataset.points.filter((p) => {
    if (dateRange.from && p.date < dateRange.from) return false
    if (dateRange.to && p.date > dateRange.to) return false
    if (selectedPlayerIds.length > 0 && !selectedPlayerIds.includes(p.playerId)) return false
    if (selectedSessionTypes.length > 0 && !selectedSessionTypes.includes(p.sessionType))
      return false
    return true
  })

  const metrics: MetricDefinition[] = dataset.metrics.filter((m) =>
    selectedCategories.includes(m.category)
  )

  const activeIds = new Set(points.map((p) => p.playerId))
  const players: Player[] = dataset.players.filter((p) =>
    selectedPlayerIds.length > 0 ? selectedPlayerIds.includes(p.id) : activeIds.has(p.id)
  )

  const sortedDates = points.map((p) => p.date).sort()

  return {
    players,
    metrics,
    points,
    dateRange: {
      from: sortedDates[0] ?? dataset.dateRange.from,
      to: sortedDates[sortedDates.length - 1] ?? dataset.dateRange.to,
    },
  }
}

export function getSessionTypes(dataset: Dataset): string[] {
  return [...new Set(dataset.points.map((p) => p.sessionType))].sort()
}
