import { Outlet } from 'react-router-dom'
import { useDataStore } from '@/store/dataStore'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import FilterBar from '@/components/filters/FilterBar'

export default function AppLayout() {
  const hasData = useDataStore((s) => s.dataset !== null)

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        {hasData && <FilterBar />}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
