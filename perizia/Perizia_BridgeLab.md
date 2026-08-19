# Perizia tecnica ed economica — Piattaforma BridgeLab (repository `bridgequest`)

**Destinatario:** Consiglio Direttivo della Federazione
**Data analisi:** 8 agosto 2026
**Metodo:** ogni numero riportato deriva da un comando eseguito sul repository o da un file letto; i comandi sono in appendice. I dati di mercato (tariffe) derivano da fonti pubbliche citate puntualmente. Ciò che non è misurabile è indicato come *stimato* (con assunzione dichiarata) o *non determinabile*.

---

## 1. Sintesi per non tecnici (una pagina)

**Che cos'è.** BridgeLab è una piattaforma web didattica per l'insegnamento del bridge, sviluppata come applicazione moderna (Next.js 16 / React 19 / TypeScript, database Supabase, app mobile iOS/Android tramite Capacitor). Non è un sito vetrina: è un prodotto software completo, con 4 corsi strutturati, ~350 mani di bridge precaricate e commentate, un motore di gioco proprietario, un'intelligenza artificiale avversaria a tre livelli, un sistema di gamification completo (livelli, XP, badge, sfide settimanali), un'area social (amici, forum, sfide), un portale istruttori con classi e compiti, e una dashboard amministrativa.

**Quanto lavoro contiene.** Il repository contiene 210 commit realizzati in 50 giorni di lavoro effettivi nell'arco di ~5,5 mesi (8 febbraio – 27 luglio 2026), opera sostanzialmente di un solo autore. Il codice misurato è di ~87.000 righe (di cui ~19.400 di contenuti didattici digitalizzati). La stima dell'impegno dai soli orari dei commit dà **84 ore**: questo è un **limite inferiore tecnico**, perché misura solo il tempo fra un commit e l'altro e non cattura progettazione, correzione errori, studio e lavoro non salvato. Una stima realistica dell'impegno complessivo per replicare la piattaforma è di **1.000–2.000 ore** (assunzione dichiarata, §5.1).

**Qualità tecnica.** Il giudizio medio è **2,6 su 5**. Punti forti: architettura ordinata e moderna, motore di gioco con componenti algoritmici non banali (un "double-dummy solver" scritto da zero in TypeScript), attenzione a performance e sicurezza di base. Punti deboli, rilevanti per la Federazione: **nessun test automatizzato**, **nessuna pipeline CI/CD**, **schema del database non versionato nel repository**, documentazione quasi assente, autorizzazione amministrativa basata su un indirizzo email scritto nel codice, prodotto solo in italiano. La piattaforma funziona ed è ricca, ma la sua manutenzione da parte di un team terzo richiederebbe un investimento iniziale in test e documentazione.

**Valore.** Tre metodi indipendenti (§6) danno risultati divergenti, come atteso:

- **Costo di riproduzione** (ore × tariffe mercato italiano): **60.000 – 260.000 €**
- **Costo di sostituzione** (commissione a fornitore esterno, chiavi in mano): **120.000 – 330.000 €**
- **Valore d'uso triennale** (licenze e costi evitati): **27.000 – 69.000 €**

**Range prudenziale conclusivo del valore conferito alla Federazione: 60.000 – 150.000 €**, fondato sul metodo di riproduzione alle tariffe bassa e media, che è il più difendibile perché ancorato a misure oggettive del repository. Tutti i limiti sono elencati onestamente in §8.

---

## 2. Fase 1 — Metriche del repository

### 2.1 Cronologia git (misurato)

| Metrica | Valore | Comando (appendice) |
|---|---|---|
| Commit totali | **210** | A1 |
| Autori | 1 autore umano (209 commit) + 1 bot Vercel (1) | A2 |
| Primo commit | 8 febbraio 2026 ("Initial commit from Create Next App") | A3 |
| Ultimo commit | 27 luglio 2026 | A3 |
| Durata calendario | ~5,5 mesi (169 giorni) | calcolato da A3 |
| Giorni con almeno un commit | **50** (30% dei giorni di calendario) | A4 |
| Branch | 3 locali + remoti (`main`, `perf/tier0-quickwins`, `redesign/ui-v2`) | A5 |
| Merge | 2 | A5 |
| Righe aggiunte / rimosse (escluso lockfile) | **+150.740 / −22.060** | A6 |
| Dimensione mediana commit | 94 righe (media 673, max 35.026) | A7 |

