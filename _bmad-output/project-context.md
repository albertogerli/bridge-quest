---
project_name: 'bridgequest'
user_name: 'Elbec'
date: '2026-04-17'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 190
optimized_for_llm: true
---

# Project Context for AI Agents — BridgeQuest / BridgeLab

_Questo file contiene regole e pattern critici che gli agenti AI DEVONO seguire quando generano codice in questo progetto. Focus su dettagli non ovvi che gli agenti potrebbero dimenticare._

---

## Technology Stack & Versions

### Core Framework
- **Next.js 16.1.6** — App Router (RSC), build/dev con **webpack** (`next dev --webpack`, `next build --webpack`). `next.config.ts` ha `turbopack: {}` ma gli script package.json forzano webpack.
- **React 19.2.3** + React DOM 19.2.3
- **TypeScript 5** — `strict: true`, `noEmit: true`, `moduleResolution: bundler`, path alias `@/* → ./src/*`
- **`capacitor.config.ts` ESCLUSO da `tsconfig.json`** (fix Vercel in commit `018b943`) — non rimuovere l'esclusione

### Styling & UI
- **Tailwind CSS 4** via `@tailwindcss/postcss` — **NESSUN `tailwind.config.{js,ts}`**: tutti i token vivono in `src/app/globals.css` dentro `@theme inline { --color-*: ... }`
- **shadcn/ui** style `new-york`, RSC true, baseColor `neutral`, CSS variables — configurato in `components.json`
- **Radix UI 1.4.3** (import come `import { Slot } from "radix-ui"`)
- **Motion 12.33** (ex framer-motion) · **lucide-react 0.563**
- **CVA 0.7 + clsx 2.1 + tailwind-merge 3.4** — helper `cn()` in `src/lib/utils.ts`
- **tw-animate-css 1.4**

### Backend & Data
- **Supabase** — `@supabase/ssr 0.8` (browser client) + `@supabase/supabase-js 2.95` — client browser e server separati in `src/lib/supabase/{client,server}.ts`
- Cookie config custom: `path: "/"`, `sameSite: "lax"`, `secure` in prod, `maxAge: 400 giorni`

### Native & PWA
- **Capacitor 8.3** (iOS + Android) — appId `it.bridgelab.app`, carica da `https://bridgelab.it`, UA append `BridgeLab-Native`
- **Serwist 9.5** (`@serwist/next`) — service worker da `src/app/sw.ts` → `public/sw.js`, disabilitato in dev

### Analytics & Tooling
- **Vercel Analytics 1.6** · **sharp 0.34** (build-time icon gen)
- **ESLint 9** + `eslint-config-next 16.1.6` — config in `eslint.config.mjs` (flat config)
- **Next script**: `generate-icons` via `node scripts/generate-icons.mjs`

### Vincoli di versione da rispettare
- Non scendere sotto React 19 (sfrutta `React.ComponentProps<"button">` e nuovi hook)
- Non sostituire Tailwind 4 con 3.x (rompe `@theme inline`)
- Non usare Turbopack per build di produzione (gli script impongono webpack)
- Capacitor 8.x: gli import sono **plugin globali** in contesto native, NON `@capacitor/*` npm (vedi commit `d3f7fe1`)

## Critical Implementation Rules

### Language-Specific Rules

#### TypeScript
- **Strict mode sempre attivo** (`tsconfig.json` → `strict: true`). Niente `any` impliciti, niente `@ts-ignore` senza ragione documentata: preferire `@ts-expect-error` con commento.
- **`noEmit: true`** — il type-check è separato dalla build. Non aggiungere `emitDeclarations` o altri output TS.
- **Path alias `@/*` obbligatorio** per import da `src/` (NO import relativi `../../../`). Convenzione confermata in 400+ file.
- **Import da Radix**: `import { Slot } from "radix-ui"` (pacchetto wrapper), NON `@radix-ui/react-slot`.
- **Type imports**: usa `import type { ... }` per type-only imports (es. `import type { User, Session } from "@supabase/supabase-js"`).
- **`React.ComponentProps<"button">`** è il pattern per estendere props native (vedi `ui/button.tsx`). Non reintrodurre `HTMLAttributes<HTMLButtonElement>`.

