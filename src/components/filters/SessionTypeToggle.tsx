import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'
import { getSessionTypes } from '@/lib/filters'
import { cn } from '@/lib/utils'

export default function SessionTypeToggle() {
  const dataset = useDataStore((s) => s.dataset)
  const { selectedSessionTypes, toggleSessionType } = useFilterStore()

  if (!dataset) return null

  const types = getSessionTypes(dataset)
  if (types.length <= 1) return null

  const allActive = selectedSessionTypes.length === 0

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground shrink-0 mr-0.5">Sessione:</span>
      {types.map((type) => {
        const active = allActive || selectedSessionTypes.includes(type)
        return (
          <button
            key={type}
            onClick={() => toggleSessionType(type)}
            className={cn(
              'h-6 rounded px-2 text-xs capitalize transition-colors',
              active && !allActive
                ? 'bg-primary text-primary-foreground'
                : allActive
                  ? 'bg-accent/60 text-foreground/70'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {type}
          </button>
        )
      })}
    </div>
  )
}
