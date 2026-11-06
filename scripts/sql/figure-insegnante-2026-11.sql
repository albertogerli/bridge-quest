-- ============================================================================
-- Le figure salvate dell'insegnante: poche carte da proiettare a lezione
--
-- ESEGUIRE A MANO su Supabase → SQL Editor. Nessuna dipendenza.
-- Rollback: `figure-insegnante-2026-11-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHE UNA TABELLA SUA E NON `esercizi_posizione`
--
-- Trevissoi (06/11/2026) vuole comporre una figura, anche di un solo seme e
-- con un numero di carte diverso per posto, salvarla con un nome e
-- proiettarla al momento giusto. Un esercizio invece si gioca o si risponde:
-- le sue mani devono essere pari, e chi lo fa lo vede in classe. La figura
-- non si assegna e non si gioca, la vede solo chi l'ha fatta.
--
-- Cancellando l'account, `on delete cascade` porta via anche le figure.
-- ============================================================================

begin;

create table if not exists public.figure_insegnante (
  id uuid primary key default gen_random_uuid(),
  autore_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  -- Le carte per posto, come nell'editor: {"north":[{"suit":"spade","rank":"A"}],…}
  mani jsonb not null check (jsonb_typeof(mani) = 'object'),
  atout text check (atout in ('spade', 'heart', 'diamond', 'club')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.figure_insegnante is
  'Figure di poche carte (anche un solo seme, lunghezze diverse) composte da un '
  'insegnante in /istruttori/combinazione, da riaprire e proiettare. Private.';

create index if not exists figure_insegnante_autore_idx
  on public.figure_insegnante (autore_id, created_at desc);

alter table public.figure_insegnante enable row level security;

drop policy if exists "L'insegnante gestisce le sue figure" on public.figure_insegnante;
create policy "L'insegnante gestisce le sue figure"
  on public.figure_insegnante
  for all
  to authenticated
  using (autore_id = (select auth.uid()))
  with check (autore_id = (select auth.uid()));

revoke all on table public.figure_insegnante from anon;
grant select, insert, update, delete on table public.figure_insegnante to authenticated;

insert into public.script_applicati (nome) values ('figure-insegnante-2026-11.sql')
on conflict (nome) do nothing;

commit;