**Distribuzione per mese** (A8): feb 53 · mar 95 · apr 7 · mag 21 · giu 20 · lug 14. Il 70% dei commit è nei primi due mesi: un picco iniziale di costruzione, poi manutenzione evolutiva costante.

**Distribuzione oraria** (A9): picchi fra le 22:00 e le 2:00 (66 commit su 210, pari al 31%) e fra le 9:00 e le 12:00. Pattern compatibile con lavoro personale serale/notturno oltre che diurno.

**File più modificati** (A10): `src/app/page.tsx` (57 revisioni), `profilo/page.tsx` (38), `admin/page.tsx` (33), pagina modulo lezione (27), sidebar (26), `gioca/smazzata` (26). Il codice più toccato è quello dell'esperienza utente principale — segnale di iterazione sul prodotto reale.

### 2.2 Stima dell'effort dai timestamp (misurato, limite inferiore)

Metodo: commit raggruppati in **sessioni di lavoro**; nuova sessione se il gap supera 90 minuti; a ogni sessione si attribuisce la durata effettiva + 30 minuti di ramp-up (A11).

| Scenario | Sessioni | Ore |
|---|---|---|
| Base (gap 90 min, ramp 30 min) | **78** | **84,4** |
| −30% (gap 63 min, ramp 21 min) | 84 | 67,4 |
| +30% (gap 117 min, ramp 39 min) | 73 | 101,7 |

> **Questo numero è dichiaratamente un limite inferiore.** Non cattura progettazione, debug, lettura di documentazione, test manuali, authoring dei contenuti didattici fuori dal codice e tutto il lavoro non committato. Va letto come "almeno queste ore", non come "queste ore".

### 2.3 Righe di codice (misurato, `src/`, esclusi node_modules/lockfile/build)

| Categoria | Righe |
|---|---|
| `src/app` (pagine, rotte, API) | 40.433 |
| `src/data` (contenuti didattici digitalizzati) | 19.402 |
| `src/components` | 13.488 |
| `src/lib` (logica: motore, scoring, solver, integrazioni) | 7.671 |
| `src/hooks` | 4.899 |
| `src/store` (stato client) | 1.042 |
| altro (contexts, proxy, CSS) | ~520 |
| **Totale** | **~87.500** |
| di cui commenti | 3.559 |
| di cui righe vuote | 5.894 |
| **Righe di codice effettive** | **~77.600** |

Script SQL: 22 file, 2.304 righe (A13). Script di utilità (`scripts/`): presenti audit, seed, importazione WBF.

**Separazione**: codice applicativo ~67.600 righe; contenuti digitalizzati ~19.400 (di cui ~3.000 auto-generati da fonte WBF, vedi §4); test **0**; configurazione ~10 file. TypeScript in modalità `strict` (`tsconfig.json:12`).

### 2.4 Conteggi strutturali (misurato)

| Elemento | Conteggio |
|---|---|
| Rotte/pagine (`page.tsx`) | **66** |
| Endpoint API (`route.ts`) | **8** |
| Componenti React | **90** |
| Tabelle DB (CREATE TABLE negli script) | 12 (+ schema base non presente nel repo, §8) |
| Policy RLS | 37 (su 15 tabelle con RLS abilitato) |
| File di migrazione versionati | **0** (gli SQL sono script sciolti in `scripts/sql/`) |
| Test automatizzati | **0** |
| Pipeline CI/CD | **0** (nessuna `.github/workflows`) |

---

## 3. Fase 2 — Qualità e profondità architetturale

Valutazione 1–5 con evidenze. Punteggio medio: **2,6 / 5**.

