import { useState, useMemo } from 'react'
import type { MetricDefinition } from '@/types/data'

export interface TableSort {
  key: string
  dir: 'asc' | 'desc'
}

export interface ValueFilter {
  min?: number
  max?: number
}

export interface TableConfig {
  visibleColumns: string[]
  sort: TableSort[]
  valueFilters: Record<string, ValueFilter>
  groupBy: 'player' | 'sessionType' | null
}

export interface TableRow {
  id: string
  label: string
  sublabel?: string
  values: Record<string, number | null>
}

function defaultConfig(metrics: MetricDefinition[]): TableConfig {
  return {
    visibleColumns: metrics.slice(0, 8).map((m) => m.key),
    sort: [],
    valueFilters: {},
    groupBy: null,
  }
}

export function useTableConfig(metrics: MetricDefinition[], rows: TableRow[]) {
  const [config, setConfig] = useState<TableConfig>(() => defaultConfig(metrics))

  const toggleColumn = (key: string) => {
    setConfig((c) => ({
      ...c,
      visibleColumns: c.visibleColumns.includes(key)
        ? c.visibleColumns.filter((k) => k !== key)
        : [...c.visibleColumns, key],
    }))
  }

  const setSort = (key: string) => {
    setConfig((c) => {
      const existing = c.sort.find((s) => s.key === key)
      if (existing) {
        return {
          ...c,
          sort: [{ key, dir: existing.dir === 'desc' ? 'asc' : 'desc' }],
        }
      }
      return { ...c, sort: [{ key, dir: 'desc' }] }
    })
  }

  const setValueFilter = (key: string, filter: ValueFilter | undefined) => {
    setConfig((c) => {
      const next = { ...c.valueFilters }
      if (filter) next[key] = filter
      else delete next[key]
      return { ...c, valueFilters: next }
    })
  }

  const resetFilters = () =>
    setConfig((c) => ({ ...c, valueFilters: {}, sort: [] }))

  const visibleMetrics = useMemo(
    () => metrics.filter((m) => config.visibleColumns.includes(m.key)),
    [metrics, config.visibleColumns]
  )

  const processedRows = useMemo(() => {
    let result = [...rows]

    // Apply value filters
    for (const [key, f] of Object.entries(config.valueFilters)) {
      result = result.filter((r) => {
        const v = r.values[key]
        if (v === null) return false
        if (f.min !== undefined && v < f.min) return false
        if (f.max !== undefined && v > f.max) return false
        return true
      })
    }

    // Apply sort (first sort wins)
    const [primary] = config.sort
    if (primary) {
      result.sort((a, b) => {
        const av = a.values[primary.key] ?? -Infinity
        const bv = b.values[primary.key] ?? -Infinity
        return primary.dir === 'desc' ? bv - av : av - bv
      })
    }

    return result
  }, [rows, config.valueFilters, config.sort])

  return {
    config,
    visibleMetrics,
    processedRows,
    toggleColumn,
    setSort,
    setValueFilter,
    resetFilters,
    activeFilterCount: Object.keys(config.valueFilters).length,
  }
}
