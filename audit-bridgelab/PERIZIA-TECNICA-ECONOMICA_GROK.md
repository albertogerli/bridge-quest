# Perizia tecnica ed economica — piattaforma BridgeLab

**Destinatario:** Consiglio Direttivo della Federazione Italiana Gioco Bridge (FIGB)  
**Oggetto:** stato osservato del software e dei sistemi accessibili in sola lettura  
**Redattore:** analista tecnico ed economico indipendente  
**Data del documento:** 13 agosto 2026  

Questo documento è una perizia autonoma, redatta integralmente sullo stato osservato. Non è un aggiornamento, un addendum o un confronto con analisi precedenti. Ogni cifra deriva da un comando, una query, un file letto o un calcolo riproducibile sui dati precedenti.

---

## 1. Titolo, destinatario, data, branch, HEAD e fonti

| Voce | Valore | Qualificazione |
|---|---|---|
| Data e ora della rilevazione repository | 13 agosto 2026, 13:07:01 CEST | MISURATO |
| Ramo | `main` | MISURATO |
| Hash HEAD | `6630a5e0a34ce37b3dc914dda3b1771e6ceb82ae` | MISURATO |
| Messaggio dell’ultimo commit | Leggibilita' per il pubblico reale: 45-65 anni | MISURATO |
| Data dell’ultimo commit | 13 agosto 2026, 11:49:23 Europe/Rome | MISURATO |
| Working tree | **non pulita** | MISURATO |
| Data e ora delle query sul database | 13 agosto 2026, 13:10:01 Europe/Rome | MISURATO |
| Connettore database | client Supabase con ruolo di servizio, PostgREST e API admin GoTrue, sola lettura aggregata | MISURATO |

### Stato della working tree (MISURATO)

Al momento della rilevazione `git status --porcelain=v1` riportava **78 voci**:

- 49 file tracciati marcati come cancellati (`D`), tutti sotto `public/videos/`;
- 1 file tracciato modificato (`M`): `src/components/home/landing-page.tsx` (45 righe toccate: +28 / −17);
- 28 percorsi non tracciati (`??`), fra cui cartelle di audit, materiali didattici locali, wrapper Android, output BMAD e file di presentazione.

Le **metriche Git** (commit, autori, effort da timestamp) sono calcolate sulla **storia committata**. Le **metriche di codice e inventario** sono calcolate sulla **working tree corrente**. Dove le due differiscono, la differenza è dichiarata.

Esiste inoltre un riferimento Git rotto ignorato da `git for-each-ref` (`refs/remotes/origin/main 2`). Non entra nei conteggi.

### Fonti

1. Repository Git locale `bridgequest`, ramo `main`.
2. File di codice e configurazione letti sul disco.
3. Database Postgres ospitato da Supabase, interrogato in sola lettura tramite credenziali già presenti in `.env.local` (i valori delle credenziali non sono riportati).
4. Listini pubblici e cambio ufficiale citati in Fase 5.
5. Verifiche locali: TypeScript, ESLint, Vitest, `npm audit`. Build di produzione: vedi § verifiche tecniche.

Non sono stati pubblicati email, nomi, username, identificativi utente o eventi individuali. Gli autori Git sono pseudonimizzati con prefisso `Autore-` e otto caratteri dell’hash SHA-256 dell’identità.

---

## 2. Sintesi per lettori non tecnici

BridgeLab è la piattaforma didattica della Federazione per imparare il bridge sul web (e, in forma di involucro, su app nativa). Lo stato osservato il 13 agosto 2026 è quello di un prodotto **già in esercizio**, con utenti reali e un catalogo di corsi, lezioni, esercizi e tavoli di gioco.

In sintesi, ciò che esiste e funziona:

- un sito Next.js con **69 schermate** e un catalogo vivo di **4 corsi**, **16 mondi**, **49 lezioni**, **199 moduli**;
- un tavolo di gioco completo (licita e carte) con avversari automatici a tre livelli, di cui il livello «esperto» tenta prima un motore neurale esterno (BEN) e, se manca, un solutore double-dummy;
- **1.091 utenti registrati** e **59.553 risultati di gioco** memorizzati, concentrati soprattutto sulla pratica della smazzata e sulla sfida al computer;
- autenticazione, ruoli (utente / istruttore / amministratore), un portale classi e un’area amministrativa;
- test automatici sui motori di regole (738 casi, di cui uno fallito nella working tree per una modifica locale non committata) e una pipeline CI che blocca errori di tipo, lint e test unitari.

Ciò che la piattaforma **non è**:

- un sistema internazionalizzato (è volutamente solo in italiano);
- un prodotto la cui assenza di difetti sia dimostrata dal fatto che la compilazione o i test passano;
- un equivalente di un generico «sito di corsi online»: il valore specifico sta nelle regole del bridge, nei solutori, nella progressione didattica e nel tavolo giocabile.

Sui numeri d’uso, tre avvertenze nette:

- agosto 2026 è un mese **incompleto** (rilevazione al giorno 13);
- le «sessioni» e la durata media **non sono determinabili**: lo storico accessi registra eventi di login, non inizio/fine di una visita. Il 99,9 % delle sessioni ricostruite con una soglia temporale contiene un solo evento e durata zero;
- la retention a 7 e 30 giorni è un **proxy** (almeno un login successivo a N giorni dalla registrazione), non una misura di utilizzo continuo.

Sulla valorizzazione economica i tre metodi **non coincidono**, e non vanno fusi:

- **riprodurre il software da zero** (metodo A, scenario centrale): circa **325.000 €**;
- **commissionarlo oggi a un fornitore** (metodo B, scenario centrale, con overhead): circa **652.000 €**;
- **costo evitato su 36 mesi** di un LMS generico più hosting e manutenzione (metodo C): circa **58.000 €**. Quest’ultimo **non** misura le funzioni specialistiche del bridge.

Il numero più difendibile per il «valore conferito alla Federazione» in termini di software già realizzato è il **costo di riproduzione (A)**, in un intervallo prudenziale **da circa 228.000 € a circa 652.000 €**, secondo le ipotesi esplicitate in Fase 5. Non vi sono inclusi marchio, avviamento, dati personali, librerie open source come proprietà esclusiva, né i diritti sui contenuti video e testuali.

---

## 3. Perimetro e metodo

### Perimetro incluso

- Codice applicativo in `src/` (esclusi seed didattici e test).
- Schema e dati aggregati del database accessibile.
- Inventario di rotte, API, script SQL, test e CI.
- Lettura dei moduli algoritmici (motore di gioco, solutori, punteggi, AI, gamification).
- Listini pubblici usati per la parte economica.

### Perimetro escluso o non verificato

- Correttezza didattica dei testi e delle mani.
- Titolarità dei diritti su video, infografiche, marchio FIGB, motore BEN.
- Carico (load test) e corrispondenza bit-a-bit fra working tree e produzione Vercel.
- Test E2E e test RLS: non eseguiti in questa perizia perché creano e cancellano utenti.
- Lavoro svolto fuori da Git (progettazione, riunioni, produzione contenuti, debug non committato).

### Classificazione delle cifre

- **MISURATO:** output diretto di comando, query o lettura di file.
- **CALCOLATO:** operazione aritmetica su dati misurati, senza nuove ipotesi.
- **STIMATO:** richiede almeno un’assunzione. Ogni assunzione quantitativa ha una riga «ASSUNZIONE» e una variazione ±30 %.

### Working tree, storia Git, produzione

| Piano | Cosa misura | Nota |
|---|---|---|
| Storia Git | commit, autori, effort da timestamp | 260 commit su HEAD; 261 sull’unione dei branch validi |
| Working tree | cloc, inventario file, test eseguiti oggi | 49 video cancellati in locale; 1 pagina di landing modificata |
| Produzione | tabelle e conteggi Supabase | non è stato fatto un diff binario con il deploy Vercel |

