import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/dataStore'

export default function Topbar() {
  const { dataset, clearDataset } = useDataStore()

  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1 flex items-center gap-3">
        {dataset ? (
          <span className="text-sm text-muted-foreground">
            Filtri globali · date range · giocatori · categoria — Fase 2
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            Nessun dato caricato — importa un file CSV o XLSX per iniziare
          </span>
        )}
      </div>
      {dataset && (
        <Button variant="outline" size="sm" onClick={clearDataset}>
          <Upload />
          Nuovo import
        </Button>
      )}
    </header>
  )
}
