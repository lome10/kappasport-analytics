import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import type { ColumnMapping, ColumnRole, MetricCategory } from '@/types/data'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'

const ROLES: { value: ColumnRole; label: string }[] = [
  { value: 'player', label: 'Giocatore' },
  { value: 'date', label: 'Data' },
  { value: 'sessionType', label: 'Tipo sessione' },
  { value: 'metric', label: 'Metrica' },
  { value: 'ignore', label: 'Ignora' },
]

const CATEGORIES: { value: MetricCategory; label: string }[] = [
  { value: 'gps', label: 'GPS / Fisico' },
  { value: 'workload', label: 'Carico (Workload)' },
  { value: 'test', label: 'Test fisico' },
]

interface Props {
  mappings: ColumnMapping[]
  sampleValues: Record<string, string[]>
  onChange: (mappings: ColumnMapping[]) => void
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ColumnMapper({
  mappings,
  sampleValues,
  onChange,
  onConfirm,
  onCancel,
  isLoading,
}: Props) {
  const [local, setLocal] = useState<ColumnMapping[]>(mappings)

  const update = (index: number, patch: Partial<ColumnMapping>) => {
    const next = local.map((m, i) => (i === index ? { ...m, ...patch } : m))
    setLocal(next)
    onChange(next)
  }

  const setRole = (index: number, role: ColumnRole) => {
    const patch: Partial<ColumnMapping> = { role }
    if (role === 'metric') {
      patch.metricLabel = local[index].metricLabel || local[index].columnName
      patch.metricCategory = local[index].metricCategory ?? 'gps'
      patch.metricUnit = local[index].metricUnit ?? ''
    }
    update(index, patch)
  }

  const errors: string[] = []
  const playerCount = local.filter((m) => m.role === 'player').length
  const dateCount = local.filter((m) => m.role === 'date').length
  if (playerCount === 0) errors.push('Seleziona una colonna come "Giocatore".')
  if (playerCount > 1) errors.push('Solo una colonna può essere "Giocatore".')
  if (dateCount === 0) errors.push('Seleziona una colonna come "Data".')
  if (dateCount > 1) errors.push('Solo una colonna può essere "Data".')

  const metricCount = local.filter((m) => m.role === 'metric').length

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Mappa le colonne</h2>
        <p className="text-sm text-muted-foreground">
          {local.length} colonne rilevate · {metricCount} metriche selezionate
        </p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            <ul className="space-y-0.5 pl-4 list-disc">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="h-72 rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Colonna
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Ruolo
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Etichetta
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Unità
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Categoria
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Esempi
              </th>
            </tr>
          </thead>
          <tbody>
            {local.map((m, i) => (
              <tr key={m.columnName} className="border-t">
                <td className="px-3 py-1.5 font-mono text-xs max-w-[10rem] truncate">
                  {m.columnName}
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={m.role}
                    onChange={(e) => setRole(i, e.target.value as ColumnRole)}
                    className="h-7 w-36 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  {m.role === 'metric' && (
                    <input
                      value={m.metricLabel || ''}
                      onChange={(e) => update(i, { metricLabel: e.target.value })}
                      placeholder={m.columnName}
                      className="h-7 w-32 rounded-md border border-input bg-background px-2 text-xs"
                    />
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {m.role === 'metric' && (
                    <input
                      value={m.metricUnit || ''}
                      onChange={(e) => update(i, { metricUnit: e.target.value })}
                      placeholder="m, km/h…"
                      className="h-7 w-20 rounded-md border border-input bg-background px-2 text-xs"
                    />
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {m.role === 'metric' && (
                    <select
                      value={m.metricCategory || 'gps'}
                      onChange={(e) =>
                        update(i, { metricCategory: e.target.value as MetricCategory })
                      }
                      className="h-7 w-36 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-3 py-1.5 max-w-[12rem]">
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {(sampleValues[m.columnName] ?? []).slice(0, 3).join(' · ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Annulla
        </Button>
        <Button
          onClick={onConfirm}
          disabled={errors.length > 0 || isLoading}
        >
          {isLoading ? 'Importazione…' : 'Conferma import'}
        </Button>
      </div>
    </div>
  )
}
