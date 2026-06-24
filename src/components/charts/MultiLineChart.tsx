import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import type { Player } from '@/types/data'
import { playerColor } from '@/lib/colors'

type SeriesRow = Record<string, string | number | null>

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number | null; color: string }[]
  label?: string
  unit: string
}

function CustomTooltip({ active, payload, label, unit }: TooltipProps) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10 space-y-0.5 min-w-36">
      <p className="font-medium mb-1">
        {(() => { try { return format(new Date(label), 'dd/MM/yyyy') } catch { return label } })()}
      </p>
      {payload.map((p) =>
        p.value !== null ? (
          <p key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="tabular-nums font-medium">
              {p.value.toLocaleString('it-IT', { maximumFractionDigits: 2 })}
              {unit && ` ${unit}`}
            </span>
          </p>
        ) : null
      )}
    </div>
  )
}

interface Props {
  series: SeriesRow[]
  players: Player[]
  unit: string
}

export default function MultiLineChart({ series, players, unit }: Props) {
  if (series.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Nessun dato disponibile per questa metrica nel periodo selezionato.
      </div>
    )
  }

  const formatTick = (v: string) => {
    try { return format(new Date(v), 'dd/MM') } catch { return v }
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={series} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatTick}
          tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'oklch(0.556 0 0)' }}
          width={52}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) =>
            v.toLocaleString('it-IT', { maximumFractionDigits: 1 })
          }
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Legend
          iconType="line"
          iconSize={14}
          wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
        />
        {players.map((player, i) => (
          <Line
            key={player.id}
            type="monotone"
            dataKey={player.id}
            name={player.name}
            stroke={playerColor(i)}
            strokeWidth={2}
            dot={{ r: 3, fill: playerColor(i), strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
