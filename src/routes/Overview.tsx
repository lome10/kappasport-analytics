import { useMemo, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import ImportWizard from '@/components/upload/ImportWizard'
import KpiCard from '@/components/cards/KpiCard'
import BarMetricChart from '@/components/charts/BarMetricChart'
import DataTable from '@/components/table/DataTable'
import type { TableRow } from '@/hooks/useTableConfig'
import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'
import { useFilteredDataset } from '@/hooks/useFilteredDataset'
import { applyFilters } from '@/lib/filters'
import {
  groupMetricAvg,
  percentChange,
  getPreviousPeriodRange,
  playerMetricAggregated,
} from '@/lib/metrics'
import { downloadCSV, downloadChartPNG } from '@/lib/export'

export default function Overview() {
  const hasData = useDataStore((s) => s.dataset !== null)
  const rawDataset = useDataStore((s) => s.dataset)
  const filtered = useFilteredDataset()

  const dateRange = useFilterStore((s) => s.dateRange)
  const selectedPlayerIds = useFilterStore((s) => s.selectedPlayerIds)
  const selectedCategories = useFilterStore((s) => s.selectedCategories)
  const selectedSessionTypes = useFilterStore((s) => s.selectedSessionTypes)

  const [chartMetricKey, setChartMetricKey] = useState('')
  const chartRef = useRef<HTMLDivElement>(null)

  if (!hasData) return <ImportWizard />
  if (!filtered) return null

  const activeMetricKey =
    filtered.metrics.some((m) => m.key === chartMetricKey)
      ? chartMetricKey
      : (filtered.metrics[0]?.key ?? '')

  // Previous period for KPI trend
  const prevRange = getPreviousPeriodRange(dateRange.from, dateRange.to)
  const previousFiltered =
    rawDataset && prevRange
      ? applyFilters(rawDataset, {
          dateRange: prevRange,
          selectedPlayerIds,
          selectedCategories,
          selectedSessionTypes,
        })
      : null

  const hasMetrics = filtered.metrics.length > 0
  const hasPlayers = filtered.players.length > 0

  // Build DataTable rows — one per player, values = aggregated metric
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const tableRows = useMemo<TableRow[]>(
    () =>
      filtered.players.map((player) => ({
        id: player.id,
        label: player.name,
        sublabel: player.position,
        values: Object.fromEntries(
          filtered.metrics.map((m) => [
            m.key,
            playerMetricAggregated(filtered.points, player.id, m),
          ])
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        {filtered && (
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.players.length} giocatori · {filtered.points.length} sessioni/drill
            {filtered.dateRange.from && (
              <> · {filtered.dateRange.from} → {filtered.dateRange.to}</>
            )}
          </p>
        )}
      </div>

      {!hasMetrics && (
        <p className="text-sm text-muted-foreground">
          Nessuna metrica disponibile con i filtri correnti. Prova ad attivare una categoria.
        </p>
      )}

      {hasMetrics && (
        <>
          {/* KPI Grid */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Medie di gruppo
              {prevRange && (
                <span className="ml-2 font-normal normal-case opacity-60">
                  vs {prevRange.from} → {prevRange.to}
                </span>
              )}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.metrics.map((metric) => {
                const current = groupMetricAvg(filtered.points, metric.key)
                const previous = previousFiltered
                  ? groupMetricAvg(previousFiltered.points, metric.key)
                  : null
                return (
                  <KpiCard
                    key={metric.key}
                    label={metric.label}
                    unit={metric.unit}
                    value={current}
                    change={percentChange(current, previous)}
                  />
                )
              })}
            </div>
          </section>

          {/* Bar Chart */}
          {hasPlayers && activeMetricKey && (
            <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium">Confronto giocatori</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={activeMetricKey}
                    onChange={(e) => setChartMetricKey(e.target.value)}
                    className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {filtered.metrics.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}{m.unit ? ` (${m.unit})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      chartRef.current &&
                      downloadChartPNG(chartRef.current, `overview_${activeMetricKey}.png`)
                    }
                    aria-label="Esporta grafico come PNG"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div ref={chartRef}>
                <BarMetricChart dataset={filtered} metricKey={activeMetricKey} />
              </div>
            </section>
          )}

          {/* DataTable composabile */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Giocatori × Metriche
              </h2>
              <button
                onClick={() => filtered && downloadCSV(filtered, 'overview.csv')}
                aria-label="Esporta tabella come CSV"
                className="flex items-center gap-1.5 h-7 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Download className="h-3 w-3" aria-hidden="true" />
                CSV
              </button>
            </div>
            <DataTable
              rows={tableRows}
              metrics={filtered.metrics}
              caption="media aggregata per giocatore nel periodo"
            />
          </section>
        </>
      )}
    </div>
  )
}
