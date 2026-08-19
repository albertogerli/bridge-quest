# Piano di rimedio — debiti residui (post-perizia v3, 13 ago 2026)

**Scopo:** chiudere i debiti ancora aperti dopo la perizia v3. È **complementare** a `PIANO-MIGLIORAMENTO-2026-08.md` (del 9 ago): non lo duplica, lo riconcilia con lo stato attuale e aggiunge i rilievi nuovi. Ogni voce: rilievo, fix concreto, criterio di accettazione (CA), sforzo in giornate (gg, con AI-assist, prassi del progetto). Priorità: **P0** = rischio sicurezza/affidabilità, fai subito; **P1** = alto valore, questa settimana; **P2** = manutenibilità, incrementale.

---

## 0. Riconciliazione con il tuo piano (cosa è già chiuso dal 9 ago)

Aggiornamento rispetto alle voci "in attesa" / "non affrontate" di `PIANO-MIGLIORAMENTO-2026-08.md`:

| Voce tuo piano | Stato al 13 ago | Nota |
|---|---|---|
| 1.2 Colonne PII `profiles` | ✅ **CHIUSA** | `pii-columns-2026-08.sql` APPLICATO 09/08 (verificato: colonne sensibili solo via `get_own_profile()`/`admin_list_users()`) |
| 4.3 Schema DB non versionato | ✅ **CHIUSA (a modo suo)** | `000-schema-baseline.sql` + `schema:dump`/`schema:check` (commit `2f3a4b2`), verificato su PG vuoto. La CA "DB ricostruibile da zero dal repo" è soddisfatta — non serve la catena Supabase CLI. |
| 2.1 Sentry | ⚠️ **quasi** | Codice cablato e corretto, ma `NEXT_PUBLIC_SENTRY_DSN` è **vuoto** in `.env.local`. Da verificare su Vercel prod. → **P0.3** |
| 1.4 Rate limiting | ⚠️ **parziale** | Solo sui 4 route `/api/ben/*`. Mancano i route che inviano email. → **P0.1** |
| 1.1 zod su tutte le API | ⚠️ **parziale** | 6 route coperte; manca `account/delete`. → **P0.2** |
| 4.1 pagine monolitiche | 🟡 **parziale** | lezioni (2.246→169) e admin (1.825→214) fatti; restano 9 pagine `gioca/*`. → **P2.3** |
| 1.5 CSP nonce / 4.4 doppia fonte / 5.1 SSR / 5.3 Realtime | ⬜ **differite** | Confermate nel tuo piano "non affrontate per scelta di rischio". → **P1.2 / P2** |

**Novità non presenti nel tuo piano** (emerge dalla perizia v3): **56 mani didattiche non realizzabili** come dichiarante (→ P2.1), **`next build` mancante in CI** (→ P1.1).

---

## P0 — Sicurezza e affidabilità residue (≈ 1 giornata)

### P0.1 — Rate limiting sui route che inviano email (+ `account/delete`)
**Rilievo.** `rateLimit` esiste (`src/lib/ben-guard.ts:38`, firma `rateLimit(key, max, windowMs)`) ma è collegato solo ai 4 route `/api/ben/*`. Tre route sensibili ne sono sprovvisti:
- `src/app/api/friends/notify/route.ts` — invia email a un amico → **email-bombing/harassment** + costo Resend
- `src/app/api/instructor-request/route.ts` — invia email admin + upsert → stesso rischio
- `src/app/api/account/delete/route.ts` — operazione distruttiva senza throttle

**Fix (per ciascuno, dopo il check `getUser`).** Aggiungi 3 righe:
```ts
import { rateLimit } from "@/lib/ben-guard";
// …dopo if (!user) return 401;
if (!rateLimit(`notify:${user.id}`, 10, 60_000))       // friends/notify: 10/min
  return NextResponse.json({ error: "troppo traffico" }, { status: 429 });
```
Soglie suggerite: `friends/notify` 10/min, `instructor-request` 5/min, `account/delete` 3/ora.
**CA:** >N richieste/min dallo stesso utente → 429; test unitario sul gate.
**Sforzo:** 0,3 gg.
**Nota (robustezza):** il limiter è in-memory per-istanza serverless, non globale. Per fermare abuso distribuito, aggiungi **Vercel WAF rate-limit** su `/api/*` (config, non codice). L'in-memory è il primo muro, il WAF quello robusto.

