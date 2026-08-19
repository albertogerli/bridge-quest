# Perizia tecnica ed economica indipendente — BridgeLab

**Destinatario:** Consiglio direttivo di una federazione sportiva  
**Data della perizia:** 15 agosto 2026  
**Repository esaminato:** ramo `main`, commit `477d2cd6f5280955d73c9aebaf28497a784e44de`  
**Ultimo commit incluso:** 15 agosto 2026, ore 19:47:37 CEST  
**Dati di utilizzo:** interrogazioni aggregate in sola lettura, ultima rilevazione 15 agosto 2026, ore 17:56:37 UTC  
**Valuta:** euro, IVA esclusa  
**Criterio di lettura:** ogni dato è qualificato come **MISURATO**, **CALCOLATO** o **STIMATO**. Se l'evidenza non consente una risposta attendibile si usa **non determinabile**.

Il presente documento è una perizia autonoma e sostituisce, senza integrarli, eventuali documenti precedenti. L'analisi ha riguardato il codice, la storia Git e aggregati del database operativo. Non sono stati effettuati login interattivi, non sono stati estratti dati personali e non sono riportati nomi, email o identificativi utente. Gli autori Git sono pseudonimizzati.

## Sintesi per il Consiglio direttivo

BridgeLab non appare come un prototipo. **MISURATO:** lo stato esaminato comprende 73.581 righe di codice applicativo, 8.912 righe di test, 20.274 righe di contenuti e 459 righe di configurazione, conteggiate separatamente. L'interfaccia comprende 81 pagine e 102 componenti; il backend applicativo espone 12 file di rotta API con 13 handler HTTP. Il database operativo comprende 47 tabelle, tutte con sicurezza a livello di riga attiva, 91 policy, 131 indici e 63 chiavi esterne.

La profondità di prodotto è rilevante. **MISURATO:** il catalogo vivo contiene 4 corsi, 16 mondi, 49 lezioni, 199 moduli, 1.093 blocchi didattici, 272 mani di catalogo con analisi double-dummy, 1.504 mani generate e condivise, 49 voci di glossario, 31 esercizi di eserciziario e 32 scenari “Trova l'errore”. Il sorgente contiene inoltre 111 domande di comprensione, 20 scenari di pratica dichiarativa, 32 scenari d'impasse, 13 badge standard, 10 obiettivi segreti e 36 livelli XP.

La piattaforma contiene logica specialistica che un LMS generico non offre: motore di gioco della carta, punteggio duplicate e IMP, integrazione con solver double-dummy, integrazione con il motore di licita BEN, generazione vincolata delle mani, stima del valore atteso, confronto con il campo, tornei di licita, ripetizione dilazionata, progressione e gamification. Una parte importante della capacità esatta di soluzione e licita dipende però da software open source esterno: `bridge-dds` 1.4.0, con licenza Apache-2.0, e BEN, progetto pubblicato con licenza GPL-3.0. Il valore proprio di BridgeLab risiede nell'integrazione, nell'orchestrazione didattica, nei contenuti e nell'esperienza utente; non nella proprietà esclusiva dei solver esterni.

**MISURATO:** la storia Git comprende 329 commit, 328 dei quali attribuiti allo stesso autore pseudonimizzato, su 57 giorni di calendario tra l'8 febbraio e il 15 agosto 2026. Il metodo prescritto sui timestamp produce 102 sessioni e 127,84 ore. Questo è un **limite inferiore** e non misura progettazione, studio, debug, contenuti o lavoro non committato. Non viene usato come effort di replica.

La qualità ingegneristica media è **3,42/5**, **CALCOLATA** su 12 giudizi motivati. **MISURATO:** passano 990 test unitari; 5 sono saltati. TypeScript, ESLint con soglia zero, build di produzione, 11 verifiche del servizio BEN e controllo di allineamento dello schema terminano con esito positivo. Sono elencati 35 test end-to-end in 10 file, ma non sono stati eseguiti localmente perché richiedono autenticazione o modificano dati. Esiste ora una verifica notturna che prevede RLS, schema ed E2E; la sua effettiva esecuzione riuscita non è stata osservata in questa perizia.

**MISURATO, soli aggregati:** risultano 1.095 utenti registrati. Gli utenti attivi mensili basati su eventi di login sono stati 678 a marzo, 373 ad aprile, 312 a maggio, 298 a giugno e 236 a luglio; agosto è parziale con 166 utenti. Le lezioni completate, deduplicate per utente e lezione, sono 3.105 da parte di 344 utenti. La retention rolling è **STIMATA mediante proxy** al 44,32% a 7 giorni e al 32,31% a 30 giorni. Il numero reale di sessioni e il tempo medio di sessione sono **non determinabili**: i dati disponibili non contengono una chiusura attendibile della sessione.

L'uso dimostra soprattutto il valore del nucleo storico. **MISURATO:** 34.055 risultati provengono dal gioco di una smazzata completa, 10.971 dalle sfide, 3.590 dalla mano del giorno e 2.583 dal gioco di conteggio. Le funzionalità aggiunte più di recente hanno segnali iniziali o nulli: 16 risultati su mani condivise, 8 risultati di torneo di licita, 1 tavolo live, nessuna mano salvata, nessuna sessione di licita a due e nessuna sfida a coppie. Pertanto la presenza tecnica delle nuove funzioni non viene trattata come prova di valore già realizzato.

### Conclusione economica, centrata sul valore

Il costo di ricostruzione non coincide con il valore. **STIMATO:** replicare tecnicamente l'attuale perimetro richiederebbe 8.120 ore-persona; il costo teorico di riproduzione è 568.400–893.200 euro a effort base, mentre un incarico completo a fornitore è 974.400–1.827.000 euro a perimetro base. Questi importi indicano complessità e barriera alla replica, ma non dimostrano che la Federazione otterrebbe un beneficio equivalente.

Il metodo principale è quindi il **valore d'uso triennale**, ancorato agli utenti attivi osservati e a un listino comparabile per l'apprendimento del bridge. **CALCOLATO:** la media degli ultimi tre mesi completi è 282 utenti attivi mensili. Applicando il prezzo pubblico annuo Funbridge Premium di 149,99 euro e variando gli utenti del ±30%, l'equivalenza lorda di capacità è 88.824,08–164.959,00 euro in tre anni. Gli oneri base di hosting e manutenzione sono 66.223,55 euro; il valore netto centrale è 60.667,99 euro. Nella sensibilità combinata il valore netto va da 2.733,46 a 118.602,52 euro.

Per prudenza, il **valore conferito alla Federazione** è quindi collocato tra **0 e 120.000 euro** per tre anni, IVA esclusa, con **scenario centrale pari a circa 61.000 euro**. Il limite inferiore pari a zero ammette che un sostituto molto economico, se ritenuto sufficiente dalla Federazione, assorba interamente il beneficio dopo i costi operativi. Il limite superiore è il valore netto favorevole arrotondato. Il corrispondente valore d'uso lordo, prima degli oneri, è circa **90.000–165.000 euro**. Questo metodo è più difendibile del costo di sostituzione perché lega il valore a uso osservato, prezzo di un'alternativa e costo necessario a mantenere il servizio. Non attribuisce valore a marchio, avviamento, dati personali o crescita futura non dimostrata.

La fotografia locale richiede un'ulteriore cautela. **MISURATO:** il commit esaminato contiene 49 video MP4 tracciati, ma tutti risultano cancellati nella working tree e non esiste localmente la cartella `public/videos`. La disponibilità dei video in produzione è **non determinabile**. La loro assenza locale non impedisce la build.

## 1. Perimetro, metodo e stato della copia esaminata

Sono stati esaminati:

- storia Git e working tree;
- codice Next.js/React, motori di dominio e integrazioni esterne;
- schema, policy, autorizzazioni, advisor e aggregati d'uso Supabase tramite query di sola lettura;
- catalogo didattico e inventario dei flussi;
- TypeScript, lint, unit test, build, elenco E2E, test del guard BEN e coerenza della baseline SQL;
- listini pubblici e benchmark tariffari indicati nell'appendice.

