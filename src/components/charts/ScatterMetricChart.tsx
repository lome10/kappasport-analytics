import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { Player } from '@/types/data'
import { playerColor } from '@/lib/colors'

interface ScatterPoint {
  name: string
  x: number
  y: number
  color: string
  idx: number
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: ScatterPoint }[]
  xLabel: string
  yLabel: string
  xUnit: string
  yUnit: string
}

function CustomTooltip({ active, payload, xLabel, yLabel, xUnit, yUnit }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10 space-y-0.5">
      <p className="font-medium mb-1" style={{ color: d.color }}>
        {d.name}
      </p>
      <p>
        <span className="text-muted-foreground">{xLabel}: </span>
        <span className="tabular-nums">
          {d.x.toLocaleString('it-IT', { maximumFractionDigits: 2 })}
          {xUnit && ` ${xUnit}`}
        </span>
      </p>
      <p>
        <span className="text-muted-foreground">{yLabel}: </span>
        <span className="tabular-nums">
          {d.y.toLocaleString('it-IT', { maximumFractionDigits: 2 })}
          {yUnit && ` ${yUnit}`}
        </span>
      </p>
    </div>
  )
}

function PlayerDot(props: Record<string, unknown>) {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload: ScatterPoint }
  if (!cx || !cy) return null
  const initials = (payload.name ?? '')
    .split(' ')
    .map((w: string) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <g>
      <circle cx={cx} cy={cy} r={14} fill={payload.color} fillOpacity={0.85} />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={9}
        fontWeight="600"
        fill="white"
      >
        {initials}
      </text>
    </g>
  )
}

interface Props {
  players: Player[]
  xValues: (number | null)[]
  yValues: (number | null)[]
  xLabel: string
  yLabel: string
  xUnit: string
  yUnit: string
}

export default function ScatterMetricChart({
  players,
  xValues,
  yValues,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
}: Props) {
  const data: ScatterPoint[] = players
    .map((player, i) => ({
      name: player.name,
      x: xValues[i],
      y: yValues[i],
      color: playerColor(i),
      idx: i,
    }))
    .filter((d): d is ScatterPoint & { x: number; y: number } =>
      d.x !== null && d.y !== null
    )

  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        Nessun dato per le metriche selezionate nel periodo.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 16, right: 24, left: 4, bottom: 32 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
        <XAxis
          dataKey="x"
          type="number"
          name={xLabel}
          tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }}
          tickLine={false}
          tickFormatter={(v: number) =>
            v.toLocaleString('it-IT', { maximumFractionDigits: 1 })
          }
          label={{
            value: `${xLabel}${xUnit ? ` (${xUnit})` : ''}`,
            position: 'insideBottom',
            offset: -20,
            fontSize: 11,
            fill: 'oklch(0.556 0 0)',
          }}
        />
        <YAxis
          dataKey="y"
          type="number"
          name={yLabel}
          tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) =>
            v.toLocaleString('it-IT', { maximumFractionDigits: 1 })
          }
          label={{
            value: `${yLabel}${yUnit ? ` (${yUnit})` : ''}`,
            angle: -90,
            position: 'insideLeft',
            offset: 12,
            fontSize: 11,
            fill: 'oklch(0.556 0 0)',
          }}
        />
        <Tooltip
          content={
            <CustomTooltip
              xLabel={xLabel}
              yLabel={yLabel}
              xUnit={xUnit}
              yUnit={yUnit}
            />
          }
        />
        <Scatter data={data} shape={<PlayerDot />} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