### P0.2 — zod su `account/delete`
**Rilievo.** `src/app/api/account/delete/route.ts` non valida il body con zod (unico route con input non validato, a parte `cron`/`unsubscribe` che sono protetti da secret/token).
**Fix.** Schema zod minimo (es. `z.object({ confirmation: z.literal("DELETE") })`) → 400 se non matcha.
**CA:** payload non conforme → 400; nessun path che esegue la delete senza conferma esplicita.
**Sforzo:** 0,2 gg.

### P0.3 — Sentry DSN in produzione (azione umana)
**Rilievo.** `NEXT_PUBLIC_SENTRY_DSN` è vuoto in `.env.local`; instrumentation client/server è no-op senza DSN (`next.config.ts:165-176`).
**Fix.** Impostare `NEXT_PUBLIC_SENTRY_DSN` (e `SENTRY_AUTH_TOKEN` per i sourcemaps) nelle env di Vercel Production. Forzare un errore in staging e verificare l'evento.
**CA:** un errore forzato arriva in Sentry con stack + source map; nessun PII nei payload.
**Sforzo:** 0,1 gg (config).

---

## P1 — CI e affidabilità (rete di sicurezza, ≈ 2–3 gg)

### P1.1 — Completare la pipeline CI
**Rilievo.** `.github/workflows/ci.yml` fa `tsc --noEmit` + `eslint --max-warnings 0` + `npm test`, ma **manca `next build`** (errori di build RSC/server-only non vengono intercettati — proprio la classe del bug "CSP che bloccava WASM", `c239a79`) e gli e2e/test:rls girano solo in locale.

**Fix.** Aggiungere in `ci.yml`:
```yaml
      - name: Build
        run: npm run build          # cattura errori RSC/server-only/CSP-wasm
      - name: E2E (Playwright)
        run: npm run test:e2e        # richiede NEXT_PUBLIC_SUPABASE_URL+ANON_KEY + utente di test come secrets
      - name: RLS tests
        run: npm run test:rls        # richiede anon key + credenziali utente di test come secrets
```
**CA:** PR che rompe il build o una policy RLS o un flusssso e2e → CI rossa.
**Sforzo:** `next build` 0,3 gg (subito, alto valore); e2e+rls in CI 1,5 gg (serve un ambiente/utente di test e secret).
**`schema:check` (drift DB):** meglio come **job schedulato** (es. daily) che come gate PR — confronta il file baseline con un dump dalla produzione e richiede accesso DB read-only; su CI dei fork avrebbe problemi di segretezza. 0,5 gg.

