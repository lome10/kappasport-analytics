import { create } from 'zustand'
import type { Dataset } from '@/types/data'

interface DataStore {
  dataset: Dataset | null
  setDataset: (dataset: Dataset) => void
  clearDataset: () => void
}

export const useDataStore = create<DataStore>((set) => ({
  dataset: null,
  setDataset: (dataset) => set({ dataset }),
  clearDataset: () => set({ dataset: null }),
}))
