# Piano di sviluppo — KappaSport Analytics Dashboard

> Documento di specifica da fornire a Claude Code.
> Obiettivo: costruire una web app stile Power BI per analizzare nel tempo e per metrica i dati dei giocatori esportati dal software KappaSport.

---

## 1. Obiettivo del progetto

Creare una single-page application che:

- importa file CSV/Excel esportati da KappaSport (upload manuale)
- normalizza e indicizza i dati in memoria nel browser
- permette di analizzare l'andamento dei giocatori nel tempo e per ogni caratteristica/metrica
- offre tre modalità di analisi con pari priorità: **confronto tra giocatori**, **evoluzione nel tempo del singolo giocatore**, **overview del gruppo/team**

L'app è **interamente client-side**: nessun backend, nessun database. I dati caricati restano nel browser dell'utente (sessione + opzionale persistenza in IndexedDB). Questo elimina costi di hosting e problemi di privacy sui dati atletici.

> **Assunzione modificabile:** se in futuro servisse multi-utente o salvataggio centralizzato, si può aggiungere un backend. Per ora non serve.

---

## 2. Categorie di dati attese da KappaSport

L'app deve gestire tre famiglie di metriche. Lo schema esatto delle colonne va dedotto a runtime dal file caricato (vedi fase 2), ma queste sono le categorie di riferimento:

1. **GPS / metriche fisiche** — distanza totale, distanza ad alta intensità, velocità massima/media, numero e intensità di accelerazioni e decelerazioni, sprint, ecc.
2. **Carico di lavoro (workload)** — RPE, carico interno (RPE × durata), ACWR (acute:chronic workload ratio), monotonia, strain.
3. **Test fisici / valutazioni periodiche** — salti, sprint test, forza, test di resistenza, misurazioni antropometriche, ecc. (dati più sporadici, non quotidiani).

Ogni riga di dato è in genere associata a: **giocatore**, **data**, **categoria/sessione** (allenamento, partita, test), e un set di **metriche numeriche**.

---

## 3. Stack tecnologico

- **Build:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Componenti UI:** shadcn/ui (Radix sotto)
- **Grafici:** Recharts (line, bar, radar, scatter) — leggero e dichiarativo
- **Parsing file:** PapaParse (CSV) + SheetJS / `xlsx` (Excel)
- **State management:** Zustand (semplice, niente boilerplate Redux)
- **Persistenza locale opzionale:** IndexedDB via `idb-keyval`
- **Date:** `date-fns`
- **Routing:** React Router (3 viste principali)

> Niente librerie pesanti di BI proprietarie. Recharts copre tutti i grafici che servono e resta personalizzabile.

---

## 4. Architettura e struttura cartelle

```
src/
  main.tsx
  App.tsx
  routes/
    Overview.tsx        # vista team/gruppo
    PlayerDetail.tsx    # evoluzione nel tempo singolo giocatore
    Compare.tsx         # confronto tra giocatori
  components/
    layout/             # Sidebar, Topbar, filtri globali
    upload/             # FileUpload, ColumnMapper, ImportPreview
    charts/             # LineMetricChart, BarChart, RadarChart, ScatterChart
    filters/            # DateRangePicker, PlayerSelect, MetricSelect, CategoryToggle
    cards/              # KpiCard, TrendCard
  store/
    dataStore.ts        # dataset normalizzato, in Zustand
    filterStore.ts      # filtri globali (date, giocatori, categoria)
  lib/
    parsers/            # csvParser.ts, xlsxParser.ts
    schema.ts           # inferenza tipo colonne, mapping
    metrics.ts          # calcoli derivati (ACWR, medie mobili, z-score)
    normalize.ts        # da righe grezze a modello interno
    persistence.ts      # IndexedDB load/save
  types/
    data.ts             # tipi: Player, Session, MetricValue, Dataset
  utils/
    format.ts, dates.ts
```

### Modello dati interno (in `types/data.ts`)

```ts
type MetricCategory = 'gps' | 'workload' | 'test';

interface MetricDefinition {
  key: string;          // es. "total_distance"
  label: string;        // etichetta leggibile
  unit: string;         // "m", "km/h", "AU"...
  category: MetricCategory;
}

interface DataPoint {
  playerId: string;
  date: string;         // ISO
  sessionType: string;  // "training" | "match" | "test" | ...
  values: Record<string, number | null>;  // key -> valore
}

interface Player { id: string; name: string; position?: string; group?: string; }

interface Dataset {
  players: Player[];
  metrics: MetricDefinition[];
  points: DataPoint[];
  dateRange: { from: string; to: string };
}
```

---

## 5. Fasi di sviluppo

Implementare in quest'ordine. Ogni fase deve essere funzionante e testabile prima di passare alla successiva.

### Fase 0 — Setup
- Inizializza Vite + React + TS + Tailwind + shadcn/ui.
- Layout base: sidebar con le 3 viste, topbar con barra filtri globale (placeholder).
- Routing tra Overview / PlayerDetail / Compare.

