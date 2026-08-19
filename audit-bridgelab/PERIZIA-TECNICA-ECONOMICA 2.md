# Perizia tecnica ed economica indipendente — BridgeLab

**Destinatario:** Consiglio direttivo di una federazione sportiva  
**Data di osservazione:** 8 agosto 2026  
**Repository:** ramo `main`, HEAD `370a40aadb255663cee1e069b989d08bdeea7640`  
**Base dati:** interrogazioni aggregate in sola lettura, rilevate l'8 agosto 2026 alle 17:58:33 UTC  
**Valuta:** euro, IVA esclusa  
**Criterio di esposizione:** ogni dato è marcato come **MISURATO**, **CALCOLATO** o **STIMATO**. Quando il dato non è sostenibile con le evidenze disponibili è scritto **non determinabile**.

Il repository presentava modifiche locali non committate già esistenti. Le metriche Git riguardano i commit raggiungibili dai riferimenti validi; le metriche statiche riguardano il codice applicativo presente nella working tree alla data dell'esame. Non sono state alterate funzioni dell'applicazione: sono stati aggiunti soltanto script e documenti di audit nella cartella `audit-bridgelab/`.

## Sintesi per il Consiglio direttivo

BridgeLab non è un semplice sito informativo. **MISURATO:** comprende 59.574 righe di codice applicativo, 66 pagine instradabili, 90 componenti d'interfaccia, 8 file API con 9 handler HTTP e un database operativo di 32 tabelle. Il catalogo didattico vivo contiene 4 corsi, 16 mondi, 49 lezioni e 199 moduli; sono inoltre presenti 272 mani nel catalogo principale, 73 mani MiniBridge in sorgente e 2 mani guidate. Il database registra 57.325 risultati di gioco e 18.156 moduli completati. Questi volumi dimostrano ampiezza funzionale e uso reale, ma non dimostrano da soli qualità o correttezza didattica.

**MISURATO:** la storia valida raggiungibile contiene 211 commit, concentrati in 50 giorni di calendario tra l'8 febbraio e il 27 luglio 2026. Applicando alla lettera il metodo richiesto — sessione nuova dopo un intervallo superiore a 90 minuti, durata fra primo e ultimo commit più 30 minuti — risultano 80 sessioni e 83,59 ore. Questo è un **limite inferiore**, non una misura delle ore realmente lavorate: non vede progettazione, riunioni, studio, debug e lavoro non committato. Non è quindi usato come base economica della riproduzione.

La piattaforma compila in modalità produzione: `next build` ha completato correttamente la compilazione TypeScript e la generazione di 69 pagine statiche. La qualità ingegneristica media attribuita in questa perizia è però **2,08/5**. Il dato è **CALCOLATO** come media aritmetica di 12 giudizi motivati. I punti positivi sono il modello dati con vincoli, l'uso generalizzato di RLS, la separazione di alcuni motori di dominio e alcune misure di caching e accessibilità. I principali fattori di rischio sono: nessun test automatizzato, nessuna pipeline CI nel repository, README non specifico, 176 errori e 147 avvisi ESLint nel solo `src`, pagine molto grandi e una policy RLS che consente a qualunque utente autenticato di leggere l'intera cronologia dei login (`USING (true)`). Quest'ultima va corretta prima di un conferimento o di un ampliamento dell'uso istituzionale.

**MISURATO, solo aggregati:** gli utenti registrati sono 1.083. Gli utenti attivi mensili ricavati dalla cronologia login sono passati da 678 a marzo a 373 ad aprile, 312 a maggio, 298 a giugno e 236 a luglio; agosto è parziale, con 128 utenti fino all'8 del mese. Sono ricostruibili 3.031 completamenti lezione riferiti a 338 utenti. La retention “rolling” è **STIMATA mediante proxy** al 43,52% a 7 giorni e 31,47% a 30 giorni. Numero reale delle sessioni e tempo medio di sessione sono **non determinabile**: gli eventi disponibili non descrivono inizio e fine sessione e producono quasi esclusivamente sessioni artificiali di durata zero.

**STIMATO:** un team esterno di 2 sviluppatori senior, partendo da zero e ricevendo i contenuti e i diritti d'uso, impiegherebbe circa 4.800 ore-persona, equivalenti a 15 mesi a 160 ore mensili per sviluppatore. La sensibilità dell'effort a ±30% è 3.360–6.240 ore, cioè 10,5–19,5 mesi a capacità nominale invariata. Questa stima include riproduzione funzionale, non una certificazione formale del software.

I tre metodi economici divergono e restano separati:

- **A — costo di riproduzione:** da 201.600 a 624.000 euro nell'inviluppo di tre tariffe e della sensibilità dell'effort; scenario centrale 384.000 euro.
- **B — costo di sostituzione presso fornitore:** da 403.200 a 1.123.200 euro nell'inviluppo completo; scenario base a 100 euro/ora 720.000 euro.
- **C — valore d'uso triennale:** 49.495,55–84.055,55 euro, scenario base 66.775,55 euro. È molto inferiore perché un LMS generico non replica i motori e i contenuti specifici del bridge.

Per una deliberazione prudenziale, il **valore conferito alla Federazione** è collocato tra **288.000 e 576.000 euro**. Il limite inferiore è il metodo A con effort base e tariffa bassa; il limite superiore è il metodo B con perimetro base e tariffa fornitore bassa. Il metodo B è il più difendibile per la Federazione perché rappresenta il controfattuale concretamente rilevante: commissionare oggi a terzi una piattaforma equivalente. Il range finale usa comunque il suo scenario più prudente e non attribuisce avviamento, marchio, esclusiva sui contenuti o valore futuro degli utenti.

**Condizione raccomandata prima del conferimento:** correggere la policy della cronologia login, documentare ruoli e trattamento dati, introdurre test sui motori e sui flussi critici, rendere bloccante il lint in CI e produrre documentazione operativa. Queste attività non invalidano il valore funzionale rilevato, ma incidono sulla trasferibilità a un team terzo.

## 1. Perimetro e metodo

### 1.1 Cosa è stato esaminato

- repository Git e working tree del progetto web Next.js;
- schema e soli aggregati del database Supabase, tramite query di sola lettura;
- codice dei motori di bridge, progressione, gamification e ripasso;
- build di produzione, lint statico, inventario pagine/API/componenti;
- listini pubblici e riferimenti tariffari correnti, letti l'8 agosto 2026.

Non sono stati eseguiti login interattivi, non sono stati estratti record personali e non sono riportati email, nomi o identificativi utente. Gli autori Git sono pseudonimizzati.

### 1.2 Stato della working tree

**MISURATO:** la working tree non era pulita; erano presenti cancellazioni e file non tracciati preesistenti. Questo non altera la storia Git misurata, ma significa che il conteggio statico fotografa lo stato locale osservato, non necessariamente un rilascio pubblicato. Una reference remota con nome malformato faceva fallire `git rev-list --all`; è stata esclusa senza modificarla. Le metriche complessive sono state calcolate sull'unione dei commit raggiungibili dai 7 riferimenti validi.

## 2. Fase 1 — Metriche del repository

### 2.1 Storia Git

| Metrica | Valore | Natura |
|---|---:|---|
| Commit raggiungibili dai riferimenti validi | 211 | MISURATO |
| Commit sul ramo `main` | 210 | MISURATO |
| Autori pseudonimizzati | 2 | MISURATO |
| Commit Autore-10620de2 | 210 | MISURATO |
| Commit Autore-6a19acae | 1 | MISURATO |
| Primo commit | 8 febbraio 2026, 00:15:02 | MISURATO, Europe/Madrid |
| Ultimo commit | 27 luglio 2026, 23:27:24 | MISURATO, Europe/Madrid |
| Giorni di calendario con almeno un commit | 50 | MISURATO |
| Dimensione mediana commit | 121 righe aggiunte + rimosse | MISURATO |
| Righe aggiunte nella storia | 165.056 | MISURATO |
| Righe rimosse nella storia | 22.504 | MISURATO |
| Merge commit | 2 | MISURATO |
| Riferimenti branch validi | 7: 3 locali + 4 remoti | MISURATO |
| Branch logici distinti | 4 | MISURATO dopo normalizzazione del prefisso remoto |

I conteggi di righe Git ignorano 523 occorrenze di file binari in `numstat`; non sono righe di codice.

#### Distribuzione mensile dei commit

| Mese 2026 | Commit |
|---|---:|
| Febbraio | 53 |
| Marzo | 96 |
| Aprile | 7 |
| Maggio | 21 |
| Giugno | 20 |
| Luglio | 14 |

#### Distribuzione per fascia oraria

| Fascia, Europe/Madrid | Commit |
|---|---:|
| 00:00–05:59 | 52 |
| 06:00–11:59 | 47 |
| 12:00–17:59 | 68 |
| 18:00–23:59 | 44 |

#### File più modificati

| File | Commit che lo toccano | Righe aggiunte | Righe rimosse | Churn |
|---|---:|---:|---:|---:|
| `src/app/page.tsx` | 58 | 3.901 | 3.845 | 7.746 |
| `src/app/profilo/page.tsx` | 38 | 2.321 | 818 | 3.139 |
| `src/app/admin/page.tsx` | 33 | 2.655 | 830 | 3.485 |
| `src/app/lezioni/[lessonId]/[moduleId]/page.tsx` | 27 | 2.642 | 396 | 3.038 |
| `src/app/gioca/smazzata/page.tsx` | 26 | 1.473 | 282 | 1.755 |
| `src/components/desktop-sidebar.tsx` | 26 | 701 | 467 | 1.168 |
| `src/app/gioca/page.tsx` | 25 | 1.108 | 459 | 1.567 |
| `src/app/layout.tsx` | 22 | 315 | 101 | 416 |
| `src/app/gioca/sfida/page.tsx` | 21 | 646 | 96 | 742 |
| `src/app/classifica/page.tsx` | 20 | 1.988 | 608 | 2.596 |

Il numero di commit che toccano un file è usato come indicatore di volatilità, non come giudizio automatico di qualità.

### 2.2 Effort ricavato dai timestamp

**Regola prescritta:** per ciascun autore, i commit ordinati cronologicamente appartengono alla stessa sessione finché il gap non supera 90 minuti. Durata della sessione = ultimo timestamp − primo timestamp + 30 minuti di ramp-up; una sessione con un solo commit dura quindi 30 minuti.

| Risultato | Valore | Natura |
|---|---:|---|
| Sessioni | 80 | CALCOLATO dai timestamp |
| Minuti | 5.015 | CALCOLATO |
| Ore | 83,59 | CALCOLATO |

