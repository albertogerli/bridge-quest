# Architettura — BridgeLab

Mappa tecnica del repository per chi entra nel progetto. Stack: Next.js 16 (App Router) + React 19 + TypeScript strict, Tailwind CSS 4, Supabase (auth/Postgres/RLS), Resend, Serwist (PWA), Capacitor (iOS/Android). Deploy su Vercel a ogni push su `main` (vedi `docs/runbook.md`).

## Layout del repository

```
src/
  app/          rotte App Router (~66) + route API
  components/   ~90 componenti (bridge/ = tavolo, ui/ = shadcn, instructor/, home/…)
  hooks/        ~26 hook client (use-bridge-game = orchestrazione partita)
  store/        store Zustand (use-game-store = gamification persistita)
  contexts/     auth-provider (sessione condivisa)
  lib/          logica di dominio pura (motori, catalog, email, supabase)
  data/         seed iniziale dei contenuti (ATTENZIONE: il live è nel DB)
  proxy.ts      "middleware" Next 16: refresh sessione + protezione rotte
scripts/        pipeline video HeyGen, validatori smazzate, seed, test RLS
scripts/sql/    schema incrementale Supabase (esecuzione manuale, in ordine)
public/         asset statici pesanti (video lezioni, infografiche, icone)
ios/ android/   wrapper Capacitor
docs/           questa documentazione + email-automation.md
.github/        CI (typecheck + test)
```

