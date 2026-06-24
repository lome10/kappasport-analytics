import { create } from 'zustand'
import type { MetricCategory } from '@/types/data'

interface FilterStore {
  dateRange: { from: string | null; to: string | null }
  selectedPlayerIds: string[]
  selectedCategories: MetricCategory[]
  selectedSessionTypes: string[]
  setDateRange: (range: { from: string | null; to: string | null }) => void
  togglePlayer: (id: string) => void
  toggleCategory: (cat: MetricCategory) => void
  toggleSessionType: (type: string) => void
  resetFilters: () => void
}

const defaultState = {
  dateRange: { from: null, to: null },
  selectedPlayerIds: [] as string[],
  selectedCategories: ['gps', 'workload', 'test'] as MetricCategory[],
  selectedSessionTypes: [] as string[],
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...defaultState,
  setDateRange: (range) => set({ dateRange: range }),
  togglePlayer: (id) => {
    const { selectedPlayerIds } = get()
    set({
      selectedPlayerIds: selectedPlayerIds.includes(id)
        ? selectedPlayerIds.filter((p) => p !== id)
        : [...selectedPlayerIds, id],
    })
  },
  toggleCategory: (cat) => {
    const { selectedCategories } = get()
    set({
      selectedCategories: selectedCategories.includes(cat)
        ? selectedCategories.filter((c) => c !== cat)
        : [...selectedCategories, cat],
    })
  },
  toggleSessionType: (type) => {
    const { selectedSessionTypes } = get()
    set({
      selectedSessionTypes: selectedSessionTypes.includes(type)
        ? selectedSessionTypes.filter((t) => t !== type)
        : [...selectedSessionTypes, type],
    })
  },
  resetFilters: () => set(defaultState),
}))