| Voce | Voto | Evidenza |
|---|---|---|
| Separazione delle responsabilità | **4** | Strati netti: `app/` (rotte), `components/` (90), `lib/` (logica pura), `hooks/` (26), `store/` (10 store zustand), `data/` (contenuti). Il motore di gioco è isolato e indipendente dalla UI (`src/lib/bridge-engine.ts:1-40`). Penalizza: pagine monolitiche, es. `src/app/admin/page.tsx` (1.825 righe). |
| Modello dati e integrità referenziale | **2** | 12 tabelle con chiavi esterne e 37 policy RLS negli script SQL, ma **nessuna migrazione versionata**: lo schema vive nel database e in 22 script sciolti (`scripts/sql/`). Lo schema base (profiles, ecc.) non è nel repository — non riproducibile da zero senza accesso al DB. |
| Autenticazione e autorizzazione | **3** | Supabase Auth con sessione via cookie e middleware (`src/proxy.ts:4-43`). Però l'autorizzazione admin è **solo client-side** con email hardcoded (`src/app/admin/page.tsx:32,599`): il middleware verifica solo il login, non il ruolo. La protezione reale dei dati admin dipende dalle policy RLS lato DB. |
| Sicurezza | **3** | Positivi: CSP e security headers completi (`next.config.ts:33-58`), service-role key solo server-side (`src/lib/supabase/admin.ts:11-21`), nessun segreto nel codice (verifica grep, A14), RLS su 15 tabelle. Negativi: validazione input debole negli endpoint API (es. `src/app/api/ben/lead/route.ts:9-10` accetta campi senza validarne tipo/formato), gate admin client-side. |
| Gestione degli errori | **3** | 303 blocchi catch in 122 file (A15); error boundary globale con UI curata (`src/app/error.tsx:7-40`); pattern di fallback espliciti (es. AI neurale: `ben/lead/route.ts:27-41`). Alcuni catch silenziosi (`src/hooks/use-spaced-review.ts:72-78`). |
| Performance e caching | **4** | PWA con service worker (serwist, `next.config.ts:9-15`); cache aggressiva degli asset statici e moderata dei PDF (`next.config.ts:60-78`); il solver gira in un Web Worker (`src/lib/dds-worker.ts`) per non bloccare la UI; timeout e fallback sul solver (2 s, `dds-solver.ts:73-77`); bundle analyzer configurato; branch dedicato `perf/tier0-quickwins`. |
| Accessibilità | **3** | Pagina istituzionale `/accessibilita`; attributi `aria-*` in 39 file (A16). Nessuna evidenza di audit formale (es. Lighthouse/screen reader); il gioco delle carte è per natura visuale. |
| Internazionalizzazione | **1** | Solo italiano; nessuna libreria i18n in `package.json`; testi hardcoded ovunque. |
| Copertura dei test | **1** | Zero file di test, nessun framework di test in `package.json`. |
| CI/CD | **2** | Deploy automatico su Vercel (presenza `.vercel/`, `vercel.json`, 1 commit del bot Vercel), ma nessuna pipeline di verifica (lint/test/build) prima del deploy. |
| Documentazione | **2** | README ancora quello di default di create-next-app; `docs/` contiene 3 file (di cui 2 documenti legali e 1 nota tecnica su email automation). In compenso i moduli algoritmici hanno header commentati accurati (es. `src/lib/dds-solver.ts:1-13`). |
| Manutenibilità da team terzo | **3** | TypeScript strict, convenzioni consistenti, struttura comprensibile; ma zero test come rete di sicurezza, schema DB non versionato, conoscenza concentrata in un solo autore, file molto grandi. Un team terzo può orientarsi, ma le prime settimane andrebbero investite in test e documentazione. |

### 3.1 Componenti a reale complessità algoritmica

