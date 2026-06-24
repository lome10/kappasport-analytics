import { TableIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  sheetNames: string[]
  onSelect: (name: string) => void
}

export default function SheetSelector({ sheetNames, onSelect }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleziona foglio Excel</CardTitle>
        <p className="text-sm text-muted-foreground">
          Il file contiene {sheetNames.length} fogli. Quale vuoi importare?
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {sheetNames.map((name) => (
          <Button key={name} variant="outline" onClick={() => onSelect(name)}>
            <TableIcon />
            {name}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
