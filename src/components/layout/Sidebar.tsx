import { NavLink } from 'react-router-dom'
import { LayoutDashboard, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/player', label: 'Giocatore', icon: User },
  { to: '/compare', label: 'Confronto', icon: Users },
]

export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-sidebar-border bg-sidebar flex flex-col shrink-0">
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
          KappaSport
        </span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40">v0.1.0 · Fase 0</p>
      </div>
    </aside>
  )
}
