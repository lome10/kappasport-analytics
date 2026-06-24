import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { useDataStore } from '@/store/dataStore'

const Overview = lazy(() => import('@/routes/Overview'))
const PlayerDetail = lazy(() => import('@/routes/PlayerDetail'))
const Compare = lazy(() => import('@/routes/Compare'))

function DataHydrator({ children }: { children: React.ReactNode }) {
  const initFromIDB = useDataStore((s) => s.initFromIDB)
  const isHydrated = useDataStore((s) => s.isHydrated)

  useEffect(() => {
    initFromIDB()
  }, [initFromIDB])

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center gap-3 text-sm text-muted-foreground">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Caricamento…
      </div>
    )
  }

  return <>{children}</>
}

function RouteFallback() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
      Caricamento vista…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <DataHydrator>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/overview" replace />} />
            <Route
              path="/overview"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Overview />
                </Suspense>
              }
            />
            <Route
              path="/player/:playerId?"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PlayerDetail />
                </Suspense>
              }
            />
            <Route
              path="/compare"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Compare />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </DataHydrator>
    </BrowserRouter>
  )
}
