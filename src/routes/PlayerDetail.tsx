import { useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'
import {
  movingAverage,
  playerTimeSeries,
  playerBaselineStats,
  zScore,
  computeACWR,
} from '@/lib/metrics'
import LineMetricChart from '@/components/charts/LineMetricChart'
import RadarProfileChart from '@/components/charts/RadarProfileChart'
import WorkloadStats from '@/components/playerdetail/WorkloadStats'
import AlertPanel from '@/components/playerdetail/AlertPanel'
import type { PlayerAlert } from '@/components/playerdetail/AlertPanel'
import { downloadChartPNG } from '@/lib/export'

const MA_WINDOW = 7

export default function PlayerDetail() {
  const rawDataset = useDataStore((s) => s.dataset)
  const dateRange = useFilterStore((s) => s.dateRange)
  const selectedCategories = useFilterStore((s) => s.selectedCategories)
  const selectedSessionTypes = useFilterStore((s) => s.selectedSessionTypes)

  const [playerId, setPlayerId] = useState('')
  const [metricKey, setMetricKey] = useState('')
  const chartRef = useRef<HTMLDivElement>(null)

  if (!rawDataset) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Dettaglio Giocatore</h1>
        <p className="text-sm text-muted-foreground">Importa un dataset per iniziare.</p>
      </div>
    )
  }

  const { players, metrics, points } = rawDataset

  // Metrics visible in current category filter
  const availableMetrics = metrics.filter((m) => selectedCategories.includes(m.category))

  // Points for this player filtered by date + session type (NOT player filter — that's global)
  const playerPoints = points.filter((p) => {
    if (p.playerId !== playerId) return false
    if (dateRange.from && p.date < dateRange.from) return false
    if (dateRange.to && p.date > dateRange.to) return false
    if (selectedSessionTypes.length > 0 && !selectedSessionTypes.includes(p.sessionType))
      return false
    return true
  })

  // Effective metric key
  const activeMetricKey =
    availableMetrics.some((m) => m.key === metricKey)
      ? metricKey
      : (availableMetrics[0]?.key ?? '')
  const activeMetric = availableMetrics.find((m) => m.key === activeMetricKey)

  // Time series for the chart
  const rawSeries = playerTimeSeries(playerPoints, playerId, activeMetricKey)
  const maValues = movingAverage(rawSeries.map((s) => s.value), MA_WINDOW)
  const chartSeries = rawSeries.map((s, i) => ({ ...s, ma: maValues[i] ?? null }))

  // Baseline from ALL raw points (no date filter)
  const baseline = activeMetricKey
    ? playerBaselineStats(points, playerId, activeMetricKey)
    : null

  // Alerts
  const alerts: PlayerAlert[] = []

  if (playerId && activeMetric) {
    // Z-score alert on most recent value
    const lastPoint = rawSeries.at(-1)
    if (lastPoint?.value !== null && lastPoint?.value !== undefined && baseline) {
      const z = zScore(lastPoint.value, baseline)
      if (z !== null) {
        if (z > 2) alerts.push({ type: 'zscore-high', metricLabel: activeMetric.label, value: z })
        if (z < -2) alerts.push({ type: 'zscore-low', metricLabel: activeMetric.label, value: z })
      }
    }

    // ACWR alert for workload metrics
    if (activeMetric.category === 'workload' && rawSeries.length > 0) {
      const endDate = rawSeries.at(-1)!.date
      const acwrRes = computeACWR(points, playerId, activeMetricKey, endDate)
      if (acwrRes.acwr !== null) {
        if (acwrRes.acwr >= 1.5)
          alerts.push({ type: 'acwr-high', metricLabel: activeMetric.label, value: acwrRes.acwr })
        else if (acwrRes.acwr < 0.8)
          alerts.push({ type: 'acwr-low', metricLabel: activeMetric.label, value: acwrRes.acwr })
      }
    }
  }

  // ACWR stats (only if workload metric)
  const acwrResult =
    playerId && activeMetric?.category === 'workload' && rawSeries.length > 0
      ? computeACWR(points, playerId, activeMetricKey, rawSeries.at(-1)!.date)
      : null

  // Test metrics for radar chart
  const testMetrics = availableMetrics.filter((m) => m.category === 'test')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dettaglio Giocatore</h1>
          {playerId && (
            <p className="mt-1 text-sm text-muted-foreground">
              {playerPoints.length} sessioni nel periodo ·{' '}
              {rawSeries.length} punti per {activeMetric?.label ?? '—'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="player-select" className="text-xs text-muted-foreground shrink-0">
            Giocatore:
          </label>
          <select
            id="player-select"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">— seleziona —</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!playerId && (
        <p className="text-sm text-muted-foreground">
          Seleziona un giocatore per visualizzare l&apos;andamento nel tempo.
        </p>
      )}

      {playerId && (
        <>
          {/* Alerts */}
          <AlertPanel alerts={alerts} />

          {/* Line chart */}
          <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium">Andamento nel tempo</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => chartRef.current && downloadChartPNG(chartRef.current, `${playerId}_${activeMetricKey}.png`)}
                  aria-label="Esporta grafico come PNG"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                {baseline && (
                  <span className="text-xs text-muted-foreground">
                    Baseline: {baseline.mean.toLocaleString('it-IT', { maximumFractionDigits: 1 })}
                    {activeMetric?.unit ? ` ${activeMetric.unit}` : ''} ±{' '}
                    {baseline.std.toLocaleString('it-IT', { maximumFractionDigits: 1 })}
                    <span className="opacity-60"> (n={baseline.count})</span>
                  </span>
                )}
                {availableMetrics.length > 0 && (
                  <select
                    value={activeMetricKey}
                    onChange={(e) => setMetricKey(e.target.value)}
                    className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {availableMetrics.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}{m.unit ? ` (${m.unit})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div ref={chartRef}>
            <LineMetricChart
              series={chartSeries}
              metricLabel={activeMetric?.label ?? ''}
              unit={activeMetric?.unit ?? ''}
              baseline={baseline}
              maWindow={MA_WINDOW}
            />
            </div>
          </section>

          {/* ACWR / Workload stats */}
          {acwrResult && activeMetric && (
            <WorkloadStats
              result={acwrResult}
              metricLabel={activeMetric.label}
              unit={activeMetric.unit}
            />
          )}

          {/* Radar chart — test metrics */}
          {testMetrics.length >= 3 && (
            <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="mb-1 text-sm font-medium">Profilo test fisici</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Valori espressi come % del massimo nel gruppo · periodo corrente
              </p>
              <RadarProfileChart
                metrics={testMetrics}
                allPoints={points}
                playerPoints={playerPoints}
                playerId={playerId}
              />
            </section>
          )}
        </>
      )}
    </div>
  )
}
