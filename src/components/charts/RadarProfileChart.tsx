import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { DataPoint, MetricDefinition } from '@/types/data'
import { playerMetricAvg } from '@/lib/metrics'

interface Props {
  metrics: MetricDefinition[]   // only test-category metrics
  allPoints: DataPoint[]        // for group max normalization
  playerPoints: DataPoint[]     // filtered to current player + period
  playerId: string
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: { metric: string; pct: number; playerVal: number | null; unit: string } }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10">
      <p className="font-medium">{d.metric}</p>
      <p className="text-muted-foreground tabular-nums">
        {d.playerVal !== null
          ? `${d.playerVal.toLocaleString('it-IT', { maximumFractionDigits: 2 })}${d.unit ? ` ${d.unit}` : ''}`
          : '—'}
        <span className="ml-2 opacity-60">{d.pct.toFixed(0)}% del max</span>
      </p>
    </div>
  )
}

export default function RadarProfileChart({ metrics, allPoints, playerPoints, playerId }: Props) {
  if (metrics.length < 3) {
    return (
      <p className="text-sm text-muted-foreground">
        Servono almeno 3 metriche test per il radar chart.
      </p>
    )
  }

  const data = metrics.map((m) => {
    const playerVal = playerMetricAvg(playerPoints, playerId, m.key)
    const groupMax = Math.max(
      ...allPoints
        .map((p) => p.values[m.key])
        .filter((v): v is number => v !== null && !isNaN(v) && v > 0)
    )
    const pct =
      playerVal !== null && isFinite(groupMax) && groupMax > 0
        ? Math.min(100, (playerVal / groupMax) * 100)
        : 0
    return {
      metric: m.label,
      pct,
      playerVal,
      unit: m.unit,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
        <PolarGrid stroke="oklch(0.922 0 0)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          dataKey="pct"
          stroke="oklch(0.488 0.243 264.376)"
          fill="oklch(0.488 0.243 264.376)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
