import ImportWizard from '@/components/upload/ImportWizard'
import { useDataStore } from '@/store/dataStore'
import { useFilteredDataset } from '@/hooks/useFilteredDataset'

export default function Overview() {
  const hasData = useDataStore((s) => s.dataset !== null)
  const filtered = useFilteredDataset()

  if (!hasData) return <ImportWizard />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        {filtered && (
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.players.length} giocatori · {filtered.metrics.length} metriche ·{' '}
            {filtered.points.length} sessioni
            {filtered.dateRange.from && (
              <>
                {' '}· {filtered.dateRange.from} → {filtered.dateRange.to}
              </>
            )}
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        KPI di gruppo, tabella ordinabile e grafico a barre — Fase 3.
      </p>
    </div>
  )
}