La working tree non era pulita. Le cancellazioni dei 49 MP4 e gli altri file non tracciati appartenevano allo stato preesistente e non sono stati modificati. Le metriche Git riguardano i commit raggiungibili dai riferimenti branch validi; le metriche statiche fotografano la working tree al commit indicato, incluse le differenze locali.

## 2. Fase 1 — Metriche del repository

### 2.1 Storia Git

| Metrica | Valore | Natura |
|---|---:|---|
| Commit totali | 329 | MISURATO |
| Autori pseudonimizzati | 2 | MISURATO |
| Commit autore principale / altro autore | 328 / 1 | MISURATO |
| Primo commit | 8 febbraio 2026, 00:15:02 | MISURATO, Europe/Rome |
| Ultimo commit | 15 agosto 2026, 19:47:37 | MISURATO, Europe/Rome |
| Giorni di calendario con almeno un commit | 57 | MISURATO |
| Dimensione mediana del commit | 168 righe aggiunte + rimosse | MISURATO |
| Righe aggiunte / rimosse nella storia | 226.936 / 36.038 | MISURATO |
| Occorrenze binarie escluse dal conteggio righe | 526 | MISURATO |
| Branch validi | 7: 3 locali, 4 remoti | MISURATO; non deduplicati per nome logico |
| Merge commit | 2 | MISURATO |

#### Distribuzione dei commit per mese

| Mese 2026 | Commit |
|---|---:|
| Febbraio | 53 |
| Marzo | 96 |
| Aprile | 7 |
| Maggio | 21 |
| Giugno | 20 |
| Luglio | 14 |
| Agosto, fino al 15 | 118 |

#### Distribuzione per fascia oraria

| Fascia, Europe/Rome | Commit |
|---|---:|
| 00:00–05:59 | 58 |
| 06:00–11:59 | 66 |
| 12:00–17:59 | 102 |
| 18:00–23:59 | 103 |

#### File più modificati

| File | Commit | Aggiunte | Rimozioni | Churn |
|---|---:|---:|---:|---:|
| `src/app/page.tsx` | 58 | 3.901 | 3.845 | 7.746 |
| `src/app/profilo/page.tsx` | 47 | 2.566 | 2.247 | 4.813 |
| `src/app/admin/page.tsx` | 39 | 2.824 | 2.609 | 5.433 |
| `src/app/gioca/page.tsx` | 37 | 1.308 | 583 | 1.891 |
| `src/app/gioca/smazzata/page.tsx` | 32 | 1.553 | 310 | 1.863 |
| `src/app/lezioni/[lessonId]/[moduleId]/page.tsx` | 31 | 2.844 | 2.675 | 5.519 |
| `src/components/desktop-sidebar.tsx` | 29 | 723 | 543 | 1.266 |
| `src/app/layout.tsx` | 29 | 376 | 106 | 482 |
| `src/app/login/page.tsx` | 25 | 736 | 165 | 901 |
| `src/app/gioca/sfida/page.tsx` | 25 | 684 | 114 | 798 |
| `src/app/classifica/page.tsx` | 24 | 2.073 | 683 | 2.756 |
| `src/app/impostazioni/page.tsx` | 22 | 1.034 | 286 | 1.320 |
| `src/components/bridge/bridge-table.tsx` | 22 | 557 | 147 | 704 |
| `src/app/gioca/mano-del-giorno/page.tsx` | 21 | 1.837 | 1.703 | 3.540 |
| `src/app/lezioni/page.tsx` | 20 | 774 | 182 | 956 |

Il numero di commit che tocca un file misura la volatilità, non la qualità.

### 2.2 Effort dai timestamp

Regola prescritta: per autore, una nuova sessione inizia se il gap dal commit precedente supera 90 minuti. Durata della sessione = ultimo timestamp meno primo timestamp, più 30 minuti di ramp-up; una sessione con un solo commit vale 30 minuti.

| Risultato | Valore | Natura |
|---|---:|---|
| Sessioni ricostruite | 102 | CALCOLATO |
| Minuti complessivi | 7.670 | CALCOLATO |
| Ore complessive | 127,84 | CALCOLATO |

**Interpretazione obbligatoria:** 127,84 ore è un limite inferiore, perché non cattura progettazione, ricerca, debug, produzione dei contenuti, riunioni e lavoro non committato. Non rappresenta le ore necessarie a replicare il prodotto.

### 2.3 Righe di codice per categoria

Sono esclusi `node_modules`, lockfile, build, asset generati, SQL/migrazioni, `src/lib/supabase/types.ts` e il baseline JSON generato. I test sono separati dal codice applicativo.

| Categoria | Linguaggio | File | Righe di codice | Natura |
|---|---|---:|---:|---|
| Applicazione | TypeScript | 435 | 73.093 | MISURATO con `cloc` |
| Applicazione | CSS | 1 | 400 | MISURATO |
| Applicazione | Python, guard BEN | 1 | 88 | MISURATO |
| **Applicazione totale** | — | **437** | **73.581** | MISURATO |
| Test | TypeScript | 68 | 8.001 | MISURATO |
| Test | JavaScript | 2 | 866 | MISURATO |
| Test | Python | 1 | 45 | MISURATO |
| **Test totale** | — | **71** | **8.912** | MISURATO |
| Contenuti | TypeScript dati | 21 | 18.082 | MISURATO |
| Contenuti | Markdown | 4 | 2.192 | MISURATO |
| **Contenuti totali** | — | **25** | **20.274** | MISURATO |
| Configurazione | JSON / TypeScript / JavaScript / Dockerfile | 12 | 459 | MISURATO |
| Sottotitoli | ASS | 49 | 7.012 righe fisiche | MISURATO con `wc -l` |

La tabella finale usa 73.581 righe applicative. Test, contenuti, configurazione e sottotitoli non sono sommati a tale valore.

### 2.4 Inventario tecnico e database

| Elemento | Valore | Natura/nota |
|---|---:|---|
| Componenti `.tsx` in `src/components` | 102 | MISURATO |
| Pagine `page.tsx` | 81 | MISURATO |
| Righe fisiche complessive delle pagine | 35.059 | MISURATO |
| Pagine oltre 1.000 righe | 5 | MISURATO |
| File di rotta API / handler esportati | 12 / 13 | MISURATO |
| Tabelle pubbliche vive / con RLS | 47 / 47 | MISURATO |
| Policy RLS | 91 | MISURATO |
| Indici pubblici | 131 | MISURATO |
| PK / FK / `CHECK` / `UNIQUE` | 47 / 63 / 55 / 20 | MISURATO |
| Funzioni pubbliche / `SECURITY DEFINER` | 63 / 55 | MISURATO |
| Funzioni definer con `search_path` esplicito | 55 / 55 | MISURATO |
| Trigger | 15 | MISURATO |
| Migrazioni formali in `supabase/migrations` | 0 | MISURATO |
| Record di migrazione nel database | 48 | MISURATO |
| Script in `scripts/sql` | 52 | MISURATO |
| File test TypeScript, sorgente + E2E | 68: 58 + 10 | MISURATO |
| Workflow GitHub Actions | 2 | MISURATO |

Il repository contiene ora una baseline verificabile in `scripts/sql/000-schema-baseline.sql`; il comando `schema:check` la confronta con lo schema generato e segnala allineamento su 4.514 righe. Rimane **MISURATO** che non esiste una catena standard sotto `supabase/migrations`; il passaggio a un team terzo richiede quindi una procedura documentata di bootstrap e migrazione.

## 3. Fase 2 — Qualità e profondità architetturale

Scala: 1 = assente o insufficiente; 3 = adeguato con lacune; 5 = maturo e facilmente trasferibile. I punteggi sono **STIMATI** da evidenze; la media è **CALCOLATA**.