**Interpretazione obbligatoria:** 83,59 ore è un limite inferiore. Non cattura progettazione, ricerca, debug, preparazione contenuti, riunioni e lavoro non committato. Non va interpretato come tempo totale di sviluppo e non è usato per stimare il costo di sostituzione.

### 2.3 Righe per categoria e linguaggio

Sono esclusi `node_modules`, lockfile, build, asset generati, SQL di migrazione e `src/lib/supabase/types.ts` generato.

| Categoria | Linguaggio | File | Righe di codice/contenuto | Natura |
|---|---|---:|---:|---|
| Applicazione | TypeScript | 261 | 59.174 | MISURATO con cloc |
| Applicazione | CSS | 1 | 400 | MISURATO con cloc |
| **Applicazione totale** | — | **262** | **59.574** | MISURATO con cloc |
| Contenuti | TypeScript dati | 21 | 18.085 | MISURATO con cloc |
| Contenuti | Markdown | 4 | 2.192 | MISURATO con cloc |
| **Contenuti testuali cloc** | — | **25** | **20.277** | MISURATO con cloc |
| Sottotitoli | ASS | 49 | 7.012 righe fisiche | MISURATO con `wc -l`, non cloc |
| Configurazione | JSON | 4 | 178 | MISURATO con cloc |
| Configurazione | TypeScript | 2 | 120 | MISURATO con cloc |
| Configurazione | JavaScript | 2 | 20 | MISURATO con cloc |
| **Configurazione totale** | — | **8** | **318** | MISURATO con cloc |
| Test | — | 0 | 0 | MISURATO |

Le 59.574 righe applicative sono la cifra da usare nella tabella finale; contenuti e configurazione sono esposti separatamente per evitare di gonfiare la misura del software.

### 2.4 Inventario tecnico

| Elemento | Valore | Precisazione |
|---|---:|---|
| Componenti `.tsx` sotto `src/components` | 90 | MISURATO |
| Pagine/rotte con `page.tsx` | 66 | MISURATO |
| File di rotta API | 8 | MISURATO |
| Handler HTTP esportati | 9 | MISURATO |
| Tabelle pubbliche vive | 32 | MISURATO sul database |
| Tabelle con RLS attiva | 32 | MISURATO sul database |
| Policy RLS vive | 65 | MISURATO sul database |
| Indici pubblici | 93 | MISURATO sul database |
| Chiavi primarie | 32 | MISURATO sul database |
| Chiavi esterne | 36 | MISURATO sul database |
| Vincoli `CHECK` | 37 | MISURATO sul database |
| Vincoli `UNIQUE` | 16 | MISURATO sul database |
| Funzioni pubbliche | 26 | MISURATO sul database |
| Funzioni `SECURITY DEFINER` | 24 | MISURATO sul database |
| Migrazioni formali in `supabase/migrations` | 0 | MISURATO |
| Script SQL in `scripts/sql` | 22 | MISURATO; non equivalgono a una cronologia versionata |
| Occorrenze `CREATE POLICY` negli script | 37 | MISURATO; il database vivo è la fonte autorevole |
| Tabelle distinte create negli script | 12 | MISURATO |
| File test/spec in `src` | 0 | MISURATO |

La differenza fra 37 policy negli script e 65 policy vive indica che gli script locali non costituiscono una riproduzione completa e ordinata dello schema. La trasferibilità richiede una baseline o migrazione esportabile.

## 3. Fase 2 — Qualità e profondità architetturale

### 3.1 Valutazione 1–5

Scala: 1 = insufficiente o assente; 3 = adeguato ma con lacune; 5 = maturo, verificato e trasferibile.

| Voce | Punteggio | Evidenze e motivazione |
|---|---:|---|
| Separazione delle responsabilità | 2/5 | Esiste un catalog layer unico e cache-safe (`src/lib/catalog.ts:1-18`, `178-205`, `283-294`) e motori di dominio separati. Tuttavia la pagina modulo misura 2.246 righe, l'admin 1.825 e il torneo 1.640: presentazione, stato e logica restano spesso accorpati. |
| Modello dati e integrità referenziale | 4/5 | 32 PK, 36 FK, 37 `CHECK`, 16 `UNIQUE`; tutte le 32 tabelle hanno RLS. Punto debole: i completamenti ricostruiscono una chiave concatenata spezzando l'ultimo trattino (`src/hooks/use-supabase-sync.ts:97-109`), soluzione funzionante ma fragile e non normalizzata. |
| Autenticazione e autorizzazione | 3/5 | Il portale istruttori verifica sessione e ruolo lato server (`src/app/istruttori/layout.tsx:17-35`); le policy limitano classi e compiti. Il proxy protegge solo il prefisso admin (`src/proxy.ts:4`, `34-43`) e la pagina admin esegue anche un controllo client su un indirizzo configurato nel codice (`src/app/admin/page.tsx:599-612`). |
| Sicurezza | 2/5 | Positivi: RLS ovunque, client service-role dichiarato server-only (`src/lib/supabase/admin.ts:3-21`), header di sicurezza (`next.config.ts:33-58`), file `.env.local` ignorato. Criticità: `login_history` permette `SELECT USING (true)` agli autenticati (`scripts/sql/login-history.sql:30-36`); una policy insert su `profiles` ha `WITH CHECK true`; CSP ammette `unsafe-inline` e `unsafe-eval` (`next.config.ts:44-55`); le API BEN inoltrano input non validato strutturalmente (`src/app/api/ben/play/route.ts:7-25`). |
| Gestione degli errori | 2/5 | Sono presenti 4 boundary `error.tsx` e un `not-found.tsx`; esiste un logger centrale (`src/lib/log.ts:1-16`). Nel codice risultano 301 costrutti `catch` e 104 chiamate console, alcune silenziose; non è configurato un sistema di error monitoring osservabile. |
| Performance e caching | 3/5 | Fetch parallelo e cache del catalogo (`src/lib/catalog.ts:173-205`, `283-294`), service worker e cache navigazione (`next.config.ts:9-15`), cache lunga degli asset (`next.config.ts:60-76`), glossario ISR ogni 3.600 secondi (`src/app/glossario/page.tsx:4-12`). Le grandi pagine client aumentano rischio di bundle e re-render; non sono disponibili misure real-user nel repository. |
| Accessibilità | 3/5 | Lingua documento italiana e skip link (`src/app/layout.tsx:110`, `196-198`), pagina dedicata all'accessibilità. Non sono presenti test axe/Playwright o audit automatici, quindi la conformità WCAG complessiva non è dimostrata. |
| Internazionalizzazione | 1/5 | `lang="it"` è corretto per il prodotto attuale, ma testi e metadati sono codificati direttamente in italiano (`src/app/layout.tsx:110-120`); non è presente un catalogo di traduzioni o routing locale. |
| Copertura dei test | 1/5 | 0 file test/spec, nessuno script `test` e nessuna dipendenza Jest, Vitest, Playwright, Cypress o Testing Library. Copertura percentuale: **non determinabile** perché non esiste una suite da misurare. |
| CI/CD | 1/5 | 0 workflow in `.github/workflows`. La build locale passa, ma non c'è una pipeline versionata che renda obbligatori build, lint, test o migrazioni. |
| Documentazione | 1/5 | Il README è ancora il testo standard di `create-next-app` (`README.md:1-36`); non documenta architettura, schema, ruoli, deploy, recovery o onboarding. Esistono commenti utili nel codice, ma non una documentazione operativa. |
| Manutenibilità da team terzo | 2/5 | TypeScript è in modalità strict (`tsconfig.json:12`) e la build passa. Pesano però 176 errori e 147 warning ESLint in 100 dei 283 file analizzati, pagine molto grandi, assenza di test/CI/migrazioni complete e concentrazione di 210 commit su un solo autore pseudonimizzato. |

**Media CALCOLATA:** (2 + 4 + 3 + 2 + 2 + 3 + 3 + 1 + 1 + 1 + 1 + 2) / 12 = **2,08/5**.

La media non è uno standard certificativo; serve a rendere trasparente il giudizio comparativo. Non si assegna un punteggio aggiuntivo per la sola ampiezza funzionale, trattata separatamente.

### 3.2 Rischi tecnici prioritari

1. **Policy login da correggere.** Il nome dichiara “own login history”, ma la condizione è `true`. Un utente autenticato può quindi leggere l'intera tabella se i grant sottostanti lo consentono. La correzione attesa è una condizione di proprietà o una policy esclusivamente amministrativa, seguita da test RLS.
2. **Autorizzazione admin non uniforme.** Il portale istruttori ha un gate server-side a ruolo; l'admin principale combina protezione di sessione e controllo client. Serve un controllo server-side uniforme basato su ruolo, non su un valore personale codificato.
3. **Schema non riproducibile dal repository.** Non c'è una sequenza di migrazioni; 22 script idempotenti/coperti parzialmente non ricostruiscono le 65 policy vive.
4. **Regressioni non presidiate.** I motori di punteggio, presa, DDS e progressione non hanno test automatizzati, pur essendo la parte più sensibile al dominio.
5. **Debito statico.** La build TypeScript passa, ma il lint di `src` fallisce. Il risultato indica regole non soddisfatte, non necessariamente 176 difetti utente visibili; va comunque azzerato o formalmente baselineato prima di una presa in carico.

### 3.3 Componenti a reale complessità algoritmica

Le ore e i costi seguenti sono **STIMATI** e riguardano la riscrittura isolata, inclusi test di dominio minimi. Tariffa di conversione: 80 euro/ora. Non vanno sommati al costo totale senza eliminare sovrapposizioni.