### Fase 1 — Import dati (il cuore del problema)
- Componente `FileUpload`: drag&drop di CSV/XLSX.
- Parser: PapaParse per CSV, SheetJS per Excel. Gestire più fogli Excel (chiedere all'utente quale foglio importare).
- **Inferenza schema** (`schema.ts`): rileva automaticamente quali colonne sono il nome giocatore, la data, il tipo sessione, e quali sono metriche numeriche.
- **Column Mapper UI**: schermata in cui l'utente conferma/corregge il mapping (es. "questa colonna = data", "questa = giocatore", "queste = metriche"). Salvare il mapping come template riutilizzabile per import futuri dello stesso formato.
- Anteprima delle prime righe prima di confermare l'import.
- Normalizzazione in `Dataset` e caricamento nello store.
- Gestione errori chiara: date non valide, valori non numerici, righe duplicate.

> Questa fase è la più delicata perché lo schema esatto di KappaSport non è ancora noto. Costruirla **agnostica rispetto alle colonne**, guidata dal mapping utente, non hardcodata.

### Fase 2 — Filtri globali
- Date range picker (con preset: ultimi 7/30 giorni, mese corrente, stagione).
- Selezione giocatori (multi-select).
- Toggle categoria (GPS / Workload / Test) e tipo sessione (allenamento/partita/test).
- I filtri vivono in `filterStore` e si applicano a tutte le viste.

### Fase 3 — Vista Overview (team/gruppo)
- Griglia di KPI card: medie/totali di gruppo per le metriche chiave nel periodo selezionato, con variazione % rispetto al periodo precedente.
- Tabella ordinabile giocatori × metriche.
- Grafico a barre per confrontare tutti i giocatori su una metrica selezionabile.
- Heatmap settimanale del carico per giocatore (opzionale ma molto utile).

### Fase 4 — Vista Player Detail (evoluzione nel tempo)
- Selezione giocatore.
- Line chart multi-metrica nel tempo con media mobile (7 giorni) sovrapposta.
- Calcoli derivati in `metrics.ts`: ACWR, monotonia, strain, z-score rispetto alla baseline del giocatore.
- Indicatori/alert: evidenzia quando ACWR esce dalla "sweet spot" (es. >1.5 o <0.8) o quando una metrica supera ±2 deviazioni standard.
- Radar chart dei test fisici per fotografare il profilo in una data.

### Fase 5 — Vista Compare (confronto giocatori)
- Selezione di 2–N giocatori.
- Line chart sovrapposto della stessa metrica per i giocatori scelti.
- Radar chart comparativo (utile per i test fisici).
- Scatter chart per correlare due metriche (es. distanza vs RPE) con un punto per giocatore.
- Tabella comparativa con ranking.

### Fase 6 — Rifinitura
- Persistenza in IndexedDB: ricarica automatica dell'ultimo dataset all'apertura.
- Export delle viste (PNG dei grafici, CSV dei dati filtrati).
- Stato vuoto curato: cosa mostrare prima del primo import.
- Responsive + accessibilità base (focus visibile, contrasto, navigazione tastiera).

---

## 6. Calcoli derivati da implementare (`metrics.ts`)

- **Carico interno** = RPE × durata sessione (minuti)
- **Acute load** = somma carico ultimi 7 giorni
- **Chronic load** = media settimanale carico ultime 4 settimane
- **ACWR** = acute / chronic
- **Monotonia** = media carico giornaliero / deviazione standard del carico nella settimana
- **Strain** = carico settimanale totale × monotonia
- **Media mobile** parametrica (finestra configurabile)
- **Z-score** per metrica rispetto alla baseline individuale del giocatore

Documentare le formule con commenti e citare la convenzione usata, così sono verificabili dallo staff tecnico.

---

## 7. Criteri di accettazione

- L'utente carica un CSV/Excel reale di KappaSport e completa l'import in meno di un minuto tramite il column mapper.
- Le tre viste mostrano dati coerenti rispetto ai filtri attivi.
- Cambiando il date range, tutti i grafici e le KPI si aggiornano.
- Gli alert su ACWR e z-score si attivano correttamente su dati di test.
- Nessun crash su file con colonne mancanti o valori sporchi: l'app degrada con messaggi chiari.
- Tutto funziona offline dopo il primo caricamento.

---

## 8. Note per Claude Code

- Procedi **una fase alla volta**, fermandoti per una verifica funzionale prima di proseguire.
- La Fase 1 (import + mapping) è la fondamenta: investici tempo e rendila robusta e agnostica rispetto allo schema.
- Tieni i tipi in `types/data.ts` come fonte di verità unica.
- Prima di scrivere i calcoli in `metrics.ts`, chiedi conferma sulle formule (le convenzioni su ACWR e carico variano tra staff).
- Se lo schema reale di KappaSport differisce dalle assunzioni qui sopra, adatta il mapping, **non** hardcodare le colonne.
