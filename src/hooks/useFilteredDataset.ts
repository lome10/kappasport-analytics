import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'
import { applyFilters } from '@/lib/filters'
import type { Dataset } from '@/types/data'

export function useFilteredDataset(): Dataset | null {
  const dataset = useDataStore((s) => s.dataset)
  const dateRange = useFilterStore((s) => s.dateRange)
  const selectedPlayerIds = useFilterStore((s) => s.selectedPlayerIds)
  const selectedCategories = useFilterStore((s) => s.selectedCategories)
  const selectedSessionTypes = useFilterStore((s) => s.selectedSessionTypes)

  if (!dataset) return null

  return applyFilters(dataset, {
    dateRange,
    selectedPlayerIds,
    selectedCategories,
    selectedSessionTypes,
  })
}