| Componente | Cosa fa e sofisticazione | Evidenza | Riscrittura base | Sensibilità ±30% |
|---|---|---|---:|---:|
| Motore di gioco, IA, DDS, punteggio e diagnosi errori | Applica obbligo di risposta al seme, vincitore della presa, stato partita e IA euristica; include minimax alpha-beta, tabella di trasposizione, deduplicazione mosse, timeout e fallback euristico. È la parte più sofisticata, ma non un DDS industriale completo: la scelta carta esatta è limitata agli endgame e le posizioni grandi possono degradare a euristica. | `src/lib/bridge-engine.ts:108-170`, `246-285`, `498-631`; `src/lib/dds-solver.ts:275-395`, `470-610`, `648-669`; `src/lib/bridge-scoring.ts:79-167`, `169-284`; `src/lib/play-error-classifier.ts:95-218` | 480 h / 38.400 € | 336–624 h / 26.880–49.920 € |
| Generazione, codifica e validazione mani | Genera mazzi deterministici con PRNG e Fisher-Yates, supporta link di sfida, cataloghi filtrati e analisi MiniBridge. Sofisticazione media: correttezza combinatoria e riproducibilità sono più importanti della complessità computazionale. | `src/lib/hand-encoder.ts:22-107`; `src/lib/minibridge.ts:75-152` | 160 h / 12.800 € | 112–208 h / 8.960–16.640 € |
| Ripetizione dilazionata | Registra risposte errate e usa intervalli fissi 1, 3 e poi 7 giorni; rimuove l'elemento dopo risposta corretta. Funzionante, ma algoritmicamente semplice: non usa SM-2, difficoltà, stabilità della memoria o feedback adattivo. | `src/hooks/use-spaced-review.ts:28-40`, `106-188` | 40 h / 3.200 € | 28–52 h / 2.240–4.160 € |
| Gamification | Livelli XP, soglie, badge standard e segreti, streak, sfide settimanali e collezionabili. Ampiezza buona; regole prevalentemente a soglia, non un motore di regole generalizzato. | `src/lib/xp-levels.ts:2-47`; `src/components/achievement-popup.tsx:24-38`; `src/hooks/use-secret-achievements.ts:13-74` | 120 h / 9.600 € | 84–156 h / 6.720–12.480 € |
| Progressione didattica | Coordina catalogo corso→mondo→lezione→modulo, completamenti, XP, blocchi contenuto e ripasso. La complessità nasce dall'orchestrazione e dalla consistenza fra database, store locale e UI più che da un singolo algoritmo. | `src/lib/catalog.ts:1-18`, `178-205`, `283-307`; `src/hooks/use-supabase-sync.ts:88-109` | 200 h / 16.000 € | 140–260 h / 11.200–20.800 € |

**Assunzione algoritmi:** le ore base rappresentano una riscrittura da specifiche ricostruite, con test unitari minimi e senza certificazione WBF. Variazione dell'assunzione di effort −30% / +30%: colonne di sensibilità sopra.

### 3.4 Tempo di replica da parte di 2 senior

**Assunzione dichiarata:** i contenuti didattici, gli asset e i diritti d'uso sono consegnati al team; non è richiesta la loro riscrittura editoriale. WBS: core/dati/sicurezza 1.100 h; UI/PWA/mobile e 66 rotte 1.000 h; catalogo/contenuti/admin 700 h; motori e modalità di gioco 900 h; social/istruttori/classi 500 h; QA/accessibilità/DevOps/documentazione 600 h. Totale 4.800 h.

**Sensibilità effort ±30%:** 3.360 / 4.800 / 6.240 ore-persona.

**Assunzione di conversione calendario:** 160 ore per sviluppatore/mese. Con due sviluppatori: 15 mesi base. Se varia soltanto l'effort ±30%: 10,5 / 15 / 19,5 mesi. Se varia soltanto la capacità mensile ±30% (112 / 160 / 208 ore): 21,43 / 15 / 11,54 mesi. Il tempo di calendario può aumentare per approvazioni federali, disponibilità contenuti e collaudo con esperti di bridge.

## 4. Fase 3 — Profondità di prodotto

### 4.1 Contenuti e funzioni effettivamente presenti

Il database vivo è fonte prioritaria; i dati statici sono usati per elementi non presenti nelle tabelle.

| Unità | Quantità | Stato osservabile |
|---|---:|---|
| Corsi | 4 | Funzionanti nel catalogo vivo |
| Mondi didattici | 16 | Funzionanti nel catalogo vivo |
| Lezioni | 49 | Funzionanti; 3.031 completamenti lezione ricostruiti |
| Moduli | 199 | Funzionanti; 100 teoria, 49 quiz, 40 esercizio, 10 pratica |
| Blocchi contenuto nei moduli | 1.093 | Funzionanti nel database vivo |
| Tipologie quiz inline | 5 | `quiz`, vero/falso, selezione carta, valutazione mano, selezione licita |
| Domande di comprensione statiche | 111 in 37 set lezione | Implementate in sorgente |
| Scenari pratica licita | 20 | Implementati in sorgente |
| Scenari impasse | 32 | Implementati in sorgente |
| Eserciziario | 31 esercizi / 150 blocchi | Funzionante nel database vivo |
| “Trova l'errore” | 32 scenari | Funzionante nel database vivo |
| Mani catalogo principale | 272 | Funzionanti nel database vivo |
| Mani MiniBridge WBF | 73 | Implementate in sorgente |
| Mani guidate | 2 | Funzionanti ma contenuto molto limitato |
| Voci glossario | 49 | Funzionanti nel database vivo |
| Badge standard | 13 | Implementati |
| Achievement segreti | 10 | Implementati |
| Sfide/badge settimanali | 12 / 12 nomi badge | Funzionanti nel database vivo |
| Livelli XP | 36 | Implementati |
| Carte collezionabili | 22 | Catalogo funzionante; acquisto/possesso principalmente client-side |
| Schermate instradabili | 66 | Compilano; non tutte collaudate end-to-end in questa perizia |

**CALCOLATO:** 272 + 73 + 2 = 347 voci di mani precaricate nei tre cataloghi. Non è stata eseguita una deduplicazione per distribuzione delle 52 carte fra cataloghi; il numero di mani realmente distinte è quindi **non determinabile**. Nel sorgente il catalogo principale statico contiene 267 mani validate e 255 dopo filtro di plausibilità, mentre il database ne contiene 272: il database è considerato autorevole per il prodotto vivo.

Distribuzione dei 199 moduli per corso: Cuori gioco 10 lezioni/32 moduli; Cuori licita 14/28; Fiori 13/91; Quadri 12/48.

Distribuzione dei 1.093 blocchi: 323 testo, 230 quiz, 159 regola, 123 esempio, 120 titolo, 43 vero/falso, 41 selezione licita, 33 suggerimento, 11 selezione carta, 10 valutazione mano.

### 4.2 Flussi utente completi e parti abbozzate

**Criterio di completezza dichiarato:** un flusso è contato quando esistono schermata d'ingresso, logica di azione, esito/persistenza o ritorno visibile; la build deve compilare e, per i flussi persistenti, deve esistere evidenza aggregata nel database. Non è equivalenza a collaudo UX.

**10 flussi completi verificabili dal codice:** (1) registrazione/login/recupero e profilo; (2) navigazione corso→lezione→modulo→completamento; (3) gioco mano→risultato→progressione; (4) mano del giorno/sfida settimanale; (5) ricerca amico→richiesta→accettazione→sfida; (6) forum post→commento/like/sondaggio; (7) domanda istruttore→revisione admin; (8) creazione/adesione classe→compito→messaggistica; (9) ricerca e consultazione circolo; (10) errore didattico→coda di ripasso→riprova.

Evidenza di persistenza aggregata: 1.083 profili, 18.156 completamenti modulo, 57.325 risultati gioco, 501 sfide, 144 relazioni di amicizia, 17 post, 27 commenti, 65 voti a sondaggi, 15 richieste istruttore, 15 classi, 52 adesioni, 14 compiti, 7 messaggi classe e 121 elementi di ripasso.

**Abbozzato o limitato:**

- Mani guidate: solo 2 unità; il flusso funziona ma non costituisce ancora una libreria ampia.
- Cuori licita: 14 lezioni e 28 moduli, ma 0 mani dedicate nel catalogo statico delle smazzate; la profondità di pratica non è allineata agli altri corsi.
- Push: tabella e codice esistono, ma 0 sottoscrizioni vive; l'effettiva operatività su dispositivi reali non è dimostrata.
- Negozio/collezione: 22 carte sono presenti, ma parte dello stato è client-side; auditabilità e portabilità cross-device richiedono verifica ulteriore.
- Analytics di sessione: non è un flusso utente, ma è una funzione prodotto incompleta per uso istituzionale; mancano eventi affidabili di session start/end.

## 5. Fase 4 — Dati di utilizzo, solo aggregati

### 5.1 Quadro generale

| Metrica | Valore | Natura e cautela |
|---|---:|---|
| Utenti registrati | 1.083 | MISURATO su `auth.users` |
| Profili | 1.083 | MISURATO |
| Eventi login | 10.174 | MISURATO; non equivalgono a sessioni |
| Minuti visibili cumulativi | 469.879 | MISURATO come somma contatore profili; non è tempo sessione |
| Righe completamento modulo | 18.156 | MISURATO |
| Coppie utente-lezione completata | 3.031 | CALCOLATO sui requisiti modulo attuali |
| Utenti con almeno una lezione completata | 338 | CALCOLATO |
| Sessioni reali | **non determinabile** | Telemetria insufficiente |
| Tempo medio di sessione | **non determinabile** | Telemetria insufficiente |

Il contatore minuti aumenta di 0,5 ogni 30 secondi quando la scheda è visibile (`src/hooks/use-activity-tracker.ts:5-26`). È cumulativo e client-side: utile come indicatore di esposizione, non come ricostruzione di singole sessioni.

### 5.2 Registrazioni, crescita e utenti attivi mensili

| Mese 2026 | Nuove registrazioni | Crescita sul mese precedente | Utenti attivi da login | Eventi login |
|---|---:|---:|---:|---:|
| Febbraio | 19 | non determinabile | 9 | 9 |
| Marzo | 668 | +3.415,79% | 678 | 1.781 |
| Aprile | 165 | −75,30% | 373 | 2.001 |
| Maggio | 108 | −34,55% | 312 | 2.021 |
| Giugno | 66 | −38,89% | 298 | 1.895 |
| Luglio | 47 | −28,79% | 236 | 1.957 |
| Agosto, giorni 1–8 | 10 | −78,72% | 128 | 510 |

Agosto è un mese parziale e non va confrontato direttamente con mesi completi. Il picco di marzo è coerente con un lancio o importazione, ma la causa è **non determinabile** dai soli aggregati.

### 5.3 Lezioni completate

Il completamento è ricostruito concatenando `lesson_id` e `module_id` come fa l'applicazione e verificando che per una coppia utente-lezione siano presenti tutti i moduli oggi richiesti. Tutte le 18.156 righe hanno trovato corrispondenza; 0 righe non corrispondenti.

| Mese 2026 | Lezioni completate |
|---|---:|
| Febbraio | 16 |
| Marzo | 1.066 |
| Aprile | 546 |
| Maggio | 567 |
| Giugno | 389 |
| Luglio | 383 |
| Agosto, giorni 1–8 | 64 |

Il valore mensile usa come data di completamento della lezione il timestamp dell'ultimo modulo necessario. Se i requisiti di una lezione sono cambiati nel tempo, il dato storico può cambiare.

### 5.4 Retention

