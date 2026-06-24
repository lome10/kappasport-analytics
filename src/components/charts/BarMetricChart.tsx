import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import type { Dataset } from '@/types/data'
import { playerMetricAvg } from '@/lib/metrics'

interface Props {
  dataset: Dataset
  metricKey: string
}

const CHART_COLORS = [
  'oklch(0.646 0.222 41.116)',
  'oklch(0.6 0.118 184.704)',
  'oklch(0.398 0.07 227.392)',
  'oklch(0.828 0.189 84.429)',
  'oklch(0.769 0.188 70.08)',
]

interface TooltipPayload {
  payload?: { fullName: string; value: number | null }
}

function CustomTooltip({ active, payload, unit }: { active?: boolean; payload?: TooltipPayload[]; unit: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d) return null
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10">
      <p className="font-medium mb-0.5">{d.fullName}</p>
      <p className="text-muted-foreground tabular-nums">
        {d.value !== null
          ? `${d.value.toLocaleString('it-IT', { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`
          : '—'}
      </p>
    </div>
  )
}

export default function BarMetricChart({ dataset, metricKey }: Props) {
  const metric = dataset.metrics.find((m) => m.key === metricKey)

  const data = dataset.players
    .map((player) => ({
      name: player.name.split(' ').slice(-1)[0],
      fullName: player.name,
      value: playerMetricAvg(dataset.points, player.id, metricKey),
    }))
    .filter((d) => d.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        Nessun dato per questa metrica nel periodo selezionato.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 48 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(0.922 0 0)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }}
          angle={-35}
          textAnchor="end"
          interval={0}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }}
          width={52}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v.toLocaleString('it-IT')}
        />
        <Tooltip
          cursor={{ fill: 'oklch(0.97 0 0)', opacity: 0.6 }}
          content={<CustomTooltip unit={metric?.unit ?? ''} />}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
