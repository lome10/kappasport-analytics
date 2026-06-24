import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { Dataset } from '@/types/data'
import { playerMetricAvg } from '@/lib/metrics'

interface Props {
  dataset: Dataset
}

type SortDir = 'asc' | 'desc'

export default function PlayersTable({ dataset }: Props) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const rows = dataset.players.map((player) => ({
    player,
    values: Object.fromEntries(
      dataset.metrics.map((m) => [
        m.key,
        playerMetricAvg(dataset.points, player.id, m.key),
      ])
    ) as Record<string, number | null>,
  }))

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0
    const av = a.values[sortKey] ?? -Infinity
    const bv = b.values[sortKey] ?? -Infinity
    return sortDir === 'desc' ? bv - av : av - bv
  })

  if (dataset.players.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nessun giocatore nel periodo selezionato.
      </p>
    )
  }

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey)
      return <ArrowUpDown className="inline-block ml-1 h-3 w-3 opacity-30" />
    return sortDir === 'desc' ? (
      <ArrowDown className="inline-block ml-1 h-3 w-3" />
    ) : (
      <ArrowUp className="inline-block ml-1 h-3 w-3" />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border ring-1 ring-foreground/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground whitespace-nowrap">
              Giocatore
            </th>
            {dataset.metrics.map((m) => (
              <th
                key={m.key}
                onClick={() => handleSort(m.key)}
                className="px-3 py-2.5 text-right font-medium text-xs text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:bg-accent/50 transition-colors"
              >
                {m.label}
                {m.unit && (
                  <span className="ml-1 font-normal opacity-60">({m.unit})</span>
                )}
                <SortIcon colKey={m.key} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ player, values }) => (
            <tr key={player.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-2 font-medium whitespace-nowrap">{player.name}</td>
              {dataset.metrics.map((m) => (
                <td key={m.key} className="px-3 py-2 text-right tabular-nums">
                  {values[m.key] !== null ? (
                    values[m.key]!.toLocaleString('it-IT', { maximumFractionDigits: 2 })
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