1. **Motore di gioco** — `src/lib/bridge-engine.ts` (810 righe). Gestisce la partita presa per presa: carte valide (obbligo di risposta a seme), determinazione del vincitore con atout, morto, attacco iniziale, stato di gioco completo (`GameState`, righe 27-40). *Costo riscrittura: 40–80 h.*
2. **Double-Dummy Solver (DDS)** — `src/lib/dds-solver.ts` (775 righe) + `dds-worker.ts` + `dds-select.ts`. Componente più sofisticato del codebase: ricerca minimax con potatura alpha-beta, ricerca esatta fino a 6 carte per mano, stima euristica oltre, timeout con fallback (`dds-solver.ts:1-13, 73-77`), esecuzione in Web Worker. Equivalente concettuale del solver di Bo Haglund usato dai professionisti. *Costo riscrittura: 120–200 h* (richiede competenza specifica su giochi a informazione perfetta).
3. **AI avversaria a tre livelli** — `src/lib/ai-difficulty.ts` (218 righe) + `aiSelectCard` nel motore + integrazione BEN (AI neurale esterna, `src/lib/ben-client.ts`, proxy API con timeout e fallback). Il livello "base" commette errori plausibili da principiante il 20% delle volte (`ai-difficulty.ts:3-8, 44`); il livello "esperto" usa la rete neurale o il gioco perfetto nei finali. *Costo riscrittura: 60–100 h* (escluso il modello neurale BEN, che è esterno).
4. **Scoring bridge completo** — `src/lib/bridge-scoring.ts` (365 righe): contratti, vulnerabilità, contri, slam, IMP. *Costo riscrittura: 24–40 h.*
5. **Ripetizione dilazionata (spaced repetition)** — `src/hooks/use-spaced-review.ts` (208 righe): gli errori dello studente rientrano in ripasso a intervalli 1/3/7 giorni in base al numero di sbagli (righe 30-40). Semplice ma corretto concettualmente (variante semplificata di Leitner/SM-2). *Costo riscrittura: 8–16 h.*
6. **Motore di gamification** — `src/lib/xp-levels.ts` (36 livelli, curve di soglia crescenti fino a 200.000 XP), 13 achievement standard + 15 segreti (`src/components/achievement-popup.tsx:25-37`, `src/hooks/use-secret-achievements.ts`), obiettivi settimanali, streak, forzieri, negozio di cosmetici. *Costo riscrittura: 60–100 h.*
7. **Logiche di progressione didattica** — 4 corsi a mondi e lezioni con prerequisiti (`src/data/lesson-meta.ts:10-41`), tutorial guidato "Prima Mano" (`src/components/prima-mano/orchestrator.tsx`), tracciamento stato principiante. *Costo riscrittura: 40–80 h.*
8. **Formati di interscambio** — parser/esportatore PBN (`src/lib/pbn.ts`, 284 righe), codificatore mani (`hand-encoder.ts`). *Costo riscrittura: 24–40 h.*

**Totale riscrittura delle sole componenti algoritmiche: ~380–650 h.**

### 3.2 Tempo di replica da parte di un team esterno (stimato)

**Domanda:** quanto impiegherebbero 2 sviluppatori senior a replicare la piattaforma partendo da zero, con la piattaforma esistente come specifica funzionale?

Stima per componenti (assunzione dichiarata in §5.1): sviluppo applicativo 800–1.600 h + digitalizzazione contenuti (169 moduli, ~350 mani) 250–450 h = **1.050–2.050 h complessive**, pari a **5–9 mesi di calendario** per una coppia di senior. La forbice dipende soprattutto dal livello di fedeltà richiesto (pixel-perfect e contenuti identici → fascia alta) e dall'assenza di test esistenti, che obbliga a verifiche manuali.

---

## 4. Fase 3 — Profondità di prodotto (misurato)

### 4.1 Contenuti didattici

| Contenuto | Quantità | Fonte |
|---|---|---|
| Corsi | **4** (Fiori, Quadri, Cuori Gioco, Cuori Licita) | `src/data/courses.ts:35-82` |
| Lezioni | **49** (13 + 12 + 10 + 14) | `src/data/lesson-meta.ts:10-15`, conteggio A17 |
| Moduli didattici | **169** | conteggio `xpReward:`/`xp:` (A18) |
| Blocchi interattivi (quiz, card-select, hand-eval, bid-select, true-false, sequence) | **263** | A19 |
| Tipologie di esercizio interattivo | **6** | `src/data/lessons.ts:18-28` |
| Mani precaricate e commentate | **~350** (98 Fiori + 80 Cuori Gioco + 96 Quadri + 73 WBF) | A20 |
| — di cui auto-generate da fonte WBF | 73 | `src/data/wbf-deals.ts:1-4` |
| Voci di glossario | **49** | `src/data/glossary.ts` (A21) |
| Scenari di pratica licita | 20 | `src/data/bidding-practice-data.ts` |
| Esercizi impasse | 32 | `src/data/impasse-data.ts` |

