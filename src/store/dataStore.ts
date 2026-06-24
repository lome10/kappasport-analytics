import { create } from 'zustand'
import type { Dataset } from '@/types/data'
import {
  saveDatasetToIDB,
  loadDatasetFromIDB,
  clearDatasetFromIDB,
} from '@/lib/persistence'

interface DataStore {
  dataset: Dataset | null
  isHydrated: boolean
  setDataset: (dataset: Dataset) => void
  clearDataset: () => void
  initFromIDB: () => Promise<void>
}

export const useDataStore = create<DataStore>((set) => ({
  dataset: null,
  isHydrated: false,

  setDataset: (dataset) => {
    set({ dataset })
    saveDatasetToIDB(dataset).catch(() => {})
  },

  clearDataset: () => {
    set({ dataset: null })
    clearDatasetFromIDB().catch(() => {})
  },

  initFromIDB: async () => {
    try {
      const dataset = await loadDatasetFromIDB()
      set({ dataset, isHydrated: true })
    } catch {
      set({ isHydrated: true })
    }
  },
}))