#### Import/Export Conventions
- **Named exports** per components/hooks/utilities (es. `export function useAuth()`, `export { Button, buttonVariants }`).
- **Default export SOLO** per pagine/layout di Next App Router (`export default function Page()`).
- Non usare `export *` nei barrel file — import diretti.

#### Client vs Server Boundaries (App Router)
- **`"use client"`** esplicito in cima al file per componenti interattivi (hooks, state, event handlers). Convenzione confermata su 20+ componenti.
- Server Components sono il **default** — non marcare inutilmente.
- **Niente `"use server"`** attualmente nel progetto (no Server Actions): se ne introduci, documenta il confine.

#### Async/Await & Error Handling
- **`try/catch` silenzioso con `catch {}`** è accettato per side-effects opzionali (es. `localStorage`, cookie parsing) — pattern già presente in `use-auth.ts`, `client.ts`.
- **`.then(() => {})` "fire-and-forget"** accettato per update non bloccanti (es. `last_login` update in `use-auth.ts`).
- **Nessun throw all'interno di hook**: restituire `{ data, error }` in stile Supabase.
- Per operazioni Supabase critiche: destructure `{ data, error }` e gestire `error` esplicitamente.

#### Environment Variables
- Solo variabili **`NEXT_PUBLIC_*`** sono disponibili client-side. Tutte le supabase keys sono `NEXT_PUBLIC_*` (anon key è pubblica per design).
- Usare `process.env.NEXT_PUBLIC_SUPABASE_URL!` con non-null assertion nel client code (convenzione del progetto).

#### ESM Only
- `"type"` non dichiarato in package.json ma `eslint.config.mjs`, `next.config.ts` usano ESM. Nuovi file config: preferire `.mjs` o `.ts` con import/export ES.

### Framework-Specific Rules

#### Next.js App Router
- **Solo App Router** (`src/app/`). Niente Pages Router, niente file in `pages/`.
- Routing per directory: `page.tsx` = route, `layout.tsx` = layout, `route.ts` = API handler, `loading.tsx` / `error.tsx` = UI states, `template.tsx` per re-render su navigate.
- **API routes in `src/app/api/<feature>/route.ts`** (es. `api/ben/play/route.ts`) — export `GET`/`POST`/`PUT`/`DELETE` come function.
- **Metadata API**: `export const metadata: Metadata` e `export const viewport: Viewport` in layout/page. Già configurati globalmente in `src/app/layout.tsx` con Schema.org JSON-LD.
- **Security headers centralizzati in `next.config.ts`** (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy). Qualsiasi nuova domain per script/img/connect va aggiunta lì.
- **Cache headers**: asset statici → 1 anno immutable; PDF → 1 giorno; `sw.js` → no-cache.

#### React 19
- **Niente `forwardRef`** per nuovi componenti — usare `ref` come prop regolare (React 19). `ui/button.tsx` è già senza forwardRef.
- `React.ComponentProps<"element">` per estendere props HTML native.
- **Hydration warnings**: `suppressHydrationWarning` su `<html>` e `<body>` per evitare rumore da script inline (theme) — già presente in `layout.tsx`.

#### Hooks & State
- **Auth centralizzato** via `AuthProvider` in `src/contexts/auth-provider.tsx` — consumare con `useSharedAuth()`, **non** chiamare `useAuth()` direttamente fuori dal provider.
- **Hook custom in `src/hooks/use-*.ts`** (kebab-case). Un hook per file. Convenzione confermata su 24 hook.
- **Cross-tab sync**: `storage` event + custom events (`window.dispatchEvent(new CustomEvent('bq_profile_change', { detail }))`) — vedi `layout-shell.tsx`.
- **LocalStorage keys**: prefisso `bq_*` (es. `bq_theme`, `bq_profile`, `bq_guest`).