---

## 4. Fase 1 — Metriche del repository

### 4.1 Ambito Git

Le metriche sono calcolate **due volte**:

- **A — solo HEAD / ramo corrente `main`** (riferimento: 260 commit);
- **B — unione dei commit raggiungibili dai 7 riferimenti branch validi**, con deduplica per hash (261 commit).

Riferimenti validi: 3 locali (`main`, `perf/tier0-quickwins`, `redesign/ui-v2`) e 4 remoti (`origin/main`, `origin/perf/tier0-quickwins`, `origin/redesign/ui-v2`, `origin/vercel/vercel-web-analytics-to-nextjs-wy0msr`). Merge commit: **2** in entrambi gli ambiti.

Salvo diversa indicazione, i numeri della tabella riassuntiva usano l’ambito **A (ramo corrente)**, perché coincide con HEAD e con la linea di deploy dichiarata (`git push` su `main`).

### 4.2 Commit e attività (MISURATO, ambito A salvo nota)

| Metrica | Ramo corrente (A) | Unione riferimenti (B) |
|---|---|---|
| Commit totali | 260 | 261 |
| Primo commit | `6471b483…` — 8 febbraio 2026, 00:15:02 Europe/Rome | identico |
| Ultimo commit | `6630a5e0…` — 13 agosto 2026, 11:49:23 Europe/Rome | identico |
| Giorni di calendario con almeno un commit | 55 | 55 |
| Righe aggiunte (testo; binari esclusi) | 201.482 | 201.819 |
| Righe rimosse (testo; binari esclusi) | 34.681 | 34.733 |
| Occorrenze binarie escluse dal conteggio righe | 524 | 524 |
| Dimensione mediana del commit (aggiunte + rimozioni) | 160,5 | 161 |
| Merge commit | 2 | 2 |

Commit per autore pseudonimizzato (ambito A):

| Autore | Commit |
|---|---|
| Autore-10620de2 | 259 |
| Autore-6a19acae | 1 |

Distribuzione mensile (ambito A, fuso Europe/Rome):

| Mese | Commit |
|---|---|
| 2026-02 | 53 |
| 2026-03 | 95 |
| 2026-04 | 7 |
| 2026-05 | 21 |
| 2026-06 | 20 |
| 2026-07 | 14 |
| 2026-08 | 50 |

Distribuzione per fascia oraria Europe/Rome (ambito A): 00–05: 55; 06–11: 56; 12–17: 88; 18–23: 61.

File più modificati per numero di commit (ambito A, primi 8):

| File | Commit | Aggiunte | Rimozioni | Churn |
|---|---|---|---|---|
| `src/app/page.tsx` | 57 | 3.808 | 3.795 | 7.603 |
| `src/app/profilo/page.tsx` | 46 | 2.558 | 2.246 | 4.804 |
| `src/app/admin/page.tsx` | 38 | 2.822 | 2.608 | 5.430 |
| `src/app/lezioni/[lessonId]/[moduleId]/page.tsx` | 31 | 2.844 | 2.675 | 5.519 |
| `src/app/gioca/smazzata/page.tsx` | 31 | 1.546 | 309 | 1.855 |
| `src/app/gioca/page.tsx` | 31 | 1.192 | 581 | 1.773 |
| `src/components/desktop-sidebar.tsx` | 29 | 723 | 543 | 1.266 |
| `src/app/layout.tsx` | 29 | 376 | 106 | 482 |

L’elevato churn su pagine di migliaia di righe è un indizio di manutenibilità da pesare in Fase 2: la storia Git mostra rielaborazioni ripetute delle stesse schermate, non solo accrescimento lineare.

### 4.3 Effort da timestamp Git (CALCOLATO)

Regola applicata, per ciascun autore separatamente:

- nuova sessione se il distacco dal commit precedente supera 90 minuti;
- durata = (ultimo − primo commit della sessione) + 30 minuti di ramp-up;
- una sessione di un solo commit vale 30 minuti.

| Voce | Valore | Qualificazione |
|---|---|---|
| Sessioni | 94 | CALCOLATO |
| Minuti | 6.321 | CALCOLATO |
| Ore | 105,35 | CALCOLATO |
| Autore-10620de2 | 93 sessioni, 104,85 ore | CALCOLATO |
| Autore-6a19acae | 1 sessione, 0,50 ore | CALCOLATO |

Questa misura è un **limite inferiore**. Non cattura progettazione, ricerca, debug, riunioni, produzione dei contenuti, lavoro non committato né il tempo fra un salvataggio e il commit. **Non è usata come effort di replica.** L’effort di replica è stimato in Fase 2 e usato in Fase 5.

### 4.4 Righe di codice (MISURATO, working tree, cloc 2.06)

Esclusioni applicate: `node_modules`, lockfile, directory di build, asset binari (`public/` immagini/video/PDF), tipi generati (nessun `database.types.ts` trovato), migrazioni auto-generate (cartella assente).

| Categoria | File | Righe di codice | Note |
|---|---|---|---|
| Codice applicativo (`src/` senza `src/data/` e senza `*.test.ts`) | 396 | **66.899** | TypeScript 66.417; CSS 400; JSON 82 |
| Test (unitari + E2E + script RLS/realtime) | 44 | 6.163 | non sommati al totale applicativo |
| Contenuti seed (`src/data/`) | 21 | 18.082 | definizioni didattiche in sorgente; il vivo è nel DB |
| Sottotitoli (`public/captions/*.ass`) | 49 | 6.914 | asset testuali, non codice |
| Configurazione di progetto | 9 | 354 | `next.config.ts`, ESLint, tsconfig, Playwright, Vitest, Capacitor, ecc. |
| Script operativi `scripts/` (incluso markdown/SQL/Python) | 126 | 13.079 | tooling, non prodotto runtime |
| SQL in `scripts/sql/` | 33 | 1.943 | già incluso nel rigo script se sommato |

Il cloc dell’applicativo sulla working tree coincide con quello sui soli file tracciati (66.899 righe, 396 file): la modifica locale a `landing-page.tsx` non sposta il totale a questa granularità.

`src/` complessivo, test e dati inclusi: 89.504 righe TypeScript su 453 file.

**La tabella finale usa soltanto 66.899 righe di codice applicativo.**

### 4.5 Inventario tecnico

Conteggi sulla working tree, salvo i dati «live» che provengono dal database.

