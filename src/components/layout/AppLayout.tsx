import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDataStore } from '@/store/dataStore'
import { useUIStore } from '@/store/uiStore'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import FilterBar from '@/components/filters/FilterBar'

export default function AppLayout() {
  const hasData = useDataStore((s) => s.dataset !== null)
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const location = useLocation()

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  return (
    <>
      {/* Skip to main */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
      >
        Vai al contenuto principale
      </a>

      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-30 transition-transform duration-200
            md:relative md:z-auto md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <Sidebar onNavigate={() => { if (window.innerWidth < 768) setSidebarOpen(false) }} />
        </div>

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar />
          {hasData && <FilterBar />}
          <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
