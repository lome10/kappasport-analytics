import { useCallback, useRef, useState } from 'react'
import { Upload, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props {
  onFile: (file: File) => void
  isLoading?: boolean
}

const ACCEPTED = '.csv,.xlsx,.xls'

export default function FileUpload({ onFile, isLoading }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handle = useCallback(
    (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
        alert('Formato non supportato. Carica un file CSV o XLSX.')
        return
      }
      onFile(file)
    },
    [onFile]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handle(file)
    },
    [handle]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handle(file)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => !isLoading && inputRef.current?.click()}
      className={cn(
        'group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-14 text-center transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50',
        isLoading && 'pointer-events-none opacity-50'
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-foreground/10">
        <FileSpreadsheet className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Trascina qui il file CSV o XLSX</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Esportato da KappaSport · max 50 MB
        </p>
      </div>
      <Button variant="outline" size="sm" tabIndex={-1} disabled={isLoading}>
        <Upload />
        Seleziona file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={onInputChange}
      />
    </div>
  )
}