#### Tailwind 4 + shadcn/ui
- **Token design → `@theme inline` in `globals.css`**. Mai creare `tailwind.config.js`.
- **Dark mode**: `@custom-variant dark (&:is(.dark *))` — applicato con classe `.dark` su `<html>`. Script inline in `layout.tsx` pre-paint legge `localStorage.bq_theme`.
- **Utility classes custom** nei `@layer` di `globals.css` (es. `.suit-spade`, `.hero-gradient`, `.felt-bg`, `.card-clean`, `.card-elevated`, `.glass-light`). Riutilizzare prima di creare.
- **shadcn components hanno varianti custom** (Button: `gold`/`figb`, Badge: `gold`/`figb`/`suit`, Progress: `gold`/`green`): controllare `buttonVariants` CVA prima di aggiungere nuove varianti.
- **Suit colors**: rosso `#e11d48` cuori, arancio `#ea580c` quadri, verde `#059669` fiori, nero `#0f172a` picche (palette corrente su `main`).
- Quando combini classi dinamiche: `cn(buttonVariants({ variant, size }), className)`. Mai concatenare stringhe a mano.

#### Motion (framer-motion)
- Import: `import { motion, AnimatePresence } from "motion/react"` — **NON** `from "framer-motion"` (pacchetto è `motion` v12, sub-path `/react`).
- `AnimatePresence` per enter/exit transitions, `motion.div` per animazioni dichiarative.

#### Supabase (browser vs server)
- **Client browser**: `createClient()` da `@/lib/supabase/client` — usa `createBrowserClient` di `@supabase/ssr`.
- **Client server**: `createServerSupabaseClient()` da `@/lib/supabase/server` — usa `createServerClient` con cookie store di `next/headers` (è `async`: richiede `await cookies()`).
- **RLS attiva**: tutte le query rispettano le policy Supabase. Tabella profili: `id = auth.uid()`.
- Pattern auth timing-sensitive: `onAuthStateChange` + `INITIAL_SESSION` + fallback `getSession()` + safety timeout 5s. **Non mockare** questo flow nei test.

#### Capacitor / Native
- **Capacitor global plugins** (non npm imports) per iOS/Android — vedi fix in commit `d3f7fe1`. Accedere via `(window as any).Capacitor.Plugins.<Name>` o wrapper in `src/lib/native-bridge.ts`.
- **Rilevamento native**: UA contiene `"BridgeLab-Native"` (vedi `capacitor.config.ts`).
- **Comportamenti iOS-specific**: cookie banner nascosto su iOS, deletion account prominente (requisiti App Store — vedi commit `489099f`).

#### Service Worker (Serwist)
- SW generato da `src/app/sw.ts`, output `public/sw.js`. Disabilitato in dev.
- `public/sw.js` è in `exclude` di `tsconfig.json`.
- `cacheOnNavigation: true`, `reloadOnOnline: true`.

### Testing Rules

#### Stato attuale
- **Nessun test runner configurato** in `package.json` (no Jest, Vitest, Playwright, Cypress).
- La validazione del codice avviene tramite **TypeScript strict (`tsc --noEmit` implicito nella build) + ESLint** e test manuale in browser/device.
- Script `scripts/validate-smazzate.ts` è un validator di dati statici (smazzate bridge), **non un test suite**.

#### Regole per verificare correttezza (senza test)
- **Obbligatorio per PR UI**: `npm run dev` + test manuale nel browser sul golden path + edge cases (responsive, dark mode, iOS/Android via Capacitor).
- **Obbligatorio per modifiche tipizzate**: `npm run build` deve passare — typecheck e webpack build sono il gate primario.
- **ESLint**: `npm run lint` deve essere clean prima di committare (config in `eslint.config.mjs`).
- Per feature con logic complessa (bridge engine, DDS solver, AI difficulty): **convalidare manualmente contro dati di riferimento** in `src/data/smazzate*.ts` prima di pushare.

