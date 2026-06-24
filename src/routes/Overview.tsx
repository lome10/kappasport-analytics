import ImportWizard from '@/components/upload/ImportWizard'
import { useDataStore } from '@/store/dataStore'

export default function Overview() {
  const dataset = useDataStore((s) => s.dataset)

  if (!dataset) {
    return <ImportWizard />
  }

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      <p className="text-sm text-muted-foreground">
        {dataset.players.length} giocatori · {dataset.metrics.length} metriche ·{' '}
        {dataset.points.length} sessioni importate
        {dataset.dateRange.from && (
          <>
            {' '}· dal{' '}
            <span className="font-medium text-foreground">{dataset.dateRange.from}</span>
            {' '}al{' '}
            <span className="font-medium text-foreground">{dataset.dateRange.to}</span>
          </>
        )}
      </p>
      <p className="text-sm text-muted-foreground pt-2">
        KPI di gruppo, tabella ordinabile e grafico a barre — Fase 3.
      </p>
    </div>
  )
}
