import { useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, X } from 'lucide-react'
import type { MetricDefinition } from '@/types/data'
import { useTableConfig } from '@/hooks/useTableConfig'
import type { TableRow } from '@/hooks/useTableConfig'
import ColumnPicker from './ColumnPicker'
import { cn } from '@/lib/utils'

function formatVal(v: number | null, unit: string): string {
  if (v === null) return '—'
  return unit === 's'
    ? `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`
    : v.toLocaleString('it-IT', { maximumFractionDigits: 2 })
}

interface FilterPanelProps {
  current: { min?: number; max?: number } | undefined
  onChange: (filter: { min?: number; max?: number } | undefined) => void
}

function FilterPanel({ current, onChange }: FilterPanelProps) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        placeholder="min"
        value={current?.min ?? ''}
        onChange={(e) =>
          onChange({ ...current, min: e.target.value ? Number(e.target.value) : undefined })
        }
        className="h-5 w-16 rounded border border-input bg-background px-1 text-[10px]"
      />
      <span className="text-[10px] text-muted-foreground">–</span>
      <input
        type="number"
        placeholder="max"
        value={current?.max ?? ''}
        onChange={(e) =>
          onChange({ ...current, max: e.target.value ? Number(e.target.value) : undefined })
        }
        className="h-5 w-16 rounded border border-input bg-background px-1 text-[10px]"
      />
      {(current?.min !== undefined || current?.max !== undefined) && (
        <button
          onClick={() => onChange(undefined)}
          aria-label="Rimuovi filtro"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

interface Props {
  rows: TableRow[]
  metrics: MetricDefinition[]
  caption?: string
}

export default function DataTable({ rows, metrics, caption }: Props) {
  const {
    config,
    visibleMetrics,
    processedRows,
    toggleColumn,
    setSort,
    setValueFilter,
    resetFilters,
    activeFilterCount,
  } = useTableConfig(metrics, rows)

  const [showFilters, setShowFilters] = useState(false)

  const SortIcon = ({ k }: { k: string }) => {
    const s = config.sort.find((x) => x.key === k)
    if (!s) return <ArrowUpDown className="inline-block ml-1 h-3 w-3 opacity-30" />
    return s.dir === 'desc'
      ? <ArrowDown className="inline-block ml-1 h-3 w-3" />
      : <ArrowUp className="inline-block ml-1 h-3 w-3" />
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <ColumnPicker
          metrics={metrics}
          visibleColumns={config.visibleColumns}
          onToggle={toggleColumn}
        />
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs transition-colors',
            showFilters || activeFilterCount > 0
              ? 'border-primary/50 bg-primary/5 text-primary'
              : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          aria-pressed={showFilters}
        >
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          Filtri{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Rimuovi filtri
          </button>
        )}
        {caption && (
          <span className="ml-auto text-xs text-muted-foreground opacity-60">{caption}</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {processedRows.length} righe
        </span>
      </div>

      {/* Filter row */}
      {showFilters && visibleMetrics.length > 0 && (
        <div className="overflow-x-auto rounded-md border bg-muted/20 px-3 py-2">
          <div className="flex items-start gap-4">
            <div className="w-32 shrink-0" />
            {visibleMetrics.map((m) => (
              <div key={m.key} className="shrink-0 space-y-0.5 min-w-[8rem]">
                <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
                <FilterPanel
                  current={config.valueFilters[m.key]}
                  onChange={(f) => setValueFilter(m.key, f)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border ring-1 ring-foreground/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap w-40">
                Giocatore
              </th>
              {visibleMetrics.map((m) => (
                <th
                  key={m.key}
                  onClick={() => setSort(m.key)}
                  className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:bg-accent/50 transition-colors"
                >
                  {m.label}
                  {m.unit && <span className="ml-1 opacity-50 font-normal">({m.unit})</span>}
                  <SortIcon k={m.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedRows.length === 0 && (
              <tr>
                <td
                  colSpan={visibleMetrics.length + 1}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Nessuna riga corrisponde ai filtri attivi.
                </td>
              </tr>
            )}
            {processedRows.map((row) => (
              <tr
                key={row.id}
                className="border-b last:border-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-2 font-medium whitespace-nowrap">
                  {row.label}
                  {row.sublabel && (
                    <span className="ml-1 text-xs text-muted-foreground">{row.sublabel}</span>
                  )}
                </td>
                {visibleMetrics.map((m) => {
                  const v = row.values[m.key] ?? null
                  const isSorted = config.sort[0]?.key === m.key
                  return (
                    <td
                      key={m.key}
                      className={cn(
                        'px-3 py-2 text-right tabular-nums',
                        isSorted && 'font-semibold'
                      )}
                    >
                      {v !== null ? (
                        formatVal(v, m.unit)
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
