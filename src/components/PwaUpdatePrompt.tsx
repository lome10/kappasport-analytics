import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, WifiOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-xs rounded-xl bg-card shadow-lg ring-1 ring-foreground/10',
        'flex items-start gap-3 p-4 animate-in slide-in-from-bottom-4 fade-in duration-300'
      )}
    >
      {needRefresh ? (
        <>
          <RefreshCw className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Aggiornamento disponibile</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nuova versione pronta. Ricarica per applicarla.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => updateServiceWorker(true)}
              className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:underline"
            >
              Ricarica
            </button>
            <button
              onClick={close}
              aria-label="Ignora aggiornamento"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Pronto per l&apos;offline</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              L&apos;app funzionerà anche senza connessione.
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Chiudi notifica"
            className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  )
}
