import { NavLink } from 'react-router-dom'
import { LayoutDashboard, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/player', label: 'Giocatore', icon: User },
  { to: '/compare', label: 'Confronto', icon: Users },
]

interface Props {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: Props) {
  return (
    <aside
      className="w-56 border-r border-sidebar-border bg-sidebar flex flex-col h-full shrink-0"
      aria-label="Navigazione principale"
    >
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
          KappaSport
        </span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5" role="navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )
            }
            aria-current={undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40">v0.6.0</p>
      </div>
    </aside>
  )
}