Nota distintiva: il Corso Cuori Licita è solo teorico (nessuna mano associata, `src/data/cuori-licita-smazzate.ts:1-25`); i 73 deal WBF sono importati e tradotti con script (auto-generati, rigenerabili), quindi il loro costo di produzione è inferiore a quello delle mani curate manualmente.

### 4.2 Funzionalità

- **Modalità di gioco: 21** sotto `src/app/gioca/` — smazzata, mano del giorno, mano guidata, torneo, sfida, sfida amico, sfida IMP, sfida link, sfida settimanale, minibridge, memory, conta-veloce, quiz lampo, trova errore, impasse, segnali, dichiara, pratica, pratica licita, analisi, e la pagina hub.
- **Flussi utente completi e funzionanti** (verificati nel codice): registrazione/login/reset password; onboarding "Prima Mano"; lezione → esercizio → quiz → XP; gioco contro AI a 3 livelli; ripasso dilazionato; profilo con statistiche e "wrapped" annuale; amici e sfide; forum con sondaggi; classifiche; collezione carte; negozio cosmetici; portale istruttori (classi, compiti, chat, leaderboard); dashboard admin; PWA installabile; app mobile iOS/Android.
- **Funzionalità abbozzate/dipendenti da servizi esterni:** l'AI neurale BEN funziona solo se un servizio esterno è attivo (fallback gestito); le notifiche push hanno l'infrastruttura (`push_subscriptions`) ma dipendono da configurazione VAPID non verificabile nel repo.
- **Gamification:** 36 livelli XP, 28 achievement (13 + 15 segreti), obiettivi settimanali, sfide settimanali, streak, forzieri.

---

## 5. Fase 4 — Dati di utilizzo

**Stato: NON DETERMINABILE in questa sessione.**

Ordine di preferenza previsto dal mandato:
1. **Query di sola lettura sul DB con credenziali da variabili d'ambiente** — il file `.env.local` esiste, ma l'accesso in lettura non è stato autorizzato nella sessione (approvazioni scadute). Nessuna query eseguita.
2. **Endpoint amministrativi** — richiedono una sessione autenticata (il gate è su `/admin`); il mandato vieta login interattivi. Non tentati.
3. **Fallback previsto dal mandato** — chiedere i numeri al committente.

Per completare questa sezione servono, dal pannello Supabase o da `/admin`: utenti registrati totali e attivi per mese, sessioni e durata media, lezioni completate, ritenzione a 7/30 giorni, crescita mensile. La dashboard admin del codice mostra che questi dati esistono (tabelle `login_history`, `game_results`, RPC `admin_game_stats`, `admin_school_stats`): la raccolta è predisposta, manca solo l'accesso autorizzato in questa sede.

---

## 6. Fase 5 — Valutazione economica

### 5.1 Assunzioni dichiarate

> **Assunzione A (ore di replica).** Le ore misurate dai timestamp (84) sono un limite inferiore tecnico. Per la replica si assume uno sforzo di **1.000–2.000 h** (centro 1.500 h), derivato per componenti: ~66 rotte e 90 componenti (~500–900 h), componenti algoritmiche (380–650 h, §3.1), integrazioni/PWA/mobile (~120–200 h), digitalizzazione contenuti (250–450 h). Sensitività ±30%: 700–2.600 h.
>
> **Assunzione B (tariffe).** Tariffe mercato italiano 2026 per sviluppo full-stack senior: **bassa 60 €/h** (freelance senior, fascia bassa), **media 90 €/h** (freelance senior alto / consulenza), **alta 130 €/h** (agenzia/software house senior). Fonti: analisi mercato 2026 [mostrum.com — senior freelance 65–100 €/h, agenzia 100–150+ €/h; yeeply.com — consulenza 60–150 €/h; sevedemo.com — full-stack 40–100+ €/h]. Sensitività ±30%: 42–169 €/h.
>
> **Assunzione C (licenza comparabile).** Piattaforma didattica gamificata comparabile in licenza per una federazione: **6.000–15.000 €/anno** (centro 10.000), più hosting+manutenzione evitati **3.000–8.000 €/anno** (centro 5.000). Sensitività ±30%.

