import { useFilterStore } from '@/store/filterStore'
import { cn } from '@/lib/utils'
import type { MetricCategory } from '@/types/data'

const CATEGORIES: { value: MetricCategory; label: string }[] = [
  { value: 'gps', label: 'GPS' },
  { value: 'workload', label: 'Carico' },
  { value: 'hr', label: 'Cardio' },
  { value: 'test', label: 'Test' },
]

export default function CategoryToggle() {
  const { selectedCategories, toggleCategory } = useFilterStore()

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground shrink-0 mr-0.5">Categoria:</span>
      {CATEGORIES.map(({ value, label }) => {
        const active = selectedCategories.includes(value)
        return (
          <button
            key={value}
            onClick={() => toggleCategory(value)}
            className={cn(
              'h-6 rounded px-2 text-xs font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
