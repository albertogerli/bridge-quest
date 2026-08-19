# Perizia tecnica ed economica indipendente — BridgeLab

**Destinatario:** Consiglio direttivo di una federazione sportiva  
**Data di osservazione:** 12 agosto 2026  
**Repository:** ramo `main`, HEAD `c56d29299ea6e21c2043aa5c2a2767c1921f62e4`  
**Base dati:** interrogazioni aggregate in sola lettura, ultima rilevazione 12 agosto 2026 alle 21:39:39 UTC  
**Working tree statica:** rilevazione 12 agosto 2026 alle 23:59:08 CEST  
**Valuta:** euro, IVA esclusa  
**Criterio:** ogni dato è marcato **MISURATO**, **CALCOLATO** o **STIMATO**. Quando le evidenze non consentono una misura attendibile è scritto **non determinabile**.

Il presente documento è una perizia autonoma sullo stato osservato. Il repository presentava modifiche locali preesistenti: le metriche Git riguardano la storia raggiungibile dai riferimenti validi, mentre le metriche statiche fotografano la working tree. L'analisi ha modificato soltanto i file di audit in `audit-bridgelab/`; non ha modificato il prodotto. Non sono stati eseguiti login interattivi e non sono stati estratti dati personali.

## Sintesi per il Consiglio direttivo

BridgeLab è una piattaforma verticale per l'apprendimento e la pratica del bridge. **MISURATO:** comprende 66.608 righe di codice applicativo, 6.025 righe di test e 20.274 righe di contenuti, mantenute separate nel conteggio. La superficie tecnica include 69 pagine, 94 componenti d'interfaccia, 10 file API con 11 handler HTTP e un database operativo di 35 tabelle. Tutte le tabelle hanno la sicurezza a livello di riga attiva.

Il catalogo vivo comprende **4 corsi, 16 mondi, 49 lezioni e 199 moduli**. Contiene 272 mani principali, tutte corredate da un risultato double-dummy: 216 sono orientate al gioco del dichiarante e 56 al controgioco. Queste ultime si aprono automaticamente in difesa perché il contratto indicato non è mantenibile dal dichiarante dopo l'attacco previsto. Sono presenti anche 73 mani MiniBridge nel sorgente, 2 mani guidate, 31 esercizi di eserciziario, 32 scenari “Trova l'errore”, 20 scenari di licita e 32 scenari d'impasse.

La piattaforma contiene capacità tecniche non comuni in un LMS generico: gioco completo della carta, IA euristica, punteggio duplicate/IMP, generazione di mani con vincoli, analisi double-dummy, calcolo del par, valutazione presa per presa, ripetizione dilazionata, progressione e gamification. Il double-dummy esatto in uso si appoggia a `bridge-dds` 1.4.0, libreria open source Apache-2.0 che incorpora un solver C++ compilato in WebAssembly. Il valore attribuibile a BridgeLab riguarda l'integrazione e l'esperienza didattica costruita sopra questa dipendenza, non la proprietà esclusiva del solver esterno.

**MISURATO:** la storia Git valida comprende 258 commit, 257 dei quali attribuiti allo stesso autore pseudonimizzato, distribuiti su 54 giorni di calendario tra l'8 febbraio e il 12 agosto 2026. Applicando il metodo prescritto — nuova sessione dopo un gap superiore a 90 minuti e 30 minuti di avvio per sessione — risultano 93 sessioni e 103,56 ore. È un **limite inferiore**: non cattura progettazione, ricerca, debug, riunioni, produzione dei contenuti o lavoro non committato. Non viene usato come effort di replica.

La working tree supera la build di produzione, il controllo TypeScript e il lint con soglia zero. **MISURATO:** passano 723 test unitari in 32 file. La suite E2E contiene 27 casi in 6 file, ma non è stata eseguita perché include autenticazione e operazioni che creano o cancellano dati. Per lo stesso motivo non sono stati eseguiti contro la produzione i test RLS e Realtime.

La qualità ingegneristica media è **3,17/5**, **CALCOLATA** come media aritmetica di 12 giudizi motivati. I punti più solidi sono modello dati, autorizzazione, gestione degli errori e accessibilità prevista dal codice. I principali limiti sono: assenza nel repository di una baseline completa del database; build, E2E, RLS e Realtime non bloccanti in CI; copertura percentuale non misurata; 5 pagine oltre 1.000 righe; documentazione numericamente non allineata; internazionalizzazione assente.

La sicurezza è strutturata, ma la presente analisi non la certifica. **MISURATO:** 35 tabelle su 35 hanno RLS; tutte le 28 funzioni `SECURITY DEFINER` fissano il `search_path`; una sola è eseguibile dal ruolo anonimo e restituisce un booleano per verificare la disponibilità di un nome BBO. Gli advisor Supabase restituiscono 29 rilievi di sicurezza, dei quali 28 warning, e 76 rilievi di performance, dei quali 51 warning. Sono euristiche, non equivalgono ad altrettante vulnerabilità. Restano da revisionare funzione per funzione 27 RPC privilegiate eseguibili dagli autenticati e i privilegi tabellari concessi al ruolo anonimo, oggi limitati dalle policy RLS.

**MISURATO, soli aggregati:** gli utenti registrati sono 1.090. Gli utenti attivi mensili ricavati dalla cronologia login sono 678 a marzo, 373 ad aprile, 312 a maggio, 298 a giugno e 236 a luglio; agosto è parziale, con 146 utenti fino alla sera del 12. Sono ricostruibili 3.077 completamenti lezione riferiti a 342 utenti. La retention rolling è **STIMATA mediante proxy** al 43,96% a 7 giorni e al 31,86% a 30 giorni. Il numero reale delle sessioni è **non determinabile**; il tempo medio di sessione è **non determinabile**.

**STIMATO:** un team esterno di 2 sviluppatori senior impiegherebbe 6.380 ore-persona per replicare la piattaforma, assumendo disponibili contenuti, asset, diritti e la possibilità di riutilizzare le dipendenze open source. A 160 ore mensili per sviluppatore equivalgono a 19,94 mesi nominali. La sensibilità dell'effort a ±30% è 4.466–8.294 ore, ossia 13,96–25,92 mesi a capacità invariata.

I tre metodi economici rimangono distinti:

- **A — costo di riproduzione:** 267.960–829.400 euro nell'inviluppo delle tre tariffe e dell'effort ±30%; scenario centrale 510.400 euro.
- **B — costo di sostituzione presso un fornitore:** 535.920–1.492.920 euro nell'inviluppo completo; scenario centrale 957.000 euro.
- **C — valore d'uso triennale:** 46.737,32–86.797,89 euro; scenario base 66.767,61 euro. È inferiore perché un LMS generico non replica i motori e le logiche specifiche del bridge.

Per una deliberazione prudenziale, il **valore conferito alla Federazione** è collocato tra **382.800 e 765.600 euro**, IVA esclusa. Il limite inferiore è il metodo A con effort base e tariffa bassa; il limite superiore è il metodo B con perimetro base e tariffa fornitore bassa. Il metodo B è il più difendibile perché rappresenta il controfattuale concreto per la Federazione: commissionare oggi a un fornitore una piattaforma equivalente, inclusi analisi, progettazione, sviluppo, test e project management. Il range non attribuisce valore a marchio, dati personali, avviamento, crescita futura o proprietà esclusiva delle dipendenze open source.

La snapshot locale richiede una cautela specifica. **MISURATO:** il commit HEAD contiene 49 video MP4 tracciati, ma tutti risultano cancellati nella working tree e nessun MP4 rimane nella relativa cartella locale. La build non verifica l'esistenza di questi asset. La loro disponibilità in produzione è **non determinabile**.

**Condizioni raccomandate prima di un conferimento:** creare una baseline riproducibile del database; revisionare le RPC privilegiate; rendere build, E2E, RLS e Realtime parte della pipeline; introdurre una soglia di coverage; verificare la disponibilità dei video; formalizzare titolarità e licenze di contenuti, asset e dipendenze; collaudare in ambiente dedicato i flussi DDS, generazione mani e consenso.

## 1. Perimetro e metodo

### 1.1 Esame svolto

- repository Git e working tree Next.js;
- schema, policy, advisor e soli aggregati del database Supabase tramite query di sola lettura;
- codice dei motori di bridge, DDS, generazione mani, progressione, gamification, matching e ripasso;
- build di produzione, TypeScript, ESLint, test unitari e inventari statici;
- listini pubblici e riferimenti tariffari correnti.

Non sono riportati email, nomi, identificativi utente o eventi individuali. Gli autori Git sono pseudonimizzati. Le query d'uso restituiscono soltanto conteggi, percentuali e distribuzioni aggregate.

### 1.2 Working tree e ripetibilità

**MISURATO:** la working tree non era pulita. Questo non altera la storia Git, ma il conteggio statico può includere differenze locali non pubblicate. I 49 MP4 tracciati in HEAD risultano tutti cancellati localmente. Una reference remota con nome malformato produce un warning ed è ignorata; lo script usa 7 riferimenti branch validi senza modificare il repository.

Il repository contiene **0** migrazioni in `supabase/migrations`, mentre il progetto vivo espone **14** record di migrazione. Sono inoltre presenti 33 script in `scripts/sql`, ma non costituiscono una catena formale e completa dello schema.

## 2. Fase 1 — Metriche del repository

### 2.1 Storia Git

| Metrica | Valore | Natura |
|---|---:|---|
| Commit raggiungibili dai riferimenti validi | 258 | MISURATO |
| Autori pseudonimizzati | 2 | MISURATO |
| Commit Autore-10620de2 | 257 | MISURATO |
| Commit Autore-6a19acae | 1 | MISURATO |
| Primo commit | 8 febbraio 2026, 00:15:02 | MISURATO, Europe/Madrid |
| Ultimo commit | 12 agosto 2026, 23:24:03 | MISURATO, Europe/Madrid |
| Giorni con almeno un commit | 54 | MISURATO |
| Dimensione mediana commit | 160,5 righe aggiunte + rimosse | MISURATO |
| Righe aggiunte nella storia | 200.664 | MISURATO |
| Righe rimosse nella storia | 33.994 | MISURATO |
| Occorrenze binarie escluse dal `numstat` | 524 | MISURATO |
| Merge commit | 2 | MISURATO |
| Riferimenti branch validi | 7: 3 locali + 4 remoti | MISURATO; non deduplicati per nome logico |

#### Distribuzione mensile

| Mese 2026 | Commit |
|---|---:|
| Febbraio | 53 |
| Marzo | 96 |
| Aprile | 7 |
| Maggio | 21 |
| Giugno | 20 |
| Luglio | 14 |
| Agosto | 47 |

#### Distribuzione per fascia oraria

| Fascia, Europe/Madrid | Commit |
|---|---:|
| 00:00–05:59 | 55 |
| 06:00–11:59 | 54 |
| 12:00–17:59 | 88 |
| 18:00–23:59 | 61 |

#### File più modificati

