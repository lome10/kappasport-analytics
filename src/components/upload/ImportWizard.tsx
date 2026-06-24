import { useState } from 'react'
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import FileUpload from './FileUpload'
import SheetSelector from './SheetSelector'
import ColumnMapper from './ColumnMapper'
import ImportPreview from './ImportPreview'
import { parseCSV } from '@/lib/parsers/csvParser'
import { getSheetNames, parseSheet } from '@/lib/parsers/xlsxParser'
import { inferMappings } from '@/lib/schema'
import { normalize } from '@/lib/normalize'
import { loadTemplate, saveTemplate } from '@/lib/persistence'
import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'
import type { ColumnMapping, ParseResult } from '@/types/data'

type Step = 'upload' | 'sheet-select' | 'mapping' | 'done'

function getSampleValues(result: ParseResult): Record<string, string[]> {
  return Object.fromEntries(
    result.headers.map((h) => [
      h,
      result.rows
        .slice(0, 5)
        .map((r) => r[h] ?? '')
        .filter(Boolean),
    ])
  )
}

export default function ImportWizard() {
  const [step, setStep] = useState<Step>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [xlsxBuffer, setXlsxBuffer] = useState<ArrayBuffer | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])

  const setDataset = useDataStore((s) => s.setDataset)
  const resetFilters = useFilterStore((s) => s.resetFilters)

  const applyParseResult = (result: ParseResult) => {
    const saved = loadTemplate(result.headers)
    const inferred = saved ?? inferMappings(result.headers, result.rows)
    setParseResult(result)
    setMappings(inferred)
    setStep('mapping')
  }

  const loadXlsxSheet = (buf: ArrayBuffer, sheetName: string) => {
    try {
      const result = parseSheet(buf, sheetName)
      applyParseResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante il parsing del foglio.')
    }
  }

  const handleFile = async (file: File) => {
    setIsLoading(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()

      if (ext === 'csv') {
        const result = await parseCSV(file)
        applyParseResult(result)
      } else {
        const buf = await file.arrayBuffer()
        const names = getSheetNames(buf)
        setXlsxBuffer(buf)
        if (names.length === 1) {
          loadXlsxSheet(buf, names[0])
        } else {
          setSheetNames(names)
          setStep('sheet-select')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante il parsing del file.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSheetSelect = (name: string) => {
    if (!xlsxBuffer) return
    loadXlsxSheet(xlsxBuffer, name)
  }

  const handleConfirm = () => {
    if (!parseResult) return
    setIsLoading(true)
    setError(null)
    try {
      const { dataset, warnings: w } = normalize(parseResult.rows, mappings)
      if (dataset.points.length === 0) {
        setError(
          'Nessun punto dati valido trovato. Controlla il mapping delle colonne.'
        )
        return
      }
      saveTemplate(parseResult.headers, mappings)
      resetFilters()
      setWarnings(w)
      setDataset(dataset)
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante la normalizzazione.')
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setError(null)
    setWarnings([])
    setParseResult(null)
    setXlsxBuffer(null)
    setSheetNames([])
    setMappings([])
  }

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>Importa dati KappaSport</CardTitle>
        <p className="text-sm text-muted-foreground">
          Carica un file CSV o XLSX esportato da KappaSport per iniziare l&apos;analisi.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'upload' && (
          <FileUpload onFile={handleFile} isLoading={isLoading} />
        )}

        {step === 'sheet-select' && (
          <SheetSelector sheetNames={sheetNames} onSelect={handleSheetSelect} />
        )}

        {step === 'mapping' && parseResult && (
          <div className="space-y-6">
            <ColumnMapper
              mappings={mappings}
              sampleValues={getSampleValues(parseResult)}
              onChange={setMappings}
              onConfirm={handleConfirm}
              onCancel={reset}
              isLoading={isLoading}
            />
            <ImportPreview headers={parseResult.headers} rows={parseResult.rows} />
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Importazione completata con successo.
            </div>
            {warnings.length > 0 && (
              <Alert>
                <AlertCircle />
                <AlertDescription>
                  <ul className="space-y-0.5 pl-4 list-disc">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <Button variant="outline" onClick={reset}>
              <Upload />
              Importa un altro file
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