| Voce | Quantità | Qualificazione | Fonte |
|---|---|---|---|
| Componenti React in `src/components/` (`*.tsx`) | 94 | MISURATO | inventario file |
| Pagine / rotte navigabili (`page.tsx`) | 69 | MISURATO | inventario file |
| File route HTTP (`route.ts`, incluso callback auth) | 11 | MISURATO | inventario file |
| Handler HTTP esportati (GET/POST/…) | 12 | MISURATO | regex `export function/const METHOD` |
| File API sotto `src/app/api/` | 10 | MISURATO | inventario file |
| Tabelle pubbliche osservate via OpenAPI PostgREST | 35 | MISURATO | live |
| Migrazioni formali (`supabase/migrations`) | 0 | MISURATO | cartella assente |
| Script SQL in `scripts/sql/` | 33 | MISURATO | inventario file |
| Policy RLS live | non determinabile | — | `pg_catalog` non interrogabile senza connessione SQL |
| Occorrenze `CREATE POLICY` nel SQL del repo | 44 | MISURATO | testo script |
| Occorrenze `ENABLE ROW LEVEL SECURITY` nel SQL del repo | 19 | MISURATO | testo script |
| Indici live | non determinabile | — | come sopra |
| Occorrenze `CREATE INDEX` nel SQL del repo | 35 nomi (una cattura spurio `CONCURRENTLY`) | MISURATO | testo script |
| Chiavi primarie / esterne / CHECK / UNIQUE live | non determinabile | — | come sopra |
| Occorrenze testuali nel SQL: PRIMARY KEY / REFERENCES / CHECK (/ UNIQUE | 16 / 25 / 32 / 10 | MISURATO | conteggio testuale, non schema live |
| Funzioni database live (RPC esposte da PostgREST) | 27 | MISURATO | OpenAPI `/rpc/*` |
| Funzioni `SECURITY DEFINER` live | non determinabile (insieme completo) | — | manca `pg_proc` |
| Menzioni `SECURITY DEFINER` nel SQL del repo | 50 | MISURATO | testo script |
| File di test unitari | 36 | MISURATO | `src/lib/*.test.ts` |
| Casi unitari eseguiti oggi | 738 | MISURATO | Vitest |
| File spec E2E tracciati | 6 | MISURATO | `e2e/*.spec.ts` (escluso un file non tracciato) |
| Chiamate `test(` negli E2E tracciati | 27 | MISURATO | grep |
| Workflow CI/CD | 1 | MISURATO | `.github/workflows/ci.yml` |
| File `src/` tracciati da Git | 454 | MISURATO | `git ls-files src` |

Handler HTTP esportati: `POST /api/account/delete`, `POST /api/ben/autoplay|lead|play`, `GET /api/ben/health`, `GET /api/cron/engagement`, `GET+POST /api/email/unsubscribe`, `POST /api/friends/notify`, `POST /api/instructor-request`, `POST /api/meta/conversion`, `GET /auth/callback`.

Le 35 tabelle live (solo nomi, nessun dato di riga) sono elencate in appendice. `src/lib/supabase/types.ts` ne tipizza 9: il tipo TypeScript del client è incompleto rispetto allo schema osservato.

---

## 5. Fase 2 — Qualità e profondità architetturale

I punteggi da 1 a 5 sono **STIMATI**. Non premiano la sola presenza di una libreria o di un file. La media dei 12 punteggi è **CALCOLATA**.

### 5.1 Separazione delle responsabilità — 3/5 (STIMATO)

**Solidi.** La logica di dominio pura sta in `src/lib/` (motore, punteggi, catalogo, solutori) ed è coperta da test. `src/lib/catalog.ts:1-12` e `src/lib/catalog.ts:289-302` isolano l’accesso ai contenuti dal seed in `src/data/`. La progressione didattica è estratta in `src/lib/progression.ts:1-9`.

**Lacune.** Diverse schermate restano monolitiche: `src/app/classifica/page.tsx` (1.390 righe), `src/lib/catalog.ts` (1.378), `src/app/glossario/glossario-client.tsx` (1.253), `src/app/gioca/smazzata/page.tsx` (1.237). La storia Git conferma churn alto sulle stesse pagine. UI, fetch e regole convivono nello stesso file.

### 5.2 Modello dati e integrità referenziale — 3/5 (STIMATO)

**Solidi.** Le tabelle utente citano chiavi esterne verso `profiles` negli script (es. `scripts/sql/login-history.sql:16`). RLS è prevista su più tabelle. Il catalogo vivo (corsi → mondi → lezioni → moduli) è coerente nei conteggi: 4 / 16 / 49 / 199.

**Lacune.** Non esistono migrazioni formali versionate. Lo schema evolve con 33 script da eseguire a mano. I tipi TypeScript coprono 9 tabelle su 35. `completed_modules` memorizza `lesson_id`/`module_id` con uno split documentato come inaffidabile (`src/hooks/use-supabase-sync.ts:100-109`): le colonne non ricostruiscono gli identificativi originali; funziona solo la concatenazione. Vincoli live (PK, FK, CHECK, UNIQUE, indici) **non determinabili** in questa sessione.

### 5.3 Autenticazione e autorizzazione — 4/5 (STIMATO)

**Solidi.** Auth Supabase (cookie/PKCE). `src/proxy.ts:4-42` rinnova la sessione e protegge `/admin`. Il portale istruttori ha un gate server-side su `profiles.role` (`src/app/istruttori/layout.tsx:19-35`). Le RPC amministrative sono dichiarate protette da `is_admin()`. Esiste `POST /api/account/delete`.

**Lacune.** Il proxy protegge esplicitamente solo `/admin`, non l’intero albero istruttori (quest’ultimo ha comunque layout server). `src/proxy.ts:35-38` reindirizza gli anonimi dal solo prefisso admin. La verifica RLS end-to-end **non è stata rieseguita** qui (crea utenti).

### 5.4 Sicurezza — 3/5 (STIMATO)

Sottovoci:

**Validazione input.** Le route BEN usano Zod (`src/app/api/ben/play/route.ts:12-20`, `src/lib/ben-guard.ts:24-29`) e un rate limit in memoria (`src/lib/ben-guard.ts:36-49`). Non è una validazione sistematica di tutte le mutazioni client-side su Supabase.

**Esposizione di segreti.** Nessun `.env` committato osservato. Chiavi pubbliche (`NEXT_PUBLIC_*`) sono attese nel client. Un indirizzo di notifica di fallback è hardcoded in `src/app/api/instructor-request/route.ts:5` (valore non riportato).

**Policy RLS.** Gli script `scripts/sql/security-fixes-2026-08.sql:37-59` e `scripts/sql/pii-columns-2026-08.sql:1-23` dichiarano correzioni (niente SELECT anonimo su `profiles`; `login_history` con `USING (user_id = auth.uid())`; revoca di colonne PII). Lo stato **live** delle policy non è stato letto da `pg_policies`. Lo script originale `scripts/sql/login-history.sql:32-36` aveva `USING (true)` nonostante il nome «own»: è un difetto **storico nel testo SQL**, non una prova che sia ancora attivo in produzione.

**Funzioni privilegiate.** 27 RPC esposte; molte dichiarate `SECURITY DEFINER` negli script. `get_engagement_targets` è presente nell’OpenAPI: va trattata come funzione privilegiata (non è stata invocata).

**CSP.** Presente in `next.config.ts:115-126`, con test in `src/lib/next-config.test.ts` e `e2e/csp.spec.ts`. Resta `'unsafe-inline'` in `script-src` e `style-src`, con motivazione documentata in `next.config.ts:55-84`. Non è una CSP rigorosa; è una CSP esistente con eccezioni consapevoli.

**Protezione API.** Cron protetto da bearer (`src/app/api/cron/engagement/route.ts:23-37`). Route BEN richiedono utente autenticato (`src/app/api/ben/play/route.ts:23-26`). Il client admin è dichiarato server-only (`src/lib/supabase/admin.ts:3-7`).

`npm audit` (21 nodi, di cui 1 critical, 16 high, 2 moderate, 2 low) è un **rilievo euristico su dipendenze**, non una vulnerabilità verificata sull’applicazione. Dettaglio in § 5.14.

### 5.5 Gestione degli errori — 3/5 (STIMATO)

**Solidi.** Punto unico `reportError` (`src/lib/report-error.ts:23-33`) con Sentry opzionale e divieto di allegare dati personali. Sentry è no-op senza DSN (`src/lib/sentry-shared.ts:8-9`).

**Lacune.** `src/app/error.tsx:14-16` usa `console.error` diretto, non `reportError`. Numerose clausole `catch {}` nel client (spesso attorno a `localStorage`, coerenti con la convenzione di progetto, ma non ovunque). Il monitoraggio in produzione dipende dalla presenza del DSN: non è stata verificata la telemetria live.

### 5.6 Performance e caching — 3/5 (STIMATO)

**Solidi.** Catalogo in cache di processo (`src/lib/catalog.ts:289-302`). Header di cache lunghi su video, infografiche, icone (`vercel.json:4-40`). PWA Serwist. DDS in Web Worker. Bundle analyzer disponibile. CSP consente WASM (`next.config.ts:96`).

**Lacune.** Nessun load test. Pagine da oltre 1.000 righe. Circa 15 GB di video in `public/` (49 file tracciati; **0 presenti sulla working tree locale** perché cancellati in locale). La capacità sotto carico è **non determinabile**.

### 5.7 Accessibilità — 3/5 (STIMATO)

**Solidi.** Pagina dichiarativa `src/app/accessibilita/page.tsx:4-7` (WCAG 2.2 AA dichiarata, non dimostrata). Suite axe in `e2e/a11y.spec.ts:1-23` con soglia su violazioni serious/critical. Preferenza dimensione testo testata (`src/lib/text-size.test.ts`).

**Lacune.** Gli E2E **non girano in CI** (`playwright.config.ts:8-9`) e **non sono stati eseguiti** in questa perizia. La conformità WCAG completa è **non determinabile**.

### 5.8 Internazionalizzazione — 3/5 (STIMATO)

Scelta di prodotto: solo italiano, senza i18n. `src/app/layout.tsx:48` fissa `locale: "it_IT"`. Non esiste infrastruttura di traduzione. Il punteggio riflette la completezza rispetto al perimetro dichiarato (federazione italiana), non l’assenza di un requisito extra.

### 5.9 Copertura dei test — 3/5 (STIMATO)

**Solidi.** 36 file, 738 casi unitari sui motori (bridge, scoring, DDS, PBN, generatore mani, Leitner, progressione, consent, admin-stats). CI esegue `npm test`.

**Lacune.** Un caso fallito nella working tree (`src/lib/palette.test.ts`: debito colore su `landing-page.tsx` locale). Gli E2E non sono in CI. Non c’è misura di coverage percentuale. Superare i test **non** prova l’assenza di difetti.

### 5.10 CI/CD — 3/5 (STIMATO)

**Solidi.** `.github/workflows/ci.yml:1-29` esegue install, `tsc`, ESLint a zero warning, test unitari su push/PR verso `main`. Deploy Vercel su `main` (documentato in `README.md`). Cron giornaliero (`vercel.json:2-4`).

**Lacune.** CI non esegue `next build`, E2E, né RLS. Un solo workflow.

### 5.11 Documentazione — 4/5 (STIMATO)

**Solidi.** `README.md`, `docs/architettura.md`, `docs/runbook.md`, `CLAUDE.md`, intestazioni operative negli script SQL. Mappa moduli e avvertenza «il DB è la fonte di verità».

**Lacune.** I tipi generati dello schema sono incompleti. Parte della conoscenza di sicurezza sta in commenti SQL da eseguire a mano, non in una catena di migrazioni.

### 5.12 Manutenibilità da parte di un team terzo — 3/5 (STIMATO)

Un terzo può orientarsi grazie a documentazione, TypeScript strict, test dei motori e strato catalogo. Ostacoli: pagine monolitiche, schema SQL manuale, tipi Supabase parziali, un autore dominante nella storia Git (259/260 commit), dipendenza da BEN self-hosted e da video non presenti in locale in questa working tree.

### 5.13 Media dei punteggi (CALCOLATA)

(3+3+4+3+3+3+3+3+3+3+4+3) / 12 = **3,17**.

### 5.14 Strumenti automatici (sola lettura)

`npm audit --json` (13 agosto 2026):

| Livello | Nodi | Qualificazione |
|---|---|---|
| critical | 1 | rilievo euristico |
| high | 16 | rilievo euristico |
| moderate | 2 | rilievo euristico |
| low | 2 | rilievo euristico |
| **totale** | **21** | MISURATO |

Tipologie ricorrenti nei titoli advisory (conteggio di occorrenze `via`, non CVE verificate): Denial of Service (brace-expansion, minimatch, Next.js Server Components/Image), bypass di middleware/proxy Next.js, path traversal in Hono `serveStatic`, XSS/iniezione in catene transitive, ReDoS, prototype pollution. Molte catene passano da dipendenze di sviluppo o da adattatori non usati nel runtime del tavolo.

**Nessuna di queste voci è stata riprodotta sull’applicazione.** Restano warning automatici. In particolare gli advisory Next.js 16 richiedono un triage separato (versione dichiarata: `next@16.1.6` in `package.json:37`).

### 5.15 Componenti a complessità algoritmica reale

Per ciascuna: cosa fa, algoritmi, sofisticazione, proprietà, effort di riscrittura. L’effort è **STIMATO**.

ASSUNZIONE (effort di riscrittura per componente): ore-persona di uno sviluppatore senior che già conosce il bridge da giocatore, non da autore di software didattico; include test del modulo, non UI circostante.

| Componente | Cosa fa | Algoritmi / regole | Sofisticazione | Proprietà | Ore base | −30% | +30% |
|---|---|---|---|---|---|---|---|
| Motore di gioco `bridge-engine.ts` (778 righe) | Mani, prese, carte legali, AI euristica `aiSelectCard` | Regole standard del gioco della carta; euristica di scelta | Media-alta | Implementazione propria di regole pubbliche | 90 | 63 | 117 |
| DDS TS `dds-solver.ts` (773; soglia esatta 6 carte, timeout 2 s: righe 73-77) | Double-dummy minimax in TypeScript | Minimax / alfa-beta, stima euristica oltre 6 carte | Alta | Propria; non è il DDS C++ di riferimento | 110 | 77 | 143 |
| DDS esatto `dds-exact.ts` (234) | Prese esatte su smazzata intera | Domanda booleana «almeno k», bitboard, equivalenza carte, tabella di trasposizione | Alta | Propria; usata come riscontro | 90 | 63 | 117 |
| Tabella DD e par `dds-table.ts` (195) | Tabella 5 ceppi × 4 dichiaranti e contratto par | Delega a `bridge-dds` (WASM di dds-bridge/dds) | Alta nel motore, bassa nel wrapper | **Libreria open source**; il wrapper è proprio | 20 (solo wrapper) | 14 | 26 |
| Selezione / replay DD | Carta ottima in corso di mano; confronto linee | Ricerca sul solver | Media | Propria, sopra i solver | 40 | 28 | 52 |
| Scoring `bridge-scoring.ts` (365) | Punteggio duplicate, IMP, verdetti | Barème WBF | Media | Implementazione propria di regole pubbliche | 40 | 28 | 52 |
| AI difficoltà `ai-difficulty.ts` | Base ~20 % errori plausibili; intermedio euristico; esperto BEN→DDS≤7 carte timeout 1200 ms→euristica | Cascata; errori da principiante guidati (`MISTAKE_PROBABILITY = 0.2`, riga 44) | Media-alta | Propria; BEN è esterno | 45 | 32 | 59 |
| Client BEN | Proxy autenticato verso server neurale | Nessun training in repo; HTTP + fallback | Integrazione | **Non di proprietà**; BEN è servizio esterno | 35 | 25 | 46 |
| Generazione mani `deal-generator.ts` | Smazzate vincolate (HCP, lunghezze) | Campionamento con rifiuto, PRNG a seme; 7 template | Media | Metodo classico (Dealer); codice proprio | 50 | 35 | 65 |
| Validazione mani | `dd_tricks` su tutte le 272 smazzate live | Uso dei solver | Media | Pipeline propria | inclusa nei solver | — | — |
| Analisi presa per presa / classificazione errori | `play-error-classifier.ts`, `dds-replay.ts` | Confronto con linea DD | Media | Propria | 30 | 21 | 39 |
| Generazione quiz `trick-quiz.ts` | Quiz «quante prese» su 3 livelli | Costruzione da posizione | Medio-bassa | Propria | 25 | 18 | 33 |
| Ripetizione dilazionata `spaced-review.ts:16` | Leitner a 5 scatole, intervalli 1/3/7/14/30 giorni | Leitner (algoritmo pubblico) | Bassa-media | Propria implementazione di metodo noto | 20 | 14 | 26 |
| Gamification `xp-levels.ts`, store Zustand | 36 livelli, XP, streak, badge | Soglie tabellari | Bassa-media | Propria | 80 | 56 | 104 |
| Progressione didattica `progression.ts:6-8` | Blocco moduli in sequenza; mondo N+1 al 50 % | Regole booleane | Bassa | Propria | 15 | 11 | 20 |
| Matching compagni `partner-matching.ts` | Punteggio su livello dichiarato e fasce | Euristica di compatibilità | Bassa-media | Propria; **0 profili live** | 25 | 18 | 33 |
| Quiz / scenari di licita e gioco (dati + UI) | Pratica licita, impasse, trova errore | Contenuti + motori sopra | Mista | Contenuti + codice | nel totale replica | — | — |

Costo economico di riscrittura per componente (tariffa centrale 85 €/h, CALCOLATO su ore STIMATE):

Esempi: motore 90×85=7.650 € (5.355–9.945); DDS TS 9.350 € (6.545–12.155); DDS esatto 7.650 €; scoring 3.400 €; AI 3.825 €; generatore 4.250 €; gamification 6.800 €. Il wrapper `dds-table` a 1.700 € **non** include il valore del solver C++ open source.

La piattaforma **non** possiede in esclusiva `bridge-dds`, le regole WBF, l’algoritmo di Leitner, il formato PBN, né BEN.

### 5.16 Replica da zero da parte di un team esterno

ASSUNZIONE: team di 2 sviluppatori full-stack senior già familiari con Next.js/React/Postgres, non esperti di software per il bridge.  
ASSUNZIONE: capacità 120 ore fatturabili al mese per persona (6 ore/giorno × 20 giorni).  
ASSUNZIONE: i contenuti didattici, i video, i diritti FIGB, il server BEN e la libreria `bridge-dds` sono **disponibili** (non vanno reinventati). Se mancassero, l’effort non è quello sotto.

Breakdown STIMATO (ore-persona):

| Voce | Ore |
|---|---|
| Motori di dominio (somma § 5.15, arrotondati nel pacchetto) | 880 |
| 69 pagine (7 complesse × 40 h; 29 medie × 22 h; 33 semplici × 10 h) | 1.248 |
| 94 componenti | 282 |
| Hook | 208 |
| Store | 120 |
| API | 96 |
| Auth, email, cron | 80 |
| Schema, RLS, RPC | 220 |
| PWA / Capacitor | 140 |
| Test | 250 |
| CI, docs, hardening | 100 |
| Integrazione e buffer | 200 |
| **Totale** | **3.824** |

Controllo di plausibilità: 66.899 LOC applicative / 3.824 h ≈ 17,5 LOC/h, ordine di grandezza atteso per UI + dominio, non per sola battitura.

| | Ore | Mesi di calendario (2 senior, 120 h/mese ciascuno) |
|---|---|---|
| −30 % | 2.677 | 11,2 |
| Base | 3.824 | 15,9 |
| +30 % | 4.971 | 20,7 |

Sensibilità della capacità (±30 %: 84 e 156 h/mese per persona), effort base: **22,8 mesi** e **12,3 mesi**.

L’effort Git (105 ore) resta un limite inferiore e **non** sostituisce queste 3.824 ore.

---

## 6. Fase 3 — Profondità di prodotto

### 6.1 Unità di contenuto

Due cataloghi distinti. **Non sommati.**

**A. Database vivo** (13 agosto 2026, 13:10 Europe/Rome) — MISURATO

| Unità | Conteggio |
|---|---|
| Corsi | 4 |
| Mondi / sezioni (`course_worlds`) | 16 |
| Lezioni | 49 |
| Moduli | 199 |
| Tipi modulo | theory 100, quiz 49, exercise 40, practice 10 |
| Blocchi contenuto nei moduli | text 323, quiz 230, rule 159, example 123, heading 120, true-false 43, bid-select 41, tip 33, card-select 11, hand-eval 10 |
| Blocchi quiz inline (tipi quiz/true-false/card-select/hand-eval/bid-select) | 335 |
| Mani in `smazzate` | 272 (tutte con `dd_tricks`) |
| Mani guidate | 2 |
| Esercizi eserciziario | 31 |
| Scenari «trova l’errore» | 32 |
| Voci di glossario | 49 |
| Carte collezionabili | 22 |
| Sfide settimanali | 12 |
| ASD in anagrafica | 241 |
| Circoli `asd_clubs` | 260 |

**B. Definizioni nel sorgente** (`src/data/`, working tree) — MISURATO

| Unità | Conteggio |
|---|---|
| Corsi / lezioni / moduli seed | 4 / 49 / 168 |
| Blocchi contenuto seed | 943 |
| Tipi di quiz inline presenti | 5 (manca `sequence` nel seed) |
| Domande di comprensione | 111 in 37 set |
| Scenari di licita (pratica) | 20 |
| Scenari impasse | 32 |
| Smazzate Fiori / Quadri / Cuori gioco / Cuori licita | 96 / 96 / 80 / 0 |
| Smazzate validate `allSmazzate` | 267 |
| Smazzate giocabili dopo filtro di plausibilità | 255 |
| Mani WBF minibridge | 73 |
| Somma `allSmazzate + WBF_DEALS` | 340 |

Formula della somma 340: `allSmazzate.length + WBF_DEALS.length`. **Rischio di duplicazione** se una mano WBF coincide con una smazzata didattica: **non determinabile** senza confronto carta per carta. Non sommare 340 alle 272 mani del database: sono cataloghi diversi (seed vs vivo). Il vivo (272) è la fonte di verità per il prodotto in esercizio.

Mani generate a runtime: 7 template in `DEAL_TEMPLATES` (`src/lib/deal-generator.ts:279`); non sono un conteggio di mani persistite. Quiz «quante prese»: 3 livelli (`QUIZ_LEVELS`).

Badge / achievement / livelli (sorgente): 13 badge standard, 10 achievement segreti, 36 livelli XP.

### 6.2 Schermate e flussi

69 rotte `page.tsx` (elenco in appendice). Flusso ritenuto **completo** solo con ingresso, azione, esito e persistenza o risultato visibile nel codice.

| Flusso | Stato osservato |
|---|---|
| Registrazione / login / reset | Funzionante, dati vivi (1.091 utenti) |
| Studio lezione / modulo | Funzionante, dati vivi (18.362 completamenti modulo) |
| Pratica smazzata vs AI | Funzionante, dati vivi (33.383 risultati `smazzata`) |
| Sfida al computer | Funzionante, dati vivi (10.633 `sfida`) |
| Mano del giorno | Funzionante, dati vivi (3.497) |
| Quiz lampo / memory / conta-veloce / impasse / dichiara / pratica-licita / mano-guidata / trova-errore / compito | Funzionanti, dati vivi (vedi distribuzione `game_results`) |
| Torneo settimanale | Implementato; 51 righe `tournament_results` — adozione bassa |
| Sfida amico / link | Implementato; 512 `challenges`, 145 `friendships` |
| Forum | Implementato; adozione bassa (17 post, 27 commenti) |
| Portale istruttori / classi | Implementato; 15 classi, 52 iscrizioni, 14 compiti |
| Admin | Implementato, protetto da ruolo |
| Glossario | Funzionante (49 voci) |
| Collezione / negozio | Implementato (22 carte) |
| Ripasso Leitner | Implementato; 131 `review_items` |
| Trova compagno | Implementato nel codice; **0** `partner_profiles` — non adottato |
| Push notification | Codice presente; **0** `push_subscriptions` — non adottato |
| Email di re-engagement | Funzionante (639 `email_events`, cron dichiarato) |
| Minibridge / quiz-prese / segnali / analisi | Presenti come rotte; **assenti** come `game_type` in `game_results` — adozione non determinabile da quella tabella |
| Cancellazione account | Implementato in API; non collaudato E2E in questa perizia |

### 6.3 Distribuzione dei 59.553 risultati di gioco (MISURATO)

| `game_type` | Righe |
|---|---|
| smazzata | 33.383 |
| sfida | 10.633 |
| mano-del-giorno | 3.497 |
| conta-veloce | 2.577 |
| quiz-lampo | 1.902 |
| memory | 1.865 |
| impasse | 1.371 |
| dichiara | 1.168 |
| mano-guidata | 1.129 |
| pratica-licita | 882 |
| trova-errore | 592 |
| compito | 554 |

---

## 7. Fase 4 — Dati di utilizzo

Fonte: database vivo, sola lettura, aggregati. Nessuna riga individuale persistita nei file di audit oltre ai totali.

Query eseguite alle **13:10:01 Europe/Rome** del 13 agosto 2026.

### 7.1 Utenti e registrazioni (MISURATO)

| Voce | Valore |
|---|---|
| Utenti `auth.users` | 1.091 |
| Profili | 1.091 |
| Eventi `login_history` | 10.479 |

Registrazioni per mese (UTC, da `auth.users.created_at`; i profili per mese Europe/Rome coincidono sui totali mensili):

| Mese | Iscritti | Crescita sul mese precedente |
|---|---|---|
| 2026-02 | 19 | — |
| 2026-03 | 668 | +3.415,79 % |
| 2026-04 | 165 | −75,30 % |
| 2026-05 | 108 | −34,55 % |
| 2026-06 | 66 | −38,89 % |
| 2026-07 | 47 | −28,79 % |
| 2026-08 (parziale, al giorno 13) | 18 | −61,70 % |

La crescita di agosto **non è confrontabile** con un mese intero.

### 7.2 Utenti attivi mensili (MISURATO)

Definiti come distinti `user_id` con almeno un evento in `login_history` nel mese civile Europe/Rome. Non sono «sessioni».

| Mese | MAU | Eventi login |
|---|---|---|
| 2026-02 | 9 | 9 |
| 2026-03 | 678 | 1.781 |
| 2026-04 | 373 | 2.001 |
| 2026-05 | 312 | 2.021 |
| 2026-06 | 298 | 1.895 |
| 2026-07 | 236 | 1.957 |
| 2026-08 (parziale) | 149 | 815 |

### 7.3 Sessioni e durata — non determinabili

`login_history` ha solo `user_id` e `logged_in_at` (`scripts/sql/login-history.sql:14-17`). Non esistono eventi start/end, né timeout di sessione lato server. Il heartbeat client (`src/hooks/use-activity-tracker.ts:6-24`) incrementa `localStorage` ogni 30 s a scheda visibile e poi sincronizza `profiles.total_minutes`: misura di visibilità dichiarata dal client, **non** una sessione.

Ricostruzione per gap (proxy):

ASSUNZIONE: una nuova sessione inizia se due login dello stesso utente distano più di 30 minuti.

| Soglia | Sessioni inferite | Media minuti | Mediana | Sessioni a un solo evento | Quota singolo evento |
|---|---|---|---|---|---|
| 21 min (−30 %) | 10.467 | 0 | 0 | 10.457 | 99,9 % |
| 30 min | 10.467 | 0 | 0 | 10.457 | 99,9 % |
| 39 min (+30 %) | 10.467 | 0 | 0 | 10.457 | 99,9 % |

Poiché la quasi totalità ha un solo evento e durata zero, **sessioni e durata media/mediana sono non determinabili**. Il ±30 % della soglia non cambia il quadro.

Somma di `profiles.total_minutes`: **482.994** (MISURATO come somma di colonna). È un cumulato di visibilità client-side, non tempo di sessione. Media per profilo: 482.994 / 1.091 ≈ 443 minuti (CALCOLATO), con affidabilità limitata dal tracker locale.

### 7.4 Completamenti didattici (MISURATO, con formula)

Chiave ricostruita = `lesson_id || '-' || module_id` di `completed_modules`, allineata a `lesson_id || '-' || module_id` di `lesson_modules`. Questo aggirà lo split inaffidabile documentato in `use-supabase-sync.ts:100-109`.

| Voce | Valore |
|---|---|
| Righe `completed_modules` | 18.362 |
| Chiavi ricostruite che matchano il catalogo | 18.362 |
| Non matchate | 0 |
| Coppie utente–lezione complete (tutti i moduli della lezione) | 3.079 |
| Utenti con almeno una lezione completa | 342 |

Lezioni complete per mese (data dell’ultimo modulo matchato della lezione):

| Mese | Lezioni complete (coppie utente–lezione) |
|---|---|
| 2026-02 | 16 |
| 2026-03 | 1.065 |
| 2026-04 | 547 |
| 2026-05 | 566 |
| 2026-06 | 389 |
| 2026-07 | 384 |
| 2026-08 (parziale) | 112 |

### 7.5 Retention (STIMATO — proxy)

Formula (**rolling**, non exact-day): un utente è eleggibile se `profiles.created_at ≤ now − N giorni`; è retained se esiste almeno un `login_history.logged_in_at ≥ created_at + N giorni`.

Non è retention di utilizzo del prodotto, è retention di **ritorno con un login registrato**. Lo storico è incompleto per costruzione (un evento per login aggiornato, backfill iniziale da `last_login`).

| N giorni | Eleggibili | Retained | Percentuale |
|---|---|---|---|
| 5 (−30 % rispetto a 7) | 1.083 | 493 | 45,52 % |
| **7** | **1.077** | **474** | **44,01 %** |
| 9 (+30 % rispetto a 7) | 1.076 | 465 | 43,22 % |
| 21 (−30 % rispetto a 30) | 1.057 | 383 | 36,23 % |
| **30** | **1.044** | **334** | **31,99 %** |
| 39 (+30 % rispetto a 30) | 1.031 | 308 | 29,87 % |

---

## 8. Fase 5 — Valutazione economica

Valuta: **euro**. Cambio ufficiale BCE del **12 agosto 2026** (ultimo disponibile al mattino del 13): 1 EUR = **1,1545 USD**, quindi 1 USD = **0,86618 EUR** (CALCOLATO). Fonte: `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`.

I tre metodi restano **separati**.

### 8.A Costo di riproduzione

Base: 3.824 ore STIMATE di replica (non le 105 ore Git).

Tariffe italiane full-stack senior freelance (fonti del 13 agosto 2026):

| Fascia | €/h | Fonte |
|---|---|---|
| Bassa | 65 | Fascia inferiore senior 5+ anni: 65–100 €/h ([cyberalchimista.it, tariffe 2026](https://cyberalchimista.it/freelance-developer-tariffe-2026/)); 60–100 €/h ([openiva.it](https://www.openiva.it/guide-fiscali/quanto-guadagna-sviluppatore-partita-iva)) |
| Media | 85 | Punto interno alle fasce 70–120 ([calcoi.com](https://calcoi.com/calculator/freelance-hourly-rate/), [faipreventivo.it](https://faipreventivo.it/calcolatore-tariffa-oraria)) e 80–120 ([marianomatera.dev](https://www.marianomatera.dev/costo-sviluppo-software)) |
| Alta | 110 | Parte alta delle stesse fasce senior |

Formula: ore × tariffa.

| | Effort −30 % (2.677 h) | Effort base (3.824 h) | Effort +30 % (4.971 h) |
|---|---|---|---|
| 65 €/h | 173.992 € | 248.560 € | 323.128 € |
| **85 €/h** | **227.528 €** | **325.040 €** | **422.552 €** |
| 110 €/h | 294.448 € | 420.640 € | 546.832 € |

Sensibilità ±30 % della tariffa centrale a effort base: 85×0,7=59,5 €/h → **227.528 €**; 85×1,3=110,5 €/h → **422.552 €**.

### 8.B Costo di sostituzione (fornitore)

Tariffe fornitore (software house / appalto), STIMATE sopra il freelance:

| Fascia | €/h |
|---|---|
| Bassa | 80 |
| Media | 110 |
| Alta | 140 |

ASSUNZIONE: la voce «sviluppo» = 3.824 h. Analisi, UX, test/sicurezza aggiuntivi e PM sono percentuali **aggiuntive** sulla voce sviluppo, perché in appalto si fatturano a parte:

| Voce | % su sviluppo |
|---|---|
| Analisi | 12 % |
| Progettazione UX e tecnica | 10 % |
| Test e sicurezza (oltre i test già nel codice) | 15 % |
| Project management | 18 % |
| **Totale overhead** | **55 %** |

Sviluppo solo (effort base): 305.920 / 420.640 / 535.360 € (bassa / media / alta).

Totale con overhead 55 %:

| Scenario | Totale |
|---|---|
| Bassa | 474.176 € |
| **Media (centrale)** | **651.992 €** |
| Alta | 829.808 € |

Sensibilità ±30 % dell’overhead a tariffa media: overhead 38,5 % → **582.586 €**; overhead 71,5 % → **721.398 €**.

Range B: circa **474.000–830.000 €**; centrale **652.000 €**.

### 8.C Valore d’uso triennale (36 mesi)

ASSUNZIONE — piattaforma comparabile: **Thinkific piano Grow**, listino pubblico 219 USD/mese se fatturato mensile ([thinkific.com/pricing](https://www.thinkific.com/pricing/)). È un LMS per corsi video, quiz e certificati. **Non è equivalente** al tavolo di bridge, ai solutori, alle sfide, al portale istruttori FIGB. Serve solo come proxy del canale «didattica online generica».

ASSUNZIONE — utenti inclusi: il listino Grow non pubblica un tetto di studenti nel materiale consultato; si assume capienza ≥ 1.091 iscritti. Se il piano avesse overage, il costo salirebbe (non determinabile dal listino letto).

ASSUNZIONE — hosting mensile 65 USD = Vercel Pro 20 USD ([documentazione Pro, aggiornata 15 luglio 2026](https://vercel.com/docs/plans/pro-plan)) + Supabase Pro 25 USD ([supabase.com/pricing](https://supabase.com/pricing), Micro incluso nel credito compute) + Resend Pro 20 USD / 50.000 email ([resend.com/pricing](https://resend.com/pricing)). Un posto Vercel, un progetto Supabase.

ASSUNZIONE — manutenzione: 16 ore/mese a 85 €/h.

| Voce | Base 36 mesi | −30 % | +30 % |
|---|---|---|---|
| Thinkific Grow | 6.829 € | 4.780 € | 8.878 € |
| Hosting (65 USD/mese) | 2.027 € | 1.419 € | 2.635 € |
| Manutenzione (ore) | 48.960 € | 34.272 € | 63.648 € |
| Manutenzione (tariffa ±30 %) | 48.960 € | 34.272 € | 63.648 € |

Totale C scenario centrale: **57.816 €** (CALCOLATO su assunzioni STIMATE).

La manutenzione domina. Senza di essa, licenza LMS + hosting su 36 mesi sono circa 8.856 €: cifra che **non** rappresenta il software specialistico osservato.

### 8.D Conclusione economica

| Metodo | Scenario centrale | Intervallo esposto |
|---|---|---|
| A Riproduzione | 325.040 € | 227.528–422.552 € (effort ±30 % a 85 €/h) |
| B Sostituzione | 651.992 € | 474.176–829.808 € (tariffe fornitore + overhead 55 %) |
| C Uso 36 mesi | 57.816 € | proxy LMS + ops; non comparabile ad A/B |

**Valore conferito alla Federazione (range prudenziale): 228.000–652.000 €.**

- **Limite inferiore:** metodo A, effort −30 %, tariffa media freelance 85 €/h → 227.528 €.  
- **Limite superiore:** metodo B, tariffa media fornitore 110 €/h, overhead 55 % → 651.992 €.  
- **Valore più difendibile:** metodo **A centrale (325.040 €)**. È il costo di rifare il software osservato, con ipotesi esplicite, senza gonfiare con overhead commerciale e senza sminuire il prodotto uguagliandolo a un LMS generico.

Cosa **non** è incluso: marchio FIGB, avviamento, crescita futura, reputazione, valore dei dati personali, proprietà delle librerie open source (`bridge-dds`, Next.js, Supabase, React), server BEN, produzione originale di video e testi didattici, diritti sulle mani WBF, hosting storico già speso, validità fiscale della cifra.

---

## 9. Tabella riassuntiva finale

| Ore stimate | Commit | Righe di codice applicativo | Giorni di lavoro attivi | Punteggio medio di qualità | Valore stimato |
|---|---|---|---|---|---|
| 3.824 h replica (STIMATO); 105,35 h da Git (CALCOLATO, limite inferiore) | 260 sul ramo `main` (MISURATO) | 66.899 (MISURATO) | 55 giorni di calendario con commit (MISURATO) | 3,17 / 5 (CALCOLATO da 12 STIMATI) | 325.040 € metodo A centrale; range prudenziale 228.000–652.000 € |

Altri ancoraggi: 1.091 utenti; 59.553 risultati di gioco; 49 lezioni e 199 moduli live; working tree non pulita.

---

## 10. Limiti della presente analisi

La perizia **non può dimostrare**:

- la **correttezza didattica** di lezioni, quiz e mani;
- l’**assenza di vulnerabilità** (i test e `npm audit` non equivalgono a un penetration test; gli advisory automatici non sono exploit verificati);
- la **conformità completa a GDPR e WCAG** (esistono misure — RLS, revoca colonne, consenso, pagina accessibilità, axe — non un audit legale né un audit WCAG eseguito qui);
- la **titolarità dei diritti** su codice, contenuti, video, marchio, BEN, mani WBF;
- la **capacità sotto carico**;
- la **corrispondenza** fra working tree locale (video cancellati, landing modificata, file extra) e la produzione su Vercel;
- il **funzionamento continuo dei servizi esterni** (BEN, Resend, Sentry, Supabase, Vercel) al momento della lettura da parte del Consiglio;
- il **lavoro svolto fuori da Git**;
- la **validità contabile o fiscale** della valorizzazione (non è una perizia giurata né una valutazione IAS/IVS);
- l’**affidabilità delle metriche d’uso ricostruite tramite proxy** (retention da login, minuti da heartbeat client, agosto incompleto);
- lo **schema Postgres live** (policy, indici, CHECK) oltre a quanto esposto da PostgREST.

Il superamento di TypeScript e ESLint, e l’esito dei test unitari, **non** provano l’assenza di difetti.

---

## 11. Verifiche tecniche (questa sessione)

| Verifica | Esito | Note |
|---|---|---|
| `npx tsc --noEmit` | EXIT 0 | MISURATO dopo rimozione di uno script di audit `.ts` che inquinava il `include` del tsconfig |
| `npx eslint src --max-warnings 0` | EXIT 0 | MISURATO |
| `npm test` (Vitest) | EXIT 1 | 737 passati, 1 fallito: `palette.test.ts` sulla modifica locale non committata di `landing-page.tsx`. Sulla storia Git quel file non è lo stesso. Il fallimento è della **working tree**, non necessariamente di HEAD |
| `npm run build` | EXIT 0 | Compilazione webpack in 21,6 s; 72 pagine statiche generate. Warning Node `--localstorage-file` (non è un errore dell’app). Il successo della build **non** prova l’assenza di difetti |
| Test E2E Playwright | **non eseguito** | `e2e/global-setup.ts` crea e poi elimina un utente via service role |
| `npm run test:rls` | **non eseguito** | crea un utente di test autenticato e lo elimina |
| `npm audit` | 21 nodi | rilievi euristici, non vulnerabilità verificate |

---

## 12. Appendice — comandi, query, output grezzi

I file completi sono in `audit-bridgelab/grok-raw/`. Qui i comandi esatti e gli estratti necessari alla riproduzione.

### 12.1 Snapshot repository

```text
$ date '+%Y-%m-%d %H:%M:%S %Z'
2026-08-13 13:07:01 CEST

$ git rev-parse --abbrev-ref HEAD
main

$ git rev-parse HEAD
6630a5e0a34ce37b3dc914dda3b1771e6ceb82ae

$ git log -1 --format='%H%n%ci%n%s'
6630a5e0a34ce37b3dc914dda3b1771e6ceb82ae
2026-08-13 11:49:23 +0200
Leggibilita' per il pubblico reale: 45-65 anni
```

Working tree: 78 voci (49 `D`, 1 `M`, 28 `??`). Elenco dei video cancellati e dei non tracciati nel log della rilevazione iniziale.

### 12.2 Metriche Git

Comando: `node audit-bridgelab/grok-collect-git.mjs`  
Output completo: `audit-bridgelab/grok-raw/git-metrics.json`

Estratto ambito A:

```json
{
  "commit_totali": 260,
  "commit_per_autore_pseudonimizzato": { "Autore-10620de2": 259, "Autore-6a19acae": 1 },
  "giorni_calendario_attivi": 55,
  "dimensione_commit_mediana_righe_aggiunte_piu_rimosse": 160.5,
  "righe_aggiunte_totali": 201482,
  "righe_rimosse_totali": 34681,
  "occorrenze_file_binari_ignorate_nel_conteggio_righe": 524,
  "merge_commit": 2,
  "effort_timestamp": { "sessioni": 94, "minuti_totali": 6321, "ore_totali": 105.35 }
}
```

### 12.3 cloc

```bash
npx --yes cloc --quiet --json --hide-rate src --fullpath --not-match-d='src/data' --not-match-f='(\.test\.ts$|\.spec\.ts$)'
```

Applicativo (estratto): `"code": 66899`, `"nFiles": 396`. File: `cloc-application.json`. Altri: `cloc-tests.json`, `cloc-content.json`, `cloc-subtitles.json`, `cloc-config.json`, `cloc-sql.json`.

### 12.4 Inventario e prodotto statico

```bash
node audit-bridgelab/grok-collect-inventory.mjs
npx --yes tsx audit-bridgelab/collect-static-product-metrics.ts
```

Output: `inventory.json`, `static-product.json`.

### 12.5 Database — metodo

Non esiste `DATABASE_URL`. Interrogazione tramite:

1. OpenAPI PostgREST `GET {SUPABASE_URL}/rest/v1/` con `Accept: application/openapi+json`;
2. `select('*', { count: 'exact', head: true })` su ciascuna tabella pubblica candidata;
3. API admin GoTrue `GET /auth/v1/admin/users` solo per **contare** e aggregare `created_at` per mese, senza persistire email o id;
4. lettura delle sole colonne necessarie (`created_at`, `logged_in_at`, `lesson_id`, `module_id`, `completed_at`, `game_type`, `dd_tricks`, `content`, `module_type`, `total_minutes`) e aggregazione in memoria.

`pg_catalog` / `pg_policies` / `pg_proc`: **non determinabile** (nessuna connessione SQL diretta).

Output: `db-aggregates.json`, `lesson-completions.json`, `game-type-distribution.json`.

Estratto d’uso:

```json
{
  "measured_at_europe_rome": "2026-08-13 13:10:01",
  "auth_registered_users": 1091,
  "profiles": 1091,
  "login_events": 10479,
  "cumulative_visible_minutes": 482994,
  "completed_module_rows": 18362,
  "users_completing_at_least_one_lesson": 342,
  "completed_lesson_user_pairs": 3079
}
```

Sessioni inferite (soglia 30 min): `inferred_sessions` 10467, media 0, mediana 0, `single_event_share` 0.999.

### 12.6 Cambio BCE

```text
$ curl -fsS 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'
<Cube time='2026-08-12'>
  <Cube currency='USD' rate='1.1545'/>
  …
```

File salvato: `audit-bridgelab/grok-raw/ecb-eurofxref-daily.xml`.

### 12.7 Verifiche

```text
$ npx tsc --noEmit ; echo EXIT:$?
EXIT:0

$ npx eslint src --max-warnings 0 ; echo EXIT:$?
EXIT:0

$ npm test
Test Files  1 failed | 35 passed (36)
Tests  1 failed | 737 passed (738)
FAIL  src/lib/palette.test.ts > … expected [ Array(1) ] to deeply equal []
+   "src/components/home/landing-page.tsx: 2 → 0"
EXIT:1

$ npm audit --json
vulnerabilities: { info: 0, low: 2, moderate: 2, high: 16, critical: 1, total: 21 }
```

Sintesi advisory: `npm-audit-summary.json`. JSON completo: `npm-audit.json` (non riprodotto per intero: è un catalogo di dipendenze, non una prova di sfruttabilità).

### 12.11 Build di produzione

```text
$ npm run build
> next build --webpack
▲ Next.js 16.1.6 (webpack)
✓ Compiled successfully in 21.6s
✓ Generating static pages using 9 workers (72/72) in 1514.9ms
EXIT:0
```

Log integrale: `audit-bridgelab/grok-raw/next-build.txt`.

### 12.8 Calcoli economici

File: `audit-bridgelab/grok-raw/economic-calculations.json` (effort 3824 h, A media 325040, B media 651992, C 57815.78).

### 12.9 Elenco tabelle live (OpenAPI)

asd, asd_clubs, assignments, badges, bbo_username_cleanup_2026_08, challenges, class_members, class_messages, classes, collectible_cards, completed_modules, course_worlds, courses, email_events, eserciziario_exercises, forum_comments, forum_likes, forum_poll_votes, forum_posts, friendships, game_results, glossary, guided_hands, instructor_requests, lesson_modules, lessons, login_history, partner_profiles, profiles, push_subscriptions, review_items, smazzate, tournament_results, trova_errore_scenarios, weekly_challenges.

### 12.10 Elenco rotte `page.tsx`

`/`, `/accessibilita`, `/admin`, `/admin/classi`, `/admin/istruttori`, `/amici`, `/appunti`, `/auth`, `/circolo/[slug]`, `/classi`, `/classi/[classId]`, `/classi/[classId]/compito/[assignmentId]`, `/classifica`, `/collezione`, `/dispense`, `/diventa-istruttore`, `/forum`, `/forum/[postId]`, `/forum/nuovo`, `/gioca`, `/gioca/analisi`, `/gioca/conta-veloce`, `/gioca/dichiara`, `/gioca/impasse`, `/gioca/mano-del-giorno`, `/gioca/mano-guidata`, `/gioca/memory`, `/gioca/minibridge`, `/gioca/pratica`, `/gioca/pratica-licita`, `/gioca/quiz-lampo`, `/gioca/quiz-prese`, `/gioca/segnali`, `/gioca/sfida`, `/gioca/sfida-amico`, `/gioca/sfida-imp`, `/gioca/sfida-link`, `/gioca/sfida-settimanale`, `/gioca/smazzata`, `/gioca/torneo`, `/gioca/trova-errore`, `/glossario`, `/guida`, `/impara`, `/impostazioni`, `/istruttori`, `/istruttori/[classId]`, `/istruttori/[classId]/compito/[assignmentId]`, `/istruttori/[classId]/nuovo-compito`, `/istruttori/genera-mani`, `/lezioni`, `/lezioni/[lessonId]`, `/lezioni/[lessonId]/[moduleId]`, `/login`, `/negozio`, `/obiettivi`, `/prima-mano`, `/privacy`, `/profilo`, `/profilo/wrapped`, `/registrati`, `/reset-password`, `/ripasso`, `/scopri`, `/scuola`, `/termini`, `/trova-circolo`, `/trova-compagno`, `/~offline`.

---

*Fine della perizia. Tutti i numeri sono ricalcolati sullo stato osservato il 13 agosto 2026. I dati personali non sono stati estratti nel documento.*