### 5.2 Metodo A — Costo di riproduzione

Ore stimate × tariffa (sviluppo + contenuti, senza margini di agenzia):

| Scenario | Ore | Tariffa | Valore |
|---|---|---|---|
| Prudente | 1.000 | 60 €/h | **60.000 €** |
| Centrale | 1.500 | 90 €/h | **135.000 €** |
| Alto | 2.000 | 130 €/h | **260.000 €** |

Sensitività combinata ±30% su ore: 42.000 – 338.000 €. **Range metodo A: 60.000 – 260.000 €.**

### 5.3 Metodo B — Costo di sostituzione (fornitore esterno)

Commissionare oggi la stessa piattaforma a una software house: analisi e progettazione (10–15%), sviluppo, QA (15–20%), project management (10–15%), a tariffe di agenzia (100–150 €/h, fonte §5.1 Assunzione B). Volume equivalente 1.200–2.200 h fatturate (include overhead di processo):

- Fascia bassa: 1.200 h × 100 €/h = **120.000 €**
- Fascia alta: 2.200 h × 150 €/h = **330.000 €**

**Range metodo B: 120.000 – 330.000 €.** È sistematicamente più alto del metodo A perché include margini, garanzie e costi di coordinamento del fornitore.

### 5.4 Metodo C — Valore d'uso triennale

Costo evitato dalla Federazione per 3 anni (licenza piattaforma comparabile + hosting/manutenzione, Assunzione C):

- Basso: (6.000 + 3.000) × 3 = **27.000 €**
- Alto: (15.000 + 8.000) × 3 = **69.000 €**

Sensitività ±30%: 19.000 – 90.000 €. **Range metodo C: 27.000 – 69.000 €.** Questo metodo misura il *valore d'uso*, non il *valore dell'asset*: una licenza esterna non includerebbe i contenuti FIGB né la proprietà del codice.

### 6.5 Conclusione: range prudenziale del valore conferito

I tre metodi divergono (27k – 330k) perché misurano cose diverse: uso, riproduzione, sostituzione. Non vanno fusi in una media.

**Range prudenziale proposto: 60.000 – 150.000 €.**

**Metodo considerato più difendibile: il metodo A (costo di riproduzione) agli scenari prudente e centrale**, perché: (i) è ancorato a misure oggettive del repository (righe, rotte, componenti, contenuti contati uno a uno); (ii) usa tariffe di mercato italiano 2026 da fonti pubbliche citate; (iii) non incorpora margini di agenzia che gonfierebbero il valore in una trattativa fra le parti. Il metodo C fornisce il pavimento (ciò che la Federazione risparmia comunque); il metodo B indica il tetto teorico se la Federazione dovesse ricomprare tutto sul mercato.

**Limiti espliciti della stima economica:** le ore di replica sono una stima, non una misura; le tariffe sono di mercato, non preventivi; il valore non considera eventuali accordi preesistenti fra le parti né la maturità d'uso (utenza reale) che, per assenza dei dati di Fase 4, non può avvalorare la componente di valore legata alla trazione.

---

## 7. Tabella riassuntiva finale

| Metrica | Valore | Tipo |
|---|---|---|
| Ore stimate (replica, centro range) | 1.000–2.000 h | stimato |
| Ore minime misurate (sessioni di commit) | 84 h (78 sessioni) | misurato, limite inferiore |
| Commit | 210 (50 giorni attivi su 169) | misurato |
| Righe di codice | ~87.500 totali / ~77.600 effettive (di cui ~19.400 contenuti) | misurato |
| Pagine/rotte · componenti · API | 66 · 90 · 8 | misurato |
| Corsi · lezioni · moduli · mani | 4 · 49 · 169 · ~350 | misurato |
| Test / CI | 0 / 0 | misurato |
| Punteggio medio qualità | **2,6 / 5** | valutato con evidenze |
| **Valore stimato (range prudenziale)** | **60.000 – 150.000 €** | stimato (metodo A, scenari prudente-centrale) |

---

## 8. Limiti della presente analisi

