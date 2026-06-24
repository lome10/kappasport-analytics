import { useState } from 'react'
import { Download } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'
import { playerTimeSeries, playerMetricAvg } from '@/lib/metrics'
import { downloadCSV } from '@/lib/export'
import ComparePlayerSelect from '@/components/compare/ComparePlayerSelect'
import RankingTable from '@/components/compare/RankingTable'
import MultiLineChart from '@/components/charts/MultiLineChart'
import ScatterMetricChart from '@/components/charts/ScatterMetricChart'
import CompareRadarChart from '@/components/charts/CompareRadarChart'

type SeriesRow = Record<string, string | number | null>

function buildMultiSeries(
  points: import('@/types/data').DataPoint[],
  playerIds: string[],
  metricKey: string,
  dateFrom: string | null,
  dateTo: string | null
): SeriesRow[] {
  const filtered = points.filter((p) => {
    if (dateFrom && p.date < dateFrom) return false
    if (dateTo && p.date > dateTo) return false
    return true
  })

  const playerMaps = new Map<string, Map<string, number>>()
  for (const pid of playerIds) {
    const series = playerTimeSeries(filtered, pid, metricKey)
    const map = new Map<string, number>()
    series.forEach((s) => { if (s.value !== null) map.set(s.date, s.value) })
    playerMaps.set(pid, map)
  }

  const allDates = [
    ...new Set([...playerMaps.values()].flatMap((m) => [...m.keys()])),
  ].sort()

  return allDates.map((date) => {
    const row: SeriesRow = { date }
    for (const pid of playerIds) row[pid] = playerMaps.get(pid)?.get(date) ?? null
    return row
  })
}

export default function Compare() {
  const rawDataset = useDataStore((s) => s.dataset)
  const dateRange = useFilterStore((s) => s.dateRange)
  const selectedCategories = useFilterStore((s) => s.selectedCategories)
  const selectedSessionTypes = useFilterStore((s) => s.selectedSessionTypes)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lineMetricKey, setLineMetricKey] = useState('')
  const [scatterXKey, setScatterXKey] = useState('')
  const [scatterYKey, setScatterYKey] = useState('')

  if (!rawDataset) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Confronto</h1>
        <p className="text-sm text-muted-foreground">Importa un dataset per iniziare.</p>
      </div>
    )
  }

  const { players, metrics, points } = rawDataset
  const availableMetrics = metrics.filter((m) => selectedCategories.includes(m.category))

  // Filtered points (date + session type only — player filter not applied here)
  const filteredPoints = points.filter((p) => {
    if (dateRange.from && p.date < dateRange.from) return false
    if (dateRange.to && p.date > dateRange.to) return false
    if (selectedSessionTypes.length > 0 && !selectedSessionTypes.includes(p.sessionType))
      return false
    return true
  })

  const selectedPlayers = players.filter((p) => selectedIds.includes(p.id))
  const hasEnough = selectedPlayers.length >= 2

  // Effective metric keys
  const activeLineKey =
    availableMetrics.some((m) => m.key === lineMetricKey)
      ? lineMetricKey
      : (availableMetrics[0]?.key ?? '')
  const activeLineMetric = availableMetrics.find((m) => m.key === activeLineKey)

  const activeXKey =
    availableMetrics.some((m) => m.key === scatterXKey)
      ? scatterXKey
      : (availableMetrics[0]?.key ?? '')
  const activeYKey =
    availableMetrics.some((m) => m.key === scatterYKey)
      ? scatterYKey
      : (availableMetrics[1]?.key ?? availableMetrics[0]?.key ?? '')
  const xMetric = availableMetrics.find((m) => m.key === activeXKey)
  const yMetric = availableMetrics.find((m) => m.key === activeYKey)

  // Data for charts
  const multiSeries = hasEnough && activeLineKey
    ? buildMultiSeries(filteredPoints, selectedIds, activeLineKey, dateRange.from, dateRange.to)
    : []

  const scatterX = selectedPlayers.map((p) =>
    playerMetricAvg(filteredPoints, p.id, activeXKey)
  )
  const scatterY = selectedPlayers.map((p) =>
    playerMetricAvg(filteredPoints, p.id, activeYKey)
  )

  const testMetrics = availableMetrics.filter((m) => m.category === 'test')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Confronto</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seleziona due o più giocatori per confrontarli sulle stesse metriche.
        </p>
      </div>

      {/* Player selector */}
      <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <ComparePlayerSelect
          players={players}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />
      </section>

      {!hasEnough && (
        <p className="text-sm text-muted-foreground">
          {selectedIds.length === 0
            ? 'Seleziona almeno 2 giocatori per iniziare il confronto.'
            : 'Seleziona un secondo giocatore per abilitare i grafici.'}
        </p>
      )}

      {hasEnough && availableMetrics.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nessuna metrica disponibile — prova ad attivare una categoria nei filtri.
        </p>
      )}

      {hasEnough && availableMetrics.length > 0 && (
        <>
          {/* Multi-line chart */}
          <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium">Andamento nel tempo</h2>
              <select
                value={activeLineKey}
                onChange={(e) => setLineMetricKey(e.target.value)}
                className="h-7 rounded-md border border-input bg-background px-2 text-xs"
              >
                {availableMetrics.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}{m.unit ? ` (${m.unit})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <MultiLineChart
              series={multiSeries}
              players={selectedPlayers}
              unit={activeLineMetric?.unit ?? ''}
            />
          </section>

          {/* Scatter chart */}
          {availableMetrics.length >= 2 && (
            <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-medium">Correlazione metriche</h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">X:</span>
                  <select
                    value={activeXKey}
                    onChange={(e) => setScatterXKey(e.target.value)}
                    className="h-7 rounded-md border border-input bg-background px-2"
                  >
                    {availableMetrics.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                  <span className="text-muted-foreground">Y:</span>
                  <select
                    value={activeYKey}
                    onChange={(e) => setScatterYKey(e.target.value)}
                    className="h-7 rounded-md border border-input bg-background px-2"
                  >
                    {availableMetrics.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <ScatterMetricChart
                players={selectedPlayers}
                xValues={scatterX}
                yValues={scatterY}
                xLabel={xMetric?.label ?? ''}
                yLabel={yMetric?.label ?? ''}
                xUnit={xMetric?.unit ?? ''}
                yUnit={yMetric?.unit ?? ''}
              />
            </section>
          )}

          {/* Radar comparativo */}
          {testMetrics.length >= 3 && (
            <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="mb-1 text-sm font-medium">Radar comparativo — test fisici</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Valori come % del massimo nel gruppo · periodo corrente
              </p>
              <CompareRadarChart
                metrics={testMetrics}
                allPoints={points}
                filteredPoints={filteredPoints}
                players={selectedPlayers}
              />
            </section>
          )}

          {/* Ranking table */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ranking · clicca colonna per ordinare
              </h2>
              <button
                onClick={() => {
                  const exportDataset = {
                    players: selectedPlayers,
                    metrics: availableMetrics,
                    points: filteredPoints.filter(p => selectedIds.includes(p.playerId)),
                    dateRange: rawDataset.dateRange,
                  }
                  downloadCSV(exportDataset, 'confronto.csv')
                }}
                aria-label="Esporta tabella come CSV"
                className="flex items-center gap-1.5 h-7 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Download className="h-3 w-3" aria-hidden="true" />
                CSV
              </button>
            </div>
            <RankingTable
              players={selectedPlayers}
              metrics={availableMetrics}
              points={filteredPoints}
              defaultSortKey={activeLineKey}
            />
          </section>
        </>
      )}
    </div>
  )
}
