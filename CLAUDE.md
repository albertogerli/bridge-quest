# CLAUDE.md — regole operative per BridgeLab

Piattaforma didattica bridge della FIGB, in produzione su bridgelab.it. Documentazione: `README.md`, `docs/architettura.md`, `docs/runbook.md`.

## Stack e vincoli

- Next.js 16 (App Router) + React 19 + TypeScript **strict**; app quasi interamente client-rendered.
- **Tailwind CSS 4**: tema in `@theme inline` dentro `src/app/globals.css` — **non esiste** `tailwind.config`. Non crearlo.
- shadcn/ui stile **new-york** (`src/components/ui/`). Varianti button verificate: `default/outline/ghost`; badge: `default/secondary/destructive/outline/ghost/link`. Non inventare varianti.
- **Non esiste** l'utility `shadow-warm-*`: usare le shadow standard Tailwind (`shadow-md`, `shadow-lg`).
- Palette: primario FIGB `#003DA5` via token (`figb`/`figb-light`/`figb-dark`); niente `bg-white`/`text-gray-*`/hex hardcoded fuori dalle eccezioni documentate.
- Solo italiano: niente i18n, per scelta di prodotto.

## Contenuti: il DB è la fonte di verità

- Lezioni/quiz live sono su Supabase e **divergono dal seed** in `src/data/`.
- Correzioni ai contenuti: **sempre via UPDATE/PATCH sul DB**, mai rieseguire il seed (`scripts/legacy/seed-supabase.ts`): perderebbe le correzioni. Alcuni contenuti (es. `eserciziario_exercises`) esistono solo nel DB.
- L'accesso ai contenuti passa da `src/lib/catalog.ts`: mai importare da `@/data/courses` nei componenti.

## Deploy

- Deploy = **`git push` su `main`** → Vercel automatico.
- **MAI eseguire `vercel --prod`**: `public/` (~15 GB di video) supera i limiti di upload della CLI.
- `.env.local` non va **mai** committato né i suoi valori copiati in file versionati.

## Verifiche obbligatorie prima del push

```bash
npx tsc --noEmit   # deve passare
npm test           # vitest, deve passare
```

- `npx eslint src` deve restare a **zero errori e zero warning** (gate CI). Ogni nuovo `eslint-disable` richiede un motivo dopo ` -- `.
- Se si toccano RLS/policy: `npm run test:rls` deve uscire con 0.

## Database

- Le tabelle si gestiscono con gli script in `scripts/sql/`, eseguiti **a mano** su Supabase Dashboard → SQL Editor (in ordine; dipendenze nell'header di ogni script). Non esistono migrazioni automatiche: per una modifica di schema, scrivere un nuovo script idempotente in `scripts/sql/`, non modificarne uno già eseguito.
- Dopo **ogni** modifica di schema: `node scripts/dump-schema.mjs` e committare `scripts/sql/000-schema-baseline.sql` insieme allo script. È il file da cui il database si ricostruisce da zero; se non lo si aggiorna, torna a divergere in silenzio.
- RPC amministrative protette da `is_admin()` (`profiles.role = 'admin'`); tutte le tabelle hanno RLS.
- `src/lib/supabase/admin.ts` (service role) è solo server: mai importarlo da componenti client.

## Altre convenzioni

- Gamification localStorage-first (store Zustand `use-game-store` + sync in `use-supabase-sync`): i componenti che leggono stato persistito devono attendere `useHasHydrated()`.
- L'AI "esperto" degrada in cascata BEN → DDS → euristica: ogni integrazione BEN deve mantenere il fallback silenzioso.
- I motori in `src/lib/` (engine, scoring, pbn, encoder…) sono puri e testati: modifiche lì richiedono l'aggiornamento dei relativi `*.test.ts`.
- Errori: usare sempre `reportError(scope, err)` da `src/lib/report-error.ts` (console + Sentry con tag `scope`), mai `console.error` diretto in codice nuovo. `catch {}` è ammesso solo attorno a puri accessi `localStorage`.
- Sentry è attivo solo con `NEXT_PUBLIC_SENTRY_DSN`: non inviare mai dati personali negli eventi (niente Session Replay, niente email/ID utente).
