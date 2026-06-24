# Piano di sviluppo — KappaSport Analytics Dashboard

> Documento di specifica da fornire a Claude Code.
> Obiettivo: costruire una web app stile Power BI per analizzare nel tempo e per metrica i dati dei giocatori esportati dal software KappaSport.

> **Stato avanzamento**
> - ✅ Fase 0 — Setup completato (scaffold Vite + React + TS + Tailwind + shadcn/ui, layout base, routing). Repo: `lome10/kappasport-analytics`, branch `dev`.
> - ▶️ Fase 1 — Import dati: **in corso**. Schema reale del formato KappaSport documentato in sezione 9 (da export Lecce 2024-25) → adattare parser e column mapper di conseguenza.
> - ⬜ Fasi 2–6 — da fare.

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

> **Importante:** lo schema reale del formato KappaSport in uso è ora documentato nella **sezione 9** (analizzato da un export Lecce 2024-25). Quel formato è lo standard di riferimento per i file presenti e futuri. In particolare: non contiene "test fisici" (solo GPS + cardio + carico), e la granularità è **per esercizio/drill**, non per giorno. Vedi sezione 9 per dettagli e regole di gestione.

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
    table/              # DataTable (componibile), ColumnPicker, ValueFilter
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
  sessionType: string;  // "Full Training" | "Partita" | "Possesso" | ... (campo "Categoria")
  exercise?: string;    // "Esercizio" — granularità reale: 1 riga = 1 drill/esercizio
  ampm?: 'AM' | 'PM';   // doppia seduta nello stesso giorno
  matchCycle?: string;  // "Ciclo Gara" (microciclo settimanale)
  isTeamAverage?: boolean; // riga aggregata generata da KappaSport, NON un giocatore reale
  values: Record<string, number | null>;  // key -> valore (durate convertite in secondi)
}

interface Player { id: string; name: string; position?: string; group?: string; }

