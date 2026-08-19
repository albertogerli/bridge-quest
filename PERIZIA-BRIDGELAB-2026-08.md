# Perizia tecnica ed economica — Piattaforma BridgeLab

**Data di analisi:** 8 agosto 2026
**Oggetto:** piattaforma didattica bridgelab.it (repository `bridge-quest` + database Supabase di produzione)
**Metodo:** ogni numero contrassegnato **[M]** è *misurato* (deriva da un comando eseguito o da un file letto, riportato in Appendice); ogni numero contrassegnato **[S]** è *stimato* su assunzioni dichiarate. Dove un dato non è ricavabile, è scritto **non determinabile**.
**Dati personali:** dalle statistiche d'uso sono stati estratti esclusivamente aggregati (conteggi, medie, distribuzioni). Nessuna email, nome o identificativo utente compare in questo documento.

---

## 1. Sintesi per il Consiglio (una pagina)

BridgeLab è una piattaforma web (e app iOS) per l'insegnamento del bridge, sviluppata tra febbraio e luglio 2026 da un singolo autore con assistenza intensiva di strumenti di intelligenza artificiale (203 commit su 210 recano il co-authoring AI **[M]**). È in produzione, con utenti reali e uso continuativo.

**Cosa contiene, in concreto [M]:** 4 corsi, 49 lezioni e 199 moduli didattici attivi nel database; 12 modalità di gioco funzionanti; 272 smazzate (mani) precaricate; un motore di gioco della carta scritto da zero, incluso un risolutore "double-dummy" (la componente tecnicamente più sofisticata); un portale per istruttori con classi e compiti; area amministrativa; automazione email; 49 video-lezioni con avatar generate tramite servizio esterno.

**Chi la usa [M, dal database di produzione]:** 1.083 utenti registrati; picco di 678 utenti attivi nel mese di lancio (marzo 2026), assestati a 236–312 attivi/mese nel periodo aprile–luglio; 57.314 partite giocate; 18.156 moduli di lezione completati; ritenzione a 7 giorni 43,5% e a 30 giorni 31,5% — valori buoni per un prodotto didattico consumer. La crescita di nuovi iscritti è però in calo costante dopo il lancio (668 a marzo → 47 a luglio).

**Qualità tecnica:** il punteggio medio sulle 12 dimensioni esaminate è **2,3 su 5**. Il nucleo di dominio (motore di gioco, punteggi federali WBF, solver) è solido e ben isolato; le criticità principali sono: **assenza totale di test automatici**, **documentazione tecnica pressoché nulla**, pagine monolitiche fino a 2.246 righe, doppio modello di autorizzazione admin e alcune imprecisioni nelle policy di sicurezza del database. La piattaforma è oggi **fortemente dipendente dall'autore**: un team terzo può subentrare, ma con un periodo di affiancamento e un investimento iniziale in test e documentazione.

**Valore economico** (tre metodi separati, § 6):
- **A. Costo di riproduzione dalle ore misurate:** 67–102 ore di lavoro a ridosso dei commit **[M]** → 2.700–8.200 € **[S]**. È un limite inferiore *non rappresentativo*: misura solo il tempo di commit di uno sviluppo AI-assistito, non ciò che un mercato pagherebbe.
- **B. Costo di sostituzione** (commissionare oggi la stessa piattaforma a un fornitore esterno, incluse analisi, PM e test): **100.000–260.000 €**, valore centrale ≈ 170.000 € **[S]**, contenuti didattici esclusi.
- **C. Valore d'uso triennale** (licenza evitata di piattaforma comparabile + hosting, 3 anni): **35.000–160.000 €** **[S]**, il metodo più debole per assenza di listini pubblici comparabili.

**Range prudenziale del valore conferito alla Federazione: 90.000–180.000 €**, ancorato al metodo B (il più difendibile) con uno sconto per lo stato di maturità (assenza di test, documentazione e ridondanza di persone). I limiti della stima sono elencati al § 8.

---

## 2. Fase 1 — Metriche del repository

Tutti i valori di questa sezione sono **[M]** (comandi in Appendice A.1).