| File | Commit | Aggiunte | Rimozioni | Churn |
|---|---:|---:|---:|---:|
| `src/app/page.tsx` | 58 | 3.901 | 3.845 | 7.746 |
| `src/app/profilo/page.tsx` | 46 | 2.558 | 2.246 | 4.804 |
| `src/app/admin/page.tsx` | 38 | 2.822 | 2.608 | 5.430 |
| `src/app/lezioni/[lessonId]/[moduleId]/page.tsx` | 31 | 2.844 | 2.675 | 5.519 |
| `src/app/gioca/smazzata/page.tsx` | 30 | 1.532 | 295 | 1.827 |
| `src/app/gioca/page.tsx` | 29 | 1.145 | 496 | 1.641 |
| `src/components/desktop-sidebar.tsx` | 28 | 712 | 532 | 1.244 |
| `src/app/layout.tsx` | 28 | 368 | 106 | 474 |
| `src/app/login/page.tsx` | 24 | 734 | 163 | 897 |
| `src/app/classifica/page.tsx` | 23 | 2.039 | 649 | 2.688 |
| `src/app/gioca/sfida/page.tsx` | 23 | 676 | 106 | 782 |
| `src/app/gioca/mano-del-giorno/page.tsx` | 21 | 1.837 | 1.703 | 3.540 |
| `src/components/bridge/bridge-table.tsx` | 21 | 550 | 140 | 690 |
| `src/app/impostazioni/page.tsx` | 20 | 1.020 | 277 | 1.297 |
| `src/app/lezioni/page.tsx` | 19 | 765 | 173 | 938 |

Il numero di commit che tocca un file indica volatilità, non qualità.

### 2.2 Effort ricavato dai timestamp

**Regola prescritta:** per autore, una sessione nuova inizia quando il gap dal commit precedente supera 90 minuti. Durata = ultimo timestamp − primo timestamp + 30 minuti di ramp-up; una sessione con un solo commit dura 30 minuti.

| Risultato | Valore | Natura |
|---|---:|---|
| Sessioni | 93 | CALCOLATO |
| Minuti | 6.214 | CALCOLATO |
| Ore | 103,56 | CALCOLATO |

**Interpretazione obbligatoria:** 103,56 ore è un limite inferiore. Non cattura progettazione, ricerca, debug, preparazione dei contenuti, riunioni e lavoro non committato. Non è usato per la valutazione economica.

### 2.3 Righe per categoria e linguaggio

Sono esclusi `node_modules`, lockfile, build, asset generati, SQL/migrazioni e `src/lib/supabase/types.ts` generato. I test sono separati dal codice applicativo.

| Categoria | Linguaggio | File | Righe | Natura |
|---|---|---:|---:|---|
| Applicazione | TypeScript | 394 | 66.208 | MISURATO con `cloc` |
| Applicazione | CSS | 1 | 400 | MISURATO con `cloc` |
| **Applicazione totale** | — | **395** | **66.608** | MISURATO |
| Test | TypeScript | 38 | 5.469 | MISURATO con `cloc` |
| Test RLS/Realtime | JavaScript | 2 | 556 | MISURATO con `cloc` |
| **Test totale** | — | **40** | **6.025** | MISURATO |
| Contenuti | TypeScript dati | 21 | 18.082 | MISURATO con `cloc` |
| Contenuti | Markdown | 4 | 2.192 | MISURATO con `cloc` |
| **Contenuti totali** | — | **25** | **20.274** | MISURATO |
| Sottotitoli | ASS | 49 | 7.012 righe fisiche | MISURATO con `wc -l` |
| Configurazione | JSON | 4 | 189 | MISURATO con `cloc` |
| Configurazione | TypeScript | 4 | 182 | MISURATO con `cloc` |
| Configurazione | JavaScript | 2 | 46 | MISURATO con `cloc` |
| **Configurazione totale** | — | **10** | **417** | MISURATO |

La cifra riportata nella tabella finale è 66.608 righe applicative. Test, contenuti, configurazione e sottotitoli non la incrementano.

### 2.4 Inventario tecnico

| Elemento | Valore | Natura/precisazione |
|---|---:|---|
| Componenti `.tsx` sotto `src/components` | 94 | MISURATO |
| Pagine con `page.tsx` | 69 | MISURATO |
| File di rotta API | 10 | MISURATO |
| Handler HTTP esportati | 11 | MISURATO |
| Tabelle pubbliche vive | 35 | MISURATO |
| Tabelle con RLS attiva | 35 | MISURATO |
| Policy RLS vive | 72 | MISURATO |
| Indici pubblici | 99 | MISURATO |
| Chiavi primarie / esterne | 35 / 39 | MISURATO |
| Vincoli `CHECK` / `UNIQUE` | 40 / 17 | MISURATO |
| Funzioni pubbliche / `SECURITY DEFINER` | 30 / 28 | MISURATO |
| Migrazioni formali in `supabase/migrations` | 0 | MISURATO |
| Record di migrazione nel progetto vivo | 14 | MISURATO; non baseline completa |
| Script SQL in `scripts/sql` | 33 | MISURATO |
| Occorrenze `CREATE POLICY` negli script | 48 | MISURATO |
| Tabelle distinte create negli script | 15 | MISURATO |
| File unit test in `src` | 32 | MISURATO |
| File E2E / casi E2E elencati | 6 / 27 | MISURATO |
| Workflow CI | 1 | MISURATO |

Le 69 pagine contano complessivamente 30.886 righe fisiche. Cinque pagine superano 1.000 righe; la più lunga ne contiene 1.390.

## 3. Fase 2 — Qualità e profondità architetturale

### 3.1 Valutazione da 1 a 5

Scala: 1 = assente o insufficiente; 3 = adeguato con lacune; 5 = maturo, verificato e facilmente trasferibile.

I 12 punteggi sono **STIMATI** sulla base delle evidenze indicate; la loro media è **CALCOLATA**.

| Voce | Punteggio | Evidenze e motivazione |
|---|---:|---|
| Separazione delle responsabilità | 3/5 | Logica complessa estratta in moduli puri (`src/lib/dds-replay.ts:78-156`, `src/lib/trick-quiz.ts:74-150`), ma 5 pagine superano 1.000 righe; massimo 1.390. |
| Modello dati e integrità referenziale | 4/5 | 35 PK, 39 FK, 40 `CHECK`, 17 `UNIQUE`; RLS su 35/35 tabelle. `partner_profiles` usa FK e vincoli sugli enumerati (`scripts/sql/partner-matching-2026-08.sql:42-50`). Debolezza: 0 migrazioni nel repository e baseline non riproducibile. |
| Autenticazione e autorizzazione | 4/5 | Gate admin lato server con sessione e ruolo (`src/app/admin/layout.tsx:14-34`); la cancellazione account ricava l'id soltanto dalla sessione (`src/app/api/account/delete/route.ts:23-70`); policy proprietarie misurate nel DB vivo. |
| Sicurezza | 3/5 | RLS totale, 28/28 funzioni privilegiate con `search_path`, una sola RPC anonima booleana, input Zod e rate limit BEN (`src/lib/ben-guard.ts:22-49`), consenso default-deny e revocabile (`src/components/cookie-banner.tsx:35-99`; `e2e/consenso.spec.ts:37-164`). Limiti: CSP con `unsafe-inline` (`next.config.ts:55-118`), 28 warning advisor, 27 funzioni definer eseguibili dagli autenticati e grant tabellari anon ampi benché limitati da RLS. |
| Gestione degli errori | 4/5 | Sentry è predisposto lato server e client con rimozione PII (`instrumentation.ts:9-26`; `instrumentation-client.ts:11-34`). Realtime degrada a polling e segnala soltanto il guasto persistente (`src/lib/realtime-health.ts:26-91`). La configurazione reale del DSN in produzione è **non determinabile**. |
| Performance e caching | 3/5 | Catalogo caricato in parallelo e cache di promise con retry (`src/lib/catalog.ts:180-215`, `290-301`); cache asset (`next.config.ts:123-153`); modulo WASM condiviso (`src/lib/dds-table.ts:47-55`). Restano 51 warning di performance, inclusi 46 casi RLS non ottimizzati e 10 FK senza indice; non è stato svolto load test. |
| Accessibilità | 4/5 | `lang="it"` e skip link (`src/app/layout.tsx:113`, `200`), focus trap riusabile (`src/hooks/use-focus-trap.ts:69-146`) e audit axe su 4 pagine (`e2e/a11y.spec.ts:77-140`). Gli E2E non sono stati eseguiti e non girano in CI. |
| Internazionalizzazione | 1/5 | Lingua italiana dichiarata, ma testi e metadati sono codificati in italiano (`src/app/layout.tsx:113-196`); non risultano cataloghi di traduzione o routing locale. |
| Copertura dei test | 3/5 | 32 file unitari, 6 E2E, script RLS e Realtime; passano 723/723 test unitari. Copertura percentuale **non determinabile**: non esistono report o soglia; E2E/RLS/Realtime non sono stati eseguiti in questa lettura. |
| CI/CD | 3/5 | Il workflow esegue installazione, typecheck, lint e unit test (`.github/workflows/ci.yml:1-29`). Non esegue build, E2E, RLS o Realtime; il deploy è collegato direttamente al push su `main` (`docs/runbook.md:5-10`). |
| Documentazione | 3/5 | README, architettura e runbook sono specifici (`README.md:1-78`; `docs/architettura.md:1-148`; `docs/runbook.md:1-103`). README indica ancora 66 rotte e 90 componenti (`README.md:40-41`), mentre la misura è 69/94. |
| Manutenibilità da team terzo | 3/5 | TypeScript, lint, test, build e moduli di dominio riducono il rischio. Pesano 257 commit su 258 dello stesso autore pseudonimizzato, assenza di baseline DB, 5 pagine oltre 1.000 righe e documentazione parzialmente disallineata. La dipendenza DDS è identificata e Apache-2.0, ma richiede competenza specialistica. |

**Media CALCOLATA:** (3 + 4 + 4 + 3 + 4 + 3 + 4 + 1 + 3 + 3 + 3 + 3) / 12 = **3,17/5**.

La media rende trasparente il giudizio; non è una certificazione.

### 3.2 Rischi tecnici prioritari

