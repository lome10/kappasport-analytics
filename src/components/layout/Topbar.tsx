export default function Topbar() {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Filtri globali · date range · giocatori · categoria
        </span>
      </div>
      <div className="flex items-center">
        <span className="text-xs text-muted-foreground/50">Fase 1 →</span>
      </div>
    </header>
  )
}
