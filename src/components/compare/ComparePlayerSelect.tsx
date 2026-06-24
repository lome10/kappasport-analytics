import type { Player } from '@/types/data'
import { playerColor } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface Props {
  players: Player[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export default function ComparePlayerSelect({ players, selectedIds, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((p) => p !== id)
        : [...selectedIds, id]
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Seleziona 2 o più giocatori da confrontare
        </span>
        {selectedIds.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Deseleziona tutti
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {players.map((player) => {
          const idx = selectedIds.indexOf(player.id)
          const isSelected = idx !== -1
          return (
            <button
              key={player.id}
              onClick={() => toggle(player.id)}
              style={isSelected ? { backgroundColor: playerColor(idx), borderColor: playerColor(idx) } : undefined}
              className={cn(
                'h-7 rounded-full border px-3 text-xs font-medium transition-all',
                isSelected
                  ? 'text-white shadow-sm'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              {player.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
