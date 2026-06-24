import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: number | null
  unit: string
  change: number | null
}

export default function KpiCard({ label, value, unit, change }: Props) {
  const isPositive = change !== null && change > 0.05
  const isNegative = change !== null && change < -0.05

  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-4 space-y-1.5">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums leading-none">
          {value !== null
            ? value.toLocaleString('it-IT', { maximumFractionDigits: 2 })
            : '—'}
        </span>
        {unit && value !== null && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
      {change !== null ? (
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            isPositive && 'text-green-600 dark:text-green-400',
            isNegative && 'text-red-500 dark:text-red-400',
            !isPositive && !isNegative && 'text-muted-foreground'
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : isNegative ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          {isPositive ? '+' : ''}
          {change.toFixed(1)}% vs periodo prec.
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/40">nessun confronto</p>
      )}
    </div>
  )
}
