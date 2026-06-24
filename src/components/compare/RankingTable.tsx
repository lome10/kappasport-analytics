import { useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { DataPoint, MetricDefinition, Player } from '@/types/data'
import { playerMetricAvg } from '@/lib/metrics'
import { playerColor } from '@/lib/colors'

interface Props {
  players: Player[]
  metrics: MetricDefinition[]
  points: DataPoint[]
  defaultSortKey?: string
}

type SortDir = 'asc' | 'desc'

export default function RankingTable({ players, metrics, points, defaultSortKey }: Props) {
  const [sortKey, setSortKey] = useState(defaultSortKey ?? metrics[0]?.key ?? '')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const rows = players.map((player, i) => ({
    player,
    color: playerColor(i),
    values: Object.fromEntries(
      metrics.map((m) => [m.key, playerMetricAvg(points, player.id, m.key)])
    ) as Record<string, number | null>,
  }))

  const sorted = [...rows].sort((a, b) => {
    const av = a.values[sortKey] ?? -Infinity
    const bv = b.values[sortKey] ?? -Infinity
    return sortDir === 'desc' ? bv - av : av - bv
  })

  const SortIcon = ({ k }: { k: string }) =>
    sortKey !== k ? (
      <ArrowUpDown className="inline-block ml-1 h-3 w-3 opacity-30" />
    ) : sortDir === 'desc' ? (
      <ArrowDown className="inline-block ml-1 h-3 w-3" />
    ) : (
      <ArrowUp className="inline-block ml-1 h-3 w-3" />
    )

  return (
    <div className="overflow-x-auto rounded-xl border ring-1 ring-foreground/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-10">
              #
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
              Giocatore
            </th>
            {metrics.map((m) => (
              <th
                key={m.key}
                onClick={() => handleSort(m.key)}
                className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:bg-accent/50 transition-colors"
              >
                {m.label}
                {m.unit && <span className="ml-1 opacity-60 font-normal">({m.unit})</span>}
                <SortIcon k={m.key} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ player, color, values }, rank) => (
            <tr key={player.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-3 py-2 text-center">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {rank + 1}
                </span>
              </td>
              <td className="px-3 py-2 font-medium whitespace-nowrap">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {player.name}
                </span>
              </td>
              {metrics.map((m) => (
                <td key={m.key} className="px-3 py-2 text-right tabular-nums">
                  {values[m.key] !== null ? (
                    <span className={sortKey === m.key ? 'font-semibold' : ''}>
                      {values[m.key]!.toLocaleString('it-IT', { maximumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