| Voce | Punteggio | Evidenze e giudizio |
|---|---:|---|
| Separazione delle responsabilità | 4/5 | Motori di dominio isolati in `src/lib/bridge-engine.ts:108`, `src/lib/valore-atteso.ts:1` e `src/lib/mani-condivise.ts:1`; restano 5 pagine oltre 1.000 righe, fra cui `src/app/classifica/page.tsx` con 1.390 righe. |
| Modello dati e integrità referenziale | 4/5 | 47 PK, 63 FK, 55 `CHECK`, 20 `UNIQUE`, RLS su 47/47 tabelle; baseline verificata. Debolezza: 21 FK segnalate senza indice e assenza della catena standard di migrazione. |
| Autenticazione e autorizzazione | 4/5 | Gate admin lato server in `src/app/admin/layout.tsx:14`; cancellazione account basata sulla sessione in `src/app/api/account/delete/route.ts:25`; mani avversarie filtrate lato server in `src/app/api/licita/avversario/route.ts:20`. |
| Sicurezza | 3/5 | RLS totale, 55/55 definer con `search_path`, input Zod/rate limit/timeout in `src/app/api/ben/bid/route.ts:18` e `src/lib/ben-guard.ts:1`, Sentry senza PII in `instrumentation-client.ts:12`. Limiti: 56 warning advisor, 52 funzioni privilegiate eseguibili dagli autenticati, 2 dagli anonimi e grant anon su `profiles` affidati alla RLS. |
| Gestione degli errori | 4/5 | Error reporting centralizzato in `src/lib/report-error.ts:23`; fallback/timeout dei servizi BEN e degradazione controllata. La presenza effettiva del DSN e la qualità del monitoraggio in produzione sono **non determinabili**. |
| Performance e caching | 3/5 | Catalogo caricato in parallelo e promise condivisa in `src/lib/catalog.ts:1`; build riuscita. Gli advisor riportano 64 warning di performance, inclusi 21 FK senza indice e 59 segnalazioni RLS init-plan; nessun load test è stato eseguito. |
| Accessibilità | 4/5 | `lang="it"` in `src/app/layout.tsx:121`, skip link/focus management e 4 audit axe definiti in `e2e/a11y.spec.ts:1`. Gli E2E non sono stati eseguiti localmente. |
| Internazionalizzazione | 1/5 | Lingua italiana fissa; non risultano cataloghi di traduzione o routing per locale. |
| Copertura dei test | 4/5 | 990 test passati, 5 saltati; 35 E2E elencati; controlli RLS, schema e BEN presenti. La percentuale di coverage è **non determinabile** perché manca un report con soglia. |
| CI/CD | 4/5 | CI principale con typecheck, lint, unit test e build in `.github/workflows/ci.yml:22`; verifica notturna con RLS, schema ed E2E in `.github/workflows/verifiche-notturne.yml:51`. Rischio: i test notturni puntano alla produzione e non è stato osservato un run riuscito. |
| Documentazione | 3/5 | README, architettura e runbook sono presenti; `README.md:41` e `docs/architettura.md:9` riportano ancora circa 66 pagine/90 componenti, contro 81/102 misurati. |
| Manutenibilità da team terzo | 3/5 | TypeScript, test, build, baseline schema e moduli di dominio aiutano il passaggio. Pesano 328 commit su 329 dello stesso autore, pagine molto lunghe, documentazione disallineata e competenza specialistica su bridge/DDS/BEN. |

**Media CALCOLATA:** 41 punti / 12 voci = **3,42/5**. La media rende trasparente il giudizio; non è una certificazione di sicurezza o qualità.

### 3.1 Sicurezza: rilievi da trattare

**MISURATO:** gli advisor restituiscono 58 rilievi di sicurezza, di cui 56 warning e 2 info, e 100 rilievi di performance, di cui 64 warning e 36 info. Le categorie principali sono 21 FK non indicizzate, 59 policy con possibile rivalutazione per riga, 14 indici non utilizzati, 5 policy permissive multiple, 2 tabelle RLS senza policy, 2 funzioni non-definer con `search_path` mutabile, 2 funzioni definer eseguibili dagli anonimi e 52 dagli autenticati. Sono euristiche, non altrettante vulnerabilità dimostrate.

