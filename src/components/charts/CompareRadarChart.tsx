import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import type { DataPoint, MetricDefinition, Player } from '@/types/data'
import { playerMetricAvg } from '@/lib/metrics'
import { playerColor } from '@/lib/colors'

interface Props {
  metrics: MetricDefinition[]
  allPoints: DataPoint[]
  filteredPoints: DataPoint[]
  players: Player[]
}

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number; color: string; payload: { metric: string } }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const metric = payload[0].payload.metric
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10 space-y-0.5">
      <p className="font-medium mb-1">{metric}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="tabular-nums">{p.value.toFixed(0)}%</span>
        </p>
      ))}
    </div>
  )
}

export default function CompareRadarChart({
  metrics,
  allPoints,
  filteredPoints,
  players,
}: Props) {
  if (metrics.length < 3) {
    return (
      <p className="text-sm text-muted-foreground">
        Servono almeno 3 metriche test per il radar comparativo.
      </p>
    )
  }

  // Build data: [{metric, playerId1: pct, playerId2: pct, ...}]
  const data = metrics.map((m) => {
    const groupMax = Math.max(
      ...allPoints
        .map((p) => p.values[m.key])
        .filter((v): v is number => v !== null && !isNaN(v) && v > 0)
    )

    const row: Record<string, string | number> = { metric: m.label }
    for (const player of players) {
      const val = playerMetricAvg(filteredPoints, player.id, m.key)
      row[player.id] =
        val !== null && isFinite(groupMax) && groupMax > 0
          ? Math.min(100, (val / groupMax) * 100)
          : 0
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
        <PolarGrid stroke="oklch(0.922 0 0)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }}
        />
        <Tooltip content={<CustomTooltip />} />
        {players.map((player, i) => (
          <Radar
            key={player.id}
            name={player.name}
            dataKey={player.id}
            stroke={playerColor(i)}
            fill={playerColor(i)}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        ))}
        <Legend
          iconType="line"
          iconSize={14}
          wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
