import { cn } from '@/lib/utils'
import type { ACWRResult } from '@/lib/metrics'

interface Props {
  result: ACWRResult
  metricLabel: string
  unit: string
}

function StatCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: number | null
  unit?: string
  accent?: 'green' | 'yellow' | 'red'
}) {
  return (
    <div
      className={cn(
        'rounded-xl bg-card ring-1 ring-foreground/10 p-3 space-y-1',
        accent === 'green' && 'ring-green-500/30 bg-green-50/50 dark:bg-green-950/20',
        accent === 'yellow' && 'ring-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/20',
        accent === 'red' && 'ring-red-500/30 bg-red-50/50 dark:bg-red-950/20'
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums">
        {value !== null ? value.toLocaleString('it-IT', { maximumFractionDigits: 2 }) : '—'}
        {unit && value !== null && (
          <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
        )}
      </p>
    </div>
  )
}

function acwrAccent(acwr: number | null): 'green' | 'yellow' | 'red' | undefined {
  if (acwr === null) return undefined
  if (acwr < 0.8 || (acwr >= 1.3 && acwr < 1.5)) return 'yellow'
  if (acwr >= 1.5) return 'red'
  return 'green'
}

export default function WorkloadStats({ result, metricLabel, unit }: Props) {
  const accent = acwrAccent(result.acwr)

  return (
    <section>
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Carico — {metricLabel}
        <span className="ml-2 font-normal normal-case opacity-60">
          ultimi 7gg vs media 4 settimane
        </span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label={`Carico acuto (7gg) — ${unit}`}
          value={result.acute}
        />
        <StatCard
          label={`Carico cronico (4 sett.) — ${unit}`}
          value={result.chronic}
        />
        <StatCard
          label="ACWR"
          value={result.acwr}
          accent={accent}
        />
        <StatCard label="Monotonia" value={result.monotony} />
        <StatCard label="Strain" value={result.strain} />
      </div>
      {result.acwr !== null && (
        <p
          className={cn(
            'mt-2 text-xs font-medium',
            accent === 'green' && 'text-green-600 dark:text-green-400',
            accent === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
            accent === 'red' && 'text-red-600 dark:text-red-400',
            accent === undefined && 'text-muted-foreground'
          )}
        >
          {accent === 'green' && '✓ ACWR nella zona ottimale (0.8–1.3)'}
          {accent === 'yellow' &&
            (result.acwr < 0.8
              ? '⚠ ACWR basso — possibile sottovalutazione del carico'
              : '⚠ ACWR elevato — zona di attenzione (1.3–1.5)')}
          {accent === 'red' && '⛔ ACWR oltre 1.5 — rischio infortuni elevato'}
        </p>
      )}
    </section>
  )
}
