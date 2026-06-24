import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'

export default function Topbar() {
  const { dataset, clearDataset } = useDataStore()
  const resetFilters = useFilterStore((s) => s.resetFilters)

  const handleNewImport = () => {
    resetFilters()
    clearDataset()
  }

  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-6 gap-4 shrink-0">
      <span className="font-semibold text-sm tracking-tight">KappaSport Analytics</span>
      <div className="flex-1" />
      {dataset ? (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {dataset.players.length}g · {dataset.points.length} sessioni
          </span>
          <Button variant="outline" size="sm" onClick={handleNewImport}>
            <Upload />
            Nuovo import
          </Button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">
          Nessun dato · importa un file per iniziare
        </span>
      )}
    </header>
  )
}
