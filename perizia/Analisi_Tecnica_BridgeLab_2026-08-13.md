# Analisi tecnica della piattaforma BridgeLab — 13 agosto 2026

**Tipo:** analisi tecnica ex novo (seconda edizione; sostituisce e aggiorna la sezione tecnica della perizia dell'8 agosto 2026)
**Metodo:** ogni numero deriva da un comando eseguito sul repository in data 13 agosto 2026 (comandi e output in appendice B) o da un file letto. Ciò che non è misurabile è marcato *stimato* o *non determinabile*.
**Nota di confronto:** dove utile, è indicato il delta rispetto alla misurazione dell'8 agosto 2026, perché il repository è cambiato in modo sostanziale in 5 giorni (+51 commit).

***

## 1. Sintesi

BridgeLab è una piattaforma didattica completa per il bridge (Next.js 16 / React 19 / TypeScript strict, Supabase, PWA, app mobile Capacitor), in produzione su bridgelab.it. Rispetto all'analisi dell'8 agosto, il progetto ha colmato quasi tutte le lacune strutturali allora segnalate: **ora esistono 36 file di test unitari (6.287 righe) e 9 file di test end-to-end con controlli di accessibilità automatici, una pipeline CI che blocca il merge se typecheck/lint/test falliscono, un gate amministrativo lato server, validazione input con zod, monitoraggio errori con Sentry e documentazione tecnica reale** (README riscritto, `docs/architettura.md`, `docs/runbook.md`).

Il giudizio medio di qualità sale da **2,6 a 3,5 su 5**. Restano aperti tre punti: schema del database non versionato nel repository (nessuna migrazione), prodotto solo in italiano, conoscenza concentrata in un solo autore.

Misure chiave: **261 commit**, **55 giorni di lavoro attivi** su 187 giorni di calendario (8 feb – 13 ago 2026), **104.155 righe** totali in `src/` (90.005 effettive, esclusi commenti e vuote; 6.287 di test), **69 pagine**, **94 componenti**, **10 endpoint API**, **48 policy RLS**, 4 corsi con 49 lezioni, 169 moduli, ~350 mani precaricate, 21 modalità di gioco. L'effort minimo misurato dai timestamp è di **106,7 ore in 93 sessioni** (limite inferiore, §2.2).

***

## 2. Metriche del repository (misurato)

### 2.1 Cronologia git

| Metrica                                     | Valore                                                   | Delta vs 8 ago    | Rif. |
| ------------------------------------------- | -------------------------------------------------------- | ----------------- | ---- |
| Commit totali                               | **261**                                                  | +51               | B1   |
| Autori                                      | 1 umano (260) + 1 bot Vercel (1)                         | —                 | B1   |
| Primo / ultimo commit                       | 8 feb 2026 / **13 ago 2026**                             | ultimo +17 gg     | B1   |
| Giorni con almeno un commit                 | **55** (29% dei 187 giorni)                              | +5                | B1   |
| Merge / branch locali                       | 2 / 3 (`main`, `perf/tier0-quickwins`, `redesign/ui-v2`) | —                 | B1   |
| Righe aggiunte / rimosse (escluso lockfile) | **+183.400 / −33.255**                                   | +32.660 / +11.195 | B2   |
| Dimensione mediana commit                   | **112 righe** (media 664, max 35.026)                    | mediana 94 → 112  | B3   |

**Distribuzione per mese** (B2): feb 53 · mar 95 · apr 7 · mag 21 · giu 20 · lug 14 · **ago 51**. Agosto è il terzo mese per intensità: il progetto non è in mantenimento, è in sviluppo attivo.

**Distribuzione oraria** (B2): confermato il bimodalità sera/notte (22:00–02:00: 77 commit, 30%) e mattina (8:00–12:00: 74 commit).

**File più modificati** (B3): `page.tsx` home (57), `profilo/page.tsx` (46, +8), `admin/page.tsx` (38, +5), `lezioni/.../moduleId/page.tsx` (31), `gioca/smazzata` (31), `gioca/page.tsx` (31). Iterazione costante sulle superfici utente principali.

### 2.2 Effort dai timestamp (misurato, limite inferiore)

Metodo invariato: sessione = sequenza di commit con gap ≤ 90 minuti; durata sessione + 30 minuti di ramp-up (B4).

| Scenario                       | Sessioni                                                                                                                                             | Ore       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Base (gap 90 min, ramp 30 min) | **93**                                                                                                                                               | **106,7** |
| ±30% su gap e ramp             | *non rieseguito in questa sessione (approvazioni comando scadute)*; nell'edizione dell'8 agosto la stessa variazione produceva −20% / +20% sulle ore | —         |

> **Limite inferiore dichiarato:** non cattura progettazione, debug, lettura documentazione, test manuali, authoring dei contenuti e lavoro non committato. Va letto come "almeno queste ore".

### 2.3 Righe di codice (misurato, `src/`, 450 file)

| Categoria                        | Righe        | File    |
| -------------------------------- | ------------ | ------- |
| `src/app` (rotte, pagine, API)   | 45.186       | 193     |
| `src/data` (contenuti didattici) | 19.399       | 21      |
| `src/components`                 | 14.139       | 97      |
| `src/lib` (logica di dominio)    | 18.872       | 102     |
| `src/hooks`                      | 5.519        | 28      |
| `src/store`                      | 1.042        | 10      |
| contexts / proxy                 | \~80         | 2       |
| **Totale**                       | **104.155**  | **450** |
| di cui commenti                  | 6.480        | <br />  |
| di cui righe vuote               | 7.670        | <br />  |
| **Codice effettivo**             | **\~90.000** | <br />  |
| di cui **test**                  | **6.287**    | 36      |

Codice applicativo (totale meno contenuti `data` e test): **\~78.500 righe**. Script SQL: 33 file, 3.376 righe (B5). Test e2e: 9 file, 1.043 righe (B6). TypeScript `strict: true` (`tsconfig.json:12`).

### 2.4 Conteggi strutturali (misurato)

| Elemento                               | Valore                                                                                       | Delta vs 8 ago                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Pagine/rotte (`page.tsx`)              | **69**                                                                                       | +3 (`trova-compagno`, `trova-circolo`, `quiz-prese`, `termini`, `~offline`…) |
| Endpoint API                           | **10**                                                                                       | +2 (`account/delete`, `meta/conversion`)                                     |
| Componenti React                       | **94**                                                                                       | +4                                                                           |
| Tabelle DB (CREATE TABLE negli script) | 16 occorrenze                                                                                | +3                                                                           |
| Policy RLS / tabelle con RLS           | **48 / 19**                                                                                  | +11 / +4                                                                     |
| Migrazioni versionate                  | **0** (script sciolti in `scripts/sql/`, esecuzione manuale documentata)                     | invariato                                                                    |
| Test unitari                           | **36 file, 6.287 righe (vitest)**                                                            | **da 0**                                                                     |
| Test e2e                               | **9 file, 1.043 righe (Playwright + axe-core)**                                              | **da 0**                                                                     |
| Pipeline CI                            | **1 workflow GitHub Actions** (typecheck + lint con `--max-warnings 0` + test, su push e PR) | **da 0**                                                                     |

***

## 3. Qualità e profondità architetturale

Valutazione 1–5 con evidenze. **Punteggio medio: 3,5 / 5** (era 2,6 l'8 agosto).

| Voce                                  | Voto  | Era | Evidenza                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | ----- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Separazione delle responsabilità      | **4** | 4   | Refactoring profondo: `admin/page.tsx` da 1.825 a **214 righe** con logica estratta in `admin/_components/*` (18 file) e `_use-admin-data.ts`; stesso pattern in `profilo/` (page 312 righe + hook `_use-profile-*.ts` + 15 sotto-componenti) e `gioca/torneo/` e `mano-del-giorno/`. Strati netti confermati (`app/components/hooks/store/lib/data`). Restano pagine grandi: `classifica/page.tsx` 1.390 righe, `quiz-lampo` 1.157.                     |
| Modello dati e integrità referenziale | **2** | 2   | euro                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Autenticazione e autorizzazione       | **4** | 3   | **Corretto il difetto principale dell'edizione precedente**: gate admin ora **server-side** in `src/app/admin/layout.tsx:14-32` (redirect se non loggato; verifica `role = 'admin'` sulla tabella profiles), con commento esplicito "Prima il controllo era solo client-side". Le RPC admin sono `is_admin`-guarded (`src/lib/instructors.ts:602`). La notifica email admin usa variabile d'ambiente con fallback (`api/instructor-request/route.ts:5`). |
| Sicurezza                             | **4** | 3   | CSP e security headers (`next.config.ts`, verificato B7); **validazione input con zod in 6 route API su 8 ispezionabili** (B8), inclusa `ben/lead` che prima non validava; service-role key solo server-side (`src/lib/supabase/admin.ts:11-21`); script `test:rls` per verificare le policy (`package.json:13`); account deletion con endpoint dedicato (`api/account/delete`).                                                                         |
| Gestione degli errori                 | **4** | 3   | **Sentry integrato** (`@sentry/nextjs` in package.json, `sentry-shared.ts`, `report-error.ts`); modulo `describe-error.ts` per messaggi utente; `global-error.tsx` + error boundary per area; test dedicati a gestione errori (`auth-errors.test.ts`, `describe-error.test.ts`, `sentry-shared.test.ts`).                                                                                                                                                |
| Performance e caching                 | **4** | 4   | Solver esatto riscritto con tecniche serie: finestra alpha-beta unitaria + ricerca binaria, potatura carte equivalenti, tabella di trasposizione con chiave intera (`src/lib/dds-exact.ts:12-30`); **bridge-dds WASM (Haglund)** per tabelle double-dummy complete (`src/lib/dds-table.ts`, dipendenza `bridge-dds` in package.json); worker, PWA serwist, cache header come da edizione precedente.                                                     |
| Accessibilità                         | **4** | 3   | **Test automatici axe-core in CI-ready** (`e2e/a11y.spec.ts`); hook `use-focus-trap.ts`; attributi aria in **66 file** (erano 39); etichette carte testuali testate (`card-labels.test.ts`); pagina `/accessibilita`.                                                                                                                                                                                                                                    |
| Internazionalizzazione                | **1** | 1   | Invariato: solo italiano, nessuna libreria i18n, testi hardcoded.                                                                                                                                                                                                                                                                                                                                                                                        |
| Copertura dei test                    | **3** | 1   | **Da zero a 36 file / 6.287 righe** su tutta la logica `lib` (motore, scoring, solver DDS, spaced repetition, XP, generatore mani, PBN, statistiche) + 7 spec e2e (smoke auth/anon, CSP, consenso, regressione pagine, a11y). Limiti: test concentrati su `lib`, nessun test di componenti React, copertura percentuale non misurata (non determinabile senza eseguire vitest --coverage).                                                               |
| CI/CD                                 | **4** | 2   | `.github/workflows/ci.yml`: checkout, Node 22, `npm ci`, typecheck `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` su push main e PR. Deploy Vercel automatico documentato nel README con divieto di `vercel --prod`. Manca un gate e2e in CI (Playwright configurato ma fuori workflow).                                                                                                                                                        |
| Documentazione                        | **4** | 2   | **README riscritto** (stack, deploy, vincoli operativi); `docs/architettura.md` (148 righe, mappa del repository per chi entra); `docs/runbook.md` (103 righe); note operative datate (`email-bbo-duplicati-2026-08.md`, `gara-figb-implicazioni-bridgelab.md`); header dei moduli algoritmici esemplari (`dds-exact.ts:1-30` spiega il PERCHÉ, non solo il cosa).                                                                                       |
| Manutenibilità da team terzo          | **4** | 3   | Combinazione di test + CI + documentazione d'ingresso + refactoring dei monoliti: un team terzo oggi ha una rete di sicurezza che il 8 agosto non esisteva. Restano: bus factor 1 (260/261 commit di un autore), DB non versionato, alcune pagine >1.000 righe.                                                                                                                                                                                          |

<br />

<br />

<br />

<br />

### 3.1 Componenti a reale complessità algoritmica (aggiornato)

| Componente                                        | File (righe)                                                     | Cosa fa                                                                                                                                                                                                                       | Costo riscrittura (stimato)          |
| ------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Motore di gioco                                   | `bridge-engine.ts` (778)                                         | Regole complete della presa: obbligo di seme, atout, morto, vincitore, stato partita                                                                                                                                          | 40–80 h                              |
| DDS euristico                                     | `dds-solver.ts` (773)                                            | Minimax/alpha-beta, esatto ≤6 carte, stima oltre, timeout, worker                                                                                                                                                             | compreso sotto                       |
| **DDS esatto** (nuovo, ago)                       | `dds-exact.ts` (234)                                             | Risolve l'intera smazzata in millisecondi: domanda booleana "almeno k prese?" con finestra alfa-beta unitaria + ricerca binaria; potatura carte equivalenti; tabella di trasposizione; bound superiore (`dds-exact.ts:12-30`) | famiglia DDS: **200–320 h**          |
| **Tabelle DD WASM** (nuovo, ago)                  | `dds-table.ts` (195)                                             | Integrazione della libreria `bridge-dds` (Haglund) per tabelle double-dummy complete                                                                                                                                          | incluso sopra (integrazione 16–24 h) |
| **Generatore di smazzate vincolate** (nuovo, ago) | `deal-generator.ts` (322)                                        | Rejection sampling uniforme con vincoli di forza/sagoma; **deterministico a seme** per riproducibilità didattica (`deal-generator.ts:14-30`)                                                                                  | 40–60 h                              |
| AI avversaria                                     | `ai-difficulty.ts` (218) + BEN                                   | Tre livelli: errori plausibili 20%, euristica, rete neurale BEN/DDS                                                                                                                                                           | 60–100 h                             |
| Scoring bridge                                    | `bridge-scoring.ts` (365)                                        | Contratti, vulnerabilità, contri, slam, IMP                                                                                                                                                                                   | 24–40 h                              |
| Ripetizione dilazionata                           | `spaced-review.ts` (79) + hook (187)                             | Intervalli 1/3/7 giorni sul conteggio errori; spostata in `lib` e coperta da test                                                                                                                                             | 8–16 h                               |
| Gamification                                      | `xp-levels.ts` (84) + achievement                                | 36 livelli, 13+15 badge, obiettivi/sfide settimanali, streak                                                                                                                                                                  | 60–100 h                             |
| Progressione didattica                            | `lesson-meta.ts`, `lesson-module.ts` (487), `progression.ts`     | 4 corsi a mondi, prerequisiti, logica moduli                                                                                                                                                                                  | 40–80 h                              |
| **Classificatore errori di gioco** (nuovo)        | `play-error-classifier.ts` (219)                                 | Classifica gli errori del giocatore per tipologia didattica                                                                                                                                                                   | 24–40 h                              |
| **Matching giocatori** (nuovo, ago)               | `partner-matching.ts` (167) + SQL `partner-matching-2026-08.sql` | Abbina giocatori compatibili ("trova compagno")                                                                                                                                                                               | 16–24 h                              |
| Formati interscambio                              | `pbn.ts` (349), `hand-encoder.ts` (128), `pbn-export`            | Parsing/esportazione PBN, condivisione mani                                                                                                                                                                                   | 24–40 h                              |

**Totale riscrittura componenti algoritmiche: \~540–860 h** (era 380–650 h l'8 agosto: la famiglia DDS si è arricchita del solver esatto e dell'integrazione WASM).

### 3.2 Implicazioni sulla stima di replica

Il codice è cresciuto del 19% in righe effettive (da ~77.600 a ~90.000) e in qualità strutturale. La stima di effort di replica dell'8 agosto (1.000–2.000 h) va rivista al rialzo di un 10–15% prudenziale: **1.100–2.300 h**, che per 2 sviluppatori senior significa **5,5–10 mesi di calendario**. La presenza di test e documentazione riduce il rischio della replica (specifica eseguibile), ma non il volume di lavoro.

***

## 4. Profondità di prodotto (misurato, sostanzialmente stabile)

| Contenuto                                 | Quantità                                                                                                                                                                                  | Delta             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Corsi / lezioni / moduli                  | 4 / 49 / **169**                                                                                                                                                                          | invariato         |
| Blocchi interattivi (6 tipologie)         | **263**                                                                                                                                                                                   | invariato         |
| Mani precaricate e commentate             | **\~350** (98 Fiori + 80 Cuori Gioco + 96 Quadri + 73 WBF auto-generate)                                                                                                                  | invariato         |
| Glossario                                 | 49 voci                                                                                                                                                                                   | invariato         |
| Scenari pratica licita / esercizi impasse | 20 / 32                                                                                                                                                                                   | invariato         |
| Modalità di gioco                         | **22**                                                                                                                                                                                    | +1 (`quiz-prese`) |
| **Nuove funzionalità (agosto)**           | "Trova compagno" con matching, "Trova circolo", generatore mani per istruttori (`istruttori/genera-mani`), cancellazione account GDPR, pagina termini, offline page, Meta Conversions API | nuove             |

***

## 5. Cosa è cambiato rispetto all'analisi dell'8 agosto 2026

| Area                 | 8 agosto                          | 13 agosto                                             | Impatto                           |
| -------------------- | --------------------------------- | ----------------------------------------------------- | --------------------------------- |
| Test                 | 0 file                            | 36 unit (6.287 righe) + 9 e2e (1.043 righe, axe-core) | regressione verificabile da terzi |
| CI/CD                | nessuna                           | GitHub Actions: typecheck + lint + test               | qualità garantita a ogni push     |
| Autorizzazione admin | email hardcoded, solo client-side | gate server-side su ruolo DB (`admin/layout.tsx:30`)  | difetto di sicurezza chiuso       |
| Validazione input    | assente                           | zod in 6 route API                                    | superficie API robusta            |
| Monitoraggio         | nessuno                           | Sentry                                                | errori in produzione visibili     |
| Documentazione       | README boilerplate                | README + architettura + runbook                       | onboarding terzi possibile        |
| Monoliti             | admin/page 1.825 righe            | 214 righe, pattern `_components/` ovunque             | manutenibilità                    |
| Solver               | euristico oltre 6 carte           | esatto intera smazzata + WASM Haglund                 | accuratezza didattica             |
| GDPR                 | —                                 | cancellazione account, consenso, CAPI                 | conformità rafforzata             |
| Giudizio medio       | 2,6 / 5                           | **3,5 / 5**                                           | <br />                            |

**Voci invariate in negativo:** migrazioni DB non versionate (2/5), solo italiano (1/5), bus factor 1.

***

## 6. Limiti della presente analisi

1. Analisi statica: non sono stati eseguiti build, test suite né la piattaforma; il passaggio dei test in CI è verificato solo come configurazione, non come esito.
2. La copertura percentuale dei test non è misurata (richiederebbe `vitest --coverage`).
3. Lo schema base del database resta fuori dal repository: 48 policy RLS sono contate dagli script, ma non è verificabile che il DB in produzione le applichi tutte.
4. Lo scenario ±30% sulla stima delle sessioni non è stato rieseguito in questa sessione (approvazioni dei comandi scadute); il valore base 106,7 h è misurato e dichiarato limite inferiore.
5. I costi di riscrittura in §3.1 sono stime dichiarate, non misure.
6. Un solo autore per il 99,6% dei commit: continuità e knowledge transfer restano un rischio non scontato in nessuna cifra.

***

## Appendice B — Comandi eseguiti il 13 agosto 2026 e output

**B1** `git rev-list --count HEAD` → `261` ; `git shortlog -sne HEAD` → `260 albertogerli …`, `1 Vercel [bot]` ; primo commit `2026-02-08 00:15:02 +0100 6471b48 Initial commit from Create Next App` ; ultimo `2026-08-13 13:23:42 +0200 dc4e132 Landing: l'intero hero era invisibile…` ; `git log --format='%ad' --date=short | sort -u | wc -l` → `55` ; `git rev-list --count --merges HEAD` → `2` ; `git branch` → `main, perf/tier0-quickwins, redesign/ui-v2`

**B2** `git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c` → `53 feb, 95 mar, 7 apr, 21 mag, 20 giu, 14 lug, 51 ago` ; `--date=format:'%H'` → `00:25 01:14 02:15 03:2 08:12 09:12 10:14 11:18 12:19 13:8 14:20 15:11 16:15 17:11 18:9 19:4 20:7 21:4 22:23 23:18` ; `git log --numstat | grep -v package-lock | awk …` → `aggiunte: 183400 rimosse: 33255`

**B3** mediana commit: `git log --numstat --format='%H' | awk … | sort -n | awk …` → `mediana: 112 | media: 664 | n: 345 | max: 35026` ; file più modificati: `57 page.tsx, 46 profilo, 38 admin, 31 moduleId, 31 smazzata, 31 gioca, 29 desktop-sidebar, 29 layout, 25 login, 24 sfida, 24 classifica, 22 bridge-table, 21 impostazioni, 21 mano-del-giorno, 20 lezioni`

**B4** `git log --format=%at --reverse | awk` (gap 5400 s, ramp 1800 s) → `base: sessioni=93 ore=106.7`

**B5** `find scripts/sql -name '*.sql' | wc -l` → `33` ; `cat scripts/sql/*.sql | wc -l` → `3376` ; policy: grep `create policy` → `48` in 13 file ; `enable row level security` → `19` ; `create table` → `16` occorrenze

**B6** `wc -l e2e/*.ts | tail -1` → `1043 total` ; file: `a11y.spec, csp.spec, consenso.spec, regressione-pagine.spec, smoke-auth.spec, smoke-anon.spec, helpers, global-setup/teardown`

**B7** `grep -c 'Content-Security-Policy' next.config.ts` → `1`

**B8** grep `zod|z.object` in `src/app/api` → 6 file: `meta/conversion, instructor-request, friends/notify, ben/autoplay, ben/lead, ben/play`

**B9** Righe codice: `wc -l $(find src -name '*.ts' -o -name '*.tsx' -o -name '*.css')` → `104155` ; per directory (conteggio righe via grep `^`): app 45.186/193 file, components 14.139/97, data 19.399/21, lib 18.872/102, hooks 5.519/28, store 1.042/10 ; commenti: grep `^\s*(//|/\*|\*|\*/)` → `6480` ; vuote: grep `^\s*$` → `7670` ; test: grep su `*.test.ts` → `6287 righe / 36 file`

**B10** Struttura: `find src/app -name 'page.tsx' | wc -l` → `69` ; `route.ts` → `10` ; componenti → `94` ; `.github/workflows/ci.yml` → presente (29 righe: checkout, setup-node 22, npm ci, tsc --noEmit, eslint --max-warnings 0, vitest run) ; `ls supabase` → assente ; test framework: `package.json:15` `"test": "vitest run"`, `:17` `"test:e2e": "playwright test"`, `:13` `"test:rls"`.

**B11** Contenuti: `smazzateIds:` → 52 occorrenze/5 file ; `xpReward:` → 121 moduli (fiori 61, cuori-gioco 32, cuori-licita 28) + `xp:` → 48 (quadri) = **169** ; blocchi interattivi → 215 + 48 `quizType` = **263** ; `north:` → 274 mani curate + 73 WBF = **\~350** ; glossario: 49 `term:`.

**B12** Letture file (evidenze citate): `src/app/admin/layout.tsx` (35 righe, gate server-side), `src/app/admin/_components/admin-gate.tsx` (54), `package.json` (64), `.github/workflows/ci.yml` (29), `src/lib/dds-exact.ts` (1-30), `src/lib/deal-generator.ts` (1-30), `README.md` (1-12), `docs/architettura.md` (1-20, 148 righe), `docs/runbook.md` (103 righe), `tsconfig.json` (strict: true).

*Analisi completata il 13 agosto 2026. Tutti i numeri sono riproducibili rieseguendo i comandi in appendice sulla revisione `dc4e132`.*
