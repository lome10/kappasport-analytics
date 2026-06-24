import { ChevronDown, Users } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useFilterStore } from '@/store/filterStore'
import { useDataStore } from '@/store/dataStore'
import { cn } from '@/lib/utils'

export default function PlayerSelect() {
  const players = useDataStore((s) => s.dataset?.players ?? [])
  const { selectedPlayerIds, togglePlayer, setPlayerIds } = useFilterStore()

  const allSelected = selectedPlayerIds.length === 0
  const label = allSelected
    ? `Tutti (${players.length})`
    : `${selectedPlayerIds.length} selezionati`

  const selectAll = () => setPlayerIds([])
  const selectNone = () => setPlayerIds(players.map((p) => p.id))

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'flex h-6 items-center gap-1.5 rounded border border-input bg-background px-2 text-xs transition-colors hover:bg-accent',
          !allSelected && 'border-primary/50 bg-primary/5 text-primary'
        )}
      >
        <Users className="h-3 w-3" />
        {label}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="flex gap-2 mb-2 pb-2 border-b border-border">
          <button
            onClick={selectAll}
            className="text-xs text-primary hover:underline"
          >
            Tutti
          </button>
          <button
            onClick={selectNone}
            className="text-xs text-muted-foreground hover:underline"
          >
            Nessuno
          </button>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {players.map((player) => {
            const checked = !allSelected && selectedPlayerIds.includes(player.id)
            return (
              <label
                key={player.id}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-accent"
              >
                <Checkbox
                  checked={allSelected ? false : checked}
                  onCheckedChange={() => {
                    if (allSelected) {
                      // switching from "all" to individual: select everyone except this one toggled off
                      setPlayerIds(
                        players.filter((p) => p.id !== player.id).map((p) => p.id)
                      )
                    } else {
                      togglePlayer(player.id)
                    }
                  }}
                />
                {player.name}
              </label>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
