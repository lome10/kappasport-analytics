import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { useFilterStore } from '@/store/filterStore'
import { cn } from '@/lib/utils'

const today = () => format(new Date(), 'yyyy-MM-dd')

const PRESETS = [
  {
    label: '7gg',
    from: () => format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    to: today,
  },
  {
    label: '30gg',
    from: () => format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: today,
  },
  {
    label: 'Mese',
    from: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: () => format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  },
  {
    label: 'Stagione',
    from: () => {
      const now = new Date()
      const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
      return `${year}-08-01`
    },
    to: () => {
      const now = new Date()
      const year = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear()
      return `${year}-07-31`
    },
  },
] as const

export default function DateRangePicker() {
  const { dateRange, setDateRange } = useFilterStore()

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setDateRange({ from: preset.from(), to: preset.to() })
  }

  const isPresetActive = (preset: (typeof PRESETS)[number]) =>
    dateRange.from === preset.from() && dateRange.to === preset.to()

  const clearDates = () => setDateRange({ from: null, to: null })
  const isAllActive = !dateRange.from && !dateRange.to

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground shrink-0">Periodo:</span>
      {PRESETS.map((p) => (
        <button
          key={p.label}
          onClick={() => applyPreset(p)}
          className={cn(
            'h-6 rounded px-2 text-xs transition-colors',
            isPresetActive(p)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {p.label}
        </button>
      ))}
      <button
        onClick={clearDates}
        className={cn(
          'h-6 rounded px-2 text-xs transition-colors',
          isAllActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        Tutto
      </button>
      <div className="flex items-center gap-1 ml-1">
        <input
          type="date"
          value={dateRange.from ?? ''}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value || null })}
          className="h-6 rounded border border-input bg-background px-1.5 text-xs"
        />
        <span className="text-xs text-muted-foreground">→</span>
        <input
          type="date"
          value={dateRange.to ?? ''}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value || null })}
          className="h-6 rounded border border-input bg-background px-1.5 text-xs"
        />
      </div>
    </div>
  )
}
