# Piano di miglioramento BridgeLab — risposta ai rilievi delle perizie (ago 2026)

Consolida **tutti** i rilievi delle 4 perizie tecniche (root, `audit-bridgelab/`, `perizia/`) in un piano eseguibile. Ogni voce ha: criticità, intervento, criterio di accettazione (CA), stima in giornate-sviluppo (gg, con AI-assist come da prassi del progetto).

---

## Stato di avanzamento (aggiornato 9 agosto 2026)

**Completato e in produzione** (commit `cca7e65` → `cc5f350`):

| Fase | Voce | Esito |
|---|---|---|
| 0 | Script RLS eseguito su Supabase | ✅ verificato: anonimo legge 0 righe su 12 tabelle |
| 1.1 | Validazione zod su tutte le API | ✅ |
| 1.3 | Gate admin server-side | ✅ `src/app/admin/layout.tsx` |
| 1.4 | Rate limiting | ✅ in-memory per utente sulle route BEN |
| 2.1 | Error monitoring | ✅ Sentry cablato — **manca solo il DSN** |
| 2.2 | Toaster + catch silenziosi | ✅ 13 bonificati, 5 toast |
| 2.3 | `global-error.tsx` | ✅ |
| 2.4 | Richieste amicizia nascoste | ✅ |
| 2.5 | E2E | ✅ 10 test Playwright (6 smoke + 4 audit a11y) |
| 2.6 | Test RLS | ✅ `npm run test:rls`, anonimo + utente autenticato |
| 3 | Lint a zero | ✅ 319 problemi → 0, gate CI |
| 4.2 | Progressione fuori dalla UI | ✅ `src/lib/progression.ts` + test |
| 4.5 | Seed legacy ritirato | ✅ |
| 4.6 | Chiave `completed_modules` | ✅ invariante documentato (migrazione non necessaria) |
| 4.7 | Documentazione | ✅ `docs/architettura.md`, `docs/runbook.md`, `CLAUDE.md` |
| 5.2 | Code splitting | ✅ floor −7,3%, home −11,2% |
| 5.4 | `next/image` | ✅ 14 conversioni |
| 6.1 | Ripetizione dilazionata | ✅ Leitner a 5 scatole |
| 6.2 | Accessibilità | ✅ focus trap, etichette carte, audit axe in CI, 5 famiglie di violazioni di contrasto corrette |

**In attesa di un'azione umana** (bloccate, non tecniche):

| Voce | Cosa serve |
|---|---|
| 1.2 Colonne PII di `profiles` | Codice pronto con fallback; eseguire `scripts/sql/pii-columns-2026-08.sql` (PARTE A, poi B dopo il deploy) |
| 2.1 Sentry | Impostare `NEXT_PUBLIC_SENTRY_DSN` su Vercel |
| — Google Ads | `NEXT_PUBLIC_GADS_SIGNUP_LABEL` non è mai stata impostata: **la conversione non traccia** |
| 4.3 Migrazioni versionate | Credenziali DB / link Supabase CLI |
| 6.3 i18n | Decisione di prodotto |
| 6.4 Push | Vedi nota sotto |

**Chiuse come non-problemi** (verificate, erano falsi positivi delle perizie):
- «due etichette placeholder»: "Prossimamente" è l'etichetta di stato degli item di ripasso futuri; "In arrivo!" è lo stato vuoto per corsi senza contenuti. Entrambe legittime.
- `avatars` non è una tabella mancante: è un bucket di storage.
- Push notifications: la tabella `push_subscriptions` (0 righe) e `NEXT_PUBLIC_VAPID_KEY` sono impalcatura di un tentativo Web Push mai collegato. L'app usa la Notification API **locale** (promemoria solo a sito aperto). Implementare il push vero richiede una coppia di chiavi VAPID e la logica di invio: decisione di prodotto, non debito tecnico.

**Non affrontate per scelta di rischio** (richiedono la rete di sicurezza appena creata): 1.5 CSP nonce-based, 4.1 refactor pagine monolitiche, 4.4 doppia fonte contenuti (guardia lint già attiva), 5.1 SSR landing, 5.3 Realtime.

---

**Stato originario:** i rilievi di sicurezza puntuali erano già risolti nel commit `cca7e65` (auth+validazione API BEN, cron via header, gate admin a ruolo, CSP, test base, CI base, README). Questo piano copre ciò che restava.

---

## Fase 0 — Azioni immediate (½ giornata, nessun deploy)

| # | Azione | CA |
|---|---|---|
| 0.1 | **Eseguire `scripts/sql/security-fixes-2026-08.sql`** su Supabase SQL Editor | `curl` con anon key su `/rest/v1/profiles` → 0 righe; classifica torneo settimanale popolata |
| 0.2 | Dashboard Supabase → Auth: password minima **8+ caratteri** + leaked-password protection | impostazioni salvate |
| 0.3 | Verifica Google Ads con Tag Assistant dopo il deploy della CSP corretta | evento conversion visibile |
| 0.4 | Impostare `NEXT_PUBLIC_GADS_SIGNUP_LABEL` e `ADMIN_NOTIFY_EMAIL` su Vercel | env presenti in Production |

