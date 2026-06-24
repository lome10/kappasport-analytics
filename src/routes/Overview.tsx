import { useState } from 'react'
import ImportWizard from '@/components/upload/ImportWizard'
import KpiCard from '@/components/cards/KpiCard'
import BarMetricChart from '@/components/charts/BarMetricChart'
import PlayersTable from '@/components/overview/PlayersTable'
import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'
import { useFilteredDataset } from '@/hooks/useFilteredDataset'
import { applyFilters } from '@/lib/filters'
import { groupMetricAvg, percentChange, getPreviousPeriodRange } from '@/lib/metrics'

export default function Overview() {
  const hasData = useDataStore((s) => s.dataset !== null)
  const rawDataset = useDataStore((s) => s.dataset)
  const filtered = useFilteredDataset()

  const dateRange = useFilterStore((s) => s.dateRange)
  const selectedPlayerIds = useFilterStore((s) => s.selectedPlayerIds)
  const selectedCategories = useFilterStore((s) => s.selectedCategories)
  const selectedSessionTypes = useFilterStore((s) => s.selectedSessionTypes)

  const [chartMetricKey, setChartMetricKey] = useState('')

  if (!hasData) return <ImportWizard />
  if (!filtered) return null

  // Resolve active chart metric (fallback to first available)
  const activeMetricKey =
    filtered.metrics.some((m) => m.key === chartMetricKey)
      ? chartMetricKey
      : (filtered.metrics[0]?.key ?? '')

  // Previous period for KPI trend comparison
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.players.length} giocatori · {filtered.points.length} sessioni
          {filtered.dateRange.from && (
            <>
              {' '}· {filtered.dateRange.from} → {filtered.dateRange.to}
            </>
          )}
        </p>
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
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium">Confronto giocatori</h2>
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
              </div>
              <BarMetricChart dataset={filtered} metricKey={activeMetricKey} />
            </section>
          )}

          {/* Players × Metrics Table */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Giocatori × Metriche
              <span className="ml-2 font-normal normal-case opacity-60">
                media per giocatore nel periodo · clicca colonna per ordinare
              </span>
            </h2>
            <PlayersTable dataset={filtered} />
          </section>
        </>
      )}
    </div>
  )
}
