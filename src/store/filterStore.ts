import { create } from 'zustand'
import type { MetricCategory } from '@/types/data'

export interface FilterState {
  dateRange: { from: string | null; to: string | null }
  selectedPlayerIds: string[]
  selectedCategories: MetricCategory[]
  selectedSessionTypes: string[]
}

interface FilterStore extends FilterState {
  setDateRange: (range: { from: string | null; to: string | null }) => void
  setPlayerIds: (ids: string[]) => void
  togglePlayer: (id: string) => void
  toggleCategory: (cat: MetricCategory) => void
  toggleSessionType: (type: string) => void
  resetFilters: () => void
}

const defaultState: FilterState = {
  dateRange: { from: null, to: null },
  selectedPlayerIds: [],
  selectedCategories: ['gps', 'workload', 'test'],
  selectedSessionTypes: [],
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...defaultState,
  setDateRange: (range) => set({ dateRange: range }),
  setPlayerIds: (ids) => set({ selectedPlayerIds: ids }),
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