interface Dataset {
  players: Player[];           // SOLO giocatori reali (Team Average escluso)
  teamAverage?: DataPoint[];   // benchmark squadra fornito da KappaSport, tenuto a parte
  metrics: MetricDefinition[];
  points: DataPoint[];         // SOLO righe di giocatori reali
  dateRange: { from: string; to: string };
}
```

> **Granularità (correzione rispetto all'ipotesi iniziale):** una riga NON è un giocatore-giorno, ma un **singolo esercizio/drill** all'interno di una sessione. Un giocatore ha più righe nello stesso giorno (diversi drill, eventualmente AM e PM). Le viste che ragionano per giorno o per sessione devono **aggregare** (somma per le metriche di volume come la distanza, media/max per le metriche di intensità). Prevedere in `metrics.ts` funzioni di aggregazione drill → sessione → giorno.

---

## 4-bis. Tabelle dinamiche e componibili (requisito trasversale centrale)

Questo è un comportamento chiave dello strumento, non un dettaglio di una singola vista: **è l'utente a comporre la tabella scegliendo al volo cosa vedere**, esattamente come nel pattern "field picker + slicer" di Power BI. Le tabelle non sono mai a colonne fisse.

Realizzare un componente riutilizzabile `DataTable` (in `components/table/`) con queste capacità:

- **Selettore di colonne (field picker):** l'utente attiva/disattiva qualsiasi metrica disponibile nel dataset; la tabella aggiunge/rimuove le colonne dinamicamente. Le metriche disponibili derivano dal `Dataset` importato (schema-agnostico), non da un elenco hardcodato.
- **Filtri sui valori (slicer):** per ogni colonna numerica, filtro per soglia/range (min–max); per le colonne categoriche (giocatore, tipo sessione), filtro per inclusione. I filtri sono combinabili (AND).
- **Ordinamento** per qualsiasi colonna, ascendente/discendente, multi-colonna se fattibile.
- **Raggruppamento opzionale** per giocatore o per tipo sessione, con righe di aggregato (media/somma) per gruppo.
- **Composizione persistente:** la configurazione della tabella (colonne attive, filtri, ordinamento) si salva come "vista" riutilizzabile e si conserva tra le sessioni (IndexedDB, vedi Fase 6).
- **Coerenza con i filtri globali:** la tabella parte dai dati già filtrati dalla barra globale (date range, categoria) e applica sopra i propri filtri locali di colonna.

Stato della tabella suggerito (in un hook `useTableConfig` o nello store):

```ts
interface TableConfig {
  visibleColumns: string[];                 // chiavi metriche attive
  sort: { key: string; dir: 'asc' | 'desc' }[];
  valueFilters: Record<string, { min?: number; max?: number; include?: string[] }>;
  groupBy?: 'player' | 'sessionType' | null;
}
```

> Implementare `DataTable` come componente generico guidato da `TableConfig`, così tutte le viste lo riusano passando dati e configurazione diversi, invece di reimplementare tabelle separate.

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
- **Tabella componibile** (`DataTable`, vedi sez. 4-bis): l'utente sceglie quali metriche mostrare come colonne, filtra sui valori e ordina liberamente. È il fulcro della vista, non un complemento.
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
- **Tabella comparativa componibile** (`DataTable`, vedi sez. 4-bis) con colonne scelte dall'utente, ranking e raggruppamento per giocatore.

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
- L'utente compone una tabella scegliendo le colonne (metriche) da mostrare, filtra sui valori e ordina; la tabella si ricompone in tempo reale e la configurazione si può salvare e riutilizzare.
- Cambiando il date range, tutti i grafici e le KPI si aggiornano.
- Gli alert su ACWR e z-score si attivano correttamente su dati di test.
- Nessun crash su file con colonne mancanti o valori sporchi: l'app degrada con messaggi chiari.
- Tutto funziona offline dopo il primo caricamento.

---

## 8. Note per Claude Code

- Procedi **una fase alla volta**, fermandoti per una verifica funzionale prima di proseguire.
- La Fase 1 (import + mapping) è la fondamenta: investici tempo e rendila robusta e agnostica rispetto allo schema.
- Tieni i tipi in `types/data.ts` come fonte di verità unica.
- Il componente `DataTable` (sez. 4-bis) è centrale: costruiscilo generico e guidato dallo schema del dataset importato, mai con colonne hardcodate. Tutte le viste con tabella lo riusano.
- Prima di scrivere i calcoli in `metrics.ts`, chiedi conferma sulle formule (le convenzioni su ACWR e carico variano tra staff).
- Se lo schema reale di KappaSport differisce dalle assunzioni qui sopra, adatta il mapping, **non** hardcodare le colonne.
- Lo schema reale è in **sezione 9**: usala come template di default del column mapper per il formato KappaSport/Lecce, ma lascia comunque l'utente libero di correggere il mapping per file leggermente diversi.

---

## 9. Schema di riferimento — formato KappaSport (analizzato da export Lecce 2024-25)

Questo è il **formato standard** dei file (presenti e futuri). L'export ha la tabella dati nel foglio `DB` (named table `TabellaDataset`). Gli altri fogli sono tabelle pivot già pronte in Excel — è il comportamento che l'app deve replicare.

**Forma dei dati:** ~9.900 righe, 73 colonne, 35 giocatori reali + 1 riga aggregata "Team Average", una stagione completa (nov → mag). **Granularità: una riga per esercizio/drill** (non per giorno).

### 9.1 Colonne — dimensioni e contesto

| Colonna | Ruolo | Note |
|---|---|---|
| `Giocatore` / `Atleta` | identificativo giocatore | "Team Average" = riga di sistema (vedi 9.4) |
| `Data` | data sessione | datetime; in CSV italiano sarà gg/mm/aaaa |
| `AM/PM` | turno | per gestire doppie sedute nello stesso giorno |
| `Giorno settimana` | derivabile dalla data | |
| `Squadra` | squadra | costante (US Lecce) |
| `Ruolo` | posizione | codici IT: PO, DC, EST B, ecc. |
| `n.maglia` | numero maglia | |
| `Sessione` | id/codice sessione | |
| `Esercizio` | nome drill | granularità della riga |
| `Categoria` | **tipo sessione/esercizio** | 100+ valori (Full Training, Partita, Possesso, Palle inattive…): è uno **slicer libero**, non il toggle GPS/cardio/carico |
| `Ciclo Gara` | microciclo | etichettato con la gara della settimana (es. "Lecce-Juventus") |
| `IN/OUT` | flag titolare/subentrato | spesso vuoto |
| `Torneo`, `Casa/Trasferta`, `Esito`, `Gara`, `Avversario`, `Giorni prima/dopo la gara` | contesto gara | popolati per le sessioni di tipo Partita |

### 9.2 Colonne — metriche, per categoria (per `MetricDefinition.category`)

- **GPS / fisiche (`gps`):** Distanza Tot (m), Dist >14/16/20/25 km/h, Vel max, AMP, %ED, N° Power Events, N° Acc/Dec >2,5 m/s², N° Sprint >25km/h, N°/D >90-95% Vmax, D Acc/Dec a varie soglie, MPmax, Energy J/kg, DIST EQ, an index, e tutte le metriche **per minuto** (D/min, Dist>14/min, VHIR, SPR, ACC, DEC /min), Max Acc, Max Dec.
- **Cardio (`hr`):** HrAvg, %HRAvg, HRmax, FC >85%, HR Z3 85-90, HR Z4 90-95, HR Z5 >95%. ⚠️ **Le zone FC e i tempi sono durate in formato orario (mm:ss), non numeri** — vedi 9.4.
- **Carico (`workload`):** RPE, Minutaggio, Training Load, T_MPHI.
- **Da ignorare:** `Colonna1`…`Colonna5`, `DRILL PROGRESSIVO`, `DATA/AMPM` (colonne tecniche/vuote).

> Aggiungere la categoria `hr` (cardio) all'enum `MetricCategory`: `'gps' | 'workload' | 'hr' | 'test'`. La categoria `test` resta nel modello ma in questo formato non è popolata.

### 9.3 Mappatura di default del column mapper

Precaricare questo mapping quando il file riconosciuto è in formato KappaSport (header che combaciano): `Atleta`/`Giocatore` → player, `Data` → date, `Categoria` → sessionType, `Esercizio` → exercise, `Ciclo Gara` → matchCycle, `AM/PM` → ampm; tutte le colonne metriche in 9.2 → `values` con la rispettiva categoria. L'utente può sempre rivedere il mapping prima di confermare.

### 9.4 Regole di gestione obbligatorie (insidie del formato)

1. **Riga "Team Average":** è un **dato aggregato generato direttamente da KappaSport** nell'estrazione GPS, presente in ogni export — non è un giocatore. In fase di import va **riconosciuta e separata**: NON entra nella lista giocatori né nei confronti, ma va conservata in `Dataset.teamAverage` e usata come **benchmark squadra già pronto** (es. overlay "giocatore vs media squadra" nelle viste, senza ricalcolarla). Rilevarla dal valore `Giocatore == "Team Average"`.
2. **Colonne orarie (mm:ss):** le zone FC, i tempi e affini arrivano come valori orari. Il parser deve **convertirle in secondi** (numerico) per poterle aggregare e graficare; mostrare poi all'utente in formato mm:ss tramite formatter. Non trattarle come testo.
3. **Granularità per drill:** aggregare correttamente quando la vista è per giorno/sessione — **somma** per i volumi (distanze, conteggi), **media o max** per le intensità (Vel max, %HRAvg). Funzioni in `metrics.ts`.
4. **`Categoria` come slicer libero:** non mapparla sui 3-4 toggle macro; esporla come filtro multi-valore popolato dinamicamente dai valori presenti nel file.
5. **Locale italiano nell'export CSV:** prevedere separatore di campo `;` e separatore decimale `,`. Il parser CSV deve gestirli (auto-detect del delimitatore + normalizzazione decimali).
6. **Celle vuote diffuse:** RPE/Minutaggio assenti nelle sessioni di solo monitoraggio; molte metriche vuote sulla riga Team Average. Gestire i `null` senza rompere medie e grafici.
