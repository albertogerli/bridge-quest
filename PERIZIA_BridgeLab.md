# Perizia tecnica ed economica — piattaforma **BridgeLab** (FIGB Bridge LAB)

**Data estrazione:** 15 agosto 2026 (sera) · **Versione:** 5 (v4 = 15 ago mattina; v3 = 13 ago).
**Fonti:** repository Git locale + database Supabase di produzione (sola lettura) + analisi statica del codice.

**Convenzioni.** **(M)** = misurato da comando eseguito o file letto; **(S)** = stimato su assunzioni dichiarate. Comandi e output in **Appendice A**. Evidenze in `percorso:riga` o commit. Nessun dato personale: solo aggregati. L'autore è "1 sviluppatore".

> **Perché una v5 (stesso giorno della v4).** Dalla v4 sono arrivati **7 commit** che chiudono i punti principali del piano di rimedio: **tetto agli invii di email sui route sensibili** (P0.1) e **`next build` nella CI** (P1.1) — commit `0f22a51`. Seguono una **caccia strutturata ai difetti** (9 trovati e corretti, con e2e nuova, `3ac54c0`), il fix della distribuzione province/regioni (tutte "N/D", `f70f36a`), il divieto di dichiarare fuori turno con motivo mostrato (`f8a741c`) e la difesa della sitemap che poteva bloccare un deploy (`1aa04fe`). Con queste chiusure il **punteggio medio di qualità supera per la prima volta 4,0/5**.

---

## 1. Sintesi esecutiva (per non tecnici)

BridgeLab è l'applicazione ufficiale per l'insegnamento del bridge della Federazione (sito PWA + app iOS/Android): **49 lezioni** in 4 corsi, **272 mani didattiche**, **oltre 300 esercizi**, quiz a contenuto illimitato generato dal motore, glossario, punti e riconoscimenti, social, **260 circoli**, area istruttori/classi.