File di configurazione rilevanti: `next.config.ts` (build con `--webpack`), `vercel.json` (cron + cache header), `capacitor.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `components.json` (shadcn).

## Mappa dei moduli

### `src/app/` — rotte App Router (~66)

Quasi tutte le pagine sono client component ("use client"); il server rendering è l'eccezione (es. glossario).

| Area | Rotte | Note |
|---|---|---|
| Gioco | `gioca/` + sottopagine: `smazzata`, `pratica`, `pratica-licita`, `dichiara`, `mano-del-giorno`, `mano-guidata`, `torneo`, `sfida`, `sfida-amico`, `sfida-imp`, `sfida-link`, `sfida-settimanale`, `minibridge`, `impasse`, `memory`, `quiz-lampo`, `conta-veloce`, `segnali`, `trova-errore`, `analisi` | Modalità di gioco/allenamento; orchestrazione partita in `use-bridge-game` |
| Didattica | `impara`, `lezioni/[lessonId]`, `prima-mano`, `ripasso`, `glossario`, `dispense`, `guida`, `appunti`, `scuola` | Contenuti serviti da `catalog.ts` (DB) |
| Sociale | `amici`, `forum/` (`[postId]`, `nuovo`), `classifica`, `profilo` (`wrapped`), `obiettivi`, `collezione`, `negozio` | |
| Istruttori/classi | `istruttori/[classId]` (portale istruttore), `classi/[classId]` (lato studente), `diventa-istruttore`, `circolo/[slug]`, `trova-circolo` | Portale ASD B2B |
| Admin | `admin/` (`classi`, `istruttori`) | Protetta da `src/proxy.ts` + ruolo `admin` |
| Auth | `login`, `registrati`, `reset-password`, `auth/callback` | |
| API | `api/ben/` (`play`, `lead`, `autoplay`, `health`), `api/cron/engagement`, `api/email/unsubscribe`, `api/friends/notify`, `api/instructor-request` | |
| Legale/varie | `privacy`, `termini`, `accessibilita`, `scopri`, `impostazioni`, `~offline` | |

### `src/components/`

- `bridge/` — tavolo da gioco: `bridge-table`, `bidding-panel`, `hand`, `playing-card`, `card-display`, `dummy-hand`, `hint-panel`, `planning-quiz`, `share-result`, `ben-status`, ecc.
- `ui/` — componenti shadcn/ui (stile new-york). Varianti verificate: button `default/outline/ghost`; badge `default/secondary/destructive/outline/ghost/link`.
- `instructor/`, `instructors/` — portale istruttori (heatmap, chat di classe…).
- `home/`, `beginner/`, `prima-mano/` — sezioni della home e onboarding principianti.
- File sciolti: navigazione (`bottom-nav`, `desktop-sidebar`, `layout-shell`), gamification (`achievement-popup`, `streak-freeze-card`, `weekly-challenge-banner`, `bonus-hand-modal`), banner (cookie, marketing consent, exit-intent, notifiche).

### `src/hooks/` (~26)

I principali: `use-bridge-game` (orchestrazione completa di una partita: licita, gioco, AI, punteggio), `use-auth` + `src/contexts/auth-provider.tsx` (sessione condivisa), `use-supabase-sync` (sync gamification, vedi sotto), `use-dds` (Web Worker DDS), `use-friends` / `use-challenges` / `use-pending-friend-requests` (sociale, con polling), `use-profile`, `use-game-results`, `use-spaced-review`, `use-weekly-objectives`, `use-notifications`, `use-sound(s)`.

### `src/store/` — store Zustand

`use-game-store` (gamification, `persist` su localStorage), `use-catalog-store`, `use-smazzate-store`, `use-guided-hands-store`, `use-trova-errore-store`, `use-weekly-challenges-store`, `use-collectible-cards-store`, `use-classes-store`, `use-glossary-store`, `use-asd-store`.

### `src/lib/` — logica di dominio (pura, testata con vitest)

| Modulo | Ruolo |
|---|---|
| `bridge-engine.ts` | Regole del gioco (mani, prese, validità carte) + AI euristica (`aiSelectCard`) |
| `dds-solver.ts` | Double-dummy solver minimax/alpha-beta in puro TS: ricerca esatta ≤ 6 carte per mano, stima euristica oltre, timeout 2s |
| `dds-worker.ts` + `use-dds` | Esegue il solver in un Web Worker (fallback sul main thread se il Worker non è disponibile) |
| `dds-select.ts` | Sceglie la carta DD-ottimale in una posizione di gioco |
| `bridge-scoring.ts` | Punteggi (contratto, WBF/IMP) |
| `ai-difficulty.ts` | Tre livelli AI: `base` (~20% errori plausibili da principiante), `intermedio` (euristica), `esperto` con cascata **BEN → DDS (≤ 7 carte, timeout 1200 ms) → euristica** |
| `ben-client.ts` / `ben-format.ts` / `ben-guard.ts` | Client verso le route `/api/ben/*`, che fanno da proxy al server BEN self-hosted (`BEN_API_URL`); ogni chiamata ha `fallback: true` in caso di errore/timeout |
| `pbn.ts` | Parsing/serializzazione formato PBN |
| `hand-encoder.ts` | Codifica compatta delle mani (es. link di sfida) |
| `minibridge.ts` | Variante minibridge |
| `catalog.ts` | Strato unico di accesso ai contenuti su DB (vedi sotto) |
| `xp-levels.ts` / `xp-utils.ts` | Livelli XP e assegnazione XP idempotente (`bq_completed_games`) |
| `email/` | `templates.ts` (HTML), `send.ts` (Resend REST), `tokens.ts` (token unsubscribe), `welcome.ts` |
| `progression.ts` / `spaced-review.ts` | Progressione didattica e ripasso spaziato (moduli recenti, testati) |
| Altro | `scoring.ts`, `play-error-classifier.ts`, `glossary-server.ts` (SSR), `share.ts`, `smazzata-meta.ts`, `native-bridge.ts` (Capacitor), `log.ts`, `report-error.ts`, `gads.ts` |

## Flusso dati dei contenuti

1. `src/data/` contiene il **seed iniziale** (corsi, lezioni, smazzate, glossario…). È stato caricato su Supabase con `scripts/legacy/seed-supabase.ts` (script legacy, non più esposto in `package.json`).
2. **Il DB è la fonte di verità**: i contenuti live (lezioni, quiz) sono stati corretti direttamente su Supabase e **divergono dal seed**. Non rieseguire il seed per correggere un contenuto: si perderebbero le correzioni. Correggere via UPDATE/PATCH sul DB. Alcuni contenuti (es. `eserciziario_exercises`) esistono **solo** nel DB.
3. `src/lib/catalog.ts` è l'unico punto di accesso: legge `courses` → `course_worlds` → `lessons` → `lesson_modules` e ricostruisce l'albero `Course → World → Lesson → Module → ContentBlock`. Cache: una fetch per sessione browser (o per processo server), promise condivisa tra chiamanti concorrenti, cache svuotata in caso di errore (retry al prossimo accesso). I componenti **non devono** importare da `@/data/courses`.
4. I quattro corsi (`fiori`, `quadri`, `cuori-gioco`, `cuori-licita`) e le smazzate hanno anche validatori dedicati (`scripts/validate-smazzate*.ts`, `scripts/audit-lesson-content.ts`) da usare prima di toccare i dati.
5. Asset generati: infografiche (Gemini, `public/infografiche/`) e video maestro (HeyGen, `scripts/generate-all-videos.py`, `public/videos/`), con cache header lunghi in `vercel.json`.

### Route API (`src/app/api/`)

- `ben/play`, `ben/lead`, `ben/autoplay`, `ben/health` — proxy verso il server BEN (`BEN_API_URL`); rispondono `{ fallback: true }` su errore/timeout, mai 500 al client.
- `cron/engagement` — cron email giornaliero (Bearer `CRON_SECRET`).
- `email/unsubscribe` — disiscrizione one-click (GET + POST RFC 8058, token firmato con `EMAIL_SECRET`).
- `friends/notify` — email `friend_request` fire-and-forget dopo l'insert della richiesta di amicizia (verifica che il chiamante sia il mittente; l'email del destinatario resta server-side).
- `instructor-request` — richiesta "diventa istruttore" (insert come utente autenticato, RLS self-insert) + notifica all'admin (`ADMIN_NOTIFY_EMAIL`).

### Ciclo di vita di una partita (riferimento rapido)

1. La pagina di gioco (es. `gioca/smazzata`) carica la smazzata (store/`catalog`) e monta `use-bridge-game`.
2. L'hook orchestra licita e gioco con `bridge-engine`; le carte degli avversari passano da `ai-difficulty` (livello letto da localStorage `bq_ai_level`).
3. A livello "esperto" prova prima BEN (`benPlay` → `/api/ben/play` → server esterno), poi `aiSelectExpertCard` (DDS nei finali), infine l'euristica. Ogni gradino fallisce in silenzio verso il successivo.
4. A fine mano: punteggio con `bridge-scoring`, XP via `awardGameXp` (idempotente), salvataggio risultato su `game_results` (se loggato), eventuale classifica via RPC.

## Flusso auth

- Supabase Auth con **cookie + PKCE** via `@supabase/ssr`: client browser in `src/lib/supabase/client.ts`, server in `server.ts`.
- `src/proxy.ts` (il "middleware" di Next 16): rinfresca la sessione a ogni richiesta, protegge le rotte in `PROTECTED_ROUTES` (oggi solo `/admin` → redirect a `/login?redirect=…`), e reindirizza via da `/login` se già autenticati.
- `src/app/auth/callback/route.ts`: `exchangeCodeForSession` alla conferma email + invio welcome email one-shot (via `after()`).
- **Ruoli**: colonna `profiles.role` (`user` / `instructor` / `admin`), verificata sia lato client sia lato DB: le RPC amministrative sono `SECURITY DEFINER` protette da `is_admin()` (definita in `scripts/sql/instructor_requests.sql`).
- `src/lib/supabase/admin.ts`: client service-role (bypassa RLS) **solo server** — usato da cron e unsubscribe, mai importarlo da componenti client.

## Schema DB (Supabase Postgres, tutto con RLS)

Non esiste una catena di migrazioni: le tabelle core sono nate da dashboard, l'evoluzione vive negli script `scripts/sql/` (eseguiti a mano, in ordine cronologico — vedi runbook). Tabelle referenziate dal codice, per area:

- **Profili/auth**: `profiles`, `login_history`, `avatars`
- **Contenuti**: `courses`, `course_worlds`, `lessons`, `lesson_modules`, `smazzate`, `guided_hands`, `glossary`, `eserciziario_exercises`, `trova_errore_scenarios`
- **Progressi/gioco**: `completed_modules`, `game_results`, `tournament_results`, `first_attempt_results`, `review_items`, `badges`, `weekly_challenges`, `collectible_cards`
- **Sociale**: `friendships` (+ vista/alias `friends`), `challenges`, `forum_posts`, `forum_comments`, `forum_likes`, `forum_poll_votes`
- **Istruttori/classi**: `classes`, `class_members`, `class_messages`, `assignments`, `instructor_requests`, `asd_clubs`
- **Email**: `email_events`

RPC principali: `get_engagement_targets`, `get_game_leaderboard`, `get_class_leaderboard`, `get_class_results`, `get_daily_field_stats`, `get_pending_challenges`, `get_challenge_stats`, `get_challenge_history`, `join_class_by_code`, `generate_invite_code`, `search_users`, `list_instructor_requests`, `review_instructor_request`, `admin_list_classes`, `admin_class_detail`, `admin_game_stats`, `admin_school_stats`.

Script in `scripts/sql/`: `instructor_requests.sql`, `instructor_portal.sql`, `admin_classes.sql`, `admin_game_stats.sql`, `admin_school_stats.sql`, `class_chat.sql`, `class_leaderboard.sql`, `game_results.sql`, `game-leaderboard-rpc.sql`, `first_attempt_results.sql`, `daily_field_stats.sql`, `friends-challenges.sql`, `forum-polls.sql`, `forum_comments_threading.sql`, `email-automation.sql`, `login-history.sql`, `instructor_request_message.sql`, `pbn_import.sql`, `product-features.sql`, `asd-code-migration.sql`, `add-platform-tracking.sql`, `upgrade-session-18.sql`, `security-fixes-2026-08.sql`.

## Gamification

- **Stato locale**: `src/store/use-game-store.ts` (Zustand + `persist` su localStorage) tiene `xp`, `streak`, `completedModules`, `handsPlayed`, `lastLogin`; migra i vecchi flag `bq_*` legacy. I componenti che leggono valori persistiti devono attendere `useHasHydrated()`.
- **XP idempotente**: `xp-utils.ts` traccia gli id dei giochi completati in `bq_completed_games` — rigiocare non riassegna XP. `xp-levels.ts` definisce i livelli.
- **Badge**: in localStorage (`bq_badges`) + tabella `badges`; popup in `achievement-popup.tsx` / `secret-achievement-popup.tsx`.
- **Streak**: calcolata nello store al login giornaliero; "streak freeze" in `streak-freeze-card.tsx`; email `streak_risk` quando la striscia è a rischio.
- **Sync**: `use-supabase-sync.ts` — al primo login sync bidirezionale (vince Supabase se ha dati, altrimenti migra localStorage), poi push verso `profiles` ogni 30 s se qualcosa è cambiato, al focus della tab e best-effort alla chiusura.

## Email automation (dettagli in `docs/email-automation.md`)

- Tipi: `welcome` (transazionale, alla conferma email), `onboarding_start`, `streak_risk`, `inactive_7`, `inactive_14` (marketing, richiedono `marketing_consent`), `friend_request`.
- Cron Vercel `0 17 * * *` UTC → `GET /api/cron/engagement` (Bearer `CRON_SECRET`): la RPC `get_engagement_targets()` sceglie in SQL al massimo **una email al giorno per utente**; l'invio va su Resend (`src/lib/email/send.ts`) e viene registrato in `email_events` (idempotenza: nessun drip inviato due volte).
- Kill switch `EMAIL_ENABLED=false`; unsubscribe one-click RFC 8058 (`/api/email/unsubscribe`).

## Decisioni architetturali note

- **Client-heavy**: quasi tutto è client-rendered; l'LCP dipende dal render client, non dal bundle. Il glossario è stato portato a SSR; la landing è ancora client.
- **localStorage-first con sync**: la gamification funziona anche da anonimi/offline; il login attiva il sync. Conseguenza: il valore "vero" di XP/streak per un utente loggato è la combinazione localStorage + `profiles`.
- **Polling, non realtime**: amici, sfide e obiettivi si aggiornano con `setInterval` (~30 s). Unica eccezione realtime: la chat di classe (`class-chat.tsx`, canali Supabase).
- **Niente i18n**: solo italiano, scelta di prodotto.
- **Fallback ovunque per l'AI esperta**: BEN è opzionale e self-hosted (`scripts/start-ben.sh`, porta 8085); se assente o irraggiungibile si degrada in automatico a DDS/euristica, senza errori visibili all'utente.
- **Pagine monolitiche**: alcune pagine superano le 1.900–2.200 righe (es. `src/app/page.tsx`); debito noto dalle perizie (`PERIZIA-*.md`).
- **PWA**: service worker Serwist (`sw.js` mai cacheato), pagina `~offline`; app native via Capacitor (`ios/`, `android/`).