**Assunzione dichiarata:** retention rolling a N giorni = utente registrato da almeno N giorni che presenta almeno un evento login a partire da `created_at + N giorni`. Non è retention “exact day” e `login_history` include backfill/aggiornamenti che possono non coincidere con una visita intenzionale.

| Soglia | Utenti eleggibili | Ritenuti | Retention rolling |
|---|---:|---:|---:|
| 5 giorni, −30% rispetto a 7 | 1.076 | 485 | 45,07% |
| **7 giorni** | **1.073** | **467** | **43,52%** |
| 9 giorni, +30% arrotondato | 1.072 | 457 | 42,63% |
| 21 giorni, −30% rispetto a 30 | 1.053 | 373 | 35,42% |
| **30 giorni** | **1.036** | **326** | **31,47%** |
| 39 giorni, +30% | 1.026 | 301 | 29,34% |

Questi valori sono **STIMATI mediante proxy**. La sensibilità richiesta è riportata variando la soglia temporale di ±30%; non corregge l'eventuale bias della sorgente login.

### 5.5 Perché sessioni e durata sono non determinabili

È stato tentato un sessionamento degli eventi login con gap di 21, 30 e 39 minuti. In tutti e tre i casi risultano 10.162 sessioni inferite, ma 10.152 contengono un solo evento; media e mediana risultano 0,00 minuti. La stabilità apparente al variare del gap è proprio l'evidenza che la sorgente non contiene heartbeat o evento di uscita. Riportare 10.162 come numero di sessioni reali sarebbe fuorviante; il dato è quindi **non determinabile**.

## 6. Fase 5 — Valutazione economica

### 6.1 Fonti e tariffe

Il riferimento commerciale italiano consultato colloca un full-stack senior freelance intorno a 70–90 euro/ora e uno sviluppatore senior in software house a 80–150 euro/ora. Un contratto pubblico ISTAT del 2026 mostra, per confronto, tariffe di volume molto più basse: 250 euro/giorno per ICT Consultant Senior e 220 euro/giorno per Cloud Application Specialist. La distanza fra i riferimenti conferma che tariffa individuale e prezzo di un fornitore strutturato non sono intercambiabili.

