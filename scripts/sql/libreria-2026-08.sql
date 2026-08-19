-- ============================================================================
-- BridgeLab: la libreria federale
-- ============================================================================
--
-- Intervento 26 del terzo lotto.
-- DIPENDENZE: `instructor_portal.sql`, `modelli-mani-2026-08.sql`. IDEMPOTENTE.
--
-- PERCHÉ. Gli insegnanti che preparano materiale sono una minoranza, e quello
-- che preparano oggi muore nel loro portatile. Chi apre il portale la sera
-- della prima lezione non ha niente e non ha il tempo di costruirselo: se non
-- trova qualcosa di pronto per l'argomento del giorno, chiude.
--
-- SI IMPORTA UNA COPIA, MAI UN RIFERIMENTO. Chi importa può cambiare senza
-- toccare l'originale e, soprattutto, l'originale non gli cambia sotto i piedi
-- la sera della lezione perché l'autore l'ha ritoccato.
--
-- L'APPROVAZIONE NON È BUROCRAZIA: è materiale che porta il nome della
-- federazione e finisce davanti a classi di principianti. Serve anche per la
-- responsabilità sui contenuti, che con la pubblicazione libera resterebbe di
-- nessuno. Il ruolo `curatore` si aggiunge in `profiles.role` accanto a
-- `instructor` e `admin`.
--
-- IL CONTATORE PASSA DA UNA FUNZIONE, e non è un vezzo: chi importa non ha —
-- giustamente — il permesso di scrivere sulla riga di un altro, ed è proprio
-- quella riga che deve cambiare.
-- ============================================================================

create table if not exists public.libreria (
  id uuid primary key default gen_random_uuid(),
  autore_id uuid references auth.users(id) on delete set null,
  tipo text not null,
  titolo text not null,
  descrizione text,
  livello text,
  argomento text,
  lesson_id integer references public.lessons(id) on delete set null,
  contenuto jsonb not null,
  stato text not null default 'in-attesa',
  nota_curatore text,
  usi integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.libreria drop constraint if exists libreria_tipo_check;
alter table public.libreria add constraint libreria_tipo_check
  check (tipo in ('modello', 'smazzate', 'esercizi'));

alter table public.libreria drop constraint if exists libreria_stato_check;
alter table public.libreria add constraint libreria_stato_check
  check (stato in ('in-attesa', 'approvato', 'rifiutato'));

create index if not exists idx_libreria_approvati on public.libreria (stato, lesson_id, created_at desc);
create index if not exists idx_libreria_autore on public.libreria (autore_id, created_at desc);

alter table public.libreria enable row level security;

create or replace function public.is_curatore()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('curatore', 'admin')
  );
$$;

drop policy if exists "La libreria approvata la vede chi insegna" on public.libreria;
create policy "La libreria approvata la vede chi insegna" on public.libreria
  for select to authenticated
  using (
    autore_id = auth.uid()
    or is_curatore()
    or (
      stato = 'approvato'
      and exists (
        select 1 from profiles p
        where p.id = auth.uid() and p.role in ('instructor', 'admin', 'curatore')
      )
    )
  );

-- Si propone SEMPRE «in attesa»: nessuno pubblica direttamente, nemmeno per
-- errore, perche il `with check` lo vieta.
drop policy if exists "Chi insegna propone" on public.libreria;
create policy "Chi insegna propone" on public.libreria
  for insert to authenticated
  with check (
    autore_id = auth.uid()
    and stato = 'in-attesa'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('instructor', 'admin', 'curatore')
    )
  );

-- L'autore corregge finche non e approvata, e la correzione la rimanda in
-- attesa: cambiare il contenuto dopo l'approvazione aggirerebbe il curatore.
drop policy if exists "L'autore corregge la propria proposta" on public.libreria;
create policy "L'autore corregge la propria proposta" on public.libreria
  for update to authenticated
  using (autore_id = auth.uid() and stato <> 'approvato')
  with check (autore_id = auth.uid() and stato = 'in-attesa');

drop policy if exists "Il curatore decide" on public.libreria;
create policy "Il curatore decide" on public.libreria
  for update to authenticated
  using (is_curatore())
  with check (is_curatore());

drop policy if exists "L'autore ritira la propria proposta" on public.libreria;
create policy "L'autore ritira la propria proposta" on public.libreria
  for delete to authenticated
  using (autore_id = auth.uid() or is_curatore());

create or replace function public.libreria_segna_uso(p_id uuid)
returns void
language sql
security definer
set search_path to 'public'
as $$
  update libreria set usi = usi + 1 where id = p_id and stato = 'approvato';
$$;

comment on function public.libreria_segna_uso(uuid) is
  'Conta un utilizzo. Passa da qui perche chi importa non ha il permesso di scrivere sulla riga altrui, ed e proprio quella a doversi alzare.';

revoke all on function public.libreria_segna_uso(uuid) from public;
grant execute on function public.libreria_segna_uso(uuid) to authenticated;

comment on table public.libreria is
  'La libreria federale: modelli, set di smazzate e raccolte di esercizi pubblicati da un insegnante e approvati da un curatore.';
