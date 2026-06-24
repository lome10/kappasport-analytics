import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Overview from '@/routes/Overview'
import PlayerDetail from '@/routes/PlayerDetail'
import Compare from '@/routes/Compare'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/player/:playerId?" element={<PlayerDetail />} />
          <Route path="/compare" element={<Compare />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