Fonti: [benchmark freelance italiano 2026](https://systemforge.it/blog/tariffe-programmatore-freelance-italia-2026/), [benchmark software house 2025](https://systemforge.it/blog/quanto-costa-sviluppare-software-italia-2025/), [contratto pubblico ISTAT 2026](https://www.istat.it/wp-content/uploads/2026/02/Contratto-28-del-26-02-2026.pdf). I primi due sono fonti commerciali, non listini regolati; per questo le tariffe sono trattate come scenari.

Per il metodo A si usano **60 / 80 / 100 euro/ora**. Per il metodo B, che include struttura di fornitura, **80 / 100 / 120 euro/ora**. Importi IVA esclusa.

### 6.2 Assunzioni e sensibilità

| Assunzione | Base | −30% | +30% | Effetto principale |
|---|---:|---:|---:|---|
| Effort di replica | 4.800 h | 3.360 h | 6.240 h | Moltiplica i costi A |
| Perimetro fornitore, inclusi overhead | 7.200 h | 5.040 h | 9.360 h | Moltiplica i costi B |
| Capacità per sviluppatore/mese | 160 h | 112 h | 208 h | Tempo: 21,43 / 15 / 11,54 mesi |
| Licenza LMS comparabile | 7.771,13 € / 3 anni | 5.439,79 € | 10.102,47 € | Componente C |
| Hosting base | 1.404,42 € / 3 anni | 983,09 € | 1.825,75 € | Componente C |
| Manutenzione | 20 h/mese a 80 €/h | 14 h/mese, 40.320 € | 26 h/mese, 74.880 € | Componente C |

**Assunzione perimetro B:** alle 4.800 ore di implementazione si aggiungono analisi 10%, UX/solution design 10%, QA e sicurezza indipendenti 15%, project management 15%, per un totale base di 7.200 ore. La sensibilità ±30% è applicata al totale, non cumulata con ogni singola percentuale.

**Assunzione LMS comparabile:** LearnWorlds Learning Center, 249 USD/mese con fatturazione annuale e capacità dichiarata di 2.000 active learners/mese, è usato come proxy generico. È compatibile con il massimo misurato di 678 utenti attivi mensili, ma non contiene i motori specifici di bridge. [Listino LearnWorlds](https://www.learnworlds.com/pricing/).

**Assunzione hosting:** un progetto Vercel Pro da 20 USD/mese più Supabase Pro da 25 USD/mese, senza extra a consumo. Sono prezzi minimi pubblici, non fatture BridgeLab. [Vercel](https://vercel.com/pricing), [Supabase](https://supabase.com/pricing).

Conversione: 1 euro = 1,1535 USD, tasso BCE del 7 agosto 2026. [Serie storica BCE](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml).

### 6.3 Metodo A — Costo di riproduzione

Formula: ore di replica × tariffa senior. Il range in ogni cella è effort −30% / base / +30%.

| Tariffa | Costo −30% | Costo base | Costo +30% |
|---:|---:|---:|---:|
| 60 €/h | 201.600 € | 288.000 € | 374.400 € |
| 80 €/h | 268.800 € | **384.000 €** | 499.200 € |
| 100 €/h | 336.000 € | 480.000 € | 624.000 € |

**Range metodo A:** 201.600–624.000 euro. Il valore centrale 384.000 euro usa 4.800 ore e 80 euro/ora.

### 6.4 Metodo B — Costo di sostituzione presso fornitore

Formula: 7.200 ore base, comprensive delle funzioni non strettamente di coding, × tariffa fornitore. Il range in ogni cella è perimetro −30% / base / +30%.

| Tariffa fornitore | Costo −30% | Costo base | Costo +30% |
|---:|---:|---:|---:|
| 80 €/h | 403.200 € | **576.000 €** | 748.800 € |
| 100 €/h | 504.000 € | **720.000 €** | 936.000 € |
| 120 €/h | 604.800 € | 864.000 € | 1.123.200 € |

**Range metodo B:** 403.200–1.123.200 euro. È il metodo più aderente a una commissione federale attuale, ma presuppone requisiti e contenuti disponibili; gara, vincoli amministrativi, certificazioni o supporto pluriennale possono cambiare il prezzo.

### 6.5 Metodo C — Valore d'uso triennale

| Componente, 36 mesi | Base | Sensibilità −30% / +30% |
|---|---:|---:|
| Licenza LMS comparabile | 7.771,13 € | 5.439,79–10.102,47 € |
| Hosting Vercel + Supabase | 1.404,42 € | 983,09–1.825,75 € |
| Manutenzione, 20 h/mese × 80 €/h | 57.600,00 € | 40.320,00–74.880,00 € |
| **Totale** | **66.775,55 €** | **49.495,55–84.055,55 €** |

La sensibilità totale varia la sola manutenzione, componente assunta dominante; le righe licenza e hosting mostrano anche la propria variazione separata. Il metodo C misura il costo operativo equivalente di una soluzione didattica generica, non il valore di ricostruzione dei motori di bridge. La divergenza con A e B è quindi strutturale e non va eliminata facendo una media.

### 6.6 Range prudenziale del valore conferito

**STIMATO: 288.000–576.000 euro, IVA esclusa.**

- 288.000 euro = 4.800 ore di riproduzione × 60 euro/ora, metodo A in scenario base prudente.
- 576.000 euro = 7.200 ore di sostituzione × 80 euro/ora, metodo B in scenario base prudente.

Il metodo B è considerato più difendibile perché il Consiglio deve confrontare il bene ricevuto con quanto costerebbe commissionarlo oggi a un fornitore responsabile di analisi, design, QA e project management. Il metodo A mantiene un utile limite inferiore; il metodo C dimostra il solo valore d'uso generico e non è adatto a valorizzare la specificità algoritmica e didattica.

Il range non include valore del marchio, avviamento, esclusiva dei contenuti, dati personali, potenziale commerciale futuro, risparmio fiscale o valore reputazionale. Non applica premi per la base utenti e non sottrae un costo puntuale di bonifica, che richiederebbe un capitolato separato.

## Tabella riassuntiva finale

| Ore stimate | Commit | Righe di codice applicativo | Giorni di lavoro attivi | Punteggio medio qualità | Valore stimato prudenziale |
|---:|---:|---:|---:|---:|---:|
| 4.800 h di replica; 83,59 h timestamp come limite inferiore | 211 | 59.574 | 50 | 2,08/5 | 288.000–576.000 € |

## Limiti della presente analisi

Questa perizia non può dimostrare la correttezza didattica dei contenuti, la conformità completa a WCAG/GDPR, l'assenza di vulnerabilità, la titolarità dei diritti su codice e materiali, l'effettiva capacità dell'infrastruttura sotto carico, la disponibilità dei servizi esterni, la parità fra working tree e produzione, né l'assenza di costi o lavoro svolto fuori da Git. Non è stato eseguito un penetration test, un collaudo end-to-end autenticato, un audit contabile delle fatture cloud o una due diligence legale. Le sessioni e la durata media sono non determinabili con la telemetria presente. La retention è un proxy basato su login e può essere distorta da backfill o aggiornamenti tecnici. Le stime di riscrittura dipendono dall'assunzione che contenuti e diritti siano consegnati al team; variazioni di requisiti, certificazione, app native o supporto aumentano tempi e costi. I listini SaaS sono pubblici e correnti alla data dell'analisi ma possono cambiare. La valutazione economica non è una perizia giurata e non sostituisce una valutazione fiscale, legale o patrimoniale.

---

## Appendice A — Comandi, query e output grezzi

I comandi sono stati eseguiti dalla radice del repository. Gli output database sono riportati esclusivamente come aggregati. I wrapper del connettore che avvertono che l'output SQL è “untrusted data” sono omessi; il payload JSON numerico è riportato senza trasformazioni.

### A.1 Git ed effort timestamp

Comando:

```bash
node audit-bridgelab/collect-git-metrics.mjs
```

Output grezzo:

```json
{
  "ambito": {
    "ramo_corrente": "main",
    "head": "370a40aadb255663cee1e069b989d08bdeea7640",
    "riferimenti_branch_validi": [
      "refs/heads/main",
      "refs/heads/perf/tier0-quickwins",
      "refs/heads/redesign/ui-v2",
      "refs/remotes/origin/main",
      "refs/remotes/origin/perf/tier0-quickwins",
      "refs/remotes/origin/redesign/ui-v2",
      "refs/remotes/origin/vercel/vercel-web-analytics-to-nextjs-wy0msr"
    ],
    "riferimenti_non_validi": [],
    "nota": "Metriche calcolate sull'unione dei commit raggiungibili dai riferimenti branch validi; ref non validi esclusi."
  },
  "git": {
    "commit_totali": 211,
    "commit_per_autore_pseudonimizzato": {
      "Autore-10620de2": 210,
      "Autore-6a19acae": 1
    },
    "primo_commit": {
      "hash": "6471b4830500b3c64004696a9258145486a998ce",
      "timestamp_Europe_Madrid": "2026-02-08 00:15:02"
    },
    "ultimo_commit": {
      "hash": "370a40aadb255663cee1e069b989d08bdeea7640",
      "timestamp_Europe_Madrid": "2026-07-27 23:27:24"
    },
    "giorni_calendario_attivi": 50,
    "commit_per_mese": {
      "2026-02": 53,
      "2026-03": 96,
      "2026-04": 7,
      "2026-05": 21,
      "2026-06": 20,
      "2026-07": 14
    },
    "commit_per_fascia_oraria_Europe_Madrid": {
      "00-05": 52,
      "06-11": 47,
      "12-17": 68,
      "18-23": 44
    },
    "dimensione_commit_mediana_righe_aggiunte_piu_rimosse": 121,
    "righe_aggiunte_totali": 165056,
    "righe_rimosse_totali": 22504,
    "occorrenze_file_binari_ignorate_nel_conteggio_righe": 523,
    "file_piu_modificati_per_numero_commit": [
      {"path":"src/app/page.tsx","commits":58,"added":3901,"removed":3845,"churn":7746},
      {"path":"src/app/profilo/page.tsx","commits":38,"added":2321,"removed":818,"churn":3139},
      {"path":"src/app/admin/page.tsx","commits":33,"added":2655,"removed":830,"churn":3485},
      {"path":"src/app/lezioni/[lessonId]/[moduleId]/page.tsx","commits":27,"added":2642,"removed":396,"churn":3038},
      {"path":"src/app/gioca/smazzata/page.tsx","commits":26,"added":1473,"removed":282,"churn":1755},
      {"path":"src/components/desktop-sidebar.tsx","commits":26,"added":701,"removed":467,"churn":1168},
      {"path":"src/app/gioca/page.tsx","commits":25,"added":1108,"removed":459,"churn":1567},
      {"path":"src/app/layout.tsx","commits":22,"added":315,"removed":101,"churn":416},
      {"path":"src/app/gioca/sfida/page.tsx","commits":21,"added":646,"removed":96,"churn":742},
      {"path":"src/app/classifica/page.tsx","commits":20,"added":1988,"removed":608,"churn":2596},
      {"path":"src/components/bridge/bridge-table.tsx","commits":19,"added":509,"removed":129,"churn":638},
      {"path":"src/app/gioca/mano-del-giorno/page.tsx","commits":18,"added":1746,"removed":176,"churn":1922},
      {"path":"src/app/login/page.tsx","commits":18,"added":652,"removed":141,"churn":793},
      {"path":"src/app/impostazioni/page.tsx","commits":17,"added":1014,"removed":273,"churn":1287},
      {"path":"src/components/desktop-nav.tsx","commits":16,"added":305,"removed":112,"churn":417}
    ],
    "branch_locali_validi": 3,
    "branch_remoti_validi": 4,
    "branch_validi_totali": 7,
    "merge_commit": 2
  },
  "effort_timestamp": {
    "regola": "Per autore: nuova sessione se gap > 90 minuti; durata = ultimo-primo commit + 30 minuti; sessione singola = 30 minuti.",
    "sessioni": 80,
    "minuti_totali": 5015,
    "ore_totali": 83.59,
    "qualificazione": "Limite inferiore: non cattura progettazione, debug e lavoro non committato."
  }
}
```

Comandi di controllo branch:

```bash
git rev-list main --count
git for-each-ref --format='%(refname)' refs/heads refs/remotes | while IFS= read -r ref; do git rev-parse --verify "$ref^{commit}" >/dev/null 2>&1 && printf '%s\n' "$ref"; done | wc -l
git for-each-ref --format='%(refname:short)' refs/heads refs/remotes | while IFS= read -r ref; do git rev-parse --verify "$ref^{commit}" >/dev/null 2>&1 && printf '%s\n' "$ref"; done | sed -E 's#^origin/##' | sort -u
git rev-list --all --count
```

Output grezzo:

```text
210
7
main
perf/tier0-quickwins
redesign/ui-v2
vercel/vercel-web-analytics-to-nextjs-wy0msr
fatal: bad object refs/remotes/origin/main 2
```

L'ultimo comando documenta il riferimento malformato. Non è stato corretto o cancellato durante l'audit.

### A.2 cloc e inventario statico

Comandi:

```bash
npx --yes cloc src/app src/components src/contexts src/hooks src/lib src/store src/proxy.ts --fullpath --not-match-f='src/lib/supabase/types\.ts$' --exclude-dir=node_modules,.next,.next.nosync,build,dist --exclude-ext=lock --hide-rate
npx --yes cloc src/data cuori-gioco-knowledge.md cuori-licita-knowledge.md fiori-knowledge.md quadri-knowledge.md public/captions --include-ext=ts,md,ass --hide-rate
npx --yes cloc package.json components.json tsconfig.json vercel.json next.config.ts capacitor.config.ts eslint.config.mjs postcss.config.mjs --exclude-ext=lock --hide-rate
find public/captions -type f -name '*.ass' -print0 | xargs -0 wc -l | tail -n 1
find public/captions -type f -name '*.ass' | wc -l
```

Output grezzo:

```text
github.com/AlDanial/cloc v 2.06
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                     261           5342           2825          59174
CSS                              1             49             50            400
-------------------------------------------------------------------------------
SUM:                           262           5391           2875          59574
-------------------------------------------------------------------------------
github.com/AlDanial/cloc v 2.06
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                      21            551            766          18085
Markdown                         4            487              0           2192
-------------------------------------------------------------------------------
SUM:                            25           1038            766          20277
-------------------------------------------------------------------------------
github.com/AlDanial/cloc v 2.06
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JSON                             4              0              0            178
TypeScript                       2              7              9            120
JavaScript                       2              3              2             20
-------------------------------------------------------------------------------
SUM:                             8             10             11            318
-------------------------------------------------------------------------------
7012 total
49
```

Comandi di inventario:

```bash
find src/components -type f -name '*.tsx' | wc -l
find src/app -type f -name 'page.tsx' | wc -l
find src/app/api -type f -name 'route.ts' | wc -l
rg -o 'export (async function|const) (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)' src/app/api --glob 'route.ts' | wc -l
find scripts/sql -type f -name '*.sql' | wc -l
rg -i -o 'create\s+policy' scripts/sql --glob '*.sql' | wc -l
rg -i -o 'create\s+table(\s+if\s+not\s+exists)?\s+([a-zA-Z0-9_.]+)' scripts/sql --glob '*.sql' | sed -E 's/.*[[:space:]]+([A-Za-z0-9_.]+)$/\1/' | sort -u | wc -l
find supabase/migrations -type f -name '*.sql' 2>/dev/null | wc -l
find src -type f \( -name '*.test.*' -o -name '*.spec.*' \) | wc -l
find .github/workflows -type f 2>/dev/null | wc -l
```

Output grezzo, nello stesso ordine:

```text
90
66
8
9
22
37
12
0
0
0
```

Comando per le pagine più grandi:

```bash
find src/app -type f -name 'page.tsx' -print0 | xargs -0 wc -l | sort -nr | head -n 12
```

Output grezzo:

```text
37275 total
2246 src/app/lezioni/[lessonId]/[moduleId]/page.tsx
1825 src/app/admin/page.tsx
1640 src/app/gioca/torneo/page.tsx
1570 src/app/gioca/mano-del-giorno/page.tsx
1503 src/app/profilo/page.tsx
1380 src/app/classifica/page.tsx
1191 src/app/gioca/smazzata/page.tsx
1171 src/app/gioca/quiz-lampo/page.tsx
1170 src/app/gioca/sfida-imp/page.tsx
1016 src/app/gioca/sfida-amico/page.tsx
929 src/app/gioca/trova-errore/page.tsx
```

Comando test/package:

```bash
node -e "const p=require('./package.json'); console.log(JSON.stringify({scripts:p.scripts,testScript:p.scripts?.test??null,testDependencies:Object.keys({...p.dependencies,...p.devDependencies}).filter(k=>/(jest|vitest|playwright|cypress|testing-library)/i.test(k))},null,2))"
```

Output grezzo:

```json
{
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack",
    "generate-icons": "node scripts/generate-icons.mjs",
    "start": "next start",
    "lint": "eslint",
    "audit:lessons": "npx --yes tsx scripts/audit-lesson-content.ts",
    "review:lessons": "npx --yes tsx scripts/generate-review-doc.ts",
    "seed:supabase": "npx --yes tsx scripts/seed-supabase.ts"
  },
  "testScript": null,
  "testDependencies": []
}
```

### A.3 Inventario prodotto statico

Comando:

```bash
npx --yes tsx audit-bridgelab/collect-static-product-metrics.ts
```

Output grezzo:

```json
{
  "repository_static_content": {
    "courses": 4,
    "lessons": 49,
    "lessons_by_course": {"fiori":13,"quadri":12,"cuori-gioco":10,"cuori-licita":14},
    "modules": 168,
    "content_blocks": 943,
    "content_block_distribution": {"bid-select":34,"card-select":5,"example":123,"hand-eval":8,"heading":120,"quiz":126,"rule":159,"text":294,"tip":33,"true-false":41},
    "inline_quiz_types_present": ["quiz","true-false","card-select","hand-eval","bid-select"],
    "inline_quiz_type_count": 5,
    "inline_quiz_blocks": 214,
    "comprehension_lesson_sets": 37,
    "comprehension_questions": 111,
    "bidding_practice_scenarios": 20,
    "impasse_scenarios": 32,
    "fiori_smazzate": 96,
    "quadri_smazzate": 96,
    "cuori_gioco_smazzate": 80,
    "cuori_licita_smazzate": 0,
    "all_validated_smazzate": 267,
    "playable_smazzate_after_plausibility_filter": 255,
    "wbf_minibridge_deals": 73,
    "preloaded_hand_definitions_total": 340,
    "standard_badges": 13,
    "secret_achievements": 10,
    "xp_levels": 36
  },
  "interface_inventory": {
    "component_tsx_files_under_src_components": 90,
    "routable_page_files": 66,
    "routes": [
      "/","/accessibilita","/admin","/admin/classi","/admin/istruttori","/amici","/appunti","/auth","/circolo/[slug]","/classi","/classi/[classId]","/classi/[classId]/compito/[assignmentId]","/classifica","/collezione","/dispense","/diventa-istruttore","/forum","/forum/[postId]","/forum/nuovo","/gioca","/gioca/analisi","/gioca/conta-veloce","/gioca/dichiara","/gioca/impasse","/gioca/mano-del-giorno","/gioca/mano-guidata","/gioca/memory","/gioca/minibridge","/gioca/pratica","/gioca/pratica-licita","/gioca/quiz-lampo","/gioca/segnali","/gioca/sfida","/gioca/sfida-amico","/gioca/sfida-imp","/gioca/sfida-link","/gioca/sfida-settimanale","/gioca/smazzata","/gioca/torneo","/gioca/trova-errore","/glossario","/guida","/impara","/impostazioni","/istruttori","/istruttori/[classId]","/istruttori/[classId]/compito/[assignmentId]","/istruttori/[classId]/nuovo-compito","/lezioni","/lezioni/[lessonId]","/lezioni/[lessonId]/[moduleId]","/login","/negozio","/obiettivi","/prima-mano","/privacy","/profilo","/profilo/wrapped","/registrati","/reset-password","/ripasso","/scopri","/scuola","/termini","/trova-circolo","/~offline"
    ],
    "api_route_files": 8,
    "exported_http_handlers": 9
  }
}
```

Nota: `preloaded_hand_definitions_total: 340` è la somma statica 267 + 73. Nel corpo della perizia si usa il database vivo, 272, e si aggiungono separatamente le 2 mani guidate; non si mescolano le due baseline.

### A.4 Database: query aggregate in sola lettura

Invocazione esatta del connettore, ripetuta per ciascun `SELECT` nei file indicati:

```text
mcp__codex_apps__supabase_execute_sql({
  "project_id": "mjojjktuhhnycdsikcla",
  "query": "<contenuto SQL del SELECT nel file indicato>"
})
```

Query complete versionate nell'audit:

```text
audit-bridgelab/sql/01-schema-aggregates.sql
audit-bridgelab/sql/02-policy-review.sql
audit-bridgelab/sql/03-table-row-counts.sql
audit-bridgelab/sql/04-product-aggregates.sql
audit-bridgelab/sql/05-usage-aggregates.sql
audit-bridgelab/sql/06-session-diagnostic.sql
```

#### Schema — output grezzo

```json
[{"public_tables":32,"rls_enabled_tables":32,"indexes":93,"rls_policies":65,"functions":26,"security_definer_functions":24,"primary_keys":32,"foreign_keys":36,"check_constraints":37,"unique_constraints":16}]
[{"cmd":"ALL","policies":3},{"cmd":"DELETE","policies":9},{"cmd":"INSERT","policies":15},{"cmd":"SELECT","policies":30},{"cmd":"UPDATE","policies":8}]
```

#### Policy selezionate — output grezzo

```json
[
  {"tablename":"assignments","policyname":"Instructor can delete assignments","roles":"{public}","cmd":"DELETE","qual":"is_instructor_of_class(class_id)","with_check":null},
  {"tablename":"assignments","policyname":"Instructor can create assignments","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"is_instructor_of_class(class_id)"},
  {"tablename":"assignments","policyname":"Instructor and members can view assignments","roles":"{public}","cmd":"SELECT","qual":"(is_instructor_of_class(class_id) OR is_member_of_class(class_id))","with_check":null},
  {"tablename":"assignments","policyname":"Instructor can update assignments","roles":"{public}","cmd":"UPDATE","qual":"is_instructor_of_class(class_id)","with_check":null},
  {"tablename":"challenges","policyname":"Challenger can delete pending challenges","roles":"{public}","cmd":"DELETE","qual":"((auth.uid() = challenger_id) AND (status = 'pending'::text))","with_check":null},
  {"tablename":"challenges","policyname":"Users can create challenges","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"(auth.uid() = challenger_id)"},
  {"tablename":"challenges","policyname":"Players can view own challenges","roles":"{public}","cmd":"SELECT","qual":"((auth.uid() = challenger_id) OR (auth.uid() = opponent_id))","with_check":null},
  {"tablename":"challenges","policyname":"Players can update own challenges","roles":"{public}","cmd":"UPDATE","qual":"((auth.uid() = challenger_id) OR (auth.uid() = opponent_id))","with_check":null},
  {"tablename":"class_members","policyname":"Instructor or self can delete membership","roles":"{public}","cmd":"DELETE","qual":"((student_id = auth.uid()) OR is_instructor_of_class(class_id))","with_check":null},
  {"tablename":"class_members","policyname":"Students can join themselves","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"(student_id = auth.uid())"},
  {"tablename":"class_members","policyname":"Members and owning instructor can view membership","roles":"{public}","cmd":"SELECT","qual":"((student_id = auth.uid()) OR is_instructor_of_class(class_id))","with_check":null},
  {"tablename":"class_members","policyname":"Instructor or self can update membership","roles":"{public}","cmd":"UPDATE","qual":"((student_id = auth.uid()) OR is_instructor_of_class(class_id))","with_check":null},
  {"tablename":"classes","policyname":"Instructors can delete own classes","roles":"{public}","cmd":"DELETE","qual":"(instructor_id = auth.uid())","with_check":null},
  {"tablename":"classes","policyname":"Instructors can create classes","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"((instructor_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['instructor'::text, 'admin'::text]))))))"},
  {"tablename":"classes","policyname":"Instructors and members can view classes","roles":"{public}","cmd":"SELECT","qual":"((instructor_id = auth.uid()) OR is_member_of_class(id))","with_check":null},
  {"tablename":"classes","policyname":"Instructors can update own classes","roles":"{public}","cmd":"UPDATE","qual":"(instructor_id = auth.uid())","with_check":null},
  {"tablename":"completed_modules","policyname":"Own modules","roles":"{public}","cmd":"ALL","qual":"(auth.uid() = user_id)","with_check":null},
  {"tablename":"friendships","policyname":"Either party can delete friendship","roles":"{public}","cmd":"DELETE","qual":"((auth.uid() = user_id) OR (auth.uid() = friend_id))","with_check":null},
  {"tablename":"friendships","policyname":"Users can send friend requests","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"(auth.uid() = user_id)"},
  {"tablename":"friendships","policyname":"Users can view own friendships","roles":"{public}","cmd":"SELECT","qual":"((auth.uid() = user_id) OR (auth.uid() = friend_id))","with_check":null},
  {"tablename":"friendships","policyname":"Recipients can accept or decline","roles":"{public}","cmd":"UPDATE","qual":"(auth.uid() = friend_id)","with_check":null},
  {"tablename":"instructor_requests","policyname":"Users can file own request","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"(user_id = auth.uid())"},
  {"tablename":"instructor_requests","policyname":"Self or admin can read requests","roles":"{public}","cmd":"SELECT","qual":"((user_id = auth.uid()) OR is_admin())","with_check":null},
  {"tablename":"instructor_requests","policyname":"Self or admin can update request","roles":"{public}","cmd":"UPDATE","qual":"((user_id = auth.uid()) OR is_admin())","with_check":null},
  {"tablename":"login_history","policyname":"Authenticated can insert own login history","roles":"{authenticated}","cmd":"INSERT","qual":null,"with_check":"(user_id = auth.uid())"},
  {"tablename":"login_history","policyname":"Users can read own login history","roles":"{authenticated}","cmd":"SELECT","qual":"true","with_check":null},
  {"tablename":"profiles","policyname":"Enable insert for service role","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"true"},
  {"tablename":"profiles","policyname":"Profiles visible to all","roles":"{public}","cmd":"SELECT","qual":"true","with_check":null},
  {"tablename":"profiles","policyname":"Users update own profile","roles":"{public}","cmd":"UPDATE","qual":"(auth.uid() = id)","with_check":null},
  {"tablename":"review_items","policyname":"Own reviews","roles":"{public}","cmd":"ALL","qual":"(auth.uid() = user_id)","with_check":null}
]
```

#### Conteggi tabelle — output grezzo

```json
[
  {"table_name":"asd","rows":241},{"table_name":"asd_clubs","rows":260},{"table_name":"assignments","rows":14},{"table_name":"badges","rows":1431},{"table_name":"challenges","rows":501},{"table_name":"class_members","rows":52},{"table_name":"class_messages","rows":7},{"table_name":"classes","rows":15},{"table_name":"collectible_cards","rows":22},{"table_name":"completed_modules","rows":18156},{"table_name":"course_worlds","rows":16},{"table_name":"courses","rows":4},{"table_name":"email_events","rows":564},{"table_name":"eserciziario_exercises","rows":31},{"table_name":"forum_comments","rows":27},{"table_name":"forum_likes","rows":6},{"table_name":"forum_poll_votes","rows":65},{"table_name":"forum_posts","rows":17},{"table_name":"friendships","rows":144},{"table_name":"game_results","rows":57325},{"table_name":"glossary","rows":49},{"table_name":"guided_hands","rows":2},{"table_name":"instructor_requests","rows":15},{"table_name":"lesson_modules","rows":199},{"table_name":"lessons","rows":49},{"table_name":"login_history","rows":10174},{"table_name":"profiles","rows":1083},{"table_name":"push_subscriptions","rows":0},{"table_name":"review_items","rows":121},{"table_name":"smazzate","rows":272},{"table_name":"trova_errore_scenarios","rows":32},{"table_name":"weekly_challenges","rows":12}
]
```

#### Prodotto vivo — output grezzo

```json
[{"courses":4,"worlds":16,"lessons":49,"modules":199,"stored_hands":272,"glossary_entries":49,"collectible_cards":22,"weekly_challenges":12,"weekly_badge_names":12,"guided_hands":2,"workbook_exercises":31,"find_the_error_exercises":32}]
[{"course_id":"cuori-gioco","lessons":10,"modules":32},{"course_id":"cuori-licita","lessons":14,"modules":28},{"course_id":"fiori","lessons":13,"modules":91},{"course_id":"quadri","lessons":12,"modules":48}]
[{"module_type":"exercise","modules":40},{"module_type":"practice","modules":10},{"module_type":"quiz","modules":49},{"module_type":"theory","modules":100}]
[{"content_block_type":"bid-select","blocks":41},{"content_block_type":"card-select","blocks":11},{"content_block_type":"example","blocks":123},{"content_block_type":"hand-eval","blocks":10},{"content_block_type":"heading","blocks":120},{"content_block_type":"quiz","blocks":230},{"content_block_type":"rule","blocks":159},{"content_block_type":"text","blocks":323},{"content_block_type":"tip","blocks":33},{"content_block_type":"true-false","blocks":43}]
[{"exercise_block_type":"bid-select","blocks":7},{"exercise_block_type":"card-select","blocks":6},{"exercise_block_type":"hand-eval","blocks":2},{"exercise_block_type":"quiz","blocks":104},{"exercise_block_type":"text","blocks":29},{"exercise_block_type":"true-false","blocks":2}]
```

#### Utilizzo — output grezzo

```json
[{"measured_at":"2026-08-08 17:58:33.157563+00","registered_users":1083,"profiles":1083,"login_events":10174,"cumulative_visible_minutes":469879}]
[{"month":"2026-02-01","registrations":19,"monthly_growth_pct":null},{"month":"2026-03-01","registrations":668,"monthly_growth_pct":"3415.79"},{"month":"2026-04-01","registrations":165,"monthly_growth_pct":"-75.30"},{"month":"2026-05-01","registrations":108,"monthly_growth_pct":"-34.55"},{"month":"2026-06-01","registrations":66,"monthly_growth_pct":"-38.89"},{"month":"2026-07-01","registrations":47,"monthly_growth_pct":"-28.79"},{"month":"2026-08-01","registrations":10,"monthly_growth_pct":"-78.72"}]
[{"month":"2026-02-01","monthly_active_users":9,"login_events":9},{"month":"2026-03-01","monthly_active_users":678,"login_events":1781},{"month":"2026-04-01","monthly_active_users":373,"login_events":2001},{"month":"2026-05-01","monthly_active_users":312,"login_events":2021},{"month":"2026-06-01","monthly_active_users":298,"login_events":1895},{"month":"2026-07-01","monthly_active_users":236,"login_events":1957},{"month":"2026-08-01","monthly_active_users":128,"login_events":510}]
[{"days":5,"eligible_users":1076,"retained_users":485,"rolling_retention_pct":"45.07"},{"days":7,"eligible_users":1073,"retained_users":467,"rolling_retention_pct":"43.52"},{"days":9,"eligible_users":1072,"retained_users":457,"rolling_retention_pct":"42.63"},{"days":21,"eligible_users":1053,"retained_users":373,"rolling_retention_pct":"35.42"},{"days":30,"eligible_users":1036,"retained_users":326,"rolling_retention_pct":"31.47"},{"days":39,"eligible_users":1026,"retained_users":301,"rolling_retention_pct":"29.34"}]
[{"completed_module_rows":18156,"matched_module_rows":18156,"unmatched_module_rows":0,"completed_lesson_user_pairs":3031,"users_completing_at_least_one_lesson":338}]
[{"month":"2026-02-01","completed_lessons":16},{"month":"2026-03-01","completed_lessons":1066},{"month":"2026-04-01","completed_lessons":546},{"month":"2026-05-01","completed_lessons":567},{"month":"2026-06-01","completed_lessons":389},{"month":"2026-07-01","completed_lessons":383},{"month":"2026-08-01","completed_lessons":64}]
```

#### Diagnostica sessioni — output grezzo

```json
[{"gap_threshold_minutes":21,"inferred_sessions":10162,"inferred_mean_minutes":"0.00","inferred_median_minutes":"0.00","single_event_sessions":10152},{"gap_threshold_minutes":30,"inferred_sessions":10162,"inferred_mean_minutes":"0.00","inferred_median_minutes":"0.00","single_event_sessions":10152},{"gap_threshold_minutes":39,"inferred_sessions":10162,"inferred_mean_minutes":"0.00","inferred_median_minutes":"0.00","single_event_sessions":10152}]
```

### A.5 Build, lint e controlli qualità

Comando:

```bash
npm run build
```

Output grezzo:

```text
> figb-bridge-lab@0.1.0 build
> next build --webpack

▲ Next.js 16.1.6 (webpack)
- Environments: .env.local

Creating an optimized production build ...
✓ (serwist) Bundling the service worker script with the URL '/sw.js' and the scope '/'...
✓ Compiled successfully in 9.5s
Running TypeScript ...
Collecting page data using 9 workers ...
Generating static pages using 9 workers (0/69) ...
Generating static pages using 9 workers (17/69)
Generating static pages using 9 workers (34/69)
Generating static pages using 9 workers (51/69)
✓ Generating static pages using 9 workers (69/69) in 399.5ms
Finalizing page optimization ...
Collecting build traces ...
```

Durante la generazione Node ha inoltre emesso l'avviso ``--localstorage-file` was provided without a valid path`` per alcuni worker; non ha causato il fallimento della build.

Comando:

```bash
node audit-bridgelab/collect-eslint-summary.mjs
```

Output grezzo:

```json
{
  "eslint_exit_code": 1,
  "files_checked": 283,
  "files_with_issues": 100,
  "errors": 176,
  "warnings": 147,
  "top_files_by_errors_then_warnings": [
    {"file":"src/app/lezioni/[lessonId]/[moduleId]/page.tsx","errors":11,"warnings":8},
    {"file":"src/app/gioca/impasse/page.tsx","errors":11,"warnings":3},
    {"file":"src/app/obiettivi/page.tsx","errors":10,"warnings":0},
    {"file":"src/components/celebration-effects.tsx","errors":10,"warnings":0},
    {"file":"src/lib/native-bridge.ts","errors":7,"warnings":0},
    {"file":"src/app/classifica/page.tsx","errors":5,"warnings":3},
    {"file":"src/app/gioca/mano-del-giorno/page.tsx","errors":5,"warnings":2},
    {"file":"src/app/admin/page.tsx","errors":5,"warnings":1},
    {"file":"src/app/negozio/page.tsx","errors":5,"warnings":0},
    {"file":"src/app/gioca/sfida-settimanale/page.tsx","errors":4,"warnings":3},
    {"file":"src/app/gioca/torneo/page.tsx","errors":4,"warnings":2},
    {"file":"src/app/gioca/sfida-link/page.tsx","errors":4,"warnings":1},
    {"file":"src/app/gioca/sfida-amico/page.tsx","errors":4,"warnings":0},
    {"file":"src/components/bridge/hand-replay.tsx","errors":4,"warnings":0},
    {"file":"src/data/cuori-gioco-lessons.ts","errors":4,"warnings":0},
    {"file":"src/data/cuori-licita-lessons.ts","errors":4,"warnings":0},
    {"file":"src/app/gioca/quiz-lampo/page.tsx","errors":3,"warnings":6},
    {"file":"src/app/gioca/conta-veloce/page.tsx","errors":3,"warnings":4},
    {"file":"src/app/gioca/smazzata/page.tsx","errors":3,"warnings":3},
    {"file":"src/app/gioca/dichiara/page.tsx","errors":3,"warnings":2}
  ]
}
```

Altri comandi:

```bash
find src/app -type f \( -name 'error.tsx' -o -name 'not-found.tsx' \) -print | sort
rg -n 'strict' tsconfig.json
rg -n 'catch\s*\{|catch\s*\(' src --glob '*.{ts,tsx}' | wc -l
rg -n 'console\.(log|error|warn)' src --glob '*.{ts,tsx}' | wc -l
git ls-files | rg '(^|/)\.env($|\.)|(^|/)(credentials?|secrets?)(\.|/|$)|private[_-]?key' || true
git check-ignore -v .env.local
```

Output grezzo:

```text
src/app/error.tsx
src/app/gioca/error.tsx
src/app/lezioni/[lessonId]/[moduleId]/error.tsx
src/app/lezioni/[lessonId]/error.tsx
src/app/not-found.tsx
12:    "strict": true,
301
104
.gitignore:42:.env.local  .env.local
```

La ricerca dei nomi file sensibili non ha prodotto righe; questo dimostra soltanto l'assenza di filename corrispondenti fra i file tracciati, non l'assenza assoluta di segreti nel contenuto.

Comandi usati per leggere le evidenze di codice citate:

```bash
nl -ba src/lib/catalog.ts | sed -n '1,25p;170,205p;275,307p'
nl -ba src/proxy.ts | sed -n '1,80p'
nl -ba src/app/admin/page.tsx | sed -n '585,615p'
nl -ba src/app/istruttori/layout.tsx | sed -n '1,48p'
nl -ba src/lib/supabase/admin.ts | sed -n '1,35p'
nl -ba scripts/sql/login-history.sql | sed -n '1,50p'
nl -ba scripts/sql/instructor_requests.sql | sed -n '20,110p'
nl -ba src/hooks/use-supabase-sync.ts | sed -n '88,115p'
nl -ba src/hooks/use-activity-tracker.ts | sed -n '1,45p'
nl -ba src/app/layout.tsx | sed -n '100,120p;188,205p'
nl -ba src/lib/log.ts | sed -n '1,25p'
nl -ba next.config.ts | sed -n '1,95p'
nl -ba src/app/glossario/page.tsx | sed -n '1,25p'
nl -ba src/lib/bridge-engine.ts | sed -n '95,170p;200,285p;490,735p;760,820p'
nl -ba src/lib/dds-solver.ts | sed -n '275,405p;455,620p;640,705p'
nl -ba src/lib/hand-encoder.ts | sed -n '1,120p'
nl -ba src/lib/bridge-scoring.ts | sed -n '70,295p'
nl -ba src/lib/play-error-classifier.ts | sed -n '85,225p'
nl -ba src/hooks/use-spaced-review.ts | sed -n '20,55p;95,195p'
nl -ba src/lib/xp-levels.ts | sed -n '1,60p'
nl -ba src/components/achievement-popup.tsx | sed -n '15,50p'
nl -ba src/hooks/use-secret-achievements.ts | sed -n '1,82p'
nl -ba src/lib/minibridge.ts | sed -n '65,165p'
nl -ba README.md | sed -n '1,120p'
```

Gli output grezzi di questi comandi sono il testo sorgente alle righe citate nel corpo. Non sono duplicati integralmente qui per non ripubblicare valori configurativi o dati non necessari; i riferimenti file:riga sono verificabili direttamente nel repository.

Estratti grezzi essenziali, con numerazione originale:

```text
src/lib/catalog.ts
4  * The single abstraction point between the frontend and the Supabase
11 * The full catalog is fetched once per session (browser) or per process
16 * Re-entrancy is safe: `getCourses()` returns the same in-flight Promise
178 const [coursesRes, worldsRes, lessonsRes, modulesRes] = await Promise.all([
287 export function getCourses(): Promise<Course[]> {
288   if (!catalogPromise) {
289     catalogPromise = loadCatalog().catch((err) => {
290       catalogPromise = null;
291       throw err;
294   return catalogPromise;

src/proxy.ts
4  const PROTECTED_ROUTES = ["/admin"];
30 const { data: { user } } = await supabase.auth.getUser();
39 if (!user && isProtected) {
40   const loginUrl = new URL("/login", request.url);
42   return NextResponse.redirect(loginUrl);

src/app/istruttori/layout.tsx
17 const supabase = await createServerSupabaseClient();
21 } = await supabase.auth.getUser();
23 if (!user) { redirect("/login"); }
27 const { data: profile } = await supabase
29   .select("role")
33 if (!profile || (profile.role !== "instructor" && profile.role !== "admin")) {
34   redirect("/diventa-istruttore");

scripts/sql/login-history.sql
30 -- Admin (service role) can read all — no policy needed, service role bypasses RLS
31 -- Users can read their own login history
32 CREATE POLICY "Users can read own login history"
35   TO authenticated
36   USING (true);

src/hooks/use-supabase-sync.ts
99  const keys = Object.keys(completedModules);
100 const rows = keys.map((moduleKey: string) => {
101   const parts = moduleKey.split("-");
102   const lessonId = parts.slice(0, -1).join("-");
103   const moduleId = parts[parts.length - 1];
104   return { user_id: userId, lesson_id: lessonId, module_id: moduleId };

src/hooks/use-activity-tracker.ts
5  const LS_KEY = "bq_total_minutes";
6  const TICK_INTERVAL = 30_000;
7  const TICK_MINUTES = 0.5;
19 // Heartbeat: increment total_minutes every 30s when tab is visible
20 const intervalId = setInterval(() => {
21   if (!isVisibleRef.current) return;
24   localStorage.setItem(LS_KEY, String(Math.round((current + TICK_MINUTES) * 10) / 10));

src/app/layout.tsx
110 <html lang="it" suppressHydrationWarning>
197 <a href="#main-content" className="skip-link">Vai al contenuto</a>

next.config.ts
12 cacheOnNavigation: true,
38 { key: "X-Content-Type-Options", value: "nosniff" },
44 key: "Content-Security-Policy",
47 "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
65 value: "public, max-age=31536000, stale-while-revalidate=86400, immutable",

src/lib/dds-solver.ts
276 // Alpha-beta minimax solver
282 const transpositionTable = new Map<string, number>();
295 if (++nodesSearched % 1000 === 0) {
309 // Check transposition table
329 // Deduplicate equivalent cards
386 // Alpha-beta cutoff
470 * Solve a bridge position double-dummy.
473 * For positions with <= FULL_SEARCH_THRESHOLD cards per hand: exact minimax.
474 * For larger positions: heuristic estimate.
475 * Times out after the specified timeout (default 2000ms) and falls back to estimate.
650 * Only attempts exact search for small positions (endgames); returns
667 if (maxCards > maxCardsForSearch) {
668   return { card: null, available: false, timeMs: 0 };

src/hooks/use-spaced-review.ts
31 * Interval schedule in days, indexed by wrongCount (1-based).
32 *  - 1st wrong  -> review in 1 day
33 *  - 2nd wrong  -> review in 3 days
34 *  - 3rd+ wrong -> review in 7 days
36 const INTERVALS_DAYS: Record<number, number> = { 1: 1, 2: 3 };
40 const DEFAULT_INTERVAL_DAYS = 7;

src/lib/xp-levels.ts
2  * Progressive XP level system — 36 levels
8  export const LEVEL_THRESHOLDS = [
44   200_000,  // Lv 36
47 export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

README.md
1 This is a Next.js project bootstrapped with create-next-app.
3 ## Getting Started
32 ## Deploy on Vercel
```

### A.6 Calcoli economici e punteggio qualità

Comando:

```bash
node audit-bridgelab/economic-calculations.mjs
```

Output grezzo:

```json
{
  "assumptions": {
    "replication_hours_by_workstream": {
      "core_fullstack_security_data": 1100,
      "ui_pwa_mobile_66_routes": 1000,
      "didactic_catalog_content_admin": 700,
      "bridge_engines_and_game_modes": 900,
      "social_instructor_classes": 500,
      "qa_accessibility_devops_documentation": 600
    },
    "hourly_rates_eur_method_A": [60,80,100],
    "external_supplier_scope_hours": {
      "implementation_hours": 4800,
      "analysis_10_pct": 480,
      "ux_and_solution_design_10_pct": 480,
      "independent_qa_and_security_15_pct": 720,
      "project_management_15_pct": 720
    },
    "hourly_rates_eur_method_B": [80,100,120],
    "work_hours_per_month_per_developer_for_calendar_conversion": 160,
    "usd_per_eur_ecb_2026_08_07": 1.1535,
    "lms_usd_per_month_billed_annually": 249,
    "hosting_usd_per_month": {"vercel":20,"supabase":25},
    "maintenance_hours_per_month": 20,
    "maintenance_hourly_rate_eur": 80
  },
  "external_two_senior_team": {
    "total_person_hours": {"minus_30_pct":3360,"base":4800,"plus_30_pct":6240},
    "calendar_months_at_160h_per_developer": {"minus_30_pct":10.5,"base":15,"plus_30_pct":19.5},
    "calendar_months_varying_monthly_capacity_30_pct": {"capacity_minus_30_pct_112h":21.43,"base_160h":15,"capacity_plus_30_pct_208h":11.54}
  },
  "method_A_reproduction_cost_eur": {
    "60_eur_per_hour":{"minus_30_pct":201600,"base":288000,"plus_30_pct":374400},
    "80_eur_per_hour":{"minus_30_pct":268800,"base":384000,"plus_30_pct":499200},
    "100_eur_per_hour":{"minus_30_pct":336000,"base":480000,"plus_30_pct":624000}
  },
  "method_B_external_replacement": {
    "total_scope_hours":{"minus_30_pct":5040,"base":7200,"plus_30_pct":9360},
    "cost_eur": {
      "80_eur_per_hour":{"minus_30_pct":403200,"base":576000,"plus_30_pct":748800},
      "100_eur_per_hour":{"minus_30_pct":504000,"base":720000,"plus_30_pct":936000},
      "120_eur_per_hour":{"minus_30_pct":604800,"base":864000,"plus_30_pct":1123200}
    }
  },
  "method_C_three_year_use_value_eur": {
    "lms_license_comparability_sensitivity":{"minus_30_pct":5439.79,"base":7771.13,"plus_30_pct":10102.47},
    "hosting_plan_sensitivity":{"minus_30_pct":983.09,"base":1404.42,"plus_30_pct":1825.75},
    "maintenance":{"minus_30_pct":40320,"base":57600,"plus_30_pct":74880},
    "total_with_maintenance_sensitivity":{"minus_30_pct":49495.55,"base":66775.55,"plus_30_pct":84055.55}
  },
  "algorithm_rewrite_person_hours_and_cost_at_80_eur": {
    "bridge_play_ai_dds_scoring_error_analysis":{"hours":{"minus_30_pct":336,"base":480,"plus_30_pct":624},"cost_eur":{"minus_30_pct":26880,"base":38400,"plus_30_pct":49920}},
    "hand_generation_validation_catalogs":{"hours":{"minus_30_pct":112,"base":160,"plus_30_pct":208},"cost_eur":{"minus_30_pct":8960,"base":12800,"plus_30_pct":16640}},
    "spaced_repetition":{"hours":{"minus_30_pct":28,"base":40,"plus_30_pct":52},"cost_eur":{"minus_30_pct":2240,"base":3200,"plus_30_pct":4160}},
    "gamification":{"hours":{"minus_30_pct":84,"base":120,"plus_30_pct":156},"cost_eur":{"minus_30_pct":6720,"base":9600,"plus_30_pct":12480}},
    "learning_progression_orchestration":{"hours":{"minus_30_pct":140,"base":200,"plus_30_pct":260},"cost_eur":{"minus_30_pct":11200,"base":16000,"plus_30_pct":20800}}
  },
  "quality":{"scores":[2,4,3,2,2,3,3,1,1,1,1,2],"sum":25,"count":12,"arithmetic_mean":2.08},
  "prudent_conferred_value_eur":{"lower_method_A_base_hours_at_60_eur":288000,"upper_method_B_base_scope_at_80_eur":576000}
}
```

### A.7 Fonti economiche correnti

Comandi di estrazione riproducibili:

```bash
curl -Ls https://www.learnworlds.com/pricing/ | rg -o 'Pricing: Starter \$24/m \| Pro \$79/m \| Learning Center \$249/m' | head -n 1
curl -Ls https://www.learnworlds.com/pricing/ | rg -o '2,000 active learners / month' | head -n 1
curl -Ls https://vercel.com/pricing | rg -o '.{0,100}(Pro|pro).{0,100}\$20.{0,100}' | head -n 3
curl -Ls https://supabase.com/pricing | rg -o '.{0,100}100,000 monthly active users.{0,100}' | head -n 2
curl -Ls https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml | xmllint --xpath 'string(/*[local-name()="Envelope"]/*[local-name()="Cube"]/*[local-name()="Cube"][@time="2026-08-07"]/*[local-name()="Cube"][@currency="USD"]/@rate)' -
curl -Ls https://systemforge.it/blog/tariffe-programmatore-freelance-italia-2026/ | rg -o 'media per un full-stack senior intorno a 70-90 €/ora' | head -n 1
```

Output grezzo essenziale:

```text
Pricing: Starter $24/m | Pro $79/m | Learning Center $249/m
2,000 active learners / month
Pro plans have a $20 included credit to use across resources.
Developer seat ... $20 / month
100,000 monthly active users ... then $0.00325 per MAU
1.1535
media per un full-stack senior intorno a 70-90 €/ora
```

Per i prezzi base sono state inoltre lette direttamente le pagine ufficiali con questi comandi web:

```json
{"open":[{"ref_id":"https://www.talentlms.com/prices"},{"ref_id":"https://vercel.com/pricing"},{"ref_id":"https://supabase.com/pricing"},{"ref_id":"https://www.learnworlds.com/pricing/"}],"response_length":"long"}
```

Estratti grezzi rilevanti restituiti:

```text
LearnWorlds Learning Center: 249/month billed annually; 299/month monthly; 2,000 active learners/month; 25 admins.
Vercel Pro: $20/mo; $20 of included usage credit.
Supabase Pro: from $25/month; 100,000 monthly active users; first project included.
TalentLMS Enterprise: starts at 1,000 users; price custom/non determinabile dal listino pubblico.
```

L'uso di LearnWorlds anziché TalentLMS evita di inventare un prezzo Enterprise non pubblicato per una capacità superiore a 1.000 utenti.
