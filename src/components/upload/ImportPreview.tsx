interface Props {
  headers: string[]
  rows: Record<string, string>[]
  maxRows?: number
}

export default function ImportPreview({ headers, rows, maxRows = 5 }: Props) {
  const preview = rows.slice(0, maxRows)

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Anteprima · {Math.min(rows.length, maxRows)} di {rows.length} righe
      </p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                {headers.map((h) => (
                  <td key={h} className="whitespace-nowrap px-3 py-1.5">
                    {row[h] || (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