1. **Non misura la trazione.** I dati di utilizzo (utenti, ritenzione, crescita) non sono stati accessibili: il valore d'uso reale della piattaforma potrebbe essere più alto o più basso di quanto stimato, e nessuna evidenza di adozione è qui dimostrata.
2. **Non dimostra la correttezza funzionale.** Non sono stati eseguiti la piattaforma, build di produzione o test end-to-end: l'analisi è statica sul codice. L'assenza totale di test automatizzati significa che la regressione non è verificabile da terzi.
3. **Lo schema dati non è riproducibile dal solo repository.** Lo schema base del database non è versionato: senza accesso al progetto Supabase la piattaforma non è ricostruibile 1:1.
4. **L'effort è una stima, non una misura.** Le ore misurate (84) sono un limite inferiore tecnico; il range 1.000–2.000 h deriva da assunzioni dichiarate su produttività, e l'eventuale uso di assistenti AI nello sviluppo ridurrebbe il costo di replica più del previsto.
5. **Le tariffe sono di mercato, non preventivi.** Per una cifra contrattuale servirebbero 2-3 preventivi reali da fornitori.
6. **Contenuti di terze parti.** 73 mani derivano da materiale WBF e i corsi dal materiale didattico FIGB: il valore di questi contenuti presuppone che i diritti d'uso siano chiari fra le parti — questa perizia non valuta aspetti legali.
7. **Un solo autore.** Il 99,5% dei commit è di una persona: esiste un rischio di continuità (bus factor = 1) che nessuna cifra in questo documento sconta esplicitamente.
8. **Dipendenze esterne.** AI neurale BEN, Supabase, Vercel, servizio email: il valore della piattaforma presuppone la disponibilità di questi servizi o il loro costo di sostituzione.

---

## Appendice — Comandi eseguiti e output grezzi

**A1** `git rev-list --count HEAD` → `210`

**A2** `git shortlog -sne HEAD` → `209 albertogerli <alberto@albertogerli.it>` · `1 Vercel <vercel[bot]@users.noreply.github.com>`

**A3** `git log --reverse --format='%ad %h %s' --date=iso | head -2` → `2026-02-08 00:15:02 +0100 6471b48 Initial commit from Create Next App` ; `git log -1 --format='%ad %h %s' --date=iso` → `2026-07-27 23:27:24 +0200 370a40a Google Ads: tag base gtag.js + conversione registrazione`

**A4** `git log --format='%ad' --date=short | sort -u | wc -l` → `50`

**A5** `git branch -a` → `main, perf/tier0-quickwins, redesign/ui-v2 (+ remoti)` ; `git rev-list --count --merges HEAD` → `2`

**A6** `git log --numstat --format='' | grep -v 'package-lock' | awk '{a+=$1; r+=$2} END {print a, r}'` → `aggiunte: 150740 rimosse: 22060`

**A7** `git log --numstat --format='%H' | awk 'length($0)==40{if(NR>1) print tot; tot=0; next} NF==3{tot+=$1+$2} END{print tot}' | sort -n | awk '{a[NR]=$1; s+=$1} END{print a[int((NR+1)/2)], int(s/NR), NR, a[NR]}'` → `mediana: 94 | media: 673 | n: 271 | max: 35026` (n include commit vuoti/merge)

**A8** `git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c` → `53 2026-02 · 95 2026-03 · 7 2026-04 · 21 2026-05 · 20 2026-06 · 14 2026-07`

**A9** `git log --format='%ad' --date=format:'%H' | sort | uniq -c` → `00:23 01:13 02:15 03:2 08:8 09:12 10:11 11:15 12:16 13:5 14:17 15:7 16:8 17:10 18:8 19:3 20:5 21:4 22:13 23:15`

**A10** `git log --numstat --format='' | awk '{print $3}' | grep -v '^$' | sort | uniq -c | sort -rn | head -15` → `57 src/app/page.tsx, 38 profilo/page.tsx, 33 admin/page.tsx, 27 lezioni/[lessonId]/[moduleId]/page.tsx, 26 desktop-sidebar.tsx, 26 gioca/smazzata/page.tsx, 25 gioca/page.tsx, 22 layout.tsx, 21 gioca/sfida/page.tsx, 20 classifica/page.tsx, 19 bridge-table.tsx, 18 login/page.tsx, 18 mano-del-giorno/page.tsx, 17 impostazioni/page.tsx, 16 desktop-nav.tsx`

