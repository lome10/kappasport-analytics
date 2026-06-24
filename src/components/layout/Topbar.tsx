import { Upload, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'
import { useUIStore } from '@/store/uiStore'

export default function Topbar() {
  const { dataset, clearDataset } = useDataStore()
  const resetFilters = useFilterStore((s) => s.resetFilters)
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const handleNewImport = () => {
    resetFilters()
    clearDataset()
  }

  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-4 gap-3 shrink-0">
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Chiudi sidebar' : 'Apri sidebar'}
        aria-expanded={sidebarOpen}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <span className="font-semibold text-sm tracking-tight hidden md:block">
        KappaSport Analytics
      </span>

      <div className="flex-1" />

      {dataset ? (
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-muted-foreground tabular-nums">
            {dataset.players.length} giocatori · {dataset.points.length} sessioni
          </span>
          <Button variant="outline" size="sm" onClick={handleNewImport} aria-label="Importa nuovo file">
            <Upload aria-hidden="true" />
            <span className="hidden sm:inline">Nuovo import</span>
          </Button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground hidden sm:block">
          Nessun dato · importa un file per iniziare
        </span>
      )}
    </header>
  )
}