Riferimenti di rimedio: [FK non indicizzate](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys), [RLS init-plan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan), [funzioni definer anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [funzioni definer authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [RLS senza policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

### 3.2 Componenti a reale complessità algoritmica

Le ore seguenti sono **STIMATE**, non dedotte dalle righe di codice. Per ogni assunzione è mostrata la sensibilità ±30%; il costo usa 90 euro/ora.

| Componente | Funzione e sofisticazione | Ore −30% / base / +30% | Costo −30% / base / +30% |
|---|---|---:|---:|
| Motore di gioco, IA, scoring, replay, DDS e BEN | Valida turni e prese, gestisce dummy/contratto, punteggi e analisi; integra solver e motore di licita con timeout e fallback. Sofisticazione alta, ma parte dell'intelligenza è esterna. Evidenze: `src/lib/bridge-engine.ts:108`, `src/app/api/ben/bid/route.ts:18`, `deploy/ben-railway/Dockerfile:1`. | 630 / 900 / 1.170 | €56.700 / €81.000 / €105.300 |
| Generazione mani, double-dummy e valore atteso | Genera distribuzioni con vincoli, verifica HCP/shape, calcola double-dummy, par e distribuzioni attese con split train/holdout. Sofisticazione alta. `src/lib/valore-atteso.ts:1`, `src/lib/mani-condivise.ts:1`. | 595 / 850 / 1.105 | €53.550 / €76.500 / €99.450 |
| Motore di licita, campo condiviso, sfide a coppie e tornei | Conduce aste, determina contratto/esito, confronta risultati sullo stesso board e gestisce classifiche. Sofisticazione medio-alta. `src/lib/licita-mano.ts:1`, `src/lib/sfida-coppie.ts:1`. | 455 / 650 / 845 | €40.950 / €58.500 / €76.050 |
| Solver interno di finali e validatori | Risolve sottoproblemi e verifica coerenza di sequenze/mani. Sofisticazione alta ma perimetro più stretto del DDS completo. | 224 / 320 / 416 | €20.160 / €28.800 / €37.440 |
| Quiz generativi di presa e apertura | Produce problemi, valida risposte, attribuisce punteggio e seleziona il quesito successivo. Sofisticazione media. | 126 / 180 / 234 | €11.340 / €16.200 / €21.060 |
| Ripetizione dilazionata | Sistema Leitner a 5 scatole con intervalli 1/3/7/14/30 giorni. È corretto e utile, ma algoritmicamente semplice. `src/lib/spaced-review.ts:1`. | 56 / 80 / 104 | €5.040 / €7.200 / €9.360 |
| Gamification | XP, 36 livelli, badge, streak, obiettivi e stelle da risultati IMP. Complessità media di orchestrazione. `src/lib/xp-levels.ts:1`, `src/lib/stelle-licita.ts:1`. | 112 / 160 / 208 | €10.080 / €14.400 / €18.720 |
| Progressione didattica | Sblocco al 50%, completamenti, prerequisiti e raccordo fra corso, lezione e modulo. Complessità media. `src/lib/progression.ts:1`. | 182 / 260 / 338 | €16.380 / €23.400 / €30.420 |
| Tavolo live per classe | Stato condiviso, posti, carte nascoste, gioco, reveal, Realtime e fallback polling. Complessità medio-alta. `src/lib/live-table.ts:1`. | 140 / 200 / 260 | €12.600 / €18.000 / €23.400 |

Il costo di riscrivere da zero il solver DDS o addestrare da zero un motore equivalente a BEN è **non determinabile**: mancano target prestazionali, corpus di addestramento, hardware e criteri di equivalenza. Le stime sopra riguardano l'integrazione e l'esperienza BridgeLab, assumendo il riuso legittimo delle dipendenze.

### 3.3 Tempo di replica da parte di un team esterno

**Assunzione — perimetro:** contenuti e asset sono consegnati, le dipendenze open source possono essere riutilizzate e non si riscrivono DDS/BEN da zero.

| Workstream stimato | −30% | Base | +30% |
|---|---:|---:|---:|
| Core full-stack, autenticazione, sicurezza, dati | 980 h | 1.400 h | 1.820 h |
| UI, PWA/mobile e 81 pagine | 875 h | 1.250 h | 1.625 h |
| Catalogo didattico, contenuti e strumenti istruttore | 665 h | 950 h | 1.235 h |
| Motori bridge, DDS/BEN, generazione e giochi | 1.470 h | 2.100 h | 2.730 h |
| Social, classi, live, sfide e tornei | 735 h | 1.050 h | 1.365 h |
| QA, accessibilità, DevOps, documentazione e handover | 959 h | 1.370 h | 1.781 h |
| **Totale ore-persona** | **5.684 h** | **8.120 h** | **10.556 h** |

**Assunzione — capacità:** 2 senior × 160 ore/mese. Sensibilità della capacità ±30%: 112 / 160 / 208 ore per sviluppatore-mese.

**STIMATO:** a capacità base, il calendario è 17,76 / 25,38 / 32,99 mesi per effort −30% / base / +30%. A effort base, variando la capacità del ±30%, il calendario è 36,25 / 25,38 / 19,52 mesi. La stima realistica centrale per due senior che partono da zero è quindi **25,38 mesi nominali**. Non include ritardi di approvazione, acquisizione diritti o riscrittura dei motori esterni.

## 4. Fase 3 — Profondità di prodotto

### 4.1 Contenuto didattico effettivo

| Unità | Valore | Stato/evidenza |
|---|---:|---|
| Corsi / mondi vivi | 4 / 16 | MISURATO nel DB |
| Lezioni vive | 49 | MISURATO nel DB e nel sorgente |
| Moduli vivi / nel sorgente | 199 / 168 | MISURATO; il DB è il catalogo operativo |
| Blocchi contenuto vivi / nel sorgente | 1.093 / 943 | MISURATO |
| Blocchi esercizio vivi | 150 | MISURATO |
| Set/domande di comprensione | 37 / 111 | MISURATO nel sorgente |
| Tipologie quiz inline | 5 | quiz, vero/falso, carta, valutazione mano, dichiarazione |
| Blocchi quiz inline | 214 | MISURATO |
| Scenari di pratica dichiarativa | 20 | MISURATO |
| Scenari d'impasse | 32 | MISURATO |
| Livelli quiz di presa generativo | 3 | MISURATO |
| Mani di catalogo vive | 272 | MISURATO; 272 con double-dummy |
| Mani difensive / altre | 56 / 216 | MISURATO |
| Definizioni di mani precaricate nel sorgente | 340 | MISURATO; raccolte sovrapposte, non sommate al DB |
| Mani precaricate validate / giocabili | 267 / 255 | MISURATO dal validatore statico |
| Mani MiniBridge WBF nel sorgente | 73 | MISURATO |
| Mani generate e condivise | 1.504 | MISURATO nel DB; tutte con distribuzioni attese |
| Scenari “Trova l'errore” | 32 | MISURATO |
| Esercizi di eserciziario | 31 | MISURATO |
| Mani guidate | 2 | MISURATO |
| Glossario / carte collezionabili | 49 / 22 | MISURATO |
| Badge standard / obiettivi segreti / livelli XP | 13 / 10 / 36 | MISURATO nel sorgente |
| Sottotitoli ASS | 49 file, 7.012 righe | MISURATO; disponibilità dei video non determinabile |

### 4.2 Schermate e flussi completi

**MISURATO per presenza del codice e, dove indicato, uso aggregato:** sono state classificate 22 famiglie di flusso: 11 con uso osservato, 6 implementate senza metrica di uso disponibile, 3 con uso iniziale e 2 implementate ma senza uso osservato.

| Stato | Flussi |
|---|---|
| Funzionante con uso osservato, 11 | autenticazione/profilo/cancellazione; corso-lezione-completamento; gioco completo/risultato/XP/analisi; sfide giornaliere e settimanali; amicizia e sfida asincrona; forum; richiesta istruttore e revisione admin; classi/compiti/chat/classifica; ricerca circolo; ripasso Leitner; ricerca compagno |
| Implementato, uso non misurabile da questi aggregati, 6 | generazione mani/DD/par/PBN; quiz di presa generativo; lavagna e dispensa istruttore; studio e archivio mani; quiz “cosa apri”; quiz “quale contratto” |
| Uso iniziale, 3 | tavolo live; licita su mano condivisa e confronto col campo; torneo di licita |
| Implementato ma 0 uso osservato, 2 | licita a due con mani avversarie nascoste; sfida a coppie su board condivisi |

“Implementato” significa che il percorso e le strutture dati sono presenti; non equivale a collaudo completo in produzione. “Uso iniziale” indica eventi molto pochi e non prova adozione stabile. Le 81 pagine sono schermate instradabili, non 81 flussi autonomi.

## 5. Fase 4 — Dati di utilizzo aggregati

### 5.1 Utenti, attività e crescita

| Mese 2026 | Registrazioni | Crescita registrazioni sul mese precedente | Utenti attivi da login | Eventi login | Lezioni completate |
|---|---:|---:|---:|---:|---:|
| Febbraio | 19 | non applicabile | 9 | 9 | 16 |
| Marzo | 668 | +3.415,79% | 678 | 1.781 | 1.066 |
| Aprile | 165 | −75,30% | 373 | 2.001 | 546 |
| Maggio | 108 | −34,55% | 312 | 2.021 | 567 |
| Giugno | 66 | −38,89% | 298 | 1.895 | 389 |
| Luglio | 47 | −28,79% | 236 | 1.957 | 383 |
| Agosto, parziale | 22 | −53,19% | 166 | 1.001 | 138 |

Tutti i valori della tabella sono **MISURATI**, salvo le percentuali che sono **CALCOLATE**. Agosto non è confrontabile con mesi completi. Gli eventi di login totali sono 10.665. Il campo cumulativo di tempo visibile nei profili somma 493.068 minuti, ma non consente di ricostruire la durata delle singole sessioni.

### 5.2 Completamenti e retention

| Metrica | Valore | Natura |
|---|---:|---|
| Righe di completamento modulo | 18.481 | MISURATO |
| Completamenti unici utente-lezione | 3.105 | CALCOLATO dalla query aggregata |
| Utenti con almeno una lezione completata | 344 | MISURATO aggregato |
| Retention rolling a 7 giorni | 480 / 1.083 = 44,32% | STIMATO mediante proxy |
| Retention rolling a 30 giorni | 338 / 1.046 = 32,31% | STIMATO mediante proxy |
| Sessioni reali | non determinabile | Mancano eventi affidabili di inizio/fine |
| Tempo medio di sessione | non determinabile | Il diagnostico ricostruisce quasi soltanto eventi singoli |

Il proxy di retention chiede se un utente ha almeno un login al giorno 7 o 30, o successivamente, dalla registrazione. Non è una retention di coorte standard e può sovrastimare il ritorno nel giorno esatto. I diagnostici con soglie 21/30/39 minuti producono 10.653 pseudo-sessioni, 10.643 delle quali con un solo evento e durata mediana zero: per questo non sono usati come “sessioni”.

### 5.3 Uso dei giochi e delle nuove funzioni

| Tipo di risultato | Eventi | Utenti distinti | Natura |
|---|---:|---:|---|
| Smazzata | 34.055 | 415 | MISURATO |
| Sfida | 10.971 | 539 | MISURATO |
| Mano del giorno | 3.590 | 271 | MISURATO |
| Conta veloce | 2.583 | 107 | MISURATO |
| Quiz | 1.913 | 149 | MISURATO |
| Memory | 1.876 | 71 | MISURATO |
| Impasse | 1.372 | 82 | MISURATO |
| Dichiara | 1.185 | 149 | MISURATO |
| Mano guidata | 1.142 | 323 | MISURATO |
| Pratica licita | 893 | 113 | MISURATO |
| Trova l'errore | 598 | 108 | MISURATO |
| Compito | 554 | 50 | MISURATO |
| Sfida settimanale | 26 | 2 | MISURATO |

Negli ultimi otto giorni osservati gli eventi/utenti giornalieri sono: 8 agosto 326/52; 9 agosto 336/52; 10 agosto 361/60; 11 agosto 362/54; 12 agosto 418/54; 13 agosto 354/58; 14 agosto 317/60; 15 agosto 374/64. **MISURATO:** mani condivise 16 risultati da 5 utenti; torneo di licita 8 risultati da 1 utente; tavolo live 1 record con 1 istruttore; profili partner 2; mani salvate 0; sessioni di licita a due 0; post circolo 0; sfide a coppie 0.

## 6. Fase 5 — Valutazione economica

### 6.1 Principio valutativo

I tre metodi non sono fusi. A e B stimano il sacrificio necessario a ricostruire o acquistare il sistema; C stima il beneficio economico plausibile per la Federazione. Poiché il prodotto non genera ricavi misurabili nella base dati esaminata, il metodo C usa il costo evitato di una licenza comparabile e lo corregge per uso e oneri operativi. Il metodo C è quello adottato per la conclusione.

### 6.2 Assunzioni e sensibilità obbligatorie

| Assunzione dichiarata | −30% | Base | +30% |
|---|---:|---:|---:|
| Effort di replica | 5.684 h | 8.120 h | 10.556 h |
| Capacità mensile per senior | 112 h | 160 h | 208 h |
| Overhead fornitore su implementazione | 35% | 50% | 65% |
| Utenti attivi mensili sostenibili | 197,4 | 282 | 366,6 |
| Prezzo equivalente Funbridge Premium | €104,99/anno | €149,99/anno | €194,99/anno |
| Manutenzione | 14 h/mese | 20 h/mese | 26 h/mese |
| Tariffa manutenzione | €63/h | €90/h | €117/h |
| Hosting | $31,50/mese | $45/mese | $58,50/mese |

L'orizzonte di 36 mesi deriva dal mandato, non è un'assunzione discrezionale. Il cambio usato è 1 euro = 1,1380 dollari, pubblicato dalla BCE per il 29 luglio 2026.

### 6.3 Metodo A — Costo di riproduzione

Le tariffe 70/90/110 euro l'ora sono scenari basso/medio/alto coerenti con i benchmark italiani pubblici indicati in appendice; non sono un tariffario ufficiale né un'offerta.

| Tariffa | Effort −30% | Effort base | Effort +30% |
|---:|---:|---:|---:|
| €70/h | €397.880 | €568.400 | €738.920 |
| €90/h | €511.560 | €730.800 | €950.040 |
| €110/h | €625.240 | €893.200 | €1.161.160 |

Tutti gli importi sono **STIMATI**. Questo metodo misura risorse tecniche, non domanda, ricavi o utilità.

### 6.4 Metodo B — Costo di sostituzione presso un fornitore

**Assunzione:** il fornitore aggiunge al lavoro di implementazione un overhead complessivo base del 50% per analisi, progettazione, QA/sicurezza indipendente e project management; sensibilità 35–65%. Perimetro base 12.180 ore; sensibilità dell'effort 8.526–15.834 ore. Tariffe fornitore 80/115/150 euro l'ora.

| Tariffa fornitore | Costo a perimetro base |
|---:|---:|
| €80/h | €974.400 |
| €115/h | €1.400.700 |
| €150/h | €1.827.000 |

Inviluppo combinato effort/tariffa: **€682.080–€2.375.100**, **STIMATO**. È un controfattuale utile per una gara o un capitolato, ma è una misura debole del valore conferibile: una federazione razionale non paga il costo storico se può ottenere lo stesso beneficio a meno.

### 6.5 Metodo C — Valore d'uso triennale

Listini pubblici osservati il 15 agosto 2026:

- [Funbridge](https://funbridge.com/fr/offres): Premium 149,99 euro/anno; Premium+ 239,99 euro/anno;
- [BBO Prime](https://doc.bridgebase.com/Prime/About_Prime.html): 5,99 dollari/mese;
- [LearnWorlds](https://www.learnworlds.com/pricing/): Learning Center 249 dollari/mese con fatturazione annuale, usato solo come controllo LMS;
- [Vercel](https://vercel.com/pricing): Pro 20 dollari/mese;
- [Supabase](https://supabase.com/pricing): Pro da 25 dollari/mese;
- [BCE](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html): 1 euro = 1,1380 dollari al 29 luglio 2026.

I listini non sono perfettamente omogenei: Funbridge è il comparabile più vicino per didattica e pratica del bridge, BBO Prime è un limite basso, LearnWorlds misura solo una piattaforma didattica generica e non va sommato al comparabile bridge.

#### Valore già erogato, controllo retrospettivo

**MISURATO:** 2.072 mesi-utente attivi tra febbraio e agosto parziale. **CALCOLATO:** applicando equivalenti mensili, il beneficio lordo storico è 10.906,22 euro con BBO Prime, 25.898,27 euro con Funbridge Premium e 41.438,27 euro con Premium+. Non è ricavo e non viene sommato al valore prospettico.

#### Valore prospettico lordo

| Scenario | Calcolo | Valore 3 anni |
|---|---|---:|
| Limite basso | 197,4 utenti × BBO Prime equivalente €63,16/anno × 3 | €37.405,39 |
| Base | 282 utenti × Funbridge Premium €149,99/anno × 3 | €126.891,54 |
| Limite alto ampio | 366,6 utenti × Premium+ €239,99/anno × 3 | €263.941,00 |

Per il range principale si usa Funbridge Premium e si varia soltanto l'utenza del ±30%: **€88.824,08 / €126.891,54 / €164.959,00**. Il controllo LMS generico LearnWorlds vale 5.513,88 / 7.876,98 / 10.240,07 euro; è molto inferiore perché non valorizza il dominio bridge.

#### Oneri e valore netto

| Voce | −30% | Base | +30% |
|---|---:|---:|---:|
| Hosting per 36 mesi | €996,49 | €1.423,55 | €1.850,62 |
| Manutenzione per 36 mesi | €45.360 | €64.800 | €84.240 |

**Assunzione:** 20 ore di manutenzione al mese a 90 euro/ora; entrambi i parametri sono mostrati separatamente nella tabella delle assunzioni. L'onere base complessivo è **€66.223,55**.

Combinando utenza −30% con oneri +30%, base con base, e utenza +30% con oneri −30%, il valore netto è **€2.733,46 / €60.667,99 / €118.602,52**. Con il sostituto BBO del limite basso, il beneficio lordo è inferiore all'onere base; per una decisione razionale il valore incrementale viene posto a **zero**, non negativo.

### 6.6 Range prudenziale del valore conferito

**STIMATO, conclusione:** **0–120.000 euro** di valore d'uso netto su tre anni; scenario centrale **60.667,99 euro**, arrotondabile a 61.000 euro. L'equivalenza lorda di capacità con il comparabile principale è **88.824,08–164.959,00 euro**, arrotondata a 90.000–165.000 euro.

Il metodo C è il più difendibile perché usa tre fatti verificabili: uso aggregato osservato, prezzo pubblico di un servizio comparabile e costi necessari a mantenere l'alternativa proprietaria. I metodi A e B mostrano che il sistema sarebbe oneroso da ricostruire, ma non vengono capitalizzati nel valore: il costo di sostituzione è un tetto tecnico, non una prova di utilità economica.

## Tabella riassuntiva finale

| Indicatore richiesto | Risultato | Natura |
|---|---:|---|
| Ore stimate di replica | 8.120 h; sensibilità 5.684–10.556 h | STIMATO |
| Ore dai timestamp Git | 127,84 h | CALCOLATO, limite inferiore |
| Commit | 329 | MISURATO |
| Righe di codice applicativo | 73.581 | MISURATO |
| Giorni di lavoro attivi | 57 | MISURATO come giorni con commit |
| Punteggio medio di qualità | 3,42/5 | CALCOLATO da 12 giudizi |
| Valore conferito prudenziale | €0–€120.000 netti su 3 anni; centrale €60.667,99 | STIMATO |
| Equivalenza di valore d'uso lordo | €88.824,08–€164.959,00 su 3 anni | STIMATO |

## Limiti della presente analisi

Questa analisi non è un audit di sicurezza con penetration test, non certifica conformità GDPR, accessibilità o correttezza regolamentare, non verifica la titolarità giuridica di codice, contenuti, video, marchi o dataset, non dimostra la disponibilità dei 49 video in produzione e non misura SLA, resilienza o prestazioni sotto carico. Non sono stati eseguiti gli E2E, i test RLS o Realtime localmente contro il database operativo; la configurazione della verifica notturna è stata letta, ma non sono stati esaminati run riusciti. Il numero e il tempo medio delle sessioni sono non determinabili; la retention è un proxy rolling, non una coorte standard. I dati di agosto sono parziali. I listini pubblici non sono offerte vincolanti e i comparabili non sono identici a BridgeLab. Le ore di replica e manutenzione sono assunzioni, seppure esplicite e sottoposte a sensibilità. Il valore non comprende ricavi futuri, crescita, marchio, avviamento o dati personali. La dipendenza da DDS e BEN riduce il costo di integrazione ma non conferisce proprietà esclusiva degli algoritmi. La concentrazione di 328 commit su 329 in un solo autore aumenta il rischio di passaggio di consegne. Infine, il working tree non era pulito: le metriche statiche riflettono quello stato locale, mentre la storia Git riflette il commit indicato.

# Appendice — comandi e output grezzi

Tutti i comandi sono stati eseguiti dalla directory `/Users/albertogiovannigerli/Desktop/Personale/Bridge/bridgequest`. Gli output database sono esclusivamente aggregati.

## A.1 Stato Git e cutoff

Comando:

```bash
git rev-parse HEAD
git log -1 --format='%H%n%aI%n%cI%n%s'
git status --short
```

Output rilevante:

```text
477d2cd6f5280955d73c9aebaf28497a784e44de
477d2cd6f5280955d73c9aebaf28497a784e44de
2026-08-15T19:47:37+02:00
2026-08-15T19:47:37+02:00
Tre segnalazioni di Sentry, e una guardia che ne impedisce una classe intera
49 righe "D public/videos/*.mp4"
file di audit e altri file preesistenti non tracciati
```

La riga riassuntiva sulle cancellazioni non sostituisce il conteggio grezzo seguente:

```bash
printf '%s\n' "tracked_mp4=$(git ls-tree -r --name-only HEAD -- public/videos | rg '\.mp4$' | wc -l | tr -d ' ')" "working_tree_mp4=$(find public/videos -type f -name '*.mp4' | wc -l | tr -d ' ')" "deleted_tracked_mp4=$(git status --short -- public/videos | awk '$1==\"D\"{n++} END{print n+0}')"
```

```text
find: public/videos: No such file or directory
tracked_mp4=49
working_tree_mp4=0
deleted_tracked_mp4=49
```

## A.2 Metriche Git e sessioni

Comando esatto:

```bash
node audit-bridgelab/collect-git-metrics.mjs
```

Output grezzo:

```json
{
  "ambito":{"ramo_corrente":"main","head":"477d2cd6f5280955d73c9aebaf28497a784e44de","riferimenti_branch_validi":["refs/heads/main","refs/heads/perf/tier0-quickwins","refs/heads/redesign/ui-v2","refs/remotes/origin/main","refs/remotes/origin/perf/tier0-quickwins","refs/remotes/origin/redesign/ui-v2","refs/remotes/origin/vercel/vercel-web-analytics-to-nextjs-wy0msr"]},
  "git":{"commit_totali":329,"commit_per_autore_pseudonimizzato":{"Autore-10620de2":328,"Autore-6a19acae":1},"primo_commit":{"hash":"6471b4830500b3c64004696a9258145486a998ce","timestamp_Europe_Rome":"2026-02-08 00:15:02"},"ultimo_commit":{"hash":"477d2cd6f5280955d73c9aebaf28497a784e44de","timestamp_Europe_Rome":"2026-08-15 19:47:37"},"giorni_calendario_attivi":57,"commit_per_mese":{"2026-02":53,"2026-03":96,"2026-04":7,"2026-05":21,"2026-06":20,"2026-07":14,"2026-08":118},"commit_per_fascia_oraria_Europe_Rome":{"00-05":58,"06-11":66,"12-17":102,"18-23":103},"dimensione_commit_mediana_righe_aggiunte_piu_rimosse":168,"righe_aggiunte_totali":226936,"righe_rimosse_totali":36038,"occorrenze_file_binari_ignorate_nel_conteggio_righe":526,"branch_locali_validi":3,"branch_remoti_validi":4,"branch_validi_totali":7,"merge_commit":2},
  "effort_timestamp":{"regola":"Per autore: nuova sessione se gap > 90 minuti; durata = ultimo-primo commit + 30 minuti; sessione singola = 30 minuti.","sessioni":102,"minuti_totali":7670,"ore_totali":127.84,"qualificazione":"Limite inferiore: non cattura progettazione, debug e lavoro non committato."}
}
```

File più modificati, parte dello stesso output:

```text
src/app/page.tsx                                  58  3901 3845 7746
src/app/profilo/page.tsx                         47  2566 2247 4813
src/app/admin/page.tsx                           39  2824 2609 5433
src/app/gioca/page.tsx                           37  1308  583 1891
src/app/gioca/smazzata/page.tsx                  32  1553  310 1863
src/app/lezioni/[lessonId]/[moduleId]/page.tsx   31  2844 2675 5519
src/components/desktop-sidebar.tsx               29   723  543 1266
src/app/layout.tsx                               29   376  106  482
src/app/login/page.tsx                           25   736  165  901
src/app/gioca/sfida/page.tsx                     25   684  114  798
src/app/classifica/page.tsx                      24  2073  683 2756
src/app/impostazioni/page.tsx                    22  1034  286 1320
src/components/bridge/bridge-table.tsx           22   557  147  704
src/app/gioca/mano-del-giorno/page.tsx           21  1837 1703 3540
src/app/lezioni/page.tsx                         20   774  182  956
```

## A.3 `cloc`, inventario e pagine

Comandi esatti:

```bash
npx --yes cloc src/app src/components src/contexts src/hooks src/lib src/store src/proxy.ts instrumentation.ts instrumentation-client.ts deploy/ben-railway/guard.py --fullpath --not-match-f='(src/lib/supabase/types\.ts$|src/lib/__palette-baseline\.json$|\.(test|spec)\.[^.]+$)' --exclude-dir=node_modules,.next,.next.nosync,build,dist --exclude-ext=lock --hide-rate
npx --yes cloc $(rg --files src e2e | rg '\.(test|spec)\.[^.]+$') scripts/test-rls.mjs scripts/test-realtime.mjs deploy/ben-railway/test_guard.py --hide-rate
npx --yes cloc src/data cuori-gioco-knowledge.md cuori-licita-knowledge.md fiori-knowledge.md quadri-knowledge.md --include-ext=ts,md --hide-rate
npx --yes cloc package.json components.json tsconfig.json vercel.json deploy/ben-railway/railway.json next.config.ts capacitor.config.ts eslint.config.mjs postcss.config.mjs vitest.config.ts playwright.config.ts deploy/ben-railway/Dockerfile --exclude-ext=lock --hide-rate
find public/captions -type f -name '*.ass' -print0 | xargs -0 wc -l | tail -n 1
find public/captions -type f -name '*.ass' | wc -l
```

Output grezzo:

```text
Language      files blank comment  code
TypeScript      435  6945    7473 73093
CSS               1    49      56   400
Python            1    31      40    88
SUM             437  7025    7569 73581

Language      files blank comment code
TypeScript       68  1314    1294 8001
JavaScript        2   128     198  866
Python            1     8      10   45
SUM              71  1450    1502 8912

Language      files blank comment  code
TypeScript       21   551     766 18082
Markdown          4   487       0  2192
SUM              25  1038     766 20274

Language      files blank comment code
JSON              5     0       0  204
TypeScript        4    10      73  183
JavaScript        2     3       5   46
Dockerfile        1     9      36   26
SUM              12    22     114  459

7012 total
49
```

Comandi inventario:

```bash
rg --files src/components | rg '\.tsx$' | wc -l
rg --files src/app | rg '(^|/)page\.tsx$' | wc -l
rg --files src/app/api | rg '(^|/)route\.ts$' | wc -l
rg -n '^export (async )?function (GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)' src/app/api -g 'route.ts' | wc -l
rg --files src e2e | rg '\.(test|spec)\.[^.]+$' | wc -l
rg --files src | rg '\.(test|spec)\.[^.]+$' | wc -l
rg --files e2e | rg '\.spec\.ts$' | wc -l
rg --files .github/workflows | wc -l
find supabase/migrations -type f 2>/dev/null | wc -l
rg --files scripts/sql | wc -l
rg --files src/app | rg '/page\.tsx$' | xargs wc -l | sort -nr | head -n 8
```

```text
102
81
12
13
68
58
10
2
0
52
35059 total
1390 src/app/classifica/page.tsx
1243 src/app/gioca/smazzata/page.tsx
1157 src/app/gioca/quiz-lampo/page.tsx
1148 src/app/gioca/sfida-imp/page.tsx
1029 src/app/gioca/sfida-amico/page.tsx
```

## A.4 Inventario statico di prodotto

Comando:

```bash
npx tsx audit-bridgelab/collect-static-product-metrics.ts
```

Output grezzo:

```json
{
  "repository_static_content":{"courses":4,"lessons":49,"lessons_by_course":{"fiori":13,"quadri":12,"cuori-gioco":10,"cuori-licita":14},"modules":168,"content_blocks":943,"content_block_distribution":{"bid-select":34,"card-select":5,"example":123,"hand-eval":8,"heading":120,"quiz":126,"rule":159,"text":294,"tip":33,"true-false":41},"inline_quiz_types_present":["quiz","true-false","card-select","hand-eval","bid-select"],"inline_quiz_type_count":5,"inline_quiz_blocks":214,"comprehension_lesson_sets":37,"comprehension_questions":111,"bidding_practice_scenarios":20,"impasse_scenarios":32,"fiori_smazzate":96,"quadri_smazzate":96,"cuori_gioco_smazzate":80,"cuori_licita_smazzate":0,"all_validated_smazzate":267,"playable_smazzate_after_plausibility_filter":255,"wbf_minibridge_deals":73,"preloaded_hand_definitions_total":340,"standard_badges":13,"secret_achievements":10,"xp_levels":36,"constrained_deal_templates":7,"generated_trick_quiz_levels":3},
  "interface_inventory":{"component_tsx_files_under_src_components":102,"routable_page_files":81,"api_route_files":12,"exported_http_handlers":13}
}
```

Inventario flussi:

```bash
awk -F'\t' '{c[$1]++} END{for(k in c) print k,c[k]; print "total",NR}' audit-bridgelab/flow-inventory.tsv | sort
```

```text
active_usage 11
implemented 6
implemented_no_usage 2
initial_usage 3
total 22
```

Il dettaglio grezzo dei 22 flussi è nel file `audit-bridgelab/flow-inventory.tsv` e costituisce parte dell'appendice verificabile.

## A.5 Verifiche tecniche

Comandi:

```bash
npm test
npx tsc --noEmit
npx eslint src --max-warnings 0
node audit-bridgelab/collect-eslint-summary.mjs
npm run build
npx playwright test --list
python3 deploy/ben-railway/test_guard.py
npm run schema:check
```

Output grezzo essenziale:

```text
Test Files  55 passed | 3 skipped (58)
Tests       990 passed | 5 skipped (995)
Duration    14.22s

tsc_exit=0
eslint_exit=0
{"eslint_exit_code":0,"files_checked":513,"files_with_issues":0,"errors":0,"warnings":0,"top_files_by_errors_then_warnings":[]}

Next.js 16.1.6 (webpack)
Compiled successfully in 16.7s
Running TypeScript ...
Generating static pages using 9 workers (85/85)
exit code 0

Total: 35 tests in 10 files

11 verifiche BEN: tutti passati

schema allineato (4514 righe).
```

La build ha emesso warning `--localstorage-file` senza percorso valido; non ha fallito. Vitest ha emesso un warning sulla futura modalità nativa di caricamento della configurazione Vite.

## A.6 Database: modalità, query e output aggregati

Sono stati letti, senza scrittura, i file:

```bash
for f in audit-bridgelab/sql/{01..12}-*.sql; do sed -n '1,260p' "$f"; done
```

Ogni istruzione `SELECT` è stata inviata separatamente con il connettore Supabase in sola lettura:

```text
mcp__codex_apps__supabase_execute_sql
{"project_id":"<progetto BridgeLab selezionato>","query":"<singola SELECT contenuta nei file audit-bridgelab/sql/01..12>"}
```

Output grezzo aggregato dello schema:

```json
{"tables":47,"rls_enabled_tables":47,"indexes":131,"functions":63,"security_definer_functions":55,"security_definer_with_explicit_search_path":55,"triggers":15,"primary_keys":47,"foreign_keys":63,"check_constraints":55,"unique_constraints":20,"policies":91,"policy_commands":{"ALL":5,"DELETE":12,"INSERT":22,"SELECT":41,"UPDATE":11},"formal_repo_migrations":0,"live_migrations":48,"first_live_migration":"20260809142055 pii_access_functions","last_live_migration":"20260815164803 review_items_box"}
```

Output grezzo, righe per tutte le tabelle pubbliche:

```text
asd 241
asd_clubs 260
assignments 14
badges 1439
bbo_username_cleanup_2026_08 9
bidding_sessions 0
challenges 513
class_members 52
class_messages 7
classes 16
club_posts 0
collectible_cards 22
completed_modules 18481
course_worlds 16
courses 4
email_events 699
eserciziario_exercises 31
forum_comments 27
forum_likes 6
forum_poll_votes 66
forum_posts 18
friendships 150
game_results 60758
glossary 49
guided_hands 2
instructor_requests 16
lesson_modules 199
lessons 49
live_tables 1
login_history 10665
mani_generate 1504
partner_profiles 2
profiles 1095
push_subscriptions 0
review_items 133
risultati_mano 16
risultati_torneo 8
saved_hands 0
scenari 7
sfida_board 0
sfide_coppie 0
smazzate 272
tornei 2
torneo_mani 32
tournament_results 60
trova_errore_scenarios 32
weekly_challenges 12
```

Output grezzo di prodotto:

```json
{"courses":4,"course_worlds":16,"lessons":49,"lesson_modules":199,"catalog_hands":272,"catalog_hands_with_double_dummy":272,"defense_oriented_hands":56,"glossary":49,"collectible_cards":22,"guided_hands":2,"workbook_exercises":31,"find_error_scenarios":32,"generated_shared_hands":1504,"generated_with_expected_value":1504,"generated_without_expected_value":0,"generated_ns_hcp_avg":23.19,"generated_ns_hcp_min":11,"generated_ns_hcp_max":34,"bidding_scenarios":7,"bidding_tournaments":2,"bidding_tournament_boards":32,"live_content_blocks":1093,"live_exercise_blocks":150}
```

Distribuzioni vive:

```text
course cuori-gioco 10 lessons 32 modules
course cuori-licita 14 lessons 28 modules
course fiori 13 lessons 91 modules
course quadri 12 lessons 48 modules
module_type exercise 40
module_type practice 10
module_type quiz 49
module_type theory 100
content_block bid 41
content_block card 11
content_block example 123
content_block hand 10
content_block heading 120
content_block quiz 230
content_block rule 159
content_block text 323
content_block tip 33
content_block truefalse 43
exercise_block bid 7
exercise_block card 6
exercise_block hand 2
exercise_block quiz 104
exercise_block text 29
exercise_block truefalse 2
```

Output grezzo d'uso:

```json
{"cutoff_utc":"2026-08-15 17:56:37.992022+00","registered_users":1095,"profile_rows":1095,"login_events":10665,"visible_cumulative_minutes":493068,"module_completion_rows":18481,"unique_user_lesson_completions":3105,"users_with_lesson_completion":344}
```

```text
month       registrations growth_pct  active_users login_events lesson_completions
2026-02     19            null        9            9            16
2026-03     668           3415.79     678          1781         1066
2026-04     165          -75.30       373          2001         546
2026-05     108          -34.55       312          2021         567
2026-06     66           -38.89       298          1895         389
2026-07     47           -28.79       236          1957         383
2026-08     22           -53.19       166          1001         138
```

Retention rolling, output grezzo:

```text
days eligible retained retention_pct
5    1087     499      45.91
7    1083     480      44.32
9    1077     470      43.64
21   1060     388      36.60
30   1046     338      32.31
39   1032     312      30.23
```

Diagnostico sessioni, per soglie 21/30/39 minuti:

```text
inferred_sessions 10653
single_event_sessions 10643
mean_minutes 0
median_minutes 0
```

Uso giochi, output grezzo:

```text
smazzata 34055 415
sfida 10971 539
mano-del-giorno 3590 271
conta 2583 107
quiz 1913 149
memory 1876 71
impasse 1372 82
dichiara 1185 149
mano-guidata 1142 323
pratica-licita 893 113
trova-errore 598 108
compito 554 50
sfida-settimanale 26 2
```

Nuove funzioni, output grezzo:

```json
{"shared_hand_results":{"rows":16,"users":5},"bidding_tournament_results":{"rows":8,"users":1},"saved_hands":0,"two_player_bidding_sessions":0,"live_tables":{"rows":1,"instructors":1},"partner_profiles":2,"club_posts":0,"pair_challenges":0}
```

Advisor e privilegi, output grezzo aggregato:

```json
{"security":{"total":58,"INFO":2,"WARN":56,"rls_no_policy":2,"mutable_search_path_nondefiner":2,"anon_security_definer_executable":2,"authenticated_security_definer_executable":52},"performance":{"total":100,"INFO":36,"WARN":64,"unindexed_foreign_keys":21,"auth_rls_initplan":59,"unused_indexes":14,"multiple_permissive_policies":5,"auth_db_connection":1},"profiles_grants":{"anon_select_columns":25,"anon_insert_columns":25,"anon_references_columns":25,"anon_update_columns":25,"authenticated_select_columns":9,"authenticated_other_grants_columns":25},"note":"i grant sono filtrati dalle policy RLS; non costituiscono da soli accesso alle righe"}
```

## A.7 Calcoli economici

Comando esatto:

```bash
node audit-bridgelab/economic-calculations.mjs
```

Output grezzo numerico:

```json
{
  "replication_hours":{"minus_30_pct":5684,"base":8120,"plus_30_pct":10556},
  "two_senior_calendar_months":{"minus_30_pct":17.76,"base":25.38,"plus_30_pct":32.99},
  "capacity_sensitivity_months":{"112h":36.25,"160h":25.38,"208h":19.52},
  "method_A":{"70":{"minus":397880,"base":568400,"plus":738920},"90":{"minus":511560,"base":730800,"plus":950040},"110":{"minus":625240,"base":893200,"plus":1161160}},
  "method_B":{"hours":{"minus":8526,"base":12180,"plus":15834},"base_cost":{"80":974400,"115":1400700,"150":1827000},"combined_envelope":{"lower":682080,"upper":2375100}},
  "method_C":{"observed_active_user_months":2072,"sustainable_mau":{"minus":197.4,"base":282,"plus":366.6},"historical_gross":{"bbo":10906.22,"funbridge_premium":25898.27,"premium_plus":41438.27},"gross_scenarios":{"low":37405.39,"base":126891.54,"high":263941},"nearest_comparator_gross":{"minus":88824.08,"base":126891.54,"plus":164959},"generic_lms":{"minus":5513.88,"base":7876.98,"plus":10240.07},"hosting":{"minus":996.49,"base":1423.55,"plus":1850.62},"maintenance":{"minus":45360,"base":64800,"plus":84240},"operating_base":66223.55,"net":{"minus":2733.46,"base":60667.99,"plus":118602.52}},
  "quality":{"scores":[4,4,4,3,4,3,4,1,4,4,3,3],"sum":41,"count":12,"mean":3.42},
  "prudent_conferred_value":{"gross_capability_equivalence":{"lower":88824.08,"upper":164959},"net_exact":{"lower":0,"upper":118602.52},"net_rounded":{"lower":0,"upper":120000},"central_net":60667.99}
}
```

Sensibilità grezza delle componenti algoritmiche:

```text
game_engine_ai_scoring_dds_ben_integration_and_replay          630 900 1170 h   56700 81000 105300 EUR
constrained_hand_generation_dds_expected_value_and_validation 595 850 1105 h   53550 76500  99450 EUR
bidding_engine_shared_field_pair_challenge_and_tournaments    455 650  845 h   40950 58500  76050 EUR
in_house_endgame_solver_and_validation_helpers                224 320  416 h   20160 28800  37440 EUR
generated_trick_and_opening_quizzes                           126 180  234 h   11340 16200  21060 EUR
spaced_repetition_leitner                                      56  80  104 h    5040  7200   9360 EUR
gamification_xp_badges_streaks_and_objectives                 112 160  208 h   10080 14400  18720 EUR
learning_progression_orchestration                            182 260  338 h   16380 23400  30420 EUR
live_class_table_state_and_hidden_information                 140 200  260 h   12600 18000  23400 EUR
```

## A.8 Fonti economiche e tecniche esterne

Comandi/consultazioni web eseguiti il 15 agosto 2026:

```text
open https://funbridge.com/fr/offres
open https://doc.bridgebase.com/Prime/About_Prime.html
open https://www.learnworlds.com/pricing/
open https://vercel.com/pricing
open https://supabase.com/pricing
open https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
open https://systemforge.it/blog/tariffe-programmatore-freelance-italia-2026/
open https://systemforge.it/blog/quanto-costa-sviluppare-software-italia-2025/
open https://github.com/lorserker/ben
```

Output estratto, senza parafrasi numerica:

```text
Funbridge Premium: €14.99/month; €149.99/year
Funbridge Premium+: €23.99/month; €239.99/year
BBO Prime: $5.99/month
LearnWorlds Learning Center: $249/month billed yearly; $299 monthly
Vercel Pro: $20/month
Supabase Pro: from $25/month
ECB 2026-07-29: USD 1.1380 per EUR
SystemForge senior full-stack: €70–90/hour; Milan €80–110/hour
SystemForge software-house senior: €80–150/hour
BEN repository licence: GPL-3.0; neural-network bridge engine with DDS integration
bridge-dds local package: version 1.4.0; Apache-2.0
```

I due riferimenti SystemForge sono benchmark commerciali pubblici, non fonti istituzionali e non preventivi. Sono usati soltanto per impostare scenari tariffari, non per determinare il valore conclusivo.