## Fase 1 — Sicurezza avanzata (4–6 gg)

| # | Rilievo (perizia) | Intervento | CA | gg |
|---|---|---|---|---|
| 1.1 | Nessuna validazione schema negli endpoint | Introdurre **zod**: schema per ognuna delle 9 route API; parse → 400 con messaggio neutro | ogni route rifiuta payload malformati; test unitari sugli schema | 1,5 |
| 1.2 | Colonne PII di `profiles` (marketing_consent, last_login, platform, asd_code) leggibili da **qualsiasi** autenticato | Vista `public_profiles` (id, display_name, avatar_url, xp, level, bbo_username) + `REVOKE SELECT` colonne sensibili al ruolo `authenticated`; il client legge la vista, l'admin usa RPC `is_admin()` | un utente normale non può selezionare marketing_consent altrui | 1,5 |
| 1.3 | Gate admin solo client-side | Layout server `src/app/admin/layout.tsx` che verifica sessione+`role='admin'` lato server (come già fa `istruttori/layout.tsx`) e fa redirect | accesso a /admin da non-admin → redirect prima del render | 0,5 |
| 1.4 | Nessun rate limiting | Vercel WAF rate-limit su `/api/*` (config, non codice); in alternativa `@upstash/ratelimit` sulle 3 route sensibili | >N req/min da stesso IP → 429 | 0,5 |
| 1.5 | CSP con `unsafe-inline` | Migrazione a CSP **nonce-based** via proxy/middleware (Next la supporta); gtag e theme-script con nonce | CSP senza unsafe-inline in prod, sito funzionante (test manuale completo) | 1–2 (rischio regressioni: fare per ultimo, con rollback pronto) |

## Fase 2 — Affidabilità e osservabilità (5–7 gg)

| # | Rilievo | Intervento | CA | gg |
|---|---|---|---|---|
| 2.1 | Nessun error monitoring | **Sentry** (piano free): client+server, source maps, alert email | errore forzato in staging arriva su Sentry | 1 |
| 2.2 | ~300 `catch` di cui molti silenziosi; nessun feedback utente | Montare **sonner** (toaster) nel layout; passata mirata sui ~25 catch silenziosi NON-localStorage (profilo, classifica, home-client, collezione, use-auth `fetchProfileInBackground`): log su Sentry + toast dove l'utente ha agito | nessun `catch {}` su operazioni di scrittura; errori di rete visibili all'utente | 2 |
| 2.3 | Manca `global-error.tsx` | Aggiungerlo (crash del root layout oggi = pagina bianca) | crash simulato → pagina di cortesia | 0,2 |
| 2.4 | `fetchPending` scarta richieste amicizia se il profilo del mittente non si carica | Mostrare la richiesta con nome "Utente" invece di nasconderla | richiesta visibile anche con profilo irrecuperabile | 0,3 |
| 2.5 | Zero E2E | **Playwright** smoke: login → lezione → quiz → XP; gioca smazzata → risultato; richiesta amicizia. In CI su preview Vercel | 3 flussi verdi in CI | 2 |
| 2.6 | RLS non testate | Suite di test RLS (script Node con anon key + utente di test): profiles/login_history/game_results/friendships | test rosso se una policy regredisce | 1 |

## Fase 3 — Azzeramento lint (4–6 gg, parallelizzabile)

~175 errori (regole react-hooks v6, soprattutto `set-state-in-effect`) + 144 warning. Burn-down **per regola**, non per file: 1) `no-unused-vars` e banali (½ g); 2) `exhaustive-deps` (1–2 g, attenzione a loop di fetch); 3) `set-state-in-effect` (2–3 g: refactor a `useSyncExternalStore`/derivazione in render — è qui il rischio regressioni, coperto dagli E2E di Fase 2). **CA finale:** `npm run lint` = 0 errori e diventa step bloccante in `ci.yml`.

## Fase 4 — Manutenibilità strutturale (3–4 settimane, incrementale)