| Metrica | Valore |
|---|---|
| Commit totali | 210 (209 dell'autore, 1 automatico Vercel) |
| Primo commit | 8 febbraio 2026 |
| Ultimo commit | 27 luglio 2026 |
| Giorni di calendario con almeno un commit | 50 |
| Branch | 3 locali, 4 remoti; 2 merge commit |
| Righe aggiunte / rimosse (tutte) | 164.668 / 22.401 |
| Righe aggiunte / rimosse (esclusi lockfile, asset, documenti) | 143.533 / 22.028 |
| Dimensione mediana del commit | 132 righe modificate (media 913, 90° percentile 2.344) |
| Commit con co-authoring AI dichiarato | 203 su 210 |

**Distribuzione per mese [M]:** feb 53, mar 95, apr 7, mag 21, giu 20, lug 14. Sviluppo concentrato in febbraio–marzo (70% dei commit), poi manutenzione ed evoluzioni.

**Distribuzione per fascia oraria [M]:** 51 commit tra le 00 e le 03; 53 tra le 22 e le 24; il resto distribuito in orario diurno. Circa metà del lavoro è avvenuto in orario serale/notturno — coerente con uno sviluppo fuori dall'orario lavorativo.

**File più modificati [M]:** `src/app/page.tsx` (57 volte), `src/app/profilo/page.tsx` (38), `src/app/admin/page.tsx` (33), `src/app/lezioni/[lessonId]/[moduleId]/page.tsx` (27).

### 2.1 Stima dell'effort dai timestamp (non dalle righe)

Metodo prescritto: i commit sono raggruppati in sessioni di lavoro (nuova sessione se il gap dal commit precedente supera 90 minuti); a ogni sessione è attribuita la sua durata effettiva più 30 minuti di ramp-up.

| Parametri | Sessioni | Ore totali |
|---|---|---|
| Base (gap 90 min, ramp-up 30 min) | 78 | **84** |
| Parametri −30% (gap 63, ramp 21) | 84 | 67 |
| Parametri +30% (gap 117, ramp 39) | 73 | 102 |

**[M]** 78 sessioni; mediana 7 minuti, la più lunga 267 minuti; 33 sessioni contengono un solo commit (e ricevono quindi solo il ramp-up).

**Questa cifra è un limite inferiore, dichiaratamente.** Non cattura progettazione, debug, redazione dei contenuti, test manuale e tutto il lavoro non committato. Inoltre, 143.533 righe aggiunte in ~84 ore di finestra-commit (≈1.700 righe/ora) sono materialmente impossibili per scrittura manuale: confermano che lo sviluppo è stato in larga parte generato con assistenza AI (coerente con i 203 commit co-firmati) e che le ore misurate rappresentano il tempo di *supervisione e integrazione*, non l'equivalente di sviluppo tradizionale.

### 2.2 Righe di codice per linguaggio (cloc, esclusi node_modules, build, asset, lockfile) [M]

| Linguaggio | File | Righe di codice |
|---|---|---|
| TypeScript (app + dati + script) | 293 | 79.583 |
| Markdown (contenuti didattici sorgente, doc) | 65 | 11.455 |
| Python (pipeline video/infografiche) | 21 | 4.145 |
| SQL (schema, RPC, policy) | 22 | 1.635 |
| JSON / CSS / JS / Shell | 14 | 2.150 |
| **Totale** | **415** | **98.968** |

Ripartizione del TypeScript **[M]**: codice applicativo (`src/app`, `src/components`, `src/hooks`, `src/lib`, `src/contexts`) **59.035 righe**; contenuti strutturati (`src/data`) **18.085 righe**; script di supporto (`scripts/`) **12.852 righe**. **Test: 0 righe** (nessun file di test nel repository).

### 2.3 Conteggi strutturali [M]

| Elemento | Conteggio |
|---|---|
| Pagine/rotte (`page.tsx`) | 66 |
| Endpoint API (route handler) | 9 |
| Componenti React (`src/components`) | 90 |
| Hook custom | 26 |
| Moduli di libreria (`src/lib`) | 30 |
| Tabelle DB verificate esistenti in produzione | ≥ 25 (elenco in App. A.4); 2 riferimenti nel codice a tabelle inesistenti (`tournament_results`, `avatars`) |
| `CREATE TABLE` nei file SQL versionati | 13 (lo schema completo è gestito sulla dashboard Supabase, non versionato) |
| Policy RLS (`CREATE POLICY`) nei file SQL versionati | 37 |
| Funzioni RPC richiamate dal codice | 17 |
| Migrazioni versionate | 0 (nessuna directory di migrazioni; script SQL ad hoc in `scripts/sql/`, 23 file) |
| Test automatici | 0 |
| App mobile | progetto iOS Capacitor presente (`ios/App`, `capacitor.config.ts`) |

---

## 3. Fase 2 — Qualità e profondità architetturale

Punteggi da 1 a 5, conservativi, ciascuno con evidenze puntuali (percorso:riga) verificate direttamente sul codice.

| # | Dimensione | Voto | Evidenze principali |
|---|---|---|---|
| 1 | Separazione delle responsabilità | **2,5** | Dominio ben estratto in `src/lib` (`bridge-engine.ts` 810 r., `dds-solver.ts` 775 r., `catalog.ts` 1.369 r.); tre client Supabase separati per contesto (`src/lib/supabase/{client,server,admin}.ts`). Contro: 14 pagine monolitiche > 800 righe con stato+logica+UI nello stesso file — `src/app/lezioni/[lessonId]/[moduleId]/page.tsx` **2.246 righe**, `src/app/admin/page.tsx` 1.825, `src/app/gioca/torneo/page.tsx` 1.640; logica di progressione corsi inline nella UI (`src/app/lezioni/page.tsx:305-316`). |
| 2 | Modello dati e integrità referenziale | **3** | FK con `ON DELETE CASCADE` (`scripts/sql/login-history.sql:16`), log immutabili per default-deny (`game_results.sql:39-51`), RPC con guardia `is_admin()` documentata (`admin_classes.sql:5`). Contro: schema non versionato (nessuna migrazione), doppia fonte di verità contenuti (16 import residui da `@/data` accanto al catalogo DB, es. `src/app/gioca/impasse/page.tsx:7`), 2 tabelle referenziate dal codice ma assenti in produzione. |
| 3 | Autenticazione e autorizzazione | **2,5** | Auth Supabase corretta; controlli a livello di risorsa nelle API (`src/app/api/friends/notify/route.ts:45-50` verifica proprietà della risorsa oltre alla sessione). Contro: **nessun `middleware.ts`** (nessuna protezione di rotta centralizzata); gate admin **client-side** con email personale hardcoded (`src/app/admin/page.tsx:32,599`); due criteri di autorizzazione coesistenti (email in `/admin`, colonna `role` in `/admin/classi` — `src/app/admin/classi/page.tsx:19`); proxy `api/ben/*` senza alcuna verifica utente. |
| 4 | Sicurezza | **3** | Service-role key solo server-side (`src/lib/supabase/admin.ts:13`), zero segreti hardcoded (grep negativo), `.env*` in `.gitignore:34`, `dangerouslySetInnerHTML` solo su contenuto statico non-utente (`src/app/layout.tsx:112,115,172`), 37 policy RLS. Contro: nessuna libreria di validazione input (zod assente); input inoltrato non validato a servizio upstream (`src/app/api/ben/play/route.ts:10-20`); policy `login_history` con `USING (true)`: ogni autenticato può leggere lo storico login di tutti (`scripts/sql/login-history.sql:32-36`); secret del cron accettato anche in query string (`src/app/api/cron/engagement/route.ts:29-34`). |
| 5 | Gestione degli errori | **2,5** | Error boundary presenti (`src/app/error.tsx` + 3 di sezione); tutte le route API con try/catch. Contro: le route `ben/*` rispondono **HTTP 200 anche in errore** (`src/app/api/ben/play/route.ts:49-50`); messaggio d'errore grezzo del DB propagato al client (`src/app/api/instructor-request/route.ts:43`); numerosi `catch {}` silenziosi (8 nella sola `src/app/profilo/page.tsx`); nessun sistema di notifica errori all'utente (nessun toaster globale). |
| 6 | Performance e caching | **2,5** | Solver in Web Worker (`src/lib/dds-worker.ts`); landing server-rendered per LCP (`src/app/page.tsx:4-6`); ISR sul glossario (`src/app/glossario/page.tsx:8`). Contro: **63 pagine su 66 interamente client-rendered**; `next/dynamic` e `React.memo`: 0 occorrenze; 12 `<img>` raw contro 3 usi di `next/image`; polling con `setInterval` in 9 punti (fino a 5 s in `src/hooks/use-weekly-objectives.ts:186`) invece di Supabase Realtime. |
| 7 | Accessibilità | **3,5** | Skip-link (`src/app/layout.tsx:197` + `globals.css:485-499`), focus visibile globale (`globals.css:479-482`), `prefers-reduced-motion` (`globals.css:317-324`), profilo "senior" con font/contrasto maggiorati (`globals.css:334+`), touch target 44 px, pagina dichiarazione accessibilità dedicata (432 righe), 74 `aria-label`. Contro: focus management programmatico quasi assente (3 occorrenze), immagini non ottimizzate. |
| 8 | Internazionalizzazione | **1** | Assente per scelta: nessuna libreria i18n, stringhe italiane inline, `lang="it"` (`src/app/layout.tsx:110`). Nota: per una piattaforma federale italiana è una scelta legittima, ma una localizzazione richiederebbe un intervento esteso. |
| 9 | Copertura dei test | **1** | **Zero file di test** nell'intero repository [M]. Nessun framework di test installato. |
| 10 | CI/CD | **2** | Nessuna pipeline (`.github/workflows` assente); il deploy è automatico via Vercel su push a `main` (con build e lint come unico gate). Nessun ambiente di staging versionato. |
| 11 | Documentazione | **1,5** | `README.md` di 36 righe: boilerplate `create-next-app` non modificato; nessun documento di architettura; `docs/` contiene un solo file tecnico (`email-automation.md`, 64 righe). I 4 file `*-knowledge.md` in root (2.679 righe) sono materiale didattico sorgente, non documentazione tecnica. Buoni i docblock nei moduli critici (`src/lib/catalog.ts:1-19`). |
| 12 | Manutenibilità da parte di un team terzo | **2,5** | TypeScript `strict: true` (`tsconfig.json:12`), ESLint attivo, solo 23 `any` su ~60.000 righe, zero TODO/FIXME [M]. Contro: 21 pagine di gioco per 16.533 righe con logica ripetuta, assenza di test e documentazione: il subentro è possibile ma oneroso. |

**Punteggio medio: 2,3 / 5** (media aritmetica semplice; si noti che le voci 8 e 9 pesano al minimo e che la n. 8 riflette una scelta di prodotto, non un difetto).

### 3.1 Componenti a reale complessità algoritmica

In ordine decrescente di sofisticazione (righe misurate con `wc -l`; giudizi verificati sul codice):

1. **Solver double-dummy** — `src/lib/dds-solver.ts` (775 righe) + worker + hook (427 righe). Minimax con potatura alfa-beta scritto da zero in TypeScript: tabella di trasposizione, deduplica delle carte equivalenti, ricerca esatta sotto le 7 carte per mano, timeout 2 s con fallback euristico, esecuzione in Web Worker. È la componente proprietaria più sostanziosa. Riscrittura da zero da parte di uno sviluppatore senior con dominio bridge: **4–8 settimane [S]**.
2. **Motore di gioco + AI euristica** — `src/lib/bridge-engine.ts` (810 righe). Regole complete del gioco della carta (obbligo di risposta, vincitore della presa con atout, morto, claim) e AI che gioca per i 3 non-umani: "third hand high", cheapest-winner, tagli/sopratagli, inferenza dei vuoti avversari dalle mancate risposte. Euristica greedy senza look-ahead, ma corretta sul piano bridgistico. Riscrittura: **3–6 settimane [S]**.
3. **AI a difficoltà graduata** — `src/lib/ai-difficulty.ts` (218 righe): i livelli facili iniettano *errori plausibili da principiante* (non mosse casuali); il livello esperto usa il solver. Didatticamente ben pensata.
4. **Integrazione motore neurale BEN** — `src/lib/ben-client.ts` + `ben-format.ts` + 4 route API (442 righe totali). **Il motore neurale è software di terzi** (BEN, self-hosted Python/TensorFlow, fuori dal repository); il codice proprietario è il layer di conversione formati e la cascata di degrado BEN → solver → euristica. Da non conteggiare come algoritmo proprio.
5. **Scoring federale** — `src/lib/bridge-scoring.ts` (365 righe) + `scoring.ts` (93): punteggio contratto completo (vulnerabilità, contro/surcontro, slam) e conversione IMP con tabella ufficiale WBF a 24 soglie.
6. **Classificatore di errori di gioco** — `src/lib/play-error-classifier.ts` (219 righe): a fine mano riconosce 4 errori tipici (taglio mancato, vincente scartata, onore sprecato, scostamento dal piano ottimale via confronto col solver) e li mappa alla lezione che spiega il concetto, alimentando la coda di ripasso. Il pezzo di maggior valore didattico originale.
7. **Parser PBN** — `src/lib/pbn.ts` (284 righe): import del formato standard federale delle mani, usato dal portale istruttori.
8. **Generazione mani deterministica** — `src/lib/hand-encoder.ts` (128 righe): mani riproducibili da seed (PRNG Mulberry32 + Fisher-Yates), che rende le "sfide via link" giocabili senza salvare le carte. Scelta ingegneristica elegante.
9. **Pipeline video** — `scripts/compose_video.py` e correlati (~1.400 righe Python): l'avatar è generato da HeyGen (servizio esterno a pagamento), ma il compositing locale (chroma-key per frame, timeline slide automatica, sottotitoli .ass generati dallo script) è codice proprietario di media complessità.

**Componenti dichiaratamente semplici, da non sopravvalutare:** la ripetizione dilazionata usa intervalli fissi (1/3/7 giorni), non SM-2 (`src/hooks/use-spaced-review.ts`); i livelli XP sono una tabella hardcoded di 36 soglie (`src/lib/xp-levels.ts`); lo sblocco lezioni è sequenziale con soglia 50%; il "motore di licita" **non esiste**: è un banco di scenari curati a mano con confronto di stringhe (`src/data/bidding-practice-data.ts`, 442 righe).

### 3.2 Tempo di replica per un team esterno di 2 sviluppatori senior

**[S]** Assunzione: replicare la piattaforma *allo stato attuale* (stesso perimetro funzionale, stessa qualità, contenuti didattici esclusi), partendo da zero ma con la piattaforma esistente come specifica vivente (il che riduce drasticamente il costo di esplorazione).

Stima: **5–8 mesi di calendario**, pari a **10–16 mesi-persona** (≈ 1.700–2.700 ore). Ripartizione indicativa: motore di gioco + solver + scoring 2–3 mesi-persona; 12 modalità di gioco e UI 3–5; corsi/moduli/progressione/ripasso 2–3; social, sfide, classifiche, forum 1,5–2,5; portale istruttori + admin + email + iOS 1,5–2,5. Con parità di uso di strumenti AI il calendario può comprimersi, ma le fasi di verifica di dominio (regole del bridge, scoring federale) restano incomprimibili senza un esperto bridgista nel team. Se la variazione è ±30%: 7–21 mesi-persona.

---

## 4. Fase 3 — Profondità di prodotto

Fonte primaria: database di produzione **[M]** (i contenuti live divergono dal seed nel repository, che ne è la fotografia iniziale).

| Unità di contenuto | Quantità | Fonte |
|---|---|---|
| Corsi | 4 | DB [M] |
| Lezioni | 49 | DB [M] |
| Moduli didattici | 199 | DB [M] |
| Blocchi di contenuto nel seed (testo, regole, quiz, esempi…) | 11 tipi; 143 quiz, 37 vero/falso, 22 bid-select nel seed | repo [M] |
| Smazzate (mani) precaricate | 272 | DB [M] |
| Esercizi eserciziario | 31 | DB [M] |
| Scenari "trova l'errore" | 32 | DB [M] |
| Scenari pratica licita | 442 righe di scenari curati | repo [M] |
| Termini di glossario | 49 | DB [M] |
| Carte collezionabili | 22 | DB [M] |
| Badge definiti nel codice | 23 (13 visibili + 10 segreti) | repo [M] |
| Articoli negozio (cornici, temi, sfondi, titoli) | 30 | repo [M] |
| Video-lezioni con avatar | 49 file tracciati | repo [M] |
| Sfide settimanali configurate | 12 | DB [M] |
| Mani guidate | 2 | DB [M] |

**Modalità di gioco funzionanti (verificate dai risultati reali in produzione) [M]:** smazzata libera (32.076 partite registrate), sfida tra amici (10.074), mano del giorno (3.329), conta-veloce (2.524), memory (1.847), quiz-lampo (1.867), impasse (1.358), dichiara (1.135), mano guidata (1.105), pratica-licita (868), trova-errore (577), compiti per classe (554). Tutte e 12 hanno uso reale: **nessuna è un guscio vuoto**.

**Schermate e flussi [M]:** 66 pagine, raggruppabili in: gioco (21), apprendimento (9), social (7), scuola/istruttori (9), admin (3), gamification/negozio (4), onboarding/auth (6), legale/utility (7). Flussi completi end-to-end verificati dall'uso in produzione: registrazione → onboarding → corso → quiz → XP/badge; gioco → risultato → classifica; istruttore → classe → compito → svolgimento (554 compiti svolti); richiesta amicizia → sfida asincrona su mano condivisa.

**Parti abbozzate o incomplete [M]:** due etichette "Prossimamente"/"In arrivo!" (`src/app/ripasso/page.tsx:81`, `src/app/lezioni/page.tsx:267`); 2 tabelle referenziate ma inesistenti nel DB; mani guidate ferme a 2 unità; notifiche push predisposte ma senza iscritti (0 righe in `push_subscriptions`). Il resto del perimetro dichiarato risulta funzionante.

---

## 5. Fase 4 — Dati di utilizzo (aggregati, dal DB di produzione)

Estratti con query di sola lettura tramite credenziali di servizio in variabili d'ambiente locali (script in Appendice A.4). Tutti **[M]** salvo dove indicato.

| Indicatore | Valore |
|---|---|
| Utenti registrati totali | **1.083** |
| Nuovi iscritti per mese | feb 19 · mar 668 · apr 165 · mag 108 · giu 66 · lug 47 · ago (parziale) 10 |
| Utenti attivi per mese (MAU: ≥1 login nel mese) | feb 9 · mar 678 · apr 373 · mag 312 · giu 298 · lug 236 · ago (parziale) 128 |
| Eventi di login totali | 10.172 (proxy delle sessioni: un evento per login registrato) |
| Tempo medio di sessione | **non determinabile** (il DB registra i login, non la durata; l'analytics Vercel non è interrogabile da qui) |
| Moduli di lezione completati | 18.156 totali (401 utenti; mediana 20 moduli/utente, max 199 = corso completato) |
| Partite giocate | 57.314 totali (655 utenti distinti); per mese: mar 10.756 · apr 9.086 · mag 9.224 · giu 13.583 · lug 12.172 |
| Ritenzione a 7 giorni | **43,5%** (467 su 1.073 eleggibili) — definizione: almeno un login ≥7 giorni dopo la registrazione, tra gli iscritti da almeno 7 giorni |
| Ritenzione a 30 giorni | **31,5%** (326 su 1.036 eleggibili) — stessa definizione a 30 giorni |
| Distribuzione giorni attivi per utente | mediana 2 · media 9,4 · 90° percentile 26 · max 145; 470 utenti con 1 solo giorno; 319 con ≥5 giorni; 132 con ≥20 giorni |
| Amicizie | 55 accettate, 88 in attesa, 1 rifiutata |
| Forum | 17 post, 27 commenti (uso marginale) |
| Classi scolastiche | 15 classi, 52 membri, 14 compiti assegnati |
| Badge assegnati | 1.431 |
| Crescita mensile | **negativa dopo il lancio**: −75% di nuovi iscritti tra marzo e aprile, poi calo regolare (~ −30%/mese). Il volume di gioco per utente attivo, invece, cresce (giugno–luglio sono i mesi con più partite). |

**Lettura onesta:** la base attiva si è stabilizzata attorno a 230–300 utenti/mese con engagement per-utente alto (un nucleo di 132 utenti con 20+ giorni di attività) e ritenzione sopra le medie tipiche dell'e-learning consumer; l'acquisizione di nuovi utenti si è invece quasi fermata (da qui la campagna Google Ads appena attivata).

---

## 6. Fase 5 — Valutazione economica

I tre metodi restano separati perché divergono strutturalmente; la divergenza stessa è un'informazione (§ 6.4).

### 6.A Costo di riproduzione dalle ore misurate

Ore misurate (limite inferiore, § 2.1): 84 (range 67–102). Tariffe orarie di mercato italiane per sviluppo full-stack senior **[assunzione dichiarata]**: bassa 40 €/h, media 60 €/h, alta 80 €/h.

| | 67 h (−30%) | 84 h (base) | 102 h (+30%) |
|---|---|---|---|
| 40 €/h | 2.680 € | 3.360 € | 4.080 € |
| 60 €/h | 4.020 € | **5.040 €** | 6.120 € |
| 80 €/h | 5.360 € | 6.720 € | 8.160 € |

**Range A: ~2.700–8.200 € [S].** Questo metodo misura il *costo effettivo di produzione* di uno sviluppo AI-assistito da parte di un autore già esperto del dominio — non il valore della piattaforma. Va letto come piso contabile, non come stima di valore: non cattura progettazione, contenuti, debug e lavoro non committato, e le ore-commit di uno sviluppo AI-assistito non sono convertibili in ore di sviluppo tradizionale.

### 6.B Costo di sostituzione (commissionare oggi la piattaforma)

Base: replica da parte di team esterno = 10–16 mesi-persona di sviluppo (§ 3.2) ≈ 200–320 giornate. Overhead di fornitura (analisi funzionale, progettazione, PM, test di accettazione): +25% **[assunzione dichiarata]** → 250–400 giornate totali. Tariffa giornaliera blended di software house italiana **[assunzione dichiarata]**: 400–650 €/gg.

- Minimo: 250 gg × 400 € = **100.000 €**
- Centrale: 325 gg × 520 € ≈ **169.000 €**
- Massimo: 400 gg × 650 € = **260.000 €**
- Sensitività ±30% sul valore centrale: 118.000–220.000 €

**Esclusioni esplicite:** contenuti didattici (18.085 righe di dati strutturati, 199 moduli, 272 smazzate validate, 49 video). La loro riproduzione richiede didatti federali e non è quantificabile da questa analisi (**non determinabile** dal repository; i soli costi vivi HeyGen/API non sono ricostruibili). Il valore B è quindi una stima *per difetto* del costo di sostituzione complessivo.

### 6.C Valore d'uso triennale (costo evitato)

**[Assunzione dichiarata, la più fragile]:** non esistono listini pubblici per una piattaforma didattica di bridge white-label in italiano con gioco interattivo; il comparabile più vicino è una licenza istituzionale di piattaforma didattica di gioco, assunta a 15.000–40.000 €/anno. Hosting attuale (Vercel + Supabase, piani pro) stimato ~500–1.000 €/anno **[S]** (fatture non accessibili da questa analisi: **non determinabile** con precisione).

- 3 anni: licenza 45.000–120.000 € + hosting ~1.500–3.000 € → **~47.000–123.000 €**
- Sensitività ±30% sull'assunzione di licenza: **~35.000–160.000 €**

La manutenzione evolutiva (stimabile in 15–20%/anno del valore B se affidata a terzi) non è inclusa: è un costo che la Federazione sosterrebbe in entrambi gli scenari.

### 6.4 Conclusione economica

**Range prudenziale del valore conferito alla Federazione: 90.000–180.000 €.**

Il metodo più difendibile è il **B (costo di sostituzione)**: si fonda su quantità misurate (perimetro funzionale, righe, complessità verificata) e su tariffe di mercato osservabili, e risponde alla domanda economicamente rilevante per il Consiglio: *quanto costerebbe procurarsi oggi lo stesso asset*. Il metodo A è un piso contabile non rappresentativo (misura l'efficienza del processo produttivo, non il valore del prodotto); il metodo C dipende da un comparabile di licenza che non ha listino verificabile.

Il range prudenziale parte dal range B (100.000–260.000 €) e ne sconta la parte alta per: assenza di test automatici e documentazione (che un fornitore includerebbe nel prezzo), dipendenza da singolo autore, e maturità del prodotto (crescita utenti in calo). L'esclusione dei contenuti didattici dal computo opera in direzione opposta (prudenziale).

---

## 7. Tabella riassuntiva

| Indicatore | Valore | Tipo |
|---|---|---|
| Ore di lavoro stimate (limite inferiore da timestamp) | 84 h (range 67–102) | M (metodo dichiarato) |
| Commit | 210 in 170 giorni di calendario | M |
| Righe di codice (esclusi asset/lockfile/build) | 98.968 totali, di cui 59.035 applicative TS | M |
| Giorni di calendario con commit | 50 | M |
| Pagine / componenti / endpoint | 66 / 90 / 9 | M |
| Contenuti | 4 corsi, 49 lezioni, 199 moduli, 272 smazzate, 49 video | M |
| Utenti registrati / attivi ultimo mese pieno | 1.083 / 236 | M |
| Ritenzione D7 / D30 | 43,5% / 31,5% | M |
| Punteggio medio di qualità | 2,3 / 5 | valutazione su evidenze |
| Test automatici | 0 | M |
| Valore stimato (range prudenziale) | **90.000–180.000 €** | S |

---

## 8. Limiti della presente analisi

1. **Le ore misurate sono un limite inferiore strutturale.** Il metodo a sessioni cattura solo il tempo in prossimità dei commit: progettazione, studio, redazione contenuti, test manuale e debug fuori sessione non lasciano traccia. Non è possibile ricostruire le ore reali dell'autore.
2. **Lo sviluppo è stato AI-assistito (203/210 commit).** Le metriche tradizionali (righe/ora, costo/riga) non sono confrontabili con benchmark storici di sviluppo manuale; il costo di riproduzione "di mercato" (metodo B) presume un fornitore che potrebbe a sua volta usare AI, con prezzi in rapida evoluzione: la tariffa assunta potrebbe invecchiare in fretta.
3. **La qualità è valutata staticamente.** Nessun test automatico esiste e questa perizia non ne ha eseguiti: la correttezza funzionale è desunta dall'uso reale in produzione (57.314 partite), non da verifica sistematica. Bug latenti non sono escludibili.
4. **Lo schema del database non è interamente versionato.** Tabelle e policy sono state verificate in produzione solo per esistenza e conteggio; una revisione di sicurezza completa delle policy RLS richiederebbe accesso alla definizione integrale dello schema.
5. **I comparabili del metodo C non hanno listino pubblico.** Il valore d'uso triennale poggia su un'assunzione di prezzo di licenza non verificabile.
6. **I dati di utilizzo hanno proxy imperfetti.** Le "sessioni" sono eventi di login (una tantum per accesso registrato); durata delle sessioni e traffico anonimo non sono misurabili da qui. Lo storico login parte da un backfill iniziale (un record per utente preesistente).
7. **Il valore dei contenuti didattici non è periziato.** Richiede una valutazione di merito bridgistico-didattico fuori dal perimetro di un'analisi tecnica.
8. **Nessuna verifica dei costi vivi storici** (HeyGen, hosting, domini, advertising): fatture non accessibili.
9. **L'analista ha operato sul repository e sul database forniti dall'interessato**: non è un audit forense; la provenienza e l'originalità del codice non firmato da terzi sono assunte, non provate (il solver e il motore risultano comunque privi di dipendenze esterne e coerenti con lo stile del resto del codice).

---

## Appendice A — Comandi eseguiti e output grezzi

### A.1 Metriche git

```
git rev-list --count HEAD                                   → 210
git shortlog -sn HEAD                                       → 209 albertogerli, 1 Vercel
git log --reverse --format="%h %ad" --date=iso | head -1    → 6471b48 2026-02-08 00:15:02 +0100
git log -1 --format="%h %ad" --date=iso                     → 370a40a 2026-07-27 23:27:24 +0200
git log --format=%ad --date=short | sort -u | wc -l         → 50
git branch -a                                               → main, perf/tier0-quickwins, redesign/ui-v2 (+4 remoti)
git log --merges --oneline | wc -l                          → 2
git log --format=%ad --date=format:%Y-%m | sort | uniq -c   → 53 feb, 95 mar, 7 apr, 21 mag, 20 giu, 14 lug
git log --format=%ad --date=format:%H | sort | uniq -c      → (distribuzione oraria, § 2)
git log --format=%ad --date=format:%a | sort | uniq -c      → Tue 49, Wed 48, Sun 28, Mon 26, Thu 25, Sat 18, Fri 16
git log --numstat --format= | awk '{a+=$1; d+=$2}'          → +164.668 / −22.401
  (filtrato senza lockfile/public/asset)                    → +143.533 / −22.028
git log --name-only --format= | sort | uniq -c | sort -rn   → top: src/app/page.tsx 57, profilo 38, admin 33
git log --shortstat  → mediana 132, media 913, p90 2.344 righe/commit (script Python in sessione)
git log --grep="Co-Authored-By: Claude" --oneline | wc -l   → 203
```

Sessioni di lavoro: script Python sui timestamp `git log --format=%at` — gap 90 min, ramp-up 30 min → 78 sessioni, 84,4 h; varianti ±30% → 67–102 h.

### A.2 Righe di codice

```
npx cloc --vcs=git --exclude-dir=node_modules,.next,ios,public \
  --not-match-f='(package-lock\.json|\.lock$)' .
→ TypeScript 79.583 · Markdown 11.455 · Python 4.145 · SQL 1.635 · JSON 1.494 · CSS 400 · JS 214 · Shell 42 · TOT 98.968

cloc src/app src/components src/hooks src/lib src/contexts  → 59.035
cloc src/data                                               → 18.085
cloc scripts                                                → 12.852
find . -name "*.test.*" -o -name "*.spec.*" (escl. node_modules) → 0 file
```

### A.3 Conteggi strutturali

```
find src/app -name page.tsx | wc -l          → 66
find src/app -name route.ts | wc -l          → 9
find src/components -name "*.tsx" | wc -l    → 90
ls src/hooks | wc -l                         → 26
ls src/lib | wc -l                           → 30
grep -c "CREATE TABLE" scripts/sql/*.sql     → 13 · "CREATE POLICY" → 37
grep -rhoE '\.rpc\("[a-z_]+"' src | sort -u  → 17 funzioni RPC
ls .github/workflows                         → assente
git ls-files public/videos | wc -l           → 49
```

### A.4 Query aggregate sul database di produzione

Script Node temporaneo (`scripts/perizia-stats*.mjs`, creato ed eliminato in sessione) con client `@supabase/supabase-js` e chiave di servizio da `.env.local`; sole `SELECT` con `count/head` e paginazione su colonne non identificative (`created_at`, `status`, `game_type`, `user_id` usato solo per conteggi distinti in memoria). Output integralmente aggregato (riportato ai § 4–5): totali per tabella (profiles 1.083, completed_modules 18.156, game_results 57.314, login_history 10.172, challenges 501, badges 1.431, friendships 144, forum_posts 17, forum_comments 27, review_items 121, classes 15, class_members 52, assignments 14, instructor_requests 15, email_events 564, smazzate 272, lessons 49, lesson_modules 199, courses 4, eserciziario_exercises 31, guided_hands 2, trova_errore_scenarios 32, glossary 49, collectible_cards 22, asd_clubs 260, weekly_challenges 12, push_subscriptions 0), serie mensili di iscrizioni/login/moduli/partite, MAU, distribuzione giorni attivi, ritenzione D7/D30 con definizione dichiarata, ripartizione partite per tipo. Tabelle `tournament_results` e `avatars`: errore "not found in schema cache" → referenziate dal codice ma inesistenti in produzione.

### A.5 Evidenze qualitative

Raccolte con ispezione diretta dei file citati nel § 3 (formato percorso:riga); conteggi con `grep -rc` (`aria-label` 74, `"use client"` 178 file, `setInterval` 9 usi applicativi, `: any`+`as any` 23, `dangerouslySetInnerHTML` 3, `next/dynamic` 0, `React.memo` 0, zod 0, TODO/FIXME 0 reali) e `wc -l` sulle pagine (> 800 righe: 14 file, § 3 voce 1).

---

*Perizia redatta con strumenti automatici di analisi statica e query aggregate di sola lettura; nessuna modifica è stata apportata al codice o ai dati in questa attività.*
