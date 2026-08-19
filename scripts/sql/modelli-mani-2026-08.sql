-- ============================================================================
-- BridgeLab: i modelli di generazione, salvabili e condivisibili
-- ============================================================================
--
-- Intervento 11 del secondo lotto (e base del 26, la libreria condivisa).
--
-- DIPENDENZE: `instructor_portal.sql` (profiles.role), tabella `lessons`.
-- IDEMPOTENTE.
--
-- IL MOTORE C'ERA GIÀ, e accetta vincoli più espressivi di quanto il piano
-- chiedesse: punti per mano e per linea, lunghezze, sagome, cortezze, qualità
-- dei colori, alternative in OR. Quello che mancava era il modo di SALVARE un
-- vincolo e ritrovarlo — senza, si ripartiva ogni volta dai sette modelli
-- scritti nel codice.
--
-- `ufficiale` NON È SCRIVIBILE DAL CLIENT: le policy lo vietano in inserimento
-- e in modifica. I tredici modelli del Corso Fiori entrano con
-- `scripts/carica-modelli-ufficiali.mjs`, che usa il service role. Sono la
-- cosa che rende la pagina utile al primo accesso, prima che l'insegnante
-- impari a comporre un vincolo, e non devono poter essere cambiati da chi
-- passa di lì.
--
-- L'indice unico su (lesson_id) where ufficiale garantisce che di ufficiale
-- per lezione ce ne sia uno solo: due modelli «Lezione 5» nell'elenco sarebbero
-- una domanda a cui l'insegnante non sa rispondere.
-- ============================================================================

create table if not exists public.modelli_mani (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descrizione text,
  vincoli jsonb not null,
  autore_id uuid references auth.users(id) on delete set null,
  ufficiale boolean not null default false,
  condiviso boolean not null default false,
  lesson_id integer references public.lessons(id) on delete set null,
  usi integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_modelli_mani_autore on public.modelli_mani (autore_id, created_at desc);
create index if not exists idx_modelli_mani_lezione on public.modelli_mani (lesson_id) where lesson_id is not null;
create unique index if not exists uq_modelli_ufficiali_lezione
  on public.modelli_mani (lesson_id) where ufficiale;

alter table public.modelli_mani enable row level security;

drop policy if exists "I modelli si leggono se tuoi, ufficiali o condivisi" on public.modelli_mani;
create policy "I modelli si leggono se tuoi, ufficiali o condivisi" on public.modelli_mani
  for select to authenticated
  using (ufficiale or condiviso or autore_id = auth.uid());

drop policy if exists "Chi insegna crea i propri modelli" on public.modelli_mani;
create policy "Chi insegna crea i propri modelli" on public.modelli_mani
  for insert to authenticated
  with check (
    autore_id = auth.uid()
    and not ufficiale
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('instructor', 'admin')
    )
  );

drop policy if exists "Ognuno modifica i propri" on public.modelli_mani;
create policy "Ognuno modifica i propri" on public.modelli_mani
  for update to authenticated
  using (autore_id = auth.uid() and not ufficiale)
  with check (autore_id = auth.uid() and not ufficiale);

drop policy if exists "Ognuno cancella i propri" on public.modelli_mani;
create policy "Ognuno cancella i propri" on public.modelli_mani
  for delete to authenticated
  using (autore_id = auth.uid() and not ufficiale);

comment on table public.modelli_mani is
  'Modelli di generazione riusabili. `ufficiale` = precaricato dalla FIGB, non modificabile dal client; `condiviso` = pubblicato dall''autore per gli altri insegnanti.';
