import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { ColumnMapping, Dataset } from '@/types/data'

// ── IndexedDB ─────────────────────────────────────────────────────────────────

const IDB_DATASET_KEY = 'kappasport_dataset_v1'

export async function saveDatasetToIDB(dataset: Dataset): Promise<void> {
  await idbSet(IDB_DATASET_KEY, dataset)
}

export async function loadDatasetFromIDB(): Promise<Dataset | null> {
  return (await idbGet<Dataset>(IDB_DATASET_KEY)) ?? null
}

export async function clearDatasetFromIDB(): Promise<void> {
  await idbDel(IDB_DATASET_KEY)
}

// ── localStorage — import templates ──────────────────────────────────────────

const STORAGE_KEY = 'kappasport_import_templates'

interface ImportTemplate {
  fingerprint: string
  mapping: ColumnMapping[]
  savedAt: string
}

function fingerprint(headers: string[]): string {
  return [...headers].sort().join('|')
}

function loadAll(): ImportTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ImportTemplate[]) : []
  } catch {
    return []
  }
}

function saveAll(templates: ImportTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // quota exceeded — silently ignore
  }
}

export function loadTemplate(headers: string[]): ColumnMapping[] | null {
  const fp = fingerprint(headers)
  return loadAll().find((t) => t.fingerprint === fp)?.mapping ?? null
}

export function saveTemplate(headers: string[], mapping: ColumnMapping[]): void {
  const fp = fingerprint(headers)
  const rest = loadAll().filter((t) => t.fingerprint !== fp)
  saveAll([...rest, { fingerprint: fp, mapping, savedAt: new Date().toISOString() }])
}