| # | Rilievo | Intervento | CA | gg |
|---|---|---|---|---|
| 4.1 | 14 pagine monolitiche (fino a 2.246 righe), logica di business nella UI | Refactor incrementale delle **top 5** (modulo lezione, admin, torneo, mano-del-giorno, profilo): estrarre logica in hook/`src/lib`, spezzare in componenti; **una pagina per PR**, protetta da E2E | nessuna pagina >800 righe tra le 5; zero regressioni E2E | 8–10 |
| 4.2 | Logica di progressione inline nella UI | Estrarre in `src/lib/progression.ts` con unit test (sblocco moduli sequenziale, soglia 50% mondi) | lezioni/pagina usano il modulo; test verdi | 1 |
| 4.3 | Schema DB non riproducibile; 22 script sciolti | Baseline: `supabase db pull` (o `pg_dump --schema-only`) → `supabase/migrations/0000_baseline.sql`; da lì in poi ogni modifica è una migrazione numerata; CI verifica che le migrazioni applichino su un Postgres pulito | DB ricostruibile da zero dal repo | 2 |
| 4.4 | Doppia fonte di verità contenuti (16 import residui da `@/data` vs catalogo DB) | Migrare i 16 import a `catalog.ts`; marcare `src/data` come seed storico (commento + lint rule `no-restricted-imports`) | zero import runtime da `@/data` in `src/app`/`src/components` | 2 |
| 4.5 | `seed-supabase.ts` rotto (5 file mancanti) | Ritirarlo (spostare in `scripts/legacy/`) e documentare che la fonte è il DB + baseline migrazioni | script non referenziato da `package.json` | 0,3 |
| 4.6 | Chiave concatenata fragile in `use-supabase-sync` (split sull'ultimo trattino) | Colonne separate `lesson_id`/`module_id` già esistono nella select → usare quelle, eliminare lo split | unit test sul mapping | 0,5 |
| 4.7 | Documentazione operativa assente | `docs/architettura.md` (moduli, flussi dati, decisioni), `docs/runbook.md` (deploy, rollback, env, recovery), `CLAUDE.md` | un dev esterno fa onboarding senza accesso all'autore | 2 |
| 4.8 | Riferimenti a `.from("friends")` da verificare | Verificare se è vista esistente o codice morto; allineare | zero riferimenti a oggetti DB inesistenti | 0,2 |

## Fase 5 — Performance (1–1,5 settimane)

| # | Rilievo | Intervento | CA | gg |
|---|---|---|---|---|
| 5.1 | 63/66 pagine client-rendered; landing home ancora client | SSR della landing (già pianificato in perf 2026-07); poi glossario-style per pagine pubbliche (scopri, trova-circolo, circolo/[slug]) | LCP landing < 2,5 s su 4G simulato | 2 |
| 5.2 | `next/dynamic` assente | Dynamic import dei componenti pesanti: tavolo di gioco, replay, grafici admin, confetti | bundle first-load della home ridotto (misura con analyzer prima/dopo) | 1 |
| 5.3 | Polling ovunque (9 `setInterval`), niente Realtime | Supabase Realtime per sfide e amici (sostituisce i poll da 30 s); tenere il poll come fallback | notifica sfida < 2 s senza refresh; -80% richieste periodiche | 2 |
| 5.4 | 12–22 `<img>` raw | Migrare a `next/image` (avatar, loghi); alt verificati | zero `<img>` raw salvo SVG inline | 1 |

## Fase 6 — Prodotto e conformità (da prioritizzare col committente)

| # | Rilievo | Intervento | gg |
|---|---|---|---|
| 6.1 | "Ripetizione dilazionata" a intervalli fissi (1/3/7) — claim più forte della sostanza | Upgrade a Leitner a 5 box o SM-2 semplificato in `use-spaced-review` (algoritmo isolato, ben testabile) | 2 |
| 6.2 | A11y: focus management assente nei modali, SVG di gioco senza aria | Focus trap nei dialog (Radix lo dà gratis dove usato), `aria-label` sulle carte/tavolo, test axe in CI su 5 pagine chiave | 2–3 |
| 6.3 | i18n assente | **Decisione di prodotto**: se resta solo-italiano, chiudere il rilievo come "by design"; se serve EN/FR, preventivare 3–4 settimane (next-intl + estrazione stringhe) | 0 o 15–20 |
| 6.4 | `push_subscriptions` a 0 righe (feature morta) | Decidere: attivare le push (nudge già esistente) o rimuovere il codice | 0,5–2 |
| 6.5 | Due etichette "Prossimamente"/"In arrivo!" | Completare o rimuovere le due feature promesse | 0,5 |
| 6.6 | Crescita utenti in calo (−30%/mese post-lancio) | Fuori perimetro tecnico: campagna Ads appena attivata; misurare conversioni ora che il tag funziona | — |

---

## Sequenza consigliata e totali

```
Fase 0 (subito) → Fase 1 (settimana 1) → Fase 2 (settimane 2-3) → Fase 3 (settimane 3-4)
→ Fase 4 (settimane 5-8, incrementale) → Fase 5 (settimana 9) → Fase 6 (a valle, su decisione)
```

- **Nucleo tecnico (Fasi 0–5): ~35–45 giornate** effettive, distribuibili in ~2 mesi a tempo parziale.
- Ordine pensato per il rischio: prima si mette la rete (monitoring + E2E + test RLS, Fase 2), **poi** si fanno i refactor invasivi (Fasi 3–4) protetti da quella rete.
- Ogni fase chiude rilievi verificabili: a fine piano, delle 12 dimensioni valutate dalle perizie, salgono in modo dimostrabile: sicurezza (RLS+zod+rate limit), test (unit+E2E+RLS), CI/CD (lint gate+migrazioni), errori (Sentry+toast), documentazione (architettura+runbook), manutenibilità (pagine <800 righe, schema riproducibile), performance (SSR+Realtime).
- Restano fuori solo per scelta: i18n (6.3) e le voci di prodotto 6.4–6.6, che richiedono una decisione del committente, non di ingegneria.