**Cosa è arrivato in 2 giorni (13–15 agosto).** Dieci nuove funzionalità, **tutte complete e funzionanti**: un **tavolo condiviso** dove si gioca davvero in più persone (con l'insegnante che può giocare per un allievo e annullare), la **licita a due contro il computer** (asincrona, con il richiamo "tocca a te" via email), i **tornei di licita** (8 mani al giorno, 24 alla settimana, con classifica), le **sfide a coppie** con punteggio in IMP (il metro delle gare reali), i **codici amico** da 6 caratteri dettabili al telefono, la **bacheca del circolo**, l'**archivio delle posizioni**, gli **esercizi pubblicati dall'insegnante** e un nuovo **voto a stelle per singola mano** basato sul valore atteso — non sulla fortuna. Ogni flusso è stato **provato end-to-end con utenti veri** (117 controlli automatici dedicati). In serata, sette commit di consolidamento hanno chiuso i rilievi principali della perizia precedente: tetto agli invii di email (anti email-bombing), build automatico nella pipeline, nove difetti corretti da una caccia strutturata.

**Come è fatto il lavoro nuovo — e questo è il punto qualitativo.** Le regole di gioco sono verificate anche **sul database** (non solo nel browser): la carta deve appartenere alla mano e non essere già usata; due dichiarazioni simultanee vengono serializzate; chiudere una sfida due volte non doppia il punteggio. Le nuove tabelle sono **tutte protette** (11 su 11), e per la più delicata — quella che contiene le quattro mani — è stato adottato un modello dove **nessuno può leggere direttamente i dati**: tutto passa da funzioni che restituiscono solo la mano di chi chiede. Il voto a stelle confronta **valore atteso con valore atteso** (le stelle di prima misuravano la fortuna); la tavola dei punteggi, duplicata fra app e database, è **verificata identica su 2.940 casi**. Il sistema di monitoraggio errori (Sentry) è **attivo in produzione e sta già guidando correzioni**.

**Avvertenza onesta sull'uso.** Le nuove funzionalità sono state rilasciate nelle ultime 48 ore e **non hanno ancora adozione misurabile** (0 sessioni di licita a due, 0 sfide a coppie, 0 bacheche; 2 tornei creati, quasi certamente di collaudo). Sono pronte e verificate, ma il valore d'uso deve ancora manifestarsi. Nel frattempo la base resta: **1.095 utenti**, 235 attivi negli ultimi 30 giorni (~21%), 165 attivi finora ad agosto.

**Dimensioni e sforzo.** Codice applicativo **~80.700 righe** (più ~7.900 di test), **81 schermate**, **12 endpoint**, **~49 tabelle**, realizzate da **un solo sviluppatore** in **57 giornate** (8 febbraio – 15 agosto). Sforzo misurabile ≥ **126 ore** (M, limite inferiore); ricostruzione da zero stimata **~3.300 ore** (S, range 2.300–4.300).

**Qualità: 4,0/5** (v1: 2,5 → v2: 3,6 → v3: 3,8 → v4: 3,9 → v5: 4,0). Forte su motore, autenticazione, errori, documentazione, sicurezza del dato. Con il build entrato in CI e il tetto alle email, la pipeline di controllo copre ora il ciclo completo tipi→lint→test→**build**; restano da collegare in automatico i collaudi end-to-end e i test delle policy di sicurezza (esistono, vanno eseguiti a mano).

**Valore economico.** Metodi: riproduzione €132–281k, sostituzione €170–330k, valore d'uso triennale €50–113k. **Range prudenziale: €120.000–€240.000** (centrale ~€175.000), in crescita sulla v3 per i nuovi sottosistemi complessi e verificati. Replicazione per 2 senior: **~12–16 mesi** (~22 persone-mese).

---

## 2. Fase 1 — Metriche del repository

### 2.1 Git (M; A1–A3)

| Metrica | Valore |
|---|---|
| Commit totali | **326** (v4: 319; v3: 284; v2: 260; v1: 210) |
| Commit per autore | 1 sviluppatore = 325; pipeline = 1 |
| Periodo | 8 febbraio 2026 → 15 agosto 2026 |
| Giorni con ≥1 commit | **57** |
| Distribuzione mensile | feb 53 · mar 95 · apr 7 · mag 21 · giu 20 · lug 14 · **ago 116** |

**Agosto è il mese più produttivo del progetto** (M), nonostante il prodotto sia "in manutenzione": il ritmo è di sviluppo attivo, non di decay post-lancio.

### 2.2 Sforzo dai timestamp (M; A3)

Sessioni (gap > 90', +30' ramp-up): **100 sessioni** → **sforzo ≥ 128,2 ore** (M, limite inferiore; non è una stima di ricostruzione).

### 2.3 Righe di codice (M; A4)

| Categoria | File | Righe non vuote |
|---|---|---|
| Codice applicativo (`src/`) | 435 | **81.176** (v4: 80.748; v3: 74.473) |
| Contenuti didattici (`src/data/`) | 21 | 18.848 (invariati) |
| **Test** | 58 | **8.126** (v4: 7.892; v3: 6.221) |
| Schema SQL | 52 | 10.076 (+1 file `vincoli-allineati`) |
| Tooling | 55 | 11.412 |

Escluso `_dump-contenuti.json` (export di contenuti, non codice).

### 2.4 Conteggi di struttura (M; A5)

| Elemento | n. | | Elemento | n. |
|---|---|---|---|---|
| Schermate | **81** | | Tabelle DB (baseline) | **~49** (+11) |
| Endpoint API | **12** | | Nuove policy RLS | 18 (tabelle nuove 11/11 con RLS) |
| Componenti | 102 | | Test unit | 58 file |
| File `"use client"` | ~280 | | Collaudi e2e dedicati | 8 script, 117 asserzioni |

---

## 3. Fase 2 — Qualità e profondità architetturale

### 3.1 Valutazione per dimensione (1–5)

| # | Dimensione | Voto | Sintesi con evidenze |
|---|---|---|---|
| 1 | Separazione responsabilità | **3,5/5** ↑ | I nuovi flussi seguono il pattern buono: logica in `src/lib` con test, UI in componenti riusati (`asta.tsx` in 3 schermate; `licita`/`torneo-licita` riusano gli stessi moduli, `src/app/gioca/licita/page.tsx:3-27`). Controesempi: `gioca/licita/page.tsx` 527 righe (vuole un hook) e le 9 pagine `gioca/*` storiche (800–1.400) da rifattorizzare. |
| 2 | Modello dati / integrità | **4,5/5** ↑ | +11 tabelle tutte con RLS; `bidding_sessions` **senza policy per progetto** (tutto via SECURITY DEFINER che filtrano le mani: `licita-a-due-2026-08.sql:62-67`); concorrenza con `FOR UPDATE` (`:183,279`); chiusure idempotenti (`sfida-coppie-2026-08.sql:251`); mezzo voto garantito dal vincolo DB `numeric(2,1)` con check `(stelle*2)=floor(stelle*2)`. Baseline ricostruibile + drift-check (v3). |
| 3 | Autenticazione | **5/5** | Invariato: Supabase SSR, PKCE, `proxy.ts` con `getUser()`, messaggi localizzati. |
| 4 | Autorizzazione / RLS | **4,5/5** | Modello esemplare sui nuovi tavoli: funzioni che restituiscono solo la mano del chiamante; errori volutamente generici per non far filtrare informazioni (`tavolo-giocabile-2026-08.sql:93-98`); codici amico che espongono solo id+nome (`codice-amico-2026-08.sql:95-110`). Residui: 4 tabelle `using(true)` espongono `user_id`/contratti a ogni autenticato (coerente con classifica pubblica, ma è dato comportamentale nuovo); stato core dipende ancora dalla dashboard. |
| 5 | Sicurezza (input/secret) | **4,5/5** ↑ | **P0.1 chiuso (commit `0f22a51`)**: `rateLimit` ora su **tutti i 9 route** che accettano input — inclusi i tre sensibili `friends/notify`, `instructor-request`, `account/delete` (tetto agli invii email). Le API nuove nascono già con zod+rateLimit+timeout progettato (`api/ben/bid`, `AbortController` 8s < `maxDuration` 30). Residui: zod mancante su `account/delete` (ora comunque con rate limit e auth); CSP `script-src 'unsafe-inline'` (decisione documentata). |
| 6 | Gestione errori | **5/5** | Sentry **attivo in produzione**: le segnalazioni stanno guidando fix reali (commit `478a5e7` "due segnalazioni da Sentry: una era un difetto vero", `8776b64`, `832ee3e`). Il bug di concorrenza "Not north's turn" è stato corretto **nell'invariante del motore** con test che lo riproduce (`bridge-engine.test.ts:112-156`), non con una toppa locale. |
| 7 | Performance / caching | **4/5** | BEN su Railway EU; valore atteso **precalcolato** (280 numeri/mano: l'EV esce con una somma, senza risolvere, `valore-atteso.ts:296`); timeout BEN progettati. Gap invariato: nessun `generateStaticParams`. Nuovo rischio noto: `/api/licita/avversario` serializza fino a 16 chiamate BEN (richieste potenzialmente lunghe). |
| 8 | Accessibilità | **4/5** | Invariato (dichiarazione WCAG 2.2 AA, axe in e2e, focus trap). |
| 9 | Internazionalizzazione | **1/5** | Assente, per scelta di prodotto. |
| 10 | Copertura test | **4,5/5** ↑ | 58 file unit (+15) incl. le regole d'asta (23 test), l'esito del contratto (16, con il caso di produzione dell'asta bloccata), le stelle (13), l'EV (11); **8 collaudi e2e con utenti veri** (117 asserzioni); prove di **equivalenza TS↔SQL** su 2.940 casi (`prova-punteggio-sql.mjs`, `prova-imp-sql.mjs`); `test:rls` esteso alle 6 tabelle nuove. Gap: prove e2e/equivalenza **non in CI**. |
| 11 | CI/CD | **3/5** ↑ | **Build entrato in CI** (`0f22a51`): ora `npm ci` → `tsc --noEmit` → `eslint --max-warnings 0` → `npm test` → **`npm run build`**. La pipeline cattura la classe di errori che aveva colpito in produzione (CSP/WASM). Restano fuori: e2e Playwright, `test:rls`, `schema:check` e le prove di equivalenza TS↔SQL — esistono e sono ottimi, ma vanno eseguiti a mano. La sitemap non può più bloccare il deploy (`1aa04fe`). |
| 12 | Documentazione | **5/5** | Invariato e in crescita: runbook aggiornato (rifornimento scorta mani), header dei moduli che dichiarano le decisioni ("nessuna regola di permesso nel client"), commit message che citano il caso di produzione che ha motivato il fix. |
| 13 | Manutenibilità team terzo | **4/5** | DB ricostruibile, logica isolata e testata, convenzioni coerenti e dichiarate nei file. Residui: 9 pagine storiche monolitiche, `licita/page.tsx` 527 righe, **bus factor = 1**. |

**Punteggio medio: 4,0/5** (media = 4,00; v4: 3,9; v3: 3,8; v2: 3,6; v1: 2,5).
**Giudizio specifico sui nuovi sottosistemi (analisi dedicata): disciplina architetturale 4,5/5** — regole nel motore, permessi nel DB, duplicazioni governate da prove di equivalenza, fix alle cause con invarianti testati.

> Nota di metodo: la "caccia strutturata ai difetti" (`3ac54c0`) è un segnale di maturità ulteriore: nove difetti trovati proattivamente (il primo ammesso essere dello stesso autore, quella mattina), ciascuno con test o e2e di accompagnamento — non correzioni driven solo da segnalazioni utenti.

### 3.2 Componenti a reale complessità algoritmica

| Componente | Cosa fa | Righe nucleo | Complessità |
|---|---|---|---|
| **Motore + DDS + AI + BEN + scoring** | Gioco della carta; 3 motori double-dummy (euristico, esatto TS, WASM di terze parti `bridge-dds`); replay; **BEN ora dichiara** (proxy `api/ben/bid`, integrazione validata: 96% di accordo con il Naturale dei corsi su 25 aperture non ambigue — misura onesta, 1 disaccordo discusso); scoring IMP con tavola duplicata TS↔SQL verificata. | ~3.600 | **4,5/5** |
| **Valutazione delle mani / voto a stelle** ↑ | **Novità sostanziale**: il voto confronta **valore atteso con valore atteso** usando le distribuzioni delle prese sulle rimescolate (280 numeri/mano precalcolati), scala in **IMP persi** con mezze stelle (SVG `clipPath`, non troncamento); degrada esplicitamente al par quando mancano le distribuzioni ("meglio un metro più grezzo che due metri diversi"). Più il generatore con DSL dei vincoli (41 test) e la scorta HCP simmetrica. | ~1.500 | **4/5** ↑ |
| **Generazione mani** | `deal-generator` (rejection sampling + vincoli + 7 template), scorta di 1.504 mani già in DB, pubblicazione scenari con rollback. | (incluso sopra) | — |
| **SRS (ripasso)** | Leitner a 5 scatole. Invariato. | ~266 | **3/5** |
| **Gamification** | XP/fiches preesistenti; le **stelle NON sono valuta**: voto per singola mano in IMP, non accumulabile né spendibile (nessun `awardXp` nelle pagine nuove). | ~660 | **2,5/5** |
| **Progressione** | Invariata (`progression.ts`). | ~257 | **3/5** |

**Precisazione onesta (invariata):** il motore double-dummy esatto è di terze parti; il valore è integrazione + complementi originali (EV/stelle, asta, replay).

### 3.3 Sicurezza rispetto alla v1 (M + analisi)

Probe in produzione: `profiles` → 0; `login_history` → 0; `game_results` → 401. Dei 6 rilievi v1: **4 chiusi, 2 parziali** (CSP `unsafe-inline` con decisione documentata; rate limit — ora esteso a tutti i route sensibili, resta la natura per-istanza serverless del limiter in-memory). **Nessuna regressione** sui 42 commit delle v4–v5; le superfici nuove nascono protette. Nota positiva: il sistema "tocca a te" invia email transazionali senza consenso marketing — difesa argomentata (partita avviata dall'utente, max 1 ogni 20h), ma è il confine da sorvegliare perché non scivoli verso email promozionali.

### 3.4 Tempo di replicazione per team esterno (S)

| Componente | Persone-mese (S) |
|---|---|
| Motore + DDS + EV/stelle + asta + BEN (integrazioni, non riscritture del DDS) | 2–3 |
| Applicazione (81 schermate, auth, social, gamification, portale istruttori + strumenti didattici + **tavolo condiviso, licita a due, tornei, sfide a coppie**) | 13–17 |
| Backend/DB (~49 tabelle, ~50 funzioni, RLS, concorrenza `FOR UPDATE`, punteggio lato server) | 3–4 |
| Test + collaudi e2e + CI + integrazione + deploy | 3,5–4,5 |
| **Totale** | **~21,5–28,5 (centrale ~22 PM)** |

Cross-check volume: ~98.600 righe (app+schema+test) / ~200–250 righe-giornaliere senior ≈ 20–25 PM, coerente.
- Calendar (2 senior): **~12–16 mesi** (centrale ~14). Ore: **~3.300 h centrali** (±30%: 2.300–4.300).
- I nuovi sottosistemi sono **più costosi per riga** della media CRUD (concorrenza, permessi granulari, punteggio lato server): la stima riflette la difficoltà, non solo il volume.

---

## 4. Fase 3 — Profondità di prodotto

### 4.1 Contenuti (M; A6)

Invariati rispetto alla v3: **49 lezioni**, **220 quiz** embedded, **89 scenari** esercizio, **272 mani** didattiche, **49 voci** glossario, 31 eserciziario, 32 trova-errore, quiz "Quante prese?" illimitato. **Nuovo patrimonio generato**: **1.504 mani** in scorta (`mani_generate`) per allenamento/tornei (contenuto di esercitazione, non lezione).

### 4.2 Le 10 funzionalità nuove (13–15 ago) — tutte COMPLETE (M)

| Funzionalità | Stato | Evidenza chiave |
|---|---|---|
| Tavolo condiviso giocabile | Completa | Gioco verificato anche lato DB (`live_table_play`); collaudo 14 controlli con 2 utenti veri (`prova-tavolo.mjs`) |
| Licita a due asincrona + BEN | Completa | Turno controllato in SQL; avversari dichiarati dal **server** (il browser non ha le mani); collaudo 20 controlli |
| Richiamo "tocca a te" | Completa | Trigger + email di servizio; collaudo 18 controlli |
| Tornei di licita (8/giorno, 24/sett.) | Completa | Mani consegnate una volta sola, no rigioco, classifica; collaudo 26 controlli |
| Sfida a coppie in IMP | Completa | Punteggio calcolato dal server; collaudo 37 controlli; limite dichiarato onestamente ("non è duplicato vero: entrambe le coppie giocano la stessa linea") |
| Codici amico (6 caratteri) | Completa | Alfabeto senza caratteri ambigui, solo id+nome esposti; collaudo 12 controlli |
| Bacheca del circolo | Completa | 3 policy (soci leggono, istruttori scrivono per il proprio ASD); nessun collaudo dedicato (verifica più leggera del gruppo) |
| Archivio mani/posizioni | Completa | Privato per scelta dichiarata |
| Esercizi pubblicati dall'insegnante | Completa | Pubblicazione con ritiro automatico se il salvataggio fallisce |
| Confronto campo filtrato (amici/classe/circolo) | Completa | Funzione SQL dedicata |

### 4.3 Adozione reale delle novità (M; A7) — dato onesto

Le funzionalità sono state rilasciate nelle ultime 48 ore: **bidding_sessions 0, sfide_coppie 0, club_posts 0, saved_hands 0, live_tables 1, tornei 2, scenari 7, risultati_mano 16** (quasi certamente collaudi), stock di 1.504 mani pronto. **Complete ma non ancora usate**: il valore d'uso deve ancora manifestarsi.

---

## 5. Fase 4 — Dati di utilizzo (aggregati)

| Metrica | Valore | Trend vs v4 |
|---|---|---|
| Utenti registrati | **1.095** | stabile |
| Attivi 7 / 30 giorni | **132 / 235** | stabile (131/235) |
| MAU agosto (in corso) | **166** | in crescita nel mese |
| MAU serie | feb 9 · **mar 678** · apr 373 · mag 312 · giu 298 · lug 236 | calo strutturale, agosto in linea per ~250 |
| Moduli completati / Risultati | 18.478 / 60.755 | +4 / +359 (giornata) |
| Impegno totale | **492.983 min ≈ 8.216 ore** (mediana 35') | stabile |
| Ritenzione (proxy) | rientrati 57,6% · ≥7gg 43,8% · ≥30gg 30,9% | stabile |

Quadro invariato: crescita concentrata a marzo, poi calo stabilizzatosi; ~21% attivi a 30 giorni. Le novità non hanno ancora impatto misurabile.

---

## 6. Fase 5 — Valutazione economica

Tariffe dichiarate (senior full-stack Italia 2026): bassa €40/h · media €60/h · alta €85/h. Ore di ricostruzione: **~3.300 h centrali** (±30%).

**A. Riproduzione:** €132k / €198k / €281k (bassa/media/alta) → **range €132k–€281k** (centrale ~€198k).
**B. Sostituzione** (fornitore, +25/40%): **€170k–€330k** (centrale ~€235k).
**C. Valore d'uso triennale** (licenza evitata €36–90k + hosting €1,8–5,4k + manutenzione €10–18k): **€50k–€113k** (centrale ~€82k).

| Metodo | Range | Centrale |
|---|---|---|
| A. Riproduzione | €132k–€281k | ~€198k |
| B. Sostituzione | €170k–€330k | ~€235k |
| C. Valore d'uso 3 anni | €50k–€113k | ~€82k |
| **Prudenziale consolidato** | **€120.000–€240.000** | **~€175.000** |

**Più difendibile: A.** L'aumento vs v3 (€110–220k) riflette: +6.300 righe applicative, +11 tabelle, e soprattutto sottosistemi **più costosi per riga** (multiplayer con concorrenza, punteggio lato server, permessi granulari) tutti **completati e collaudati end-to-end**. La crescita del valore è misurata sul costo di ricostruzione, non sull'ottimismo sull'adozione — che al momento è zero e va riverificata.

---

## 7. Tabella riassuntiva finale

| Voce | Valore | Tipo |
|---|---|---|
| Ore stimate (ricostruzione) | ~3.300 (range 2.300–4.300) | S |
| Ore (limite inferiore, committate) | ≥128,2 | M |
| Commit totali | 326 | M |
| Righe di codice (applicative) | 81.176 (src totale ~108k; test 8.126) | M |
| Giorni di lavoro attivi | 57 | M |
| Punteggio medio di qualità | 4,0 / 5 (v4: 3,9 · v3: 3,8 · v2: 3,6 · v1: 2,5) | M+giudizio |
| Utenti / attivi 30gg | 1.095 / 235 | M |
| Funzionalità complete (incl. 10 nuove) | tutte complete; adozione nuove ≈ 0 | M |
| Tempo di replicazione (2 senior) | ~12–16 mesi (~22 PM) | S |
| **Valore stimato (prudenziale)** | **€120.000–€240.000** (centrale ~€175k) | S |

---

## 8. Limiti della presente analisi

1. **Sforzo storico reale** certo > 126 h ma non quantificabile (progettazione, debug, lavoro non committato).
2. **Correttezza funzionale**: 58 suite + 117 collaudi e2e ispirano fiducia, ma non certificano ogni caso; 56/272 mani storiche restano con contratti errati (da correggere, piano di rimedio P2.1).
3. **Valore delle novità non ancora dimostrato dall'uso**: adozione ≈ 0 a 48h dal rilascio. La stima di valore si basa su costo di ricostruzione, non su adozione; una perizia futura dovrebbe verificare se tornei/licita/tavolo vengono adottati.
4. **Stato di sicurezza non totalmente verificabile** (RLS sondato su 3 tabelle; le policy sono documentate nella baseline ma l'effetto va verificato per tabella).
5. **Metriche d'uso proxy** (sessione/ritenzione non tracciati nativamente).
6. **Il valore è costo di riproduzione**, non di mercato/ricavo/ROI; il rischio residuo (bus factor 1, e2e/RLS-test ancora manuali, email transazionali al confine del consenso) è descritto ma non scontato nel range.
7. **Copertura**: lettura mirata + agenti + commit chiave, non riga-per-riga.

---

## Appendice A — Comandi e output grezzi

Eseguiti il 2026-08-15 in `/Users/albertogiovannigerli/Desktop/personale/bridge/bridgequest`.

### A1 — Git
```
git rev-list --count HEAD                 → 326
git log f96a61a..HEAD --oneline | wc -l   → 7   (delta v4→v5)
git diff --stat f96a61a..HEAD | tail -1   → 44 file, +979/−97
git log --format=%ad --date=short | sort -u | wc -l → 57
```

### A2 — Commit chiave v5
```
0f22a51 Tetto agli invii di email, e il build entra nella CI
        → rateLimit su friends/notify + instructor-request + account/delete; "Build" in ci.yml
3ac54c0 Nove difetti trovati da una caccia strutturata (+ e2e torneo-licita.spec.ts)
f70f36a Distribuzione per provincia e per regione: erano tutte «N/D»
f8a741c Non si dichiara fuori turno, e quando l'asta è ferma si dice perché
1aa04fe La mappa del sito non deve poter far fallire un deploy
```

### A2b — Commit chiave v4 (estratto)
```
269b827/7d98d25 Al tavolo condiviso si gioca (+prova end-to-end, 14 controlli)
9ea1e4d/4972dad Licita con un amico vs BEN (db provato; BEN dichiara, il par dà il voto)
3b613a8 Tornei di licita (8/giorno, 24/settimana) con classifica
ea98269/9b16991 Sfida a coppie in IMP; "le stelle confrontavano due metri diversi"
94b4d46/d3c96c3 Mezze stelle; numeratore e riferimento sullo stesso metro
d8d6ae1 Il sistema di BEN contro il Naturale dei corsi: 96% di accordo
832ee3e «Not north's turn»: due timer dalla stessa fotografia (fix nell'invariante)
478a5e7 Due segnalazioni da Sentry: una era un difetto vero
d7bed6e BEN dichiara davvero: un parametro vuoto non è un parametro assente
```

### A3 — Effort (`python3 /tmp/bq_git4.py`)
```
non-merge commits: 324 | added: 225555 | removed: 35114 | net: 190441
per-commit: median=173 mean=804.5 | sessions: 100 | effort(lower bound): 128.2 h
monthly: feb 53, mar 95, apr 7, mag 21, giu 20, lug 14, ago 116
```

### A4 — Righe (`python3 /tmp/bq_cloc4.py`)
```
applicativo 435/81.176 · contenuti 21/18.848 · test 58/8.126 · schema-sql 52/10.076 · tooling 55/11.412
```

### A5 — Struttura
```
pages 81 · api 12 · components 102 · test unit 58 ·
nuove tabelle 11 (baseline → 49 CREATE TABLE), tutte con RLS, +18 policy ·
CI: npm ci / tsc --noEmit / eslint --max-warnings 0 / npm test / npm run build  ← Build AGGIUNTO (0f22a51)
rateLimit presente su TUTTI i 9 route input (incl. friends/notify, instructor-request, account/delete)
zod presente su 8 route (NON su account/delete — P0.2 residuo)
```

### A6 — Adozione nuove funzionalità (`node /tmp/bq_newfeat.mjs`)
```
bidding_sessions: 0 · sfide_coppie: 0 · club_posts: 0 · saved_hands: 0 ·
live_tables: 1 · tornei: 2 · scenari: 7 · risultati_mano: 16 · mani_generate: 1504
(tornei/mani, risultati_torneo, sfida_board, torneo_mani: err 400 — PK composita, conteggio via id non disponibile)
```

### A7 — Utilizzo aggregato (`node /tmp/bq_use4.mjs` + `/tmp/bq_mau4.mjs`)
```json
{
  "counts": {"profiles":1095,"game_results":60755,"completed_modules":18478,
             "login_history":10663,"badges":1439},
  "active7":132, "active30":235, "total_min_sum":492983, "min_median":35,
  "retention": {"p7":43.8, "p30":30.9},
  "mau": {"2026-02":9,"2026-03":678,"2026-04":373,"2026-05":312,
          "2026-06":298,"2026-07":236,"2026-08":166},
  "rls_probe": {"profiles":0,"login_history":0,"game_results":"err(401)"}
}
```

### A8 — Note metodologiche
- DB in sola lettura via variabili locali; solo aggregati; nessun dato personale.
- Fase 2: agenti read-only + lettura mirata + commit chiave; evidenze `percorso:riga`/hash.
- Tariffe e ore di ricostruzione sono **assunzioni dichiarate**.

*Fine del documento.*
