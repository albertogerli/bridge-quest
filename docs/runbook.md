# Runbook operativo — BridgeLab

Produzione: [bridgelab.it](https://bridgelab.it) su Vercel. Backend: Supabase (progetto unico, prod). Email: Resend.

## Deploy

- **Deploy = `git push` su `main`.** Vercel builda e pubblica automaticamente ogni push.
- **MAI `vercel --prod`** dalla macchina locale: la directory `public/` (video/infografiche, ~15 GB) supera i limiti di upload della CLI. Il deploy da git non ha questo problema.
- Prima di pushare: `npx tsc --noEmit` e `npm test` devono passare (la CI su GitHub li esegue comunque e fallisce il run, ma il deploy Vercel parte lo stesso: verificare in locale prima).

## Rollback

Due strade, in ordine di preferenza:

1. **Redeploy dalla dashboard Vercel**: Deployments → deployment precedente funzionante → "Promote to Production". Istantaneo, non tocca la history git.
2. **Revert su git**: `git revert <sha>` + push su `main`. Preferibile quando il rollback deve restare permanente nella history.

Nota: gli script SQL già eseguiti su Supabase **non** si rollbackano col deploy — vanno annullati a mano se serve.

## Variabili d'ambiente

Si impostano in **`.env.local`** in locale (mai committato, permessi 600) e su **Vercel → Project → Settings → Environment Variables** per la produzione. Solo nomi, mai copiare i valori nei documenti:

| Variabile | Uso | Dove serve |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client Supabase (pubbliche) | locale + Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | solo server (cron, unsubscribe, admin); bypassa RLS | locale + Vercel |
| `RESEND_API_KEY` / `RESEND_FROM` | invio email | Vercel (locale solo per test) |
| `CRON_SECRET` | autorizza `/api/cron/engagement` (header `Authorization: Bearer`) | Vercel |
| `BEN_API_URL` | server AI neurale BEN. **In produzione dal 13/08/2026**: Railway, progetto `bridgelab-ben`, regione `europe-west4`. Serve sia il gioco della carta sia la LICITA (`/bid`). Fallback automatico se assente | Vercel (vedi `deploy/ben-railway/`) |
| `BEN_API_TOKEN` | segreto condiviso con la guardia davanti a BEN; senza, la guardia non parte | Vercel + Railway |
| `NEXT_PUBLIC_GADS_SIGNUP_LABEL` | label conversione Google Ads (registrazione) | locale + Vercel |
| `NEXT_PUBLIC_SENTRY_DSN` | error monitoring; **assente = Sentry interamente disattivo** | Vercel (locale solo per test) |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | upload source map in build; senza, gli stack trace sono minificati | opzionale, Vercel |
| `NEXT_PUBLIC_SITE_URL` | base URL nei link email (default `https://bridgelab.it`) | opzionale |
| `EMAIL_ENABLED` | kill switch email: `false` = il cron gira ma non invia | opzionale |
| `EMAIL_SECRET` | firma i token di unsubscribe (default = service role key) | opzionale |
| `ADMIN_NOTIFY_EMAIL` | destinatario notifiche richieste istruttore | opzionale |
| `HEYGEN_API_KEY` (+ `HEYGEN_AVATAR_ID`, `HEYGEN_VOICE_ID`) | solo script di generazione video, non usata dall'app | locale |

## Schema DB

- Nessuna catena di migrazioni: lo schema si evolve con gli script in `scripts/sql/`, eseguiti **a mano** su Supabase Dashboard → SQL Editor, **in ordine cronologico** (alcuni dipendono da altri: es. `admin_classes.sql` richiede `instructor_portal.sql` e `is_admin()` da `instructor_requests.sql`). Gli script sono in gran parte idempotenti; leggerne l'header prima di eseguirli.
- Dopo modifiche a RLS/policy, verificare con:
  ```bash
  npm run test:rls          # alias di: node scripts/test-rls.mjs
  ```
  Testa con la ANON key che le tabelle PII (`profiles`, `login_history`, `game_results`, `friendships`, `email_events`, `completed_modules`, `tournament_results`) risultino invisibili, e che `glossary`/`lessons` restino leggibili (il glossario è SSR anonimo). Exit code ≠ 0 = RLS rotta: non deployare.
- Correzioni ai **contenuti** (lezioni/quiz): sempre via UPDATE sul DB, mai reseed (vedi `docs/architettura.md`).

## Cron email

- Vercel Cron: `0 17 * * *` UTC (≈ 19:00 in Italia) → `GET /api/cron/engagement`. Vercel invia da solo `Authorization: Bearer $CRON_SECRET`.
- Il secret è accettato **solo** via header (mai in query string: finirebbe nei log).
- Trigger manuale:
  ```bash
  curl "https://bridgelab.it/api/cron/engagement?limit=50" \
    -H "Authorization: Bearer $CRON_SECRET"
  ```
  Risposta JSON: `{ candidates, sent, skipped, byKind, errors, errorCount }`.
- Spegnere tutto: `EMAIL_ENABLED=false` su Vercel (il cron logga senza inviare).

## Test e qualità

```bash
npx tsc --noEmit   # typecheck — bloccante in CI
npm test           # vitest, unit test dei motori (engine, scoring, pbn, encoder…) — bloccante in CI
npx eslint src     # lint: zero errori/warning, bloccante in CI
```

CI: `.github/workflows/ci.yml` (typecheck + lint + test su push/PR).

## Incidenti tipici

| Sintomo | Causa | Cosa fare |
|---|---|---|
| AI "esperto" gioca come "intermedio", badge BEN offline | Server BEN spento/irraggiungibile (`BEN_API_URL`) | Nulla di urgente: il fallback BEN → DDS → euristica è automatico e silenzioso. Riavviare BEN con `scripts/start-ben.sh` (locale) o controllare il servizio su Railway. **Se risponde 404 a tutto, i due `BEN_API_TOKEN` non coincidono.** Si confrontano senza leggerli: `railway variables list --kv \| grep BEN_API_TOKEN \| cut -d= -f2- \| shasum -a 256` contro la stessa cosa da `vercel env pull` |
| Email non partite | Resend down o `RESEND_API_KEY` errata | Nessun retry automatico nel run: gli invii falliti sono persi (non registrati in `email_events`; il cron del giorno dopo può riproporre il drip solo se l'utente è ancora eleggibile). Verificare log Vercel del cron + dashboard Resend |
| App carica ma niente contenuti/login | Supabase down | L'app degrada: gamification continua su localStorage, contenuti e auth falliscono (la cache del catalog riprova alla richiesta successiva). Attendere il ripristino; nessuna azione lato app |
| `/api/cron/engagement` risponde 500 "CRON_SECRET non configurato" | Env mancante su Vercel | Impostare `CRON_SECRET` e rideployare |
| Anon vede righe PII | RLS regredita (nuova tabella o policy toccata) | Eseguire lo script SQL di fix (vedi `scripts/sql/security-fixes-2026-08.sql` come riferimento) e riverificare con `node scripts/test-rls.mjs` |

## Colonne personali di `profiles`

Le colonne che l'app non mostra mai fra utenti (`marketing_consent`, `last_login`, `platform`, `total_minutes`, `streak`, `profile_type`, preferenze…) sono accessibili solo:
- al proprietario, via RPC `get_own_profile()` (usata da `use-auth`);
- all'amministratore, via RPC `admin_list_users()` guardata da `is_admin()`.

Applicare con `scripts/sql/pii-columns-2026-08.sql`: **PARTE A** (crea le funzioni, nessun impatto) subito, **PARTE B** (revoca le colonne) dopo il deploy dell'app. Il codice ha un fallback sulla lettura diretta, quindi funziona in entrambi gli ordini; il fallback si può rimuovere una volta applicata la PARTE B. Verifica finale: `npm run test:rls` deve chiudersi senza fallimenti.

## Error monitoring (Sentry)

Attivo **solo** quando `NEXT_PUBLIC_SENTRY_DSN` è impostata: senza DSN l'SDK non si inizializza e il wrapper di build non si applica (build identica a prima).

- **Cablaggio**: `instrumentation.ts` (server + edge, con `onRequestError` per route e server component), `instrumentation-client.ts` (browser + navigazioni App Router), `src/lib/sentry-shared.ts` (config comune), `src/lib/report-error.ts` (punto unico: logga in console e invia a Sentry con tag `scope`).
- **Privacy**: `sendDefaultPii: false`, nessun Session Replay, e un `beforeSend` che rimuove comunque email/IP/username dagli eventi. Non viene inviato alcun identificativo utente: se in futuro servisse correlare gli errori per utente, valutarlo con il DPO (Sentry diventerebbe responsabile del trattamento ex art. 28).
- **Adblocker**: gli eventi passano da `/monitoring` (tunnel same-origin), altrimenti gli adblocker bloccherebbero `ingest.sentry.io` e perderemmo gli errori dei browser reali.
- **Rumore filtrato**: errori da estensioni del browser, `ResizeObserver`, `AbortError` e fetch interrotte dai cambi pagina (elenco in `sentry-shared.ts`).
- **Campionamento**: tracce di performance al 10% in produzione, 100% in sviluppo. Gli errori sono sempre inviati per intero.
- **Source map**: caricate in build solo se `SENTRY_AUTH_TOKEN` è presente; senza, gli stack trace in produzione restano minificati.

**Verifica dopo l'attivazione**: con il DSN impostato, `throw new Error("test sentry")` da una pagina qualsiasi (o una visita a una route API che fallisce) deve comparire in Sentry entro pochi secondi, con tag `scope` se passa da `reportError`.

Restano fonti di verità complementari i log Vercel (Functions) e i log Supabase.
