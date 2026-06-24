import { Columns3 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import type { MetricDefinition } from '@/types/data'

const CATEGORY_LABELS: Record<string, string> = {
  gps: 'GPS / Fisico',
  workload: 'Carico',
  hr: 'Cardio',
  test: 'Test',
}

interface Props {
  metrics: MetricDefinition[]
  visibleColumns: string[]
  onToggle: (key: string) => void
}

export default function ColumnPicker({ metrics, visibleColumns, onToggle }: Props) {
  const byCategory = metrics.reduce<Record<string, MetricDefinition[]>>((acc, m) => {
    ;(acc[m.category] ??= []).push(m)
    return acc
  }, {})

  const activeCount = visibleColumns.length

  return (
    <Popover>
      <PopoverTrigger
        className="flex h-7 items-center gap-1.5 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Seleziona colonne"
      >
        <Columns3 className="h-3.5 w-3.5" aria-hidden="true" />
        Colonne ({activeCount})
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2 max-h-80 overflow-y-auto">
        {Object.entries(byCategory).map(([cat, mets]) => (
          <div key={cat} className="mb-3 last:mb-0">
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABELS[cat] ?? cat}
            </p>
            <div className="space-y-0.5">
              {mets.map((m) => (
                <label
                  key={m.key}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-accent"
                >
                  <Checkbox
                    checked={visibleColumns.includes(m.key)}
                    onCheckedChange={() => onToggle(m.key)}
                  />
                  <span className="truncate">{m.label}</span>
                  {m.unit && (
                    <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                      {m.unit}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