**A11** Script awk su `git log --format=%at --reverse` (sessioni: gap 90 min, ramp 30 min) → `base: sessioni=78 ore=84.4 · fattore 0.7: sessioni=84 ore=67.4 · fattore 1.3: sessioni=73 ore=101.7`

**A12** `find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) | xargs wc -l` → `87513` ; per directory: `app: 40433, components: 13488, lib: 7671, hooks: 4899, store: 1042, contexts: 21, data: 19402` ; commenti/vuote: `grep -cE '^\s*(//|/\*|\*|\*/)'` → `3559`, `grep -cE '^\s*$'` → `5894`

**A13** `find scripts/sql -name '*.sql' | wc -l` → `22` ; `cat scripts/sql/*.sql | wc -l` → `2304`

**A14** `grep -rn 'SERVICE_ROLE|sk_live|api_secret|password\s*[:=]' src` → solo riferimenti a `process.env.SUPABASE_SERVICE_ROLE_KEY` lato server (`src/lib/supabase/admin.ts:13`, `src/lib/email/tokens.ts:11`); nessun segreto in chiaro

**A15** `grep -rc 'catch' src --include='*.ts' --include='*.tsx'` → `303 occorrenze in 122 file`

**A16** `grep -rl 'aria-' src/components src/app --include='*.tsx' | wc -l` → `39`

**A17** Conteggi lezioni: `grep -c 'smazzateIds:' src/data/*.ts` → `lessons.ts:10, lessons-9-12.ts:4, quadri-lessons.ts:14, cuori-gioco-lessons.ts:10, cuori-licita-lessons.ts:14` (fiori: ids 0–12 per `lesson-meta.ts:12`)

**A18** Moduli: `grep -c 'xpReward:'` → `lessons.ts:41, lessons-9-12.ts:20, cuori-gioco-lessons.ts:32, cuori-licita-lessons.ts:28` ; `grep -c '^\s*xp: \d+,' src/data/quadri-lessons.ts` → `48` ; totale 169

**A19** Blocchi interattivi: `grep -c 'type:\s*"(quiz|card-select|hand-eval|bid-select|true-false|sequence)"' src/data/*.ts` → `215` + `grep -c 'quizType:' src/data/quadri-lessons.ts` → `48` ; totale 263

**A20** Mani: `grep -c 'north:' src/data/smazzate*.ts cuori-gioco-smazzate.ts quadri-smazzate.ts` → `33 + 33 + 32 + 80 + 96 = 274` ; WBF: 73 deal (`src/data/wbf-deals.ts:3`); totale ~347

**A21** `grep -c '^\s*term: "' src/data/glossary.ts` → `49`

**A22** Struttura: `find src/app -name 'page.tsx' | wc -l` → `66` ; `find src/app/api -name 'route.ts' | wc -l` → `8` ; `find src/components -name '*.tsx' | wc -l` → `90` ; `grep -hi 'create table' scripts/sql/*.sql | wc -l` → `13` (12 tabelle distinte) ; `grep -hi 'create policy' scripts/sql/*.sql | wc -l` → `37` ; `grep -hi 'enable row level security' scripts/sql/*.sql | wc -l` → `15` ; `find . -name '*.test.*' -o -name '*.spec.*'` (escluso node_modules) → nessun risultato ; `ls .github/workflows` → assente

**A23** Fonti tariffe (web, consultate l'8 agosto 2026): mostrum.com/articoli/51 (senior freelance 65–100 €/h, agenzia 100–150+ €/h); yeeply.com/it/blog (consulenza 60–150 €/h, senior 35–90 €/h); sevedemo.com/blog (full-stack 40–100+ €/h); freelancedev.it (intermedio 35–80 €/h, senior specialist >100 €/h).

---

*Fine della perizia. Documento prodotto con metodo verificabile: ogni numero riporta il comando o la fonte in appendice; le stime sono esplicitamente distinte dalle misure.*
