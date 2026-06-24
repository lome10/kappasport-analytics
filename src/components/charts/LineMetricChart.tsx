import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import type { BaselineStats } from '@/lib/metrics'

export interface ChartPoint {
  date: string
  value: number | null
  ma: number | null
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: ChartPoint }[]
  label?: string
  unit: string
  metricLabel: string
  maWindow: number
}

function CustomTooltip({ active, payload, unit, metricLabel, maWindow }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10 space-y-0.5">
      <p className="font-medium mb-1">
        {format(new Date(d.date), 'dd/MM/yyyy')}
      </p>
      {d.value !== null && (
        <p>
          <span className="text-muted-foreground">{metricLabel}: </span>
          <span className="tabular-nums font-medium">
            {d.value.toLocaleString('it-IT', { maximumFractionDigits: 2 })}
            {unit && ` ${unit}`}
          </span>
        </p>
      )}
      {d.ma !== null && (
        <p>
          <span className="text-muted-foreground">MA {maWindow}gg: </span>
          <span className="tabular-nums">
            {d.ma.toLocaleString('it-IT', { maximumFractionDigits: 2 })}
            {unit && ` ${unit}`}
          </span>
        </p>
      )}
    </div>
  )
}

interface Props {
  series: ChartPoint[]
  metricLabel: string
  unit: string
  baseline?: BaselineStats | null
  maWindow?: number
}

export default function LineMetricChart({
  series,
  metricLabel,
  unit,
  baseline,
  maWindow = 7,
}: Props) {
  if (series.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Nessun dato disponibile per questa metrica nel periodo selezionato.
      </div>
    )
  }

  const upper = baseline && baseline.std > 0 ? baseline.mean + 2 * baseline.std : null
  const lower = baseline && baseline.std > 0 ? baseline.mean - 2 * baseline.std : null

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
        <Tooltip
          content={
            <CustomTooltip unit={unit} metricLabel={metricLabel} maWindow={maWindow} />
          }
        />

        {/* Baseline mean */}
        {baseline && (
          <ReferenceLine
            y={baseline.mean}
            stroke="oklch(0.556 0 0)"
            strokeDasharray="2 8"
            strokeOpacity={0.3}
          />
        )}
        {/* ±2σ bands */}
        {upper !== null && (
          <ReferenceLine
            y={upper}
            stroke="oklch(0.577 0.245 27.325)"
            strokeDasharray="4 4"
            strokeOpacity={0.55}
            label={{
              value: '+2σ',
              position: 'insideTopRight',
              fontSize: 9,
              fill: 'oklch(0.577 0.245 27.325)',
            }}
          />
        )}
        {lower !== null && lower > 0 && (
          <ReferenceLine
            y={lower}
            stroke="oklch(0.577 0.245 27.325)"
            strokeDasharray="4 4"
            strokeOpacity={0.55}
            label={{
              value: '-2σ',
              position: 'insideBottomRight',
              fontSize: 9,
              fill: 'oklch(0.577 0.245 27.325)',
            }}
          />
        )}

        {/* Raw values */}
        <Line
          type="monotone"
          dataKey="value"
          name={metricLabel}
          stroke="oklch(0.488 0.243 264.376)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'oklch(0.488 0.243 264.376)', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
        {/* Moving average */}
        <Line
          type="monotone"
          dataKey="ma"
          name={`MA ${maWindow}gg`}
          stroke="oklch(0.646 0.222 41.116)"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
          connectNulls={false}
        />

        <Legend
          iconType="line"
          iconSize={14}
          wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