#### Se introduci un test runner
- **Vitest preferito** rispetto a Jest (compatibilità nativa con Vite/ESM, TS senza babel, match con Next 16).
- Integrazione-first: **non mockare Supabase auth** (il flow `INITIAL_SESSION` + fallback è timing-sensitive; mock darebbero falsi positivi).
- Per E2E mobile/PWA: Playwright con capacità di testare UA `BridgeLab-Native` spoofato.
- Test file co-locati: `Component.test.tsx` adiacente a `Component.tsx`; utilities test in `src/lib/**/__tests__/`.
- **Aggiornare questa sezione del project-context** quando il runner viene introdotto.

#### QA Manuale: aree ad alto rischio
- **Auth flow**: login/logout, recovery, session restore dopo refresh, inactivity timeout (30min), token refresh (10min).
- **Capacitor native**: testare su device reale (iOS + Android), UA detection, cookie banner su iOS, deletion account.
- **PWA offline**: service worker, pagine `~offline`, cache strategy.
- **Bridge game logic**: usare `src/data/*-smazzate.ts` come ground truth per validare bidding engine, DDS, AI play.
- **Profili utente**: `junior`/`giovane`/`adulto`/`senior` hanno override CSS (`[data-profile="..."]` in `globals.css`) — verificare tutti.

### Code Quality & Style Rules