### P1.2 — CSP nonce-based (decisione)
**Rilievo.** `script-src 'unsafe-inline'` permane (`next.config.ts:88`). La patch a nonce **esiste e funziona** (`tmp/csp-nonce.patch`, 0 violazioni) ma non è adottata perché fa passare il prerender da 58 a 5 rotte (TTFB `/glossario` 4→93 ms).
**Fix/decisione.** È un tradeoff reale, già analizzato onestamente nel codice. Opzioni: (a) **adottare il nonce** e recuperare il prerender con `generateStaticParams` sulle rotte a catalogo noto (vedi P2.4) — guadagno di sicurezza, costo di TTFB marginale su poche rotte; (b) **tenere `unsafe-inline`** con la giustificazione documentata (difendibile: l'app fa escaping React, niente `dangerouslySetInnerHTML` su input utente). Suggerimento: (a) — il valore di sicurezza supera il costo, soprattutto ora che ci sono i test e2e/CSP a proteggere la migrazione.
**CA (se a):** CSP senza `unsafe-inline` in prod; `csp.spec.ts` verde; nessuna regressione e2e.
**Sforzo:** 1–2 gg (fare per ultimo, con rollback pronto).

---

## P2 — Qualità contenuti e manutenibilità (incrementale, ≈ 12–16 gg)

### P2.1 — Correggere le 56 mani non realizzabili ⚠️ priorità prodotto
**Rilievo.** La validazione DDS ha trovato **56/272 mani** del catalogo non realizzabili dal dichiarante anche a carte scoperte (`validazione-smazzate.json`: ogni voce ha `id`, diagnosi `det`, `caduta`). In un prodotto didattico è un difetto di contenuto: il motore è corretto, la mano no.
**Fix.** Per ciascuna delle 56 (la lista dice esattamente di quante prese cade): o (a) **correggere il contratto/target** usando il par DDS (`bestContractFor`/`calcPar` da `dds-table.ts`) — la mano regge un contratto diverso; o (b) se la mano è pedagogicamente vincolata al contratto attuale, **rigenerarla** con `deal-generator.ts` impostando il vincolo (HCP, trump fit) e il par voluto. Aggiornare sia `src/data/*-smazzate.ts` che il DB (divergono già: catalogo source 272 vs `smazzate` DB 272, ma moduli a -27).
**CA:** `npm run` validazione DDS → 0 irrealizzabili; 56 mani corrette in source + DB.
**Sforzo:** 1–2 gg (la JSON fornisce la diagnosi esatta per ciascuna).

### P2.2 — Refactor delle 9 pagine `gioca/*` monolitiche (tuoi 4.1, restanti)
**Rilievo.** `classifica` 1.390, `gioca/smazzata` 1.237, `quiz-lampo` 1.157, `sfida-imp` 1.148, `sfida-amico` 1.029, `trova-errore` 937, `negozio` 831, `impasse` 804, `glossario-client` 1.253: tutte "use client" con stato/locale in un solo file.
**Fix.** Applicare lo **stesso pattern che ha funzionato** su lezioni/admin: estrarre la logica in un hook `_use-*.ts` + spezzare la UI in sottocomponenti `_components/`. **Una pagina per PR**, protetta dagli e2e (P1.1). Priorità: le 3–4 più toccate di recente.
**CA:** nessuna pagina `gioca/*` > 800 righe; zero regressioni e2e.
**Sforzo:** 8–10 gg (distribuito su più settimane).

### P2.3 — `generateStaticParams` sulle rotte a catalogo noto
**Rilievo.** Nessun `generateStaticParams` nonostante lezioni/moduli/glossario/circoli siano noti a build time → si paga il default RSC al primo render.
**Fix.** Aggiungere `generateStaticParams` a `lezioni/[lessonId]/[moduleId]`, `circolo/[slug]`; conferma il vantaggio anche per il recupero del prerender se si adotta il nonce CSP (P1.2).
**CA:** rotte prerenderizzate; LCP migliorato (misurare prima/dopo).
**Sforzo:** 0,5 gg.

### P2.4 — Test unitari sui top hook
**Rilievo.** 36 test coprono `src/lib`, ma gli hook "grassi" (`use-bridge-game`, `use-friends`, `use-supabase-sync`) e le pagine non hanno unit test (solo e2e smoke).
**Fix.** Test mirati sui 3–5 hook con più logica di stato/sync, dove il rischio di regressione è alto.
**CA:** gli hook più complessi hanno test; coverage dichiarata.
**Sforzo:** 2–3 gg.

---

## Fuori perimetro tecnico (decisioni di prodotto, come nel tuo piano)

- **i18n** (6.3): confermato by-design per audience FIGB. Chiudere formalmente.
- **Push notifications** (6.4): `push_subscriptions` a 0 righe, Web Push mai collegato. Decisione: attivare (nudge) o rimuovere il codice morto.
- **Engagement in calo** (6.6): MAU 678→149; non è un debito tecnico. Ora che conversioni/consenso sono a posto, misurare l'effetto della campagna Ads.
- **Google Ads label** (`NEXT_PUBLIC_GADS_SIGNUP_LABEL`): verificare che la conversione registri (Tag Assistant).

---

## Sequenza e totali

```
P0 (subito, 1 gg) → P1.1 next build (0,3 gg) → P2.1 le 56 mani (1–2 gg, priorità prodotto)
→ P1.1 e2e/rls in CI (1,5 gg) → P1.2 CSP nonce (1–2 gg) → P2.2 refactor pagine (8–10 gg, incrementale)
→ P2.3/P2.4 (3 gg)
```

- **Nucleo ad alto valore/basso sforzo (P0 + P1.1-build + P2.1): ~3–4 giornate** → chiude il rischio email-bombing, la lacuna zod, il DSN Sentry, il build in CI e le 56 mani. È il minimo sindacale prima di ogni altra cosa.
- **Rete di sicurezza completa (P1): ~3–5 gg** → CI con build+e2e+rls e (opzionale) CSP nonce.
- **Manutenibilità (P2): ~12–16 gg** → refactor pagine + test hook + static params.

A fine piano, delle 13 dimensioni della perizia le uniche ancora sotto 4 sarebbero **CI/CD** (da 2 a 4 con build+e2e), **i18n** (1, by-design) e **gamification** (2,5 — configurazione, non debito). Il punteggio medio passerebbe da 3,8 a **~4,0/5**.

*Fine del documento.*