1. **Schema non ricostruibile da zero.** I 33 script SQL e i 14 record di migrazione vivi documentano evoluzioni, ma non costituiscono una baseline ordinata delle 35 tabelle e 72 policy.
2. **Funzioni privilegiate.** Una RPC anonima è intenzionale e booleana; 27 RPC `SECURITY DEFINER` restano chiamabili dagli autenticati e richiedono verifica del gate interno. Riferimenti advisor: [anon definer](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated definer](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
3. **Controlli non tutti bloccanti.** Build, E2E, RLS e Realtime non sono nella pipeline. Non è misurata la coverage.
4. **Prestazioni database.** Sono segnalate 10 FK non indicizzate e 46 policy con rivalutazione per riga: [FK](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys), [RLS init plan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan).
5. **Dipendenza algoritmica esterna.** Tabella double-dummy e par dipendono da `bridge-dds` 1.4.0. La licenza Apache-2.0 permette il riuso alle relative condizioni, ma disponibilità, aggiornamenti e compatibilità del pacchetto non sono sotto il controllo esclusivo di BridgeLab.
6. **Telemetria di sessione insufficiente.** Login e contatore minuti non permettono di ricostruire sessioni e durata media.
7. **Asset video locali assenti.** I 49 MP4 tracciati in HEAD sono cancellati nella working tree; lo stato della produzione è non determinabile.

### 3.3 Componenti a reale complessità algoritmica

Le ore sono **STIMATE** per una riscrittura isolata con test minimi. La tariffa centrale è l'**ASSUNZIONE** di 80 €/h; variata del ±30% diventa 56/104 €/h. Le ore e i costi sono mostrati a ±30%. Le componenti si sovrappongono e non devono essere sommate al totale di replica.

| Componente | Funzione e sofisticazione | Evidenza | Base | Sensibilità ±30% |
|---|---|---|---:|---:|
| Motore di gioco, IA, scoring, integrazione DDS e replay | Regole della presa, obbligo di risposta, IA euristica, scoring, diagnosi, tabella/par DDS e valutazione del potenziale dopo ogni presa. Sofisticazione alta nell'orchestrazione; il solver esatto sottostante non è codice proprietario. | `src/lib/bridge-engine.ts:110-174`, `245-330`; `src/lib/dds-table.ts:47-121`; `src/lib/dds-replay.ts:81-156`; `src/components/turning-point-panel.tsx:16-149` | 720 h / 57.600 € | 504–936 h / 40.320–74.880 € |
| Solver interni di supporto e verifica | Ricerca esatta degli endgame con fallback euristico e solver full-hand di controllo basato su bitmask, potatura di carte equivalenti, tabella di trasposizione e ricerca binaria a finestra booleana. Complessità algoritmica alta; il secondo è corretto sui test osservati ma troppo lento per il percorso produttivo e resta uno strumento di convalida. | `src/lib/dds-solver.ts:473-684`; `src/lib/dds-exact.ts:1-32`, `60-100`, `122-233`; `src/lib/dds-exact.test.ts:19-77` | 320 h / 25.600 € | 224–416 h / 17.920–33.280 € |
| Solver DDS di riferimento, solo se riscritto anziché riusato | Ricerca double-dummy ad alte prestazioni sulla smazzata completa, tabella e par. BridgeLab usa una dipendenza Apache-2.0; la riscrittura indipendente non è necessaria per replicare la piattaforma ed è esclusa dalle 6.380 ore. | `src/lib/dds-table.ts:1-24`, `69-121`; `node_modules/bridge-dds/package.json:2-18` | 1.600 h / 128.000 € | 1.120–2.080 h / 89.600–166.400 € |
| Generazione e validazione mani | PRNG seminato, Fisher-Yates, campionamento con rifiuto, vincoli HCP/semi/sagoma, 7 modelli, PBN, calcolo DD/par e contratto per singola mano. Sofisticazione medio-alta. | `src/lib/deal-generator.ts:113-199`, `203-322`; `src/app/istruttori/genera-mani/page.tsx:89-178`; `scripts/valida-smazzate-dds.mjs:69-165` | 420 h / 33.600 € | 294–546 h / 23.520–43.680 € |
| Quiz generativo delle prese | Genera una mano, calcola la risposta con DDS, crea distrattori deterministici e applica una tolleranza didattica. Tre livelli; il numero di quesiti producibili non è finito in catalogo. | `src/lib/trick-quiz.ts:36-150`; `src/app/gioca/quiz-prese/page.tsx:42-105` | 180 h / 14.400 € | 126–234 h / 10.080–18.720 € |
| Ripetizione dilazionata | Leitner a 5 scatole con intervalli 1/3/7/14/30 giorni, regressione su errore e uscita dopo padronanza. Algoritmo reale ma semplice. | `src/lib/spaced-review.ts:1-78` | 80 h / 6.400 € | 56–104 h / 4.480–8.320 € |
| Gamification | 36 livelli XP, badge, achievement segreti, streak, sfide e collezionabili. Ampia nelle regole, ma prevalentemente a soglia. | `src/lib/xp-levels.ts:1-84`; `src/hooks/use-secret-achievements.ts:13-129` | 140 h / 11.200 € | 98–182 h / 7.840–14.560 € |
| Progressione didattica | Blocco moduli e mondi, soglie, sequenza lezione, timer, XP e potenziamenti. Sofisticazione media di orchestrazione. | `src/lib/progression.ts:1-82`; `src/lib/lesson-module.ts:21-267`, `439-486` | 240 h / 19.200 € | 168–312 h / 13.440–24.960 € |
| Matching partner | Normalizzazione, sovrapposizione disponibilità, distanza fra livelli, score pesato, ordinamento stabile e opt-in. Algoritmo semplice; la parte delicata è autorizzativa. | `src/lib/partner-matching.ts:53-166`; `scripts/sql/partner-matching-2026-08.sql:42-125` | 60 h / 4.800 € | 42–78 h / 3.360–6.240 € |

### 3.4 Tempo di replica da parte di 2 senior

**ASSUNZIONE QUALITATIVA DI PERIMETRO:** contenuti, asset e diritti d'uso sono consegnati al team; le dipendenze open source possono essere riutilizzate nel rispetto delle licenze. Una variazione percentuale ±30% non è applicabile a una condizione binaria. Se la condizione non vale, il costo di contenuti e diritti è **non determinabile**; la sola riscrittura del solver DDS aggiunge la stima separata di 1.600 ore, con sensibilità 1.120–2.080 ore.

**ASSUNZIONE — effort:** 6.380 ore-persona. Sensibilità ±30%: 4.466 / 6.380 / 8.294 ore.

| Workstream stimato | −30% | Base | +30% |
|---|---:|---:|---:|
| Core full-stack, sicurezza e dati | 945 h | 1.350 h | 1.755 h |
| UI, PWA, responsive e superfici native | 770 h | 1.100 h | 1.430 h |
| Catalogo didattico e amministrazione contenuti | 546 h | 780 h | 1.014 h |
| Motori bridge, DDS, analisi, modalità e generazione | 1.050 h | 1.500 h | 1.950 h |
| Sociale, istruttori, classi e matching | 455 h | 650 h | 845 h |
| QA, accessibilità, DevOps e documentazione | 700 h | 1.000 h | 1.300 h |
| **Totale** | **4.466 h** | **6.380 h** | **8.294 h** |

**ASSUNZIONE — capacità:** 160 ore/mese per ciascuno dei 2 senior. A effort base, la sensibilità ±30% della capacità è 112/160/208 ore mensili e produce 28,48/19,94/15,34 mesi.

**STIMATO:** a capacità base, l'effort ±30% produce 13,96/19,94/25,92 mesi. Dipendenze sequenziali, approvazioni e revisione dei contenuti possono allungare il calendario.

## 4. Fase 3 — Profondità di prodotto

### 4.1 Contenuti e funzioni presenti

| Unità | Quantità | Stato |
|---|---:|---|
| Corsi / mondi / lezioni / moduli vivi | 4 / 16 / 49 / 199 | Funzionanti nel DB vivo |
| Moduli teoria / esercizio / quiz / pratica | 100 / 40 / 49 / 10 | Funzionanti nel DB vivo |
| Tipologie quiz inline | 5 | Quiz, vero/falso, selezione carta, valutazione mano, selezione licita |
| Blocchi quiz inline | 214 | Implementati nel sorgente statico |
| Quiz generativo “Quante prese?” | 1 tipologia / 3 livelli | Implementato e coperto da unit test; quesiti generati a runtime |
| Numero totale di quesiti generabili | **non determinabile** | Dipende dai seed e dalle mani generate, non da un catalogo finito |
| Blocchi contenuto nei moduli | 1.093 | MISURATO nel DB |
| Domande comprensione statiche | 111 in 37 set | Implementate in sorgente |
| Scenari pratica licita | 20 | Implementati in sorgente |
| Scenari impasse | 32 | Implementati in sorgente |
| Eserciziario | 31 esercizi / 150 blocchi | Funzionante nel DB |
| “Trova l'errore” | 32 scenari | Funzionante nel DB |
| Mani catalogo principale | 272 | Tutte con metrica DD nel DB |
| Mani da dichiarante / orientate alla difesa | 216 / 56 | CALCOLATO dalla metrica DD |
| Mani MiniBridge | 73 | Implementate in sorgente |
| Mani guidate | 2 | Funzionanti ma limitate |
| Modelli generatore mani | 7 | Implementati e testati; non sono mani precaricate |
| Glossario | 49 voci | Funzionante nel DB |
| Badge standard / achievement segreti | 13 / 10 | Implementati |
| Sfide settimanali / nomi badge | 12 / 12 | Presenti nel DB |
| Livelli XP | 36 | Implementati |
| Carte collezionabili | 22 | Catalogo presente |
| Schermate instradabili | 69 | Compilano; collaudo E2E completo non eseguito |

**CALCOLATO:** 272 + 73 + 2 = 347 definizioni di mani precaricate fra catalogo vivo, MiniBridge e mani guidate. Il sorgente statico conta 340 definizioni e 267 mani validate, perché seed e database vivo non coincidono. Non è stata eseguita una deduplicazione per distribuzione: il numero di mani uniche è **non determinabile**.

Distribuzione dei 199 moduli: Cuori gioco 10 lezioni/32 moduli; Cuori licita 14/28; Fiori 13/91; Quadri 12/48.

Distribuzione dei 1.093 blocchi: 323 testo, 230 quiz, 159 regola, 123 esempio, 120 titolo, 43 vero/falso, 41 selezione licita, 33 suggerimento, 11 selezione carta e 10 valutazione mano.

### 4.2 Flussi completi e parti abbozzate

Un flusso è contato quando il codice espone ingresso, azione, esito e persistenza o ritorno visibile. È una verifica da codice e dati aggregati, non un collaudo UX autenticato.

**CALCOLATO da ispezione statica: 14 flussi implementati nel codice:** (1) registrazione/login/recupero/profilo; (2) corso→lezione→modulo→completamento; (3) gioco→risultato→progressione; (4) mano del giorno/sfida settimanale; (5) amico→richiesta→accettazione→sfida; (6) forum→commento/like/sondaggio; (7) richiesta istruttore→revisione admin; (8) classe→adesione→compito→messaggistica; (9) ricerca/consultazione circolo; (10) errore didattico→ripasso→riprova; (11) cancellazione account; (12) generazione mani→DD/par→PBN→assegnazione classe; (13) opt-in partner→filtri/affinità→richiesta amicizia; (14) generazione quiz prese→risposta→punteggio→domanda successiva.

Evidenza aggregata di persistenza: 1.090 profili, 18.355 completamenti modulo, 59.413 risultati gioco, 512 sfide, 145 relazioni di amicizia, 17 post, 27 commenti, 65 voti, 15 richieste istruttore, 15 classi, 52 adesioni, 14 compiti, 7 messaggi classe, 130 elementi di ripasso e 50 risultati torneo.

**Abbozzato, limitato o non dimostrato:**

- matching partner: codice e policy presenti, ma 0 schede vive; adozione non dimostrata;
- mani guidate: soltanto 2 unità;
- Cuori licita: 14 lezioni e 28 moduli, ma 0 mani dedicate nel catalogo statico;
- push: tabella e codice presenti, ma 0 sottoscrizioni vive;
- negozio/collezione: 22 carte, con parte dello stato client-side; portabilità cross-device non dimostrata;
- quiz generativo, analisi presa per presa e consenso: unit test o E2E presenti, ma collaudo E2E completo non eseguito in questa analisi;
- analytics sessioni: mancano eventi affidabili start/end;
- video locali: 49 MP4 presenti in HEAD ma 0 nella working tree; disponibilità in produzione non determinabile;
- Sentry e servizi esterni: cablati, ma variabili e disponibilità di produzione **non determinabili**.

## 5. Fase 4 — Dati di utilizzo, solo aggregati

### 5.1 Quadro generale

| Metrica | Valore | Natura |
|---|---:|---|
| Utenti registrati | 1.090 | MISURATO su `auth.users` |
| Profili | 1.090 | MISURATO |
| Eventi login | 10.444 | MISURATO; non equivalgono a sessioni |
| Minuti visibili cumulativi | 481.652 | MISURATO come contatore profili; non è durata sessione |
| Righe completamento modulo | 18.355 | MISURATO |
| Coppie utente-lezione completata | 3.077 | CALCOLATO |
| Utenti con almeno una lezione completata | 342 | CALCOLATO |
| Sessioni reali | **non determinabile** | Telemetria insufficiente |
| Tempo medio di sessione | **non determinabile** | Telemetria insufficiente |

Il contatore minuti cresce lato client quando la scheda è visibile (`src/hooks/use-activity-tracker.ts:5-26`). È un indicatore cumulativo, non una ricostruzione di sessioni.

### 5.2 Registrazioni, crescita e utenti attivi

| Mese 2026 | Registrazioni | Crescita mese/mese | Utenti attivi da login | Eventi login |
|---|---:|---:|---:|---:|
| Febbraio | 19 | non determinabile | 9 | 9 |
| Marzo | 668 | +3.415,79% | 678 | 1.781 |
| Aprile | 165 | −75,30% | 373 | 2.001 |
| Maggio | 108 | −34,55% | 312 | 2.021 |
| Giugno | 66 | −38,89% | 298 | 1.895 |
| Luglio | 47 | −28,79% | 236 | 1.957 |
| Agosto, giorni 1–12 | 17 | −63,83% | 146 | 780 |

Agosto è parziale e non confrontabile direttamente con mesi completi. La causa del picco di marzo è **non determinabile** dai soli aggregati.

### 5.3 Lezioni completate

Tutte le 18.355 righe modulo hanno trovato corrispondenza con il catalogo vivo; 0 sono rimaste senza match.

| Mese 2026 | Lezioni completate |
|---|---:|
| Febbraio | 16 |
| Marzo | 1.066 |
| Aprile | 546 |
| Maggio | 567 |
| Giugno | 389 |
| Luglio | 383 |
| Agosto, giorni 1–12 | 110 |

La data della lezione è il timestamp dell'ultimo modulo necessario. Se i requisiti cambiano, il dato storico ricostruito può cambiare.

### 5.4 Retention

**ASSUNZIONE:** retention rolling a N giorni = utente registrato da almeno N giorni con almeno un login a partire da `created_at + N giorni`. Non è retention exact-day.

**Sensibilità ±30%:** per 7 giorni si usano 5/7/9 giorni arrotondati; per 30 giorni si usano 21/30/39 giorni.

| Soglia | Eleggibili | Ritenuti | Retention |
|---|---:|---:|---:|
| 5 giorni | 1.083 | 492 | 45,43% |
| **7 giorni** | **1.076** | **473** | **43,96%** |
| 9 giorni | 1.076 | 463 | 43,03% |
| 21 giorni | 1.056 | 381 | 36,08% |
| **30 giorni** | **1.042** | **332** | **31,86%** |
| 39 giorni | 1.031 | 306 | 29,68% |

I valori sono **STIMATI mediante proxy**. La sensibilità varia la soglia temporale ma non elimina il bias della sorgente login.

### 5.5 Sessioni e durata

**ASSUNZIONE diagnostica:** nuovo intervallo dopo 30 minuti senza login. Sensibilità ±30%: 21/30/39 minuti.

Per tutte le soglie risultano 10.432 intervalli inferiti, dei quali 10.422 a evento singolo; media e mediana sono 0,00 minuti. La stabilità non convalida il dato: dimostra che la tabella non contiene heartbeat o logout. Il numero di sessioni reali è **non determinabile**; il tempo medio è **non determinabile**.

## 6. Fase 5 — Valutazione economica

### 6.1 Tariffe e fonti

**ASSUNZIONE A — tariffe senior italiane:** 60/80/100 €/h. Sensibilità ±30% della tariffa centrale: 56/80/104 €/h. Un benchmark commerciale italiano colloca la media full-stack senior intorno a 70–90 €/h: [benchmark freelance](https://systemforge.it/blog/tariffe-programmatore-freelance-italia-2026/).

**ASSUNZIONE B — tariffe fornitore:** 80/100/120 €/h. Sensibilità ±30% della tariffa centrale: 70/100/130 €/h. Il benchmark consultato indica 80–150 €/h per un senior in software house: [benchmark software house](https://systemforge.it/blog/quanto-costa-sviluppare-software-italia-2025/).

**Dato MISURATO:** cambio BCE del 12 agosto 2026: 1 EUR = 1,1545 USD, [Banca Centrale Europea](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml).

### 6.2 Assunzioni e sensibilità

Ogni assunzione quantitativa è mostrata su una riga. Le variazioni sono one-at-a-time; non vengono cumulate salvo dove dichiarato.

| Assunzione | −30% | Base | +30% | Effetto |
|---|---:|---:|---:|---|
| Effort replica | 4.466 h | 6.380 h | 8.294 h | Metodo A e calendario |
| Capacità di ciascun senior | 112 h/mese | 160 h/mese | 208 h/mese | 28,48 / 19,94 / 15,34 mesi a effort base |
| Overhead fornitore sull'implementazione | 35% | 50% | 65% | 8.613 / 9.570 / 10.527 h |
| Licenza LMS mensile | 174,30 USD | 249 USD | 323,70 USD | 5.435,08 / 7.764,40 / 10.093,72 € su 36 mesi |
| Hosting mensile | 31,50 USD | 45 USD | 58,50 USD | 982,24 / 1.403,20 / 1.824,17 € su 36 mesi |
| Manutenzione | 14 h/mese | 20 h/mese | 26 h/mese | 40.320 / 57.600 / 74.880 € a 80 €/h |
| Tariffa manutenzione | 56 €/h | 80 €/h | 104 €/h | 40.320 / 57.600 / 74.880 € a 20 h/mese |

**ASSUNZIONE — perimetro fornitore:** all'implementazione si aggiungono analisi 10%, UX/solution design 10%, QA/sicurezza indipendenti 15% e project management 15%. Applicando ±30% a ciascuna percentuale, l'overhead complessivo varia 35–65%.

**ASSUNZIONE — LMS comparabile:** LearnWorlds Learning Center a 249 USD/mese con fatturazione annuale e 2.000 monthly active learners; il massimo osservato di 678 MAU rientra nel limite. Il prodotto comparabile non include i motori di bridge: [listino](https://www.learnworlds.com/pricing/), [limiti piano](https://www.learnworlds.com/plans/).

**ASSUNZIONE — hosting:** Vercel Pro 20 USD/mese più Supabase Pro 25 USD/mese, senza extra a consumo. Sono minimi pubblici, non fatture BridgeLab: [Vercel](https://vercel.com/pricing), [Supabase](https://supabase.com/pricing).

### 6.3 Metodo A — costo di riproduzione

Formula: effort × tariffa. Ogni riga varia l'effort del ±30%.

| Tariffa | Effort −30% | Base | Effort +30% |
|---:|---:|---:|---:|
| 60 €/h | 267.960 € | 382.800 € | 497.640 € |
| 80 €/h | 357.280 € | **510.400 €** | 663.520 € |
| 100 €/h | 446.600 € | 638.000 € | 829.400 € |

**Range A:** 267.960–829.400 euro. Scenario centrale: 510.400 euro.

### 6.4 Metodo B — costo di sostituzione

Il perimetro base è 9.570 ore, comprensive delle funzioni non strettamente di coding. La tabella varia l'intero perimetro del ±30%.

| Tariffa | Perimetro −30% | Base | Perimetro +30% |
|---:|---:|---:|---:|
| 80 €/h | 535.920 € | **765.600 €** | 995.280 € |
| 100 €/h | 669.900 € | **957.000 €** | 1.244.100 € |
| 120 €/h | 803.880 € | 1.148.400 € | 1.492.920 € |

**Range B:** 535.920–1.492.920 euro. Requisiti, contenuti e riuso delle dipendenze open source sono assunti disponibili; gara, certificazioni, SLA e supporto pluriennale possono cambiare il prezzo.

### 6.5 Metodo C — valore d'uso triennale

| Componente, 36 mesi | Base | Sensibilità ±30% |
|---|---:|---:|
| Licenza LMS comparabile | 7.764,40 € | 5.435,08–10.093,72 € |
| Hosting | 1.403,20 € | 982,24–1.824,17 € |
| Manutenzione | 57.600,00 € | 40.320,00–74.880,00 € |
| **Totale** | **66.767,61 €** | **46.737,32–86.797,89 €** |

I totali sono calcolati prima dell'arrotondamento delle singole righe; per questo la somma visiva può differire di un centesimo. La sensibilità delle ore e quella della tariffa di manutenzione non sono composte simultaneamente. Il metodo C misura un equivalente operativo generico e non viene mediato con A o B.

### 6.6 Range prudenziale del valore conferito

**STIMATO: 382.800–765.600 euro, IVA esclusa.**

- 382.800 euro = 6.380 ore × 60 €/h, metodo A base prudente.
- 765.600 euro = 9.570 ore × 80 €/h, metodo B base prudente.

Il metodo B è il più difendibile per una federazione perché confronta il bene con una commissione esterna completa di analisi, design, QA e project management. Il metodo A mantiene un limite inferiore utile; il metodo C descrive soltanto il valore d'uso di un sostituto generico.

Il range non include marchio, avviamento, esclusiva dei contenuti, dati personali, benefici fiscali, crescita futura o valore reputazionale. Non attribuisce a BridgeLab la proprietà del solver `bridge-dds`. Non sottrae un costo di bonifica: richiederebbe un capitolato separato.

## Tabella riassuntiva finale

| Ore stimate | Commit | Righe di codice applicativo | Giorni di lavoro attivi | Qualità media | Valore stimato prudenziale |
|---:|---:|---:|---:|---:|---:|
| 6.380 h replica; 103,56 h timestamp come limite inferiore | 258 | 66.608 | 54 | 3,17/5 | 382.800–765.600 € |

## Limiti della presente analisi

Questa perizia non può dimostrare la correttezza didattica, la conformità completa a WCAG o GDPR, l'assenza di vulnerabilità, la titolarità dei diritti, la compatibilità legale di tutte le dipendenze, la capacità sotto carico, la disponibilità dei servizi esterni, la disponibilità in produzione dei 49 video assenti dalla working tree, la corrispondenza fra working tree e produzione o il lavoro svolto fuori da Git. Non sono stati eseguiti penetration test, collaudo E2E autenticato, test RLS/Realtime che creano dati, audit contabile delle fatture cloud o due diligence legale. Il superamento della build non prova il corretto funzionamento di tutte le schermate o la presenza degli asset richiamati. Gli advisor sono euristiche e richiedono verifica manuale. Il numero di sessioni e il tempo medio sono non determinabili; retention e completamenti lezione sono proxy ricostruiti. La stima economica assume disponibilità di contenuti, diritti e dipendenze open source e usa tariffe/listini pubblici, non offerte vincolanti. La perizia non è giurata e non sostituisce valutazioni legali, fiscali o patrimoniali.

---

## Appendice A — Comandi, query e output grezzi

I comandi shell sono stati eseguiti dalla radice del repository. Gli output database sono aggregati o metadati di schema. Nessuna riga personale è stata estratta.

### A.1 Baseline

Comandi:

```bash
date '+%Y-%m-%d %H:%M:%S %Z'
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
if test -n "$(git status --short --untracked-files=no)"; then echo tracked_worktree_dirty; else echo tracked_worktree_clean; fi
git status --short -- public/videos | rg '^ D ' | wc -l
git ls-tree -r --name-only HEAD public/videos | rg '\.mp4$' | wc -l
find public/videos -type f -name '*.mp4' 2>/dev/null | wc -l
```

Output rilevante:

```text
2026-08-12 23:59:08 CEST
main
c56d29299ea6e21c2043aa5c2a2767c1921f62e4
tracked_worktree_dirty
49
49
0
```

Il controllo limitato a `public/videos` ha contato le cancellazioni senza riportare altri nomi di file fuori perimetro.

### A.2 Git ed effort timestamp

Comando:

```bash
node audit-bridgelab/collect-git-metrics.mjs
```

Output grezzo:

```json
{
  "ambito":{"ramo_corrente":"main","head":"c56d29299ea6e21c2043aa5c2a2767c1921f62e4","riferimenti_branch_validi":["refs/heads/main","refs/heads/perf/tier0-quickwins","refs/heads/redesign/ui-v2","refs/remotes/origin/main","refs/remotes/origin/perf/tier0-quickwins","refs/remotes/origin/redesign/ui-v2","refs/remotes/origin/vercel/vercel-web-analytics-to-nextjs-wy0msr"]},
  "git":{
    "commit_totali":258,
    "commit_per_autore_pseudonimizzato":{"Autore-10620de2":257,"Autore-6a19acae":1},
    "primo_commit":{"hash":"6471b4830500b3c64004696a9258145486a998ce","timestamp_Europe_Madrid":"2026-02-08 00:15:02"},
    "ultimo_commit":{"hash":"c56d29299ea6e21c2043aa5c2a2767c1921f62e4","timestamp_Europe_Madrid":"2026-08-12 23:24:03"},
    "giorni_calendario_attivi":54,
    "commit_per_mese":{"2026-02":53,"2026-03":96,"2026-04":7,"2026-05":21,"2026-06":20,"2026-07":14,"2026-08":47},
    "commit_per_fascia_oraria_Europe_Madrid":{"00-05":55,"06-11":54,"12-17":88,"18-23":61},
    "dimensione_commit_mediana_righe_aggiunte_piu_rimosse":160.5,
    "righe_aggiunte_totali":200664,
    "righe_rimosse_totali":33994,
    "occorrenze_file_binari_ignorate_nel_conteggio_righe":524,
    "branch_locali_validi":3,"branch_remoti_validi":4,"branch_validi_totali":7,"merge_commit":2
  },
  "effort_timestamp":{"sessioni":93,"minuti_totali":6214,"ore_totali":103.56}
}
```

Output file più modificati:

```json
[{"path":"src/app/page.tsx","commits":58,"added":3901,"removed":3845,"churn":7746},{"path":"src/app/profilo/page.tsx","commits":46,"added":2558,"removed":2246,"churn":4804},{"path":"src/app/admin/page.tsx","commits":38,"added":2822,"removed":2608,"churn":5430},{"path":"src/app/lezioni/[lessonId]/[moduleId]/page.tsx","commits":31,"added":2844,"removed":2675,"churn":5519},{"path":"src/app/gioca/smazzata/page.tsx","commits":30,"added":1532,"removed":295,"churn":1827},{"path":"src/app/gioca/page.tsx","commits":29,"added":1145,"removed":496,"churn":1641},{"path":"src/components/desktop-sidebar.tsx","commits":28,"added":712,"removed":532,"churn":1244},{"path":"src/app/layout.tsx","commits":28,"added":368,"removed":106,"churn":474},{"path":"src/app/login/page.tsx","commits":24,"added":734,"removed":163,"churn":897},{"path":"src/app/classifica/page.tsx","commits":23,"added":2039,"removed":649,"churn":2688},{"path":"src/app/gioca/sfida/page.tsx","commits":23,"added":676,"removed":106,"churn":782},{"path":"src/app/gioca/mano-del-giorno/page.tsx","commits":21,"added":1837,"removed":1703,"churn":3540},{"path":"src/components/bridge/bridge-table.tsx","commits":21,"added":550,"removed":140,"churn":690},{"path":"src/app/impostazioni/page.tsx","commits":20,"added":1020,"removed":277,"churn":1297},{"path":"src/app/lezioni/page.tsx","commits":19,"added":765,"removed":173,"churn":938}]
```

Warning Git:

```text
warning: ignoring ref with broken name refs/remotes/origin/main 2
```

### A.3 `cloc`, inventario e dimensione pagine

Comandi:

```bash
npx --yes cloc src/app src/components src/contexts src/hooks src/lib src/store src/proxy.ts instrumentation.ts instrumentation-client.ts --fullpath --not-match-f='(src/lib/supabase/types\.ts$|\.(test|spec)\.[^.]+$)' --exclude-dir=node_modules,.next,.next.nosync,build,dist --exclude-ext=lock --hide-rate
npx --yes cloc $(rg --files src e2e | rg '\.(test|spec)\.[^.]+$') scripts/test-rls.mjs scripts/test-realtime.mjs --hide-rate
npx --yes cloc src/data cuori-gioco-knowledge.md cuori-licita-knowledge.md fiori-knowledge.md quadri-knowledge.md --include-ext=ts,md --hide-rate
npx --yes cloc package.json components.json tsconfig.json vercel.json next.config.ts capacitor.config.ts eslint.config.mjs postcss.config.mjs vitest.config.ts playwright.config.ts --exclude-ext=lock --hide-rate
find public/captions -type f -name '*.ass' -print0 | xargs -0 wc -l | tail -n 1
find public/captions -type f -name '*.ass' | wc -l
```

Output grezzo:

```text
Language       files blank comment  code
TypeScript       394  6232    5258 66208
CSS                1    49      52   400
SUM              395  6281    5310 66608

Language       files blank comment code
TypeScript        38   923     580 5469
JavaScript         2    82     118  556
SUM               40  1005     698 6025

Language       files blank comment  code
TypeScript        21   551     766 18082
Markdown           4   487       0  2192
SUM               25  1038     766 20274

Language       files blank comment code
JSON                4     0       0 189
TypeScript          4    10      66 182
JavaScript          2     3       5  46
SUM                10    13      71 417

7012 total
49
```

Comandi inventario:

```bash
find src/components -type f -name '*.tsx' | wc -l
find src/app -type f -name 'page.tsx' | wc -l
find src/app/api -type f -name 'route.ts' | wc -l
rg -o 'export (async function|const) (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)' src/app/api --glob 'route.ts' | wc -l
find scripts/sql -type f -name '*.sql' | wc -l
rg -i -o 'create\s+policy' scripts/sql --glob '*.sql' | wc -l
rg -i -o 'create\s+table(\s+if\s+not\s+exists)?\s+([a-zA-Z0-9_.]+)' scripts/sql --glob '*.sql' | sed -E 's/.*[[:space:]]+([A-Za-z0-9_.]+)$/\1/' | sort -u | wc -l
find supabase/migrations -type f -name '*.sql' 2>/dev/null | wc -l
find src e2e -type f \( -name '*.test.*' -o -name '*.spec.*' \) | wc -l
find src -type f \( -name '*.test.*' -o -name '*.spec.*' \) | wc -l
find e2e -type f \( -name '*.test.*' -o -name '*.spec.*' \) | wc -l
find .github/workflows -type f 2>/dev/null | wc -l
```

Output nello stesso ordine:

```text
94
69
10
11
33
48
15
0
38
32
6
1
```

Comando pagine:

```bash
find src/app -type f -name 'page.tsx' -print0 | xargs -0 wc -l | sort -nr | head -n 16
```

Output:

```text
30886 total
1390 src/app/classifica/page.tsx
1237 src/app/gioca/smazzata/page.tsx
1157 src/app/gioca/quiz-lampo/page.tsx
1148 src/app/gioca/sfida-imp/page.tsx
1029 src/app/gioca/sfida-amico/page.tsx
937 src/app/gioca/trova-errore/page.tsx
831 src/app/negozio/page.tsx
804 src/app/gioca/impasse/page.tsx
793 src/app/forum/[postId]/page.tsx
775 src/app/collezione/page.tsx
743 src/app/impostazioni/page.tsx
736 src/app/gioca/sfida-link/page.tsx
723 src/app/amici/page.tsx
721 src/app/gioca/pratica-licita/page.tsx
649 src/app/gioca/page.tsx
```

### A.4 Inventario prodotto statico

Comandi:

```bash
npx tsx audit-bridgelab/collect-static-product-metrics.ts
node -e 'const total=272, defense=56; console.log(JSON.stringify({catalog_hands:total,declarer_oriented:total-defense,defense_oriented:defense,defense_oriented_pct:Number((100*defense/total).toFixed(2))}))'
node -e 'const p=require("./node_modules/bridge-dds/package.json"); console.log(JSON.stringify({name:p.name,version:p.version,license:p.license,repository:p.repository}))'
```

Output grezzo:

```json
{
  "repository_static_content":{"courses":4,"lessons":49,"lessons_by_course":{"fiori":13,"quadri":12,"cuori-gioco":10,"cuori-licita":14},"modules":168,"content_blocks":943,"content_block_distribution":{"bid-select":34,"card-select":5,"example":123,"hand-eval":8,"heading":120,"quiz":126,"rule":159,"text":294,"tip":33,"true-false":41},"inline_quiz_types_present":["quiz","true-false","card-select","hand-eval","bid-select"],"inline_quiz_type_count":5,"inline_quiz_blocks":214,"comprehension_lesson_sets":37,"comprehension_questions":111,"bidding_practice_scenarios":20,"impasse_scenarios":32,"fiori_smazzate":96,"quadri_smazzate":96,"cuori_gioco_smazzate":80,"cuori_licita_smazzate":0,"all_validated_smazzate":267,"playable_smazzate_after_plausibility_filter":255,"wbf_minibridge_deals":73,"preloaded_hand_definitions_total":340,"standard_badges":13,"secret_achievements":10,"xp_levels":36,"constrained_deal_templates":7,"generated_trick_quiz_levels":3},
  "interface_inventory":{"component_tsx_files_under_src_components":94,"routable_page_files":69,"routes":["/","/accessibilita","/admin","/admin/classi","/admin/istruttori","/amici","/appunti","/auth","/circolo/[slug]","/classi","/classi/[classId]","/classi/[classId]/compito/[assignmentId]","/classifica","/collezione","/dispense","/diventa-istruttore","/forum","/forum/[postId]","/forum/nuovo","/gioca","/gioca/analisi","/gioca/conta-veloce","/gioca/dichiara","/gioca/impasse","/gioca/mano-del-giorno","/gioca/mano-guidata","/gioca/memory","/gioca/minibridge","/gioca/pratica","/gioca/pratica-licita","/gioca/quiz-lampo","/gioca/quiz-prese","/gioca/segnali","/gioca/sfida","/gioca/sfida-amico","/gioca/sfida-imp","/gioca/sfida-link","/gioca/sfida-settimanale","/gioca/smazzata","/gioca/torneo","/gioca/trova-errore","/glossario","/guida","/impara","/impostazioni","/istruttori","/istruttori/[classId]","/istruttori/[classId]/compito/[assignmentId]","/istruttori/[classId]/nuovo-compito","/istruttori/genera-mani","/lezioni","/lezioni/[lessonId]","/lezioni/[lessonId]/[moduleId]","/login","/negozio","/obiettivi","/prima-mano","/privacy","/profilo","/profilo/wrapped","/registrati","/reset-password","/ripasso","/scopri","/scuola","/termini","/trova-circolo","/trova-compagno","/~offline"],"api_route_files":10,"exported_http_handlers":11}
}
{"catalog_hands":272,"declarer_oriented":216,"defense_oriented":56,"defense_oriented_pct":20.59}
{"name":"bridge-dds","version":"1.4.0","license":"Apache-2.0","repository":{"type":"git","url":"https://github.com/bookchris/bridge-dds-js.git"}}
```

### A.5 Database: query di sola lettura

I testi SQL esatti sono nei file `audit-bridgelab/sql/01-schema-aggregates.sql`–`09-function-permissions.sql`. Comando eseguito per leggerli integralmente:

```bash
for f in audit-bridgelab/sql/01-schema-aggregates.sql audit-bridgelab/sql/02-policy-review.sql audit-bridgelab/sql/03-table-row-counts.sql audit-bridgelab/sql/04-product-aggregates.sql audit-bridgelab/sql/05-usage-aggregates.sql audit-bridgelab/sql/06-session-diagnostic.sql audit-bridgelab/sql/07-profile-column-privileges.sql audit-bridgelab/sql/08-dds-coverage.sql audit-bridgelab/sql/09-function-permissions.sql; do sed -n '1,400p' "$f"; done
```

Il connettore non espone una riga di comando shell. Ogni `SELECT` stampato dal comando precedente è stato inviato separatamente, senza istruzioni di scrittura, con questi parametri esatti: strumento `mcp__codex_apps__supabase_execute_sql`; `project_id=mjojjktuhhnycdsikcla`; `query=` testo integrale del singolo `SELECT` contenuto nei file elencati. Questa formulazione evita di presentare come “comando esatto” una pseudo-sintassi non eseguibile.

Output schema, policy e funzioni:

```json
[{"public_tables":35,"rls_enabled_tables":35,"indexes":99,"rls_policies":72,"functions":30,"security_definer_functions":28,"primary_keys":35,"foreign_keys":39,"check_constraints":40,"unique_constraints":17}]
[{"cmd":"ALL","policies":3},{"cmd":"DELETE","policies":10},{"cmd":"INSERT","policies":17},{"cmd":"SELECT","policies":32},{"cmd":"UPDATE","policies":10}]
[{"security_definer_functions":28,"anon_executable":1,"authenticated_executable":27,"explicit_search_path":28,"anon_functions":[{"name":"is_bbo_username_taken","config":"search_path=public","return_type":"boolean"}]}]
```

Output grezzo delle policy selezionate per la revisione autorizzativa (metadati, nessuna riga utente):

```json
[{"tablename":"assignments","policyname":"Instructor can delete assignments","roles":"{public}","cmd":"DELETE","qual":"is_instructor_of_class(class_id)","with_check":null},{"tablename":"assignments","policyname":"Instructor can create assignments","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"is_instructor_of_class(class_id)"},{"tablename":"assignments","policyname":"Instructor and members can view assignments","roles":"{public}","cmd":"SELECT","qual":"(is_instructor_of_class(class_id) OR is_member_of_class(class_id))","with_check":null},{"tablename":"assignments","policyname":"Instructor can update assignments","roles":"{public}","cmd":"UPDATE","qual":"is_instructor_of_class(class_id)","with_check":null},{"tablename":"challenges","policyname":"Challenger can delete pending challenges","roles":"{public}","cmd":"DELETE","qual":"((auth.uid() = challenger_id) AND (status = 'pending'::text))","with_check":null},{"tablename":"challenges","policyname":"Users can create challenges","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"(auth.uid() = challenger_id)"},{"tablename":"challenges","policyname":"Players can view own challenges","roles":"{public}","cmd":"SELECT","qual":"((auth.uid() = challenger_id) OR (auth.uid() = opponent_id))","with_check":null},{"tablename":"challenges","policyname":"Players can update own challenges","roles":"{public}","cmd":"UPDATE","qual":"((auth.uid() = challenger_id) OR (auth.uid() = opponent_id))","with_check":null},{"tablename":"class_members","policyname":"Instructor or self can delete membership","roles":"{public}","cmd":"DELETE","qual":"((student_id = auth.uid()) OR is_instructor_of_class(class_id))","with_check":null},{"tablename":"class_members","policyname":"Students can join themselves","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"(student_id = auth.uid())"},{"tablename":"class_members","policyname":"Members and owning instructor can view membership","roles":"{public}","cmd":"SELECT","qual":"((student_id = auth.uid()) OR is_instructor_of_class(class_id))","with_check":null},{"tablename":"class_members","policyname":"Instructor or self can update membership","roles":"{public}","cmd":"UPDATE","qual":"((student_id = auth.uid()) OR is_instructor_of_class(class_id))","with_check":null},{"tablename":"classes","policyname":"Instructors can delete own classes","roles":"{public}","cmd":"DELETE","qual":"(instructor_id = auth.uid())","with_check":null},{"tablename":"classes","policyname":"Instructors can create classes","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"((instructor_id = auth.uid()) AND (EXISTS (SELECT 1 FROM profiles p WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['instructor'::text, 'admin'::text]))))))"},{"tablename":"classes","policyname":"Instructors and members can view classes","roles":"{public}","cmd":"SELECT","qual":"((instructor_id = auth.uid()) OR is_member_of_class(id))","with_check":null},{"tablename":"classes","policyname":"Instructors can update own classes","roles":"{public}","cmd":"UPDATE","qual":"(instructor_id = auth.uid())","with_check":null},{"tablename":"completed_modules","policyname":"Own modules","roles":"{public}","cmd":"ALL","qual":"(auth.uid() = user_id)","with_check":null},{"tablename":"friendships","policyname":"Either party can delete friendship","roles":"{public}","cmd":"DELETE","qual":"((auth.uid() = user_id) OR (auth.uid() = friend_id))","with_check":null},{"tablename":"friendships","policyname":"Users can send friend requests","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"(auth.uid() = user_id)"},{"tablename":"friendships","policyname":"Users can view own friendships","roles":"{public}","cmd":"SELECT","qual":"((auth.uid() = user_id) OR (auth.uid() = friend_id))","with_check":null},{"tablename":"friendships","policyname":"Recipients can accept or decline","roles":"{public}","cmd":"UPDATE","qual":"(auth.uid() = friend_id)","with_check":null},{"tablename":"instructor_requests","policyname":"Users can file own request","roles":"{public}","cmd":"INSERT","qual":null,"with_check":"(user_id = auth.uid())"},{"tablename":"instructor_requests","policyname":"Self or admin can read requests","roles":"{public}","cmd":"SELECT","qual":"((user_id = auth.uid()) OR is_admin())","with_check":null},{"tablename":"instructor_requests","policyname":"Self or admin can update request","roles":"{public}","cmd":"UPDATE","qual":"((user_id = auth.uid()) OR is_admin())","with_check":null},{"tablename":"login_history","policyname":"Authenticated can insert own login history","roles":"{authenticated}","cmd":"INSERT","qual":null,"with_check":"(user_id = auth.uid())"},{"tablename":"login_history","policyname":"Users can read own login history","roles":"{authenticated}","cmd":"SELECT","qual":"(user_id = auth.uid())","with_check":null},{"tablename":"partner_profiles","policyname":"partner_profiles_delete","roles":"{authenticated}","cmd":"DELETE","qual":"(user_id = auth.uid())","with_check":null},{"tablename":"partner_profiles","policyname":"partner_profiles_insert","roles":"{authenticated}","cmd":"INSERT","qual":null,"with_check":"(user_id = auth.uid())"},{"tablename":"partner_profiles","policyname":"partner_profiles_select","roles":"{authenticated}","cmd":"SELECT","qual":"(looking OR (user_id = auth.uid()))","with_check":null},{"tablename":"partner_profiles","policyname":"partner_profiles_update","roles":"{authenticated}","cmd":"UPDATE","qual":"(user_id = auth.uid())","with_check":"(user_id = auth.uid())"},{"tablename":"profiles","policyname":"Users can insert own profile","roles":"{authenticated}","cmd":"INSERT","qual":null,"with_check":"(id = auth.uid())"},{"tablename":"profiles","policyname":"Authenticated users can read profiles","roles":"{authenticated}","cmd":"SELECT","qual":"true","with_check":null},{"tablename":"profiles","policyname":"Users update own profile","roles":"{public}","cmd":"UPDATE","qual":"(auth.uid() = id)","with_check":null},{"tablename":"review_items","policyname":"Own reviews","roles":"{public}","cmd":"ALL","qual":"(auth.uid() = user_id)","with_check":null},{"tablename":"tournament_results","policyname":"Users can insert own tournament result","roles":"{authenticated}","cmd":"INSERT","qual":null,"with_check":"(user_id = auth.uid())"},{"tablename":"tournament_results","policyname":"Authenticated can read tournament results","roles":"{authenticated}","cmd":"SELECT","qual":"true","with_check":null},{"tablename":"tournament_results","policyname":"Users can update own tournament result","roles":"{authenticated}","cmd":"UPDATE","qual":"(user_id = auth.uid())","with_check":"(user_id = auth.uid())"}]
```

Output conteggi tabelle:

```json
[{"table_name":"asd","rows":241},{"table_name":"asd_clubs","rows":260},{"table_name":"assignments","rows":14},{"table_name":"badges","rows":1434},{"table_name":"bbo_username_cleanup_2026_08","rows":9},{"table_name":"challenges","rows":512},{"table_name":"class_members","rows":52},{"table_name":"class_messages","rows":7},{"table_name":"classes","rows":15},{"table_name":"collectible_cards","rows":22},{"table_name":"completed_modules","rows":18355},{"table_name":"course_worlds","rows":16},{"table_name":"courses","rows":4},{"table_name":"email_events","rows":639},{"table_name":"eserciziario_exercises","rows":31},{"table_name":"forum_comments","rows":27},{"table_name":"forum_likes","rows":6},{"table_name":"forum_poll_votes","rows":65},{"table_name":"forum_posts","rows":17},{"table_name":"friendships","rows":145},{"table_name":"game_results","rows":59413},{"table_name":"glossary","rows":49},{"table_name":"guided_hands","rows":2},{"table_name":"instructor_requests","rows":15},{"table_name":"lesson_modules","rows":199},{"table_name":"lessons","rows":49},{"table_name":"login_history","rows":10444},{"table_name":"partner_profiles","rows":0},{"table_name":"profiles","rows":1090},{"table_name":"push_subscriptions","rows":0},{"table_name":"review_items","rows":130},{"table_name":"smazzate","rows":272},{"table_name":"tournament_results","rows":50},{"table_name":"trova_errore_scenarios","rows":32},{"table_name":"weekly_challenges","rows":12}]
```

Output prodotto vivo:

```json
[{"courses":4,"worlds":16,"lessons":49,"modules":199,"stored_hands":272,"glossary_entries":49,"collectible_cards":22,"weekly_challenges":12,"weekly_badge_names":12,"guided_hands":2,"workbook_exercises":31,"find_the_error_exercises":32}]
[{"course_id":"cuori-gioco","lessons":10,"modules":32},{"course_id":"cuori-licita","lessons":14,"modules":28},{"course_id":"fiori","lessons":13,"modules":91},{"course_id":"quadri","lessons":12,"modules":48}]
[{"module_type":"exercise","modules":40},{"module_type":"practice","modules":10},{"module_type":"quiz","modules":49},{"module_type":"theory","modules":100}]
[{"content_block_type":"bid-select","blocks":41},{"content_block_type":"card-select","blocks":11},{"content_block_type":"example","blocks":123},{"content_block_type":"hand-eval","blocks":10},{"content_block_type":"heading","blocks":120},{"content_block_type":"quiz","blocks":230},{"content_block_type":"rule","blocks":159},{"content_block_type":"text","blocks":323},{"content_block_type":"tip","blocks":33},{"content_block_type":"true-false","blocks":43}]
[{"exercise_block_type":"bid-select","blocks":7},{"exercise_block_type":"card-select","blocks":6},{"exercise_block_type":"hand-eval","blocks":2},{"exercise_block_type":"quiz","blocks":104},{"exercise_block_type":"text","blocks":29},{"exercise_block_type":"true-false","blocks":2}]
[{"catalog_hands":272,"hands_with_dd_tricks":272,"hands_without_dd_tricks":0,"min_dd_tricks":5,"max_dd_tricks":13,"defense_oriented_hands":56}]
```

Output utilizzo:

```json
[{"measured_at":"2026-08-12 21:39:39.215253+00","registered_users":1090,"profiles":1090,"login_events":10444,"cumulative_visible_minutes":481652}]
[{"month":"2026-02-01","registrations":19,"monthly_growth_pct":null},{"month":"2026-03-01","registrations":668,"monthly_growth_pct":"3415.79"},{"month":"2026-04-01","registrations":165,"monthly_growth_pct":"-75.30"},{"month":"2026-05-01","registrations":108,"monthly_growth_pct":"-34.55"},{"month":"2026-06-01","registrations":66,"monthly_growth_pct":"-38.89"},{"month":"2026-07-01","registrations":47,"monthly_growth_pct":"-28.79"},{"month":"2026-08-01","registrations":17,"monthly_growth_pct":"-63.83"}]
[{"month":"2026-02-01","monthly_active_users":9,"login_events":9},{"month":"2026-03-01","monthly_active_users":678,"login_events":1781},{"month":"2026-04-01","monthly_active_users":373,"login_events":2001},{"month":"2026-05-01","monthly_active_users":312,"login_events":2021},{"month":"2026-06-01","monthly_active_users":298,"login_events":1895},{"month":"2026-07-01","monthly_active_users":236,"login_events":1957},{"month":"2026-08-01","monthly_active_users":146,"login_events":780}]
[{"days":5,"eligible_users":1083,"retained_users":492,"rolling_retention_pct":"45.43"},{"days":7,"eligible_users":1076,"retained_users":473,"rolling_retention_pct":"43.96"},{"days":9,"eligible_users":1076,"retained_users":463,"rolling_retention_pct":"43.03"},{"days":21,"eligible_users":1056,"retained_users":381,"rolling_retention_pct":"36.08"},{"days":30,"eligible_users":1042,"retained_users":332,"rolling_retention_pct":"31.86"},{"days":39,"eligible_users":1031,"retained_users":306,"rolling_retention_pct":"29.68"}]
[{"completed_module_rows":18355,"matched_module_rows":18355,"unmatched_module_rows":0,"completed_lesson_user_pairs":3077,"users_completing_at_least_one_lesson":342}]
[{"month":"2026-02-01","completed_lessons":16},{"month":"2026-03-01","completed_lessons":1066},{"month":"2026-04-01","completed_lessons":546},{"month":"2026-05-01","completed_lessons":567},{"month":"2026-06-01","completed_lessons":389},{"month":"2026-07-01","completed_lessons":383},{"month":"2026-08-01","completed_lessons":110}]
[{"gap_threshold_minutes":21,"inferred_sessions":10432,"inferred_mean_minutes":"0.00","inferred_median_minutes":"0.00","single_event_sessions":10422},{"gap_threshold_minutes":30,"inferred_sessions":10432,"inferred_mean_minutes":"0.00","inferred_median_minutes":"0.00","single_event_sessions":10422},{"gap_threshold_minutes":39,"inferred_sessions":10432,"inferred_mean_minutes":"0.00","inferred_median_minutes":"0.00","single_event_sessions":10422}]
```

Output grant colonne `profiles`, aggregato per ruolo e privilegio:

```json
[{"grantee":"anon","privilege_type":"INSERT","granted_columns":24},{"grantee":"anon","privilege_type":"REFERENCES","granted_columns":24},{"grantee":"anon","privilege_type":"SELECT","granted_columns":24},{"grantee":"anon","privilege_type":"UPDATE","granted_columns":24},{"grantee":"authenticated","privilege_type":"INSERT","granted_columns":24},{"grantee":"authenticated","privilege_type":"REFERENCES","granted_columns":24},{"grantee":"authenticated","privilege_type":"SELECT","granted_columns":9,"columns":"asd_code, asd_name, avatar_url, bbo_username, display_name, id, role, updated_at, xp"},{"grantee":"authenticated","privilege_type":"UPDATE","granted_columns":24}]
```

### A.6 Migrazioni e advisor Supabase

Chiamate esatte:

```json
{"tool":"supabase.list_migrations","project_id":"mjojjktuhhnycdsikcla"}
{"tool":"supabase.get_advisors","project_id":"mjojjktuhhnycdsikcla","type":"security"}
{"tool":"supabase.get_advisors","project_id":"mjojjktuhhnycdsikcla","type":"performance"}
```

Output migrazioni:

```json
{"migrations":[{"version":"20260809142055","name":"pii_access_functions"},{"version":"20260809142204","name":"pii_columns_revoke"},{"version":"20260809142254","name":"realtime_publication_friendships_challenges"},{"version":"20260809200022","name":"tmp_range_probe"},{"version":"20260809200043","name":"tmp_range_probe_drop"},{"version":"20260809201736","name":"harden_security_definer_functions"},{"version":"20260809201816","name":"harden_security_definer_revoke_public"},{"version":"20260810063244","name":"replica_identity_full_realtime_delete"},{"version":"20260810064129","name":"bbo_username_taken_check"},{"version":"20260810200851","name":"bbo_username_cleanup_group_a"},{"version":"20260810212431","name":"admin_list_users_with_email"},{"version":"20260810220218","name":"partner_matching"},{"version":"20260811102234","name":"fix_engagement_targets_pii_leak"},{"version":"20260812184618","name":"smazzate_dd_tricks"}]}
```

Output advisor aggregato dai risultati grezzi:

```json
{"type":"security","total":29,"by_level":{"INFO":1,"WARN":28},"by_name":{"rls_enabled_no_policy":1,"anon_security_definer_function_executable":1,"authenticated_security_definer_function_executable":27}}
{"type":"performance","total":76,"by_level":{"INFO":25,"WARN":51},"by_name":{"unindexed_foreign_keys":10,"auth_rls_initplan":46,"unused_index":14,"multiple_permissive_policies":5,"auth_db_connections_absolute":1}}
```

### A.7 Test, lint, typecheck, E2E elencati e build

Comandi:

```bash
npm test
npm run build
npx tsc --noEmit
npx eslint src --max-warnings 0
node audit-bridgelab/collect-eslint-summary.mjs
npx playwright test --list
```

Output essenziale grezzo:

```text
Test Files  32 passed (32)
Tests       723 passed (723)
Duration    16.58s

npm run build
Next.js 16.1.6 (webpack)
Compiled successfully in 11.3s
Running TypeScript
Generating static pages using 9 workers (72/72)

npx tsc --noEmit
exit code 0

npx eslint src --max-warnings 0
exit code 0

{"eslint_exit_code":0,"files_checked":446,"files_with_issues":0,"errors":0,"warnings":0,"top_files_by_errors_then_warnings":[]}

npx playwright test --list
Total: 27 tests in 6 files
```

`npm run test:e2e`, `npm run test:rls` e `npm run test:realtime` **non eseguiti**: usano autenticazione e creano o cancellano account/righe. La perizia era limitata a letture aggregate.

### A.8 Calcoli economici

Comando:

```bash
node audit-bridgelab/economic-calculations.mjs
```

Output grezzo:

```json
{
  "assumptions":{"replication_hours_by_workstream":{"core_fullstack_security_data":1350,"ui_pwa_mobile_69_routes":1100,"didactic_catalog_content_admin":780,"bridge_engines_dds_analysis_game_modes_and_deal_generation":1500,"social_instructor_classes_and_partner_matching":650,"qa_accessibility_devops_documentation":1000},"hourly_rates_eur_method_A":[60,80,100],"external_supplier_scope_hours":{"implementation_hours":6380,"analysis_10_pct":638,"ux_and_solution_design_10_pct":638,"independent_qa_and_security_15_pct":957,"project_management_15_pct":957},"hourly_rates_eur_method_B":[80,100,120],"work_hours_per_month_per_developer_for_calendar_conversion":160,"usd_per_eur_ecb_2026_08_12":1.1545,"lms_usd_per_month_billed_annually":249,"hosting_usd_per_month":{"vercel":20,"supabase":25},"maintenance_hours_per_month":20,"maintenance_hourly_rate_eur":80},
  "external_two_senior_team":{"total_person_hours":{"minus_30_pct":4466,"base":6380,"plus_30_pct":8294},"calendar_months_at_160h_per_developer":{"minus_30_pct":13.96,"base":19.94,"plus_30_pct":25.92},"calendar_months_varying_monthly_capacity_30_pct":{"capacity_minus_30_pct_112h":28.48,"base_160h":19.94,"capacity_plus_30_pct_208h":15.34}},
  "method_A_reproduction_cost_eur":{"60_eur_per_hour":{"minus_30_pct":267960,"base":382800,"plus_30_pct":497640},"80_eur_per_hour":{"minus_30_pct":357280,"base":510400,"plus_30_pct":663520},"100_eur_per_hour":{"minus_30_pct":446600,"base":638000,"plus_30_pct":829400}},
  "method_A_central_rate_80_eur_sensitivity":{"hourly_rate_eur":{"minus_30_pct":56,"base":80,"plus_30_pct":104},"cost_at_base_hours_eur":{"minus_30_pct":357280,"base":510400,"plus_30_pct":663520}},
  "method_B_external_replacement":{"total_scope_hours":{"minus_30_pct":6699,"base":9570,"plus_30_pct":12441},"scope_when_overhead_pct_varies_30_pct":{"overhead_pct_minus_30_pct":35,"hours_minus_30_pct":8613,"overhead_pct_base":50,"hours_base":9570,"overhead_pct_plus_30_pct":65,"hours_plus_30_pct":10527},"cost_eur":{"80_eur_per_hour":{"minus_30_pct":535920,"base":765600,"plus_30_pct":995280},"100_eur_per_hour":{"minus_30_pct":669900,"base":957000,"plus_30_pct":1244100},"120_eur_per_hour":{"minus_30_pct":803880,"base":1148400,"plus_30_pct":1492920}},"central_rate_100_eur_sensitivity":{"hourly_rate_eur":{"minus_30_pct":70,"base":100,"plus_30_pct":130},"cost_at_base_scope_eur":{"minus_30_pct":669900,"base":957000,"plus_30_pct":1244100}}},
  "method_C_three_year_use_value_eur":{"lms_license_comparability_sensitivity":{"minus_30_pct":5435.08,"base":7764.4,"plus_30_pct":10093.72},"hosting_plan_sensitivity":{"minus_30_pct":982.24,"base":1403.2,"plus_30_pct":1824.17},"maintenance":{"minus_30_pct":40320,"base":57600,"plus_30_pct":74880},"total_with_maintenance_sensitivity":{"minus_30_pct":49487.61,"base":66767.61,"plus_30_pct":84047.61},"total_all_components_sensitivity":{"minus_30_pct":46737.32,"base":66767.61,"plus_30_pct":86797.89}},
  "algorithm_rewrite_person_hours_and_cost_at_80_eur":{"bridge_play_ai_scoring_dds_integration_and_replay_analysis":{"hours":{"minus_30_pct":504,"base":720,"plus_30_pct":936},"cost_eur":{"minus_30_pct":40320,"base":57600,"plus_30_pct":74880}},"in_house_heuristic_endgame_and_validation_solvers":{"hours":{"minus_30_pct":224,"base":320,"plus_30_pct":416},"cost_eur":{"minus_30_pct":17920,"base":25600,"plus_30_pct":33280}},"underlying_reference_dds_solver_if_rewritten_instead_of_reused":{"hours":{"minus_30_pct":1120,"base":1600,"plus_30_pct":2080},"cost_eur":{"minus_30_pct":89600,"base":128000,"plus_30_pct":166400}},"constrained_hand_generation_dds_validation_and_export":{"hours":{"minus_30_pct":294,"base":420,"plus_30_pct":546},"cost_eur":{"minus_30_pct":23520,"base":33600,"plus_30_pct":43680}},"generated_trick_quiz":{"hours":{"minus_30_pct":126,"base":180,"plus_30_pct":234},"cost_eur":{"minus_30_pct":10080,"base":14400,"plus_30_pct":18720}},"spaced_repetition":{"hours":{"minus_30_pct":56,"base":80,"plus_30_pct":104},"cost_eur":{"minus_30_pct":4480,"base":6400,"plus_30_pct":8320}},"gamification":{"hours":{"minus_30_pct":98,"base":140,"plus_30_pct":182},"cost_eur":{"minus_30_pct":7840,"base":11200,"plus_30_pct":14560}},"learning_progression_orchestration":{"hours":{"minus_30_pct":168,"base":240,"plus_30_pct":312},"cost_eur":{"minus_30_pct":13440,"base":19200,"plus_30_pct":24960}},"partner_matching":{"hours":{"minus_30_pct":42,"base":60,"plus_30_pct":78},"cost_eur":{"minus_30_pct":3360,"base":4800,"plus_30_pct":6240}}},
  "quality":{"scores":[3,4,4,3,4,3,4,1,3,3,3,3],"sum":38,"count":12,"arithmetic_mean":3.17},
  "prudent_conferred_value_eur":{"lower_method_A_base_hours_at_60_eur":382800,"upper_method_B_base_scope_at_80_eur":765600}
}
```

### A.9 Fonti economiche: comandi e output

Comandi:

```bash
curl -Ls https://www.learnworlds.com/pricing/ | rg -o -m 8 'Learning Center.{0,160}|\$249.{0,100}|249.{0,100}/month' | sed -n '1,30p'
curl -Ls https://www.learnworlds.com/plans/ | sed 's/<[^>]*>/ /g' | tr -s ' ' | rg -o -m 10 '.{0,100}(2,000|2\.000|2000).{0,140}|.{0,100}Monthly active learners.{0,140}' | sed -n '1,30p'
curl -Ls https://vercel.com/pricing | rg -o -m 8 '\$20.{0,100}|20.{0,50}(month|mo)' | sed -n '1,30p'
curl -Ls https://supabase.com/pricing | rg -o -m 8 '\$25.{0,100}|25.{0,50}(month|mo)' | sed -n '1,30p'
curl -Ls https://systemforge.it/blog/tariffe-programmatore-freelance-italia-2026/ | sed 's/<[^>]*>/ /g' | tr -s ' ' | rg -o -m 5 '.{0,100}(70-90|70–90|80-110|80–110).{0,120}' | sed -n '1,20p'
curl -Ls https://systemforge.it/blog/quanto-costa-sviluppare-software-italia-2025/ | sed 's/<[^>]*>/ /g' | tr -s ' ' | rg -o -m 8 '.{0,120}(80-150|80–150|software house|senior).{0,160}' | sed -n '1,30p'
curl -Ls https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml | rg "Cube time=|currency='USD'" | sed -n '1,2p'
```

Output rilevante:

```text
Learning Center $249/m.
Monthly active learners
2,000
$20/mo.
25/month
media per un full-stack senior intorno a 70-90 €/ora
Sviluppatore senior in software house italiana: €80–€150/ora
<Cube time='2026-08-12'>
<Cube currency='USD' rate='1.1545'/>
```

Query web di controllo incrociato:

```json
{"search_query":[{"q":"Italia 2026 tariffa oraria sviluppatore full stack senior freelance euro ora"},{"q":"Italia software house tariffa oraria sviluppatore senior 2026"},{"q":"LearnWorlds pricing Learning Center monthly active learners 2026"},{"q":"Vercel Pro Supabase Pro pricing monthly 2026"}],"response_length":"long"}
```

### A.10 Letture puntuali del codice

Comandi eseguiti per le citazioni file:riga:

```bash
nl -ba src/lib/bridge-engine.ts | sed -n '110,330p'
nl -ba src/lib/dds-solver.ts | sed -n '450,710p'
nl -ba src/lib/dds-exact.ts | sed -n '1,240p'
nl -ba src/lib/dds-exact.test.ts | sed -n '1,100p'
nl -ba src/lib/dds-table.ts | sed -n '1,180p'
nl -ba node_modules/bridge-dds/package.json | sed -n '1,30p'
nl -ba src/lib/dds-replay.ts | sed -n '1,210p'
nl -ba src/lib/trick-quiz.ts | sed -n '1,180p'
nl -ba src/components/turning-point-panel.tsx | sed -n '1,190p'
nl -ba src/app/gioca/quiz-prese/page.tsx | sed -n '35,150p'
nl -ba src/app/gioca/smazzata/page.tsx | sed -n '340,410p'
nl -ba src/app/gioca/smazzata/page.tsx | sed -n '520,620p'
nl -ba src/app/gioca/smazzata/page.tsx | sed -n '900,1040p'
nl -ba src/lib/deal-generator.ts | sed -n '1,360p'
nl -ba src/app/istruttori/genera-mani/page.tsx | sed -n '40,190p'
nl -ba scripts/valida-smazzate-dds.mjs | sed -n '1,220p'
nl -ba src/lib/spaced-review.ts | sed -n '1,130p'
nl -ba src/lib/xp-levels.ts | sed -n '1,120p'
nl -ba src/hooks/use-secret-achievements.ts | sed -n '1,140p'
nl -ba src/lib/progression.ts | sed -n '1,130p'
nl -ba src/lib/lesson-module.ts | sed -n '1,290p'
nl -ba src/lib/lesson-module.ts | sed -n '430,520p'
nl -ba src/lib/partner-matching.ts | sed -n '1,260p'
nl -ba scripts/sql/partner-matching-2026-08.sql | sed -n '1,180p'
nl -ba src/app/admin/layout.tsx | sed -n '1,70p'
nl -ba src/app/api/account/delete/route.ts | sed -n '1,110p'
nl -ba src/lib/ben-guard.ts | sed -n '1,90p'
nl -ba instrumentation.ts | sed -n '1,80p'
nl -ba instrumentation-client.ts | sed -n '1,90p'
nl -ba src/lib/realtime-health.ts | sed -n '1,110p'
nl -ba src/lib/catalog.ts | sed -n '170,330p'
nl -ba src/hooks/use-activity-tracker.ts | sed -n '1,80p'
nl -ba next.config.ts | sed -n '45,165p'
nl -ba src/hooks/use-focus-trap.ts | sed -n '45,170p'
nl -ba src/app/layout.tsx | sed -n '100,265p'
nl -ba e2e/a11y.spec.ts | sed -n '50,160p'
nl -ba e2e/consenso.spec.ts | sed -n '1,180p'
nl -ba .github/workflows/ci.yml
nl -ba README.md | sed -n '1,180p'
nl -ba docs/architettura.md | sed -n '1,190p'
nl -ba docs/runbook.md | sed -n '1,170p'
```

Gli output sono i file sorgente numerati e sono citati puntualmente nel corpo. Non vengono duplicati integralmente nell'appendice per non trasformare la perizia in una copia del repository.
