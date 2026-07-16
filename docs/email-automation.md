# Email automation & re-engagement (BridgeLab)

Chiude i due gap della review: **comunicazione post-registrazione** (welcome + drip)
e **attivazione della retention** (promemoria che riportano l'utente in app).

## Cosa fa

| Email | Tipo | Quando |
|---|---|---|
| `welcome` | transazionale | alla **conferma email** (una sola volta) → CTA "Inizia la Lezione 1" |
| `onboarding_start` | marketing | iscritto 1–5 gg fa, < 2 moduli fatti, mai sollecitato |
| `streak_risk` | marketing | streak ≥ 3, attivo ieri ma non oggi → "salva la striscia" |
| `inactive_7` | marketing | ultimo accesso 7–14 gg fa |
| `inactive_14` | marketing | ultimo accesso 14–45 gg fa |

Ogni utente riceve **al massimo una email al giorno** (priorità: streak → onboarding →
inattività). Le email marketing richiedono `marketing_consent = true` e hanno
unsubscribe one-click; la welcome no (transazionale). Idempotenza garantita dalla
tabella `email_events`: nessun drip viene mai inviato due volte.

## Architettura

- `scripts/sql/email-automation.sql` — tabella `email_events`, colonne consenso, RPC
  `get_engagement_targets()` (tutta la segmentazione vive qui, in SQL).
- `src/lib/email/templates.ts` — HTML brandizzati (blu FIGB / avorio / oro).
- `src/lib/email/send.ts` — invio via Resend + kill-switch `EMAIL_ENABLED` + `List-Unsubscribe`.
- `src/lib/email/welcome.ts` + `src/app/auth/callback/route.ts` — welcome one-shot (via `after()`).
- `src/app/api/cron/engagement/route.ts` — cron giornaliero (protetto da `CRON_SECRET`).
- `src/app/api/email/unsubscribe/route.ts` — disiscrizione one-click (GET + POST RFC 8058).
- `vercel.json` — cron `0 17 * * *` (≈ 19:00 in Italia).
- In-app: `src/components/notifications-nudge.tsx` — attiva il permesso notifiche (leva dormiente).

## Attivazione (checklist)

1. **SQL** — esegui `scripts/sql/email-automation.sql` nel SQL Editor di Supabase.
   Verifica: `SELECT * FROM public.get_engagement_targets(50);`
2. **Resend** — verifica il dominio `bridgelab.it` su Resend (DNS: SPF, DKIM, DMARC),
   poi imposta:
   - `RESEND_API_KEY` = la tua API key Resend
   - `RESEND_FROM` = `Bridge LAB <ciao@bridgelab.it>` (mittente sul dominio verificato)
3. **Cron** — imposta `CRON_SECRET` (stringa random) negli env di Vercel. Vercel Cron
   invia automaticamente `Authorization: Bearer $CRON_SECRET`.
4. (Opzionali) `NEXT_PUBLIC_SITE_URL` (default `https://bridgelab.it`),
   `EMAIL_SECRET` (default = service role key), `EMAIL_ENABLED=false` per spegnere tutto.

Già presenti in ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Kill-switch e test

- **Spegni tutto**: `EMAIL_ENABLED=false` → il cron gira ma non invia (logga soltanto).
- **Trigger manuale** (dry-run o reale):
  ```
  curl "https://bridgelab.it/api/cron/engagement?key=$CRON_SECRET&limit=20"
  ```
  Risposta JSON: `{ candidates, sent, skipped, byKind, errorCount }`.
- **Solo a te**: tieni `EMAIL_ENABLED=false` finché il dominio non è verificato, oppure
  metti in `marketing_consent=true` solo il tuo profilo e lancia il cron manuale.

## Note

- `last_login` viene aggiornato all'apertura app (sign-in / refresh token), quindi
  approssima "ultimo accesso": sufficiente per il re-engagement.
- La segmentazione è tutta modificabile in un punto solo: la RPC in
  `scripts/sql/email-automation.sql` (soglie giorni, priorità, condizioni).
