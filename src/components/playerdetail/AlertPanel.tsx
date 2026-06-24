import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface PlayerAlert {
  type: 'acwr-high' | 'acwr-low' | 'zscore-high' | 'zscore-low'
  metricLabel: string
  value: number
}

interface Props {
  alerts: PlayerAlert[]
}

function alertText(a: PlayerAlert): string {
  switch (a.type) {
    case 'acwr-high':
      return `ACWR elevato su ${a.metricLabel} (${a.value.toFixed(2)}) — zona rischio infortuni`
    case 'acwr-low':
      return `ACWR basso su ${a.metricLabel} (${a.value.toFixed(2)}) — sottovalutazione del carico`
    case 'zscore-high':
      return `${a.metricLabel} sopra la norma (+${a.value.toFixed(1)}σ) — valore insolitamente alto`
    case 'zscore-low':
      return `${a.metricLabel} sotto la norma (${a.value.toFixed(1)}σ) — valore insolitamente basso`
  }
}

function AlertIcon({ type }: { type: PlayerAlert['type'] }) {
  if (type === 'zscore-high') return <TrendingUp className="h-4 w-4" />
  if (type === 'zscore-low') return <TrendingDown className="h-4 w-4" />
  return <AlertTriangle className="h-4 w-4" />
}

export default function AlertPanel({ alerts }: Props) {
  if (alerts.length === 0) return null

  const hasHigh = alerts.some(
    (a) => a.type === 'acwr-high' || (a.type === 'zscore-high' && a.value > 2.5)
  )

  return (
    <Alert variant={hasHigh ? 'destructive' : 'default'}>
      <AlertTriangle />
      <AlertDescription>
        <ul className="space-y-0.5">
          {alerts.map((a, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <AlertIcon type={a.type} />
              {alertText(a)}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
