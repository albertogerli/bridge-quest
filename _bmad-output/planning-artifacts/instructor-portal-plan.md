# Portale Istruttori BridgeLab (ASD B2B) — Piano di implementazione

> Stato: in sviluppo · Avvio 2026-05-29 · Scope deciso: **Full (incl. modalità aula live)** · Risultati: **riuso di `game_results`**

## Obiettivo

Trasformare BridgeLab nello strumento didattico ufficiale per le ASD e i maestri FIGB.
Gli istruttori creano classi virtuali, assegnano smazzate dal catalogo come compiti, e
analizzano i risultati degli allievi (anche in tempo reale durante la lezione).

## Decisioni chiave

| Tema | Decisione | Motivo |
|---|---|---|
| Ruolo istruttore | Colonna `role text` su `profiles` (`user`/`instructor`/`admin`), **non** `is_instructor` | Ortogonale a `profile_type` (età/UI); RLS più pulite; copre anche `admin` |
| Iscrizione studenti | Codice invito 6 char (alfabeto senza caratteri ambigui) + QR code | Basso attrito per utenza senior; QR proiettabile in aula; rigenerabile/revocabile |
| Risultati compiti | Riuso `game_results` + colonna `assignment_id` (NIENTE tabella separata) | La scrittura partita esiste già; il portale diventa lettura aggregata |
| Gating route | `layout.tsx` come **Server Component** che legge `role` e fa `redirect()` | Evita il flash del profilo caricato client-side da `useAuth()` |

## Fatti ancorati al codice

- `game_results (user_id, game_type, score, details jsonb, created_at)` esiste con RLS
  (read/insert own only, immutabile). `game_type` include già `'sfida'`, `'smazzata'`.
- `Smazzata` (src/lib/catalog.ts): `id` string ("1-1", "Q1-1"), `contract`, `declarer`,
  `hands {north/south/east/west: Card[]}`, `commentary`. ~272 righe, cache di sessione.
- Sfida settimanale: flusso 5 mani sequenziali, ma progresso **solo in localStorage**
  (`bq_weekly_challenge_progress`). Da adattare scrivendo su Supabase per i compiti.
- Auth: `useAuth()` carica `profile` in background (non bloccante) → gating client soffre di flash.
- Anagrafica ASD seeded (260 circoli) con `asd_code` → join naturale per le classi.
- Pattern store Zustand: `isLoading/isLoaded/error` + `useEnsure` + dedupe in-flight (vedi `use-smazzate-store.ts`).
- Convenzioni SQL: idempotente (`IF NOT EXISTS`, `OR REPLACE`), `DROP POLICY IF EXISTS` prima di `CREATE POLICY`, RPC `SECURITY DEFINER STABLE`.

## Schema dati (scripts/sql/instructor_portal.sql)

- `profiles.role text default 'user'` (CHECK user/instructor/admin)
- `classes (id, instructor_id, asd_code, name, description, invite_code unique, invite_active, created_at)`
- `class_members (class_id, student_id, status, joined_at)` PK composta
- `assignments (id, class_id, title, instructor_note, smazzata_ids text[], due_date, mode, unlock_mode, live_active_index, created_at)`
- `game_results.assignment_id uuid` (riuso) + "carta divergente" in `details` (Fase 2)
- RLS: istruttore vede solo le sue classi/compiti; studente solo quelle di appartenenza;
  policy aggiuntiva su `game_results` per far leggere all'istruttore i risultati dei compiti
  delle proprie classi (via funzione `SECURITY DEFINER` per evitare ricorsione RLS).
- RPC helper: `generate_invite_code()`, `is_instructor_of_class(uuid)`, `is_member_of_class(uuid)`,
  `get_class_results(assignment_id)`.

## Data Access Layer (src/lib/instructors.ts)

createClass · regenerateInviteCode · getMyClasses · getClassDetail · joinClass · leaveClass ·
createAssignment · getStudentAssignments · getAssignment · getAssignmentResults ·
setLiveActiveHand · subscribeLiveResults (Realtime)

## Frontend

**Istruttore — src/app/istruttori/**
- layout.tsx (Server Component, gate role)
- page.tsx (lista classi + crea)
- [classId]/page.tsx (tab Allievi con QR/codice + Compiti)
- [classId]/nuovo-compito/page.tsx (browser catalogo con filtri didattici)
- [classId]/compito/[assignmentId]/page.tsx (heatmap studenti×smazzate)
- [classId]/live/[assignmentId]/page.tsx (modalità aula, Realtime)

**Studente — src/app/classi/**
- page.tsx (classi iscritte + input codice / scanner QR)
- [classId]/page.tsx (compiti Da Fare / Completati)
- [classId]/compito/[assignmentId]/page.tsx (gioco sequenziale, sink su Supabase)

## Fasi

1. **MVP** — ✅ COMPLETATA (2026-05-29): role, classi, join via codice, compiti dal catalogo
   (filtri lezione+difficoltà+ricerca), dashboard heatmap read-only.
   File: `scripts/sql/instructor_portal.sql`, `src/lib/instructors.ts`,
   `src/lib/smazzata-meta.ts`, `src/store/use-classes-store.ts`,
   `src/app/istruttori/{layout,page,[classId]/page,[classId]/nuovo-compito/page,[classId]/compito/[assignmentId]/page}.tsx`,
   `src/app/classi/{page,[classId]/page,[classId]/compito/[assignmentId]/page}.tsx`,
   link in `src/components/desktop-sidebar.tsx`. Decisione: QR rimandato (solo codice 6 char per ora).
2. **Diagnostica** — TODO: carta divergente nel `details`, "errore comune della classe", compito di recupero auto.
3. **Aula live** — TODO: `mode='live'` + Supabase Realtime (allievi su tablet/telefono, istruttore vede in diretta).
   DAL già pronto: `setLiveActiveHand`, `subscribeLiveResults`.

## Piano di verifica

1. Eseguire `instructor_portal.sql` su Supabase.
2. `UPDATE profiles SET role='instructor'` sul profilo di test.
3. /istruttori → crea "Corso Fiori 2026" → proietta QR.
4. Incognito, utente normale → join via codice.
5. Istruttore crea compito (3 mani filtrate per "impasse").
6. Studente gioca → verifica `game_results.assignment_id` scritto.
7. Heatmap mostra prese/contratto/down. **Test RLS negativo**: altro istruttore NON vede.
8. Fase 3: due tablet sulla stessa mano live → risultati in diretta.