#### Linting
- **ESLint flat config** (`eslint.config.mjs`): `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. **Ignora**: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.
- `npm run lint` deve essere **clean** prima del commit.
- `eslint-disable` è accettato **solo con commento che spiega il motivo**. Attualmente usato sparingly (11 occorrenze in 7 file).

#### Naming Conventions
- **File**: `kebab-case.tsx` / `kebab-case.ts` (es. `bidding-panel.tsx`, `use-game-history.ts`). Mai `PascalCase.tsx`.
- **Componenti React**: `PascalCase` (es. `function BiddingPanel()`).
- **Hooks**: prefisso `use` + kebab-case file (es. `use-spaced-review.ts` → `useSpacedReview`).
- **Costanti modulo**: `SCREAMING_SNAKE_CASE` (es. `FULL_SCREEN_ROUTES`, `PUBLIC_ROUTES`, `INACTIVITY_TIMEOUT`).
- **Variabili/funzioni**: `camelCase`.
- **Type/Interface**: `PascalCase` (`Profile`, `AuthState`, `UserProfile`).

#### File Organization
- **Componenti UI shadcn**: `src/components/ui/<component>.tsx` — pattern `function Name()` + `export { Name, nameVariants }`, import `import * as React from "react"`.
- **Componenti dominio bridge**: `src/components/bridge/<name>.tsx`.
- **Componenti app-level**: `src/components/<name>.tsx` (site-footer, cookie-banner, layout-shell…).
- **Feature components**: sottocartella sotto `src/components/` (es. `prima-mano/`, `beginner/`).
- **Hook**: `src/hooks/use-<name>.ts` — un hook per file.
- **Utility/logic**: `src/lib/<name>.ts` (es. `bridge-engine.ts`, `dds-solver.ts`, `audio-manager.ts`, `native-bridge.ts`).
- **Dati statici**: `src/data/<name>.ts` (smazzate, lezioni, glossary, courses).
- **Context**: `src/contexts/<name>-provider.tsx`.

#### Component Patterns
- **shadcn functional style**: `function Component(props)` + `export { Component }` (NO `const Component = () =>`). Pattern confermato in tutti `ui/*.tsx`.
- **Data attributes per styling**: `data-slot="..."`, `data-variant="..."`, `data-size="..."` — permette targeting CSS senza className battle.
- **Spread `...props`** preserva estensibilità; `className` separato e mergiato con `cn(...)`.
- **Readonly children pattern**: `children: Readonly<{ children: React.ReactNode }>` per RootLayout.

#### Documentation & Comments
- **Default: zero commenti**. Il codice parla da sé con naming chiaro.
- **Commento obbligatorio** solo per WHY non ovvio: workaround di bug specifici, invarianti nascoste, timing-sensitive code (es. `use-auth.ts` documenta il flow `INITIAL_SESSION`), requisiti App Store/FIGB.
- **JSDoc**: usato solo per annotare intento di costanti esportate (vedi `FULL_SCREEN_ROUTES` in `layout-shell.tsx`).
- **Niente commenti TODO/FIXME sparpagliati** — tracciare fuori (issue, commit message).
- **Niente commenti che parafrasano la riga sotto** ("this sets X to Y") — rimuovere.

#### Code Hygiene
- **No dead code**: se una feature è rimossa, elimina completamente (non lasciare variabili/import con `_` prefix o `// removed` comments).
- **No backwards-compat hack** salvo necessità reale (es. Supabase trigger race in `signUp` è giustificata dal commento inline).
- **No console.log** in produzione — `console.warn`/`console.error` accettati per failure paths (vedi `use-auth.ts`).
- **`scripts/__pycache__/`, `tmp/`, `output/`** sono output dir: gitignorare se non già gestiti.

#### Formatting
- Indent: **2 spazi**.
- **Trailing commas** dove JSON/ESLint consente (confermato in `components.json`, `tsconfig.json`).
- **Doppi apici** per string literals (`"use client"`, `"@/lib/utils"`) — coerente con ESLint config Next.
- **Semicolons**: presenti (stile TS-Next default).

#### Dipendenze
- **Non aggiungere librerie** senza valutare se `lucide-react`, Radix, shadcn o Motion già coprono il caso.
- **Librerie Tailwind plugin**: `tw-animate-css` è già presente per animazioni utility.

### Development Workflow Rules

#### Git Branches
- **`main`**: branch di produzione, auto-deploy su Vercel (`bridgelab.it`).
- **`redesign/ui-v2`**: branch attivo per il redesign UI (palette verde felt, post-FIGB-blue). Non mergiare su `main` senza review completa.
- **Feature branches**: convenzione non formalizzata; preferire `feat/<slug>`, `fix/<slug>`, `chore/<slug>` quando possibile.
- **Repo**: `github.com/albertogerli/bridge-quest`.

#### Commit Messages
- **Formato libero italiano o inglese**, imperativo breve. Prefissi comuni nel log: `Fix`, `Add`, `Admin`, `Glossario`, `Improve`.
- **Scope esplicito** quando utile: `Admin ASD:`, `Fix iPad layout,`, `Fix Apple App Store rejection (3rd attempt):`.
- **Preferibilmente**: una modifica logica per commit (lint/typecheck clean).
- **Co-author di Claude**: aggiungere `Co-Authored-By: Claude <noreply@anthropic.com>` quando pair-programmato con AI.
- **Mai amendare commit già pushati**. Mai `--force push` su `main`.

#### Build & Deploy
- **Vercel = auto-deploy** su push `main`. Preview deploy su ogni PR/branch.
- **`vercel.json`** controlla cache headers per asset statici in `public/infografiche`, `public/videos`, `public/icons`, `public/captions`, e override no-cache per `/sw.js`.
- **Pre-push checklist manuale**: `npm run build` (webpack) deve passare localmente — Vercel fallirà se il build fallisce.
- **Build time error comuni**: TS strict su nuovi file, `capacitor.config.ts` già escluso (non rimuovere), import path sbagliati (usare `@/`).
- **Environment variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` su Vercel. Aggiornare Dashboard quando introduci nuove var.

#### Native Mobile (iOS + Android)
- **iOS build pipeline**: `npm run build` → `npx cap sync ios` → aprire Xcode (`ios/App/App.xcworkspace`) → archive & upload TestFlight.
- **Android**: `npx cap sync android` → Android Studio.
- **Capacitor carica da URL remoto** (`server.url = "https://bridgelab.it"`): basta rideployare su Vercel per aggiornare l'app senza nuova review — eccetto modifiche a plugin/native code.
- **App Store reviewer checklist**: cookie banner nascosto su iOS, account deletion prominente, niente claim fuorvianti su gioco d'azzardo (bridge non è gambling).

#### PWA
- **Service worker**: cambia solo via `src/app/sw.ts` → build rigenera `public/sw.js`.
- **Cache-busting sw.js**: header `no-cache` (già in `next.config.ts` + `vercel.json`) — evitare cache stale su client.

#### Dependency Updates
- **Prima di upgrade Next/React/Tailwind**: testare in branch separato, verificare compatibilità con Capacitor 8 e Serwist 9.
- **Lockfile**: `package-lock.json` versionato — npm (non yarn/pnpm).
- **`shadcn` CLI**: aggiornare component con `npx shadcn@latest add <component>` — il CLI legge `components.json`.

#### Secrets & Security
- **Mai committare**: `.env*`, `scripts/youtube_token.json`, chiavi API private, cookie di sessione.
- **File sensibili attualmente untracked nel repo** (OK se in `.gitignore`): `scripts/youtube_token.json`, `Gruppi.xlsx`, `test-infografica.png`, `output/`, `tmp/`.
- **CSP**: qualsiasi nuova origine per script/connect/img va aggiunta in `next.config.ts` headers block.

#### Date & Localization
- **Lingua app**: Italiano (UI, copy, metadata). Codice/commit/commenti: italiano o inglese, consistente per file.
- **Date**: sempre in formato ISO nei DB (es. `new Date().toISOString()` in Supabase update).
- **Fuso orario**: i log admin usano fuso locale (vedi commit `8812b4e`).

### Critical Don't-Miss Rules

#### 🛑 Anti-pattern assoluti
- **MAI creare `tailwind.config.js`/`.ts`** — Tailwind 4 legge tutto da `@theme inline` in `src/app/globals.css`.
- **MAI importare Capacitor plugin da npm in contesto native** — usare `(window as any).Capacitor.Plugins.<Name>` o i wrapper in `src/lib/native-bridge.ts` (vedi fix commit `d3f7fe1`).
- **MAI rimuovere `capacitor.config.ts` dall'`exclude` di `tsconfig.json`** — rompe il build Vercel (vedi commit `018b943`).
- **MAI usare `import { motion } from "framer-motion"`** — il pacchetto è `motion/react`.
- **MAI usare `forwardRef`** in nuovi componenti (React 19 accetta `ref` come prop normale).
- **MAI usare path import relativi profondi** (`../../../lib/foo`) — usare sempre `@/lib/foo`.
- **MAI mockare `supabase.auth` nei test** — il flow `INITIAL_SESSION` + fallback è timing-sensitive, mock darebbero falsi positivi.
- **MAI committare `.env*`, `youtube_token.json`, o altri secret**.
- **MAI `git push --force` su `main`** né amendare commit già pushati.
- **MAI usare Turbopack per `next build`** — gli script package.json impongono webpack.

#### 🪤 Gotchas di sistema
- **Dual-brand colors**: `#003DA5` è il blu FIGB (branding istituzionale, preservato in footer/login/share-result), `#1B5E3B` è il verde felt del redesign sul branch `redesign/ui-v2`. Su `main` il primary è ancora FIGB blue. Verifica branch prima di cambiare palette.
- **Profili utente `data-profile`**: `junior`/`giovane`/`adulto`/`senior` applicano override CSS globali su `html` (font-size, spacing). Qualsiasi UI nuovo deve testare tutti e 4 i profili.
- **Cross-tab profile sync**: `storage` event + custom event `bq_profile_change`. Se cambi shape di `UserProfile`, aggiorna entrambi i listener.
- **Inactivity timeout 30min**: auto-logout + `window.location.href = "/"`. Occhio a modali/form che possono essere interrotti mid-compile.
- **Token refresh 10min**: `setInterval` in `use-auth.ts`. Se aggiungi retry su richieste autenticate, coordinale con questo refresh per evitare race.
- **UA detection native**: `navigator.userAgent.includes("BridgeLab-Native")` → iOS/Android app. Non basarsi solo su `window.Capacitor` (può essere undefined prima dell'injection).
- **Cookie banner iOS**: nascosto su device iOS per conformità App Store (vedi commit `489099f`). Se modifichi, verifica ancora rispettato.
- **`useSupabaseSync` runs on every page**: no-op se not logged in. Non aggiungere side-effects costosi senza gate.

#### 🔒 Security rules
- **RLS Supabase è il confine primario** — non fidarsi mai di `user.id` client-side per autorizzazioni sensibili; le policy DB sono authoritative.
- **Content Security Policy strict**: `script-src` permette `'unsafe-inline' 'unsafe-eval'` (necessari per Next/Analytics) e `va.vercel-scripts.com`. **Aggiungere nuove origini in `next.config.ts`** (non bypassare con meta tag).
- **`X-Frame-Options: SAMEORIGIN`** — niente embed esterno (eccetto `frame-src` permette YouTube).
- **Permissions-Policy blocca** camera, microphone, geolocation per default. Richiedere esplicitamente se serve.
- **Cookie `secure` solo in prod**, `sameSite: "lax"` per Supabase auth.
- **Non esporre mai la service-role key di Supabase client-side** — usare solo in API route server-side se necessaria.

#### ⚡ Performance gotchas
- **`src/app/page.tsx` è ~2260 righe** — già un landmark. Split in componenti se aggiungi feature sostanziali.
- **`src/app/globals.css` è ~470 righe** — crescono utility custom. Prima di aggiungere una nuova utility, cerca se esiste già.
- **Animazioni Motion**: evitare `transition: spring` su layout costosi (liste lunghe); preferire `tween` e `will-change` targeting.
- **Immagini PDF/videos/infografiche**: cache immutable 1 anno (già impostato). Se aggiorni un asset, **cambiare nome file** (hash o versione) per cache-bust.
- **Serwist disabilitato in dev**: se PWA offline va testata, usa `next build && next start` locale.
- **Dark mode FOUC**: evitato dallo script inline in `layout.tsx`. Mai rimuovere quello script.

#### 📱 Mobile & App Store
- **Ogni submission iOS Apple richiede compliance completa** — 3 rejection storiche sul cookie banner / account deletion (commit `489099f`).
- **Prima di sottomettere**: test su device fisico (iOS 17+, Android 13+), verificare haptics, status bar, safe area, splash 8s.
- **Aggiornamenti "over-the-air"**: dato che Capacitor carica `bridgelab.it`, la maggior parte dei fix deploya senza nuova review. Native code changes (plugin, Info.plist) richiedono nuovo submit.

#### 🎯 Domain-specific (Bridge)
- **Bridge engine (`src/lib/bridge-engine.ts`)**: source-of-truth per legalità di bid/play. Non duplicare logica nei componenti.
- **DDS solver (`src/lib/dds-solver.ts` + `dds-worker.ts`)**: usato in worker per calcolo tricks — non chiamare sincrono su main thread.
- **Dati smazzate statici** (`src/data/*-smazzate.ts`): struttura canonica. Modifiche richiedono validation con `scripts/validate-smazzate.ts`.
- **Suit colors europei**: rosso cuori+quadri, nero picche+fiori era convenzione storica; ora progetto usa 4 colori (rosso, arancio, verde, nero). Non reintrodurre 2-color scheme.

---

## Usage Guidelines

**Per gli agenti AI:**
- Leggi questo file **prima** di implementare qualsiasi codice.
- Segui **tutte** le regole esattamente come documentate.
- In caso di dubbio, preferisci l'opzione più restrittiva.
- Aggiorna questo file se emergono nuovi pattern consolidati.

**Per gli umani (manutenzione):**
- Mantieni il file **lean** e focalizzato sui bisogni degli agenti.
- Aggiorna quando cambiano stack tecnologico, versioni o pattern chiave.
- Revisiona trimestralmente per rimuovere regole diventate ovvie o obsolete.
- Quando un anti-pattern viene risolto alla radice (es. tool che lo impedisce), rimuovi la regola.

Last Updated: 2026-04-17
