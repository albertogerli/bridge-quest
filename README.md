# BridgeLab

Piattaforma didattica ufficiale della Federazione Italiana Gioco Bridge (FIGB) per imparare il bridge: corsi interattivi, quiz, pratica al tavolo contro l'AI, tornei, sfide tra amici e portale istruttori. In produzione su [bridgelab.it](https://bridgelab.it).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript strict**
- **Tailwind CSS 4** (`@theme inline` in `globals.css`, nessun tailwind.config) + shadcn/ui
- **Supabase**: auth (cookie/PKCE), Postgres con RLS, storage (bucket `avatars`), RPC
- **Resend** per le email transazionali e di re-engagement (cron giornaliero Vercel)
- **Serwist** (PWA/service worker), **Capacitor** (app iOS in `ios/`, Android in `android/`)
- Deploy: **Vercel**, automatico a ogni push su `main`. Non usare mai `vercel --prod` (la directory `public/` supera i limiti di upload).

## Avvio locale

```bash
npm install
cp .env.example .env.local   # se assente, creare .env.local con le variabili sotto
npm run dev                  # http://localhost:3000
```

Variabili d'ambiente richieste (`.env.local`, mai committato):

| Variabile | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client Supabase (pubbliche) |
| `SUPABASE_SERVICE_ROLE_KEY` | solo server (route API admin/email); bypassa RLS |
| `RESEND_API_KEY` / `RESEND_FROM` | invio email |
| `CRON_SECRET` | autorizza `/api/cron/engagement` (header `Authorization: Bearer`) |
| `BEN_API_URL` | opzionale: server AI neurale BEN self-hosted (fallback automatico su solver/euristica se assente); per ospitarlo vedi `deploy/ben-railway/` |
| `BEN_API_TOKEN` | segreto condiviso con la guardia davanti a BEN; obbligatorio se BEN è ospitato, inutile in locale |
| `NEXT_PUBLIC_GADS_SIGNUP_LABEL` | label conversione Google Ads (registrazione) |
| `ADMIN_NOTIFY_EMAIL` | opzionale: destinatario notifiche richieste istruttore |
| `NEXT_PUBLIC_SENTRY_DSN` | error monitoring; **se assente Sentry è interamente no-op** |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | opzionali: upload source map in build (senza, gli stack trace restano minificati) |
| `HEYGEN_API_KEY` | solo script di generazione video |

## Struttura

```
src/app/          66 rotte App Router (gioca/, lezioni/, istruttori/, admin/, api/)
src/components/   90 componenti (bridge/ = tavolo da gioco, ui/ = shadcn)
src/lib/          logica di dominio pura: bridge-engine, dds-solver (double-dummy
                  minimax in Web Worker), bridge-scoring (punteggi WBF/IMP),
                  ai-difficulty, pbn, hand-encoder, catalog (contenuti da DB)
src/hooks/        26 hook (use-bridge-game = orchestrazione partita)
src/data/         seed iniziale dei contenuti — ATTENZIONE: i contenuti live sono
                  nel DB Supabase e DIVERGONO dal seed; correggere via DB, non reseed
scripts/sql/      schema incrementale (eseguire su Supabase Dashboard → SQL Editor)
scripts/          pipeline video HeyGen, validatori smazzate, seed legacy
```

## Database

Lo schema vive su Supabase e si evolve tramite gli script in `scripts/sql/` (eseguiti a mano sulla dashboard, in ordine cronologico). Non esiste una catena di migrazioni completa: le tabelle core (`profiles`, `lessons`, …) sono state create da dashboard. Tutte le tabelle hanno RLS; le RPC amministrative sono protette da `is_admin()` (colonna `profiles.role`).

**Correzioni di sicurezza pendenti/recenti**: `scripts/sql/security-fixes-2026-08.sql` (RLS su `profiles` e `login_history`, tabella `tournament_results`).

## Qualità

```bash
npx tsc --noEmit           # typecheck (bloccante in CI)
npx eslint src             # lint, zero errori/warning (bloccante in CI)
npm test                   # unit test motori di dominio (vitest, bloccante in CI)
npm run test:rls           # verifica RLS con anon key (dopo modifiche schema)
npm run test:e2e           # smoke E2E Playwright (solo locale: crea/elimina
                           # un utente di test via service role)
```

CI: `.github/workflows/ci.yml` (typecheck + lint + test su ogni push/PR).

Debito noto (perizie tecniche in `PERIZIA-*.md` e piano in `PIANO-MIGLIORAMENTO-2026-08.md`): pagine monolitiche (fino a ~2.200 righe), niente i18n (scelta di prodotto), error monitoring assente (aggancio pronto in `src/lib/report-error.ts`), schema DB senza migrazioni versionate.

## Manuali d'uso

Non documentazione tecnica: sono i manuali per chi la piattaforma la usa, da
consegnare così come sono.

| manuale | per chi |
|---|---|
| [`docs/manuale-utenti.md`](docs/manuale-utenti.md) | chi usa Bridge LAB per conto proprio |
| [`docs/manuale-allievi.md`](docs/manuale-allievi.md) | chi segue un corso con un istruttore |
| [`docs/manuale-istruttori.md`](docs/manuale-istruttori.md) | gli istruttori: classi, compiti, strumenti d'aula |

Quando cambia una funzione visibile, cambiano anche loro: un manuale che
descrive la versione di sei mesi fa fa perdere più tempo di uno che non esiste.

## Note operative

- **Admin**: autorizzazione a ruolo (`profiles.role = 'admin'`), sia client sia RLS/RPC.
- **Email cron**: `GET /api/cron/engagement` gira alle 17:00 UTC via Vercel Cron; trigger manuale con `curl -H "Authorization: Bearer $CRON_SECRET"`.
- **Contenuti**: lezioni/quiz live nel DB (`catalog.ts` li serve con cache); le infografiche sono generate (Gemini) e i video con HeyGen (`scripts/generate-all-videos.py`).
- **App iOS**: build Capacitor da `ios/App` (submission marzo 2026).
