-- ============================================================================
-- Stelle assegnate dall'insegnante nei compiti di licita
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `stelle-insegnante-2026-10-rollback.sql`.
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `compito-licita-2026-10.sql` (colonna `assignments.licita`),
-- `is_instructor_of_assignment`, `is_member_of_class`, `touch_updated_at`
-- (già nel baseline). Indipendente da `commenti-compito-2026-10.sql`.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Le stelle di un compito di licita le calcola il programma confrontando il
-- contratto raggiunto col par. Ma l'insegnante spesso spiega accordi diversi
-- da quelli del corso federale, e un allievo che ha dichiarato come gli è
-- stato insegnato si ritrova con una stella sola (25/10/2026). Due cose:
--
--   1. `stelle_compito`: l'insegnante corregge le stelle di un allievo su una
--      mano. Una riga per (compito, mano, allievo); `null` dalla RPC la
--      cancella e torna il voto del programma.
--
--   2. `assignments.stelle_insegnante`: il compito si crea con le stelle «le
--      assegno io». L'allievo non vede il voto automatico, ma «in attesa
--      dell'insegnante» finché non arrivano le sue.
--
-- Si scrive solo dalla RPC `assegna_stelle_compito`, che controlla che chi
-- scrive sia l'insegnante della classe. La colonna sul compito la cambia
-- l'insegnante con la policy di UPDATE che già ha su `assignments`.
--
-- LEGGONO: l'insegnante tutte le stelle del compito; l'allievo solo le sue.
-- ============================================================================

begin;

alter table public.assignments
  add column if not exists stelle_insegnante boolean not null default false;

comment on column public.assignments.stelle_insegnante is
  'Compito di licita: le stelle le assegna l''insegnante. L''allievo non vede il voto automatico finché non arrivano le sue (stelle_compito).';

create table if not exists public.stelle_compito (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  smazzata_id text not null,
  student_id uuid not null references auth.users(id) on delete cascade,
  stelle numeric(2,1) not null check (stelle >= 0 and stelle <= 3 and stelle * 2 = floor(stelle * 2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, smazzata_id, student_id)
);

comment on table public.stelle_compito is
  'Stelle dell''insegnante su una mano di un compito di licita, al posto di quelle del programma. Si scrive solo da assegna_stelle_compito.';

drop trigger if exists stelle_compito_updated_at on public.stelle_compito;
create trigger stelle_compito_updated_at
  before update on public.stelle_compito
  for each row execute function public.touch_updated_at();

alter table public.stelle_compito enable row level security;

revoke all on table public.stelle_compito from anon, authenticated;
grant select on table public.stelle_compito to authenticated;
grant all on table public.stelle_compito to service_role;

drop policy if exists "Insegnante legge le stelle del compito" on public.stelle_compito;
create policy "Insegnante legge le stelle del compito" on public.stelle_compito
  for select to authenticated
  using (public.is_instructor_of_assignment(assignment_id));

drop policy if exists "Allievo legge le sue stelle" on public.stelle_compito;
create policy "Allievo legge le sue stelle" on public.stelle_compito
  for select to authenticated
  using (
    student_id = auth.uid()
    and exists (
      select 1 from public.assignments a
      where a.id = stelle_compito.assignment_id
        and public.is_member_of_class(a.class_id)
    )
  );

create or replace function public.assegna_stelle_compito(
  p_assignment_id uuid,
  p_smazzata_id text,
  p_student_id uuid,
  p_stelle numeric
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not is_instructor_of_assignment(p_assignment_id) then
    raise exception 'non sei l''insegnante di questo compito' using errcode = '42501';
  end if;

  if p_stelle is null then
    delete from stelle_compito
    where assignment_id = p_assignment_id
      and smazzata_id = p_smazzata_id
      and student_id = p_student_id;
    return;
  end if;

  -- 22023 (invalid_parameter_value), non 40001: PostgREST ritenterebbe
  -- all'infinito un errore che non cambia.
  if p_stelle < 0 or p_stelle > 3 or p_stelle * 2 <> floor(p_stelle * 2) then
    raise exception 'stelle non valide: %', p_stelle using errcode = '22023';
  end if;

  insert into stelle_compito (assignment_id, smazzata_id, student_id, stelle)
  values (p_assignment_id, p_smazzata_id, p_student_id, p_stelle)
  on conflict (assignment_id, smazzata_id, student_id)
  do update set stelle = excluded.stelle;
end;
$$;

revoke all on function public.assegna_stelle_compito(uuid, text, uuid, numeric) from public, anon, authenticated;
grant execute on function public.assegna_stelle_compito(uuid, text, uuid, numeric) to authenticated;

insert into public.script_applicati (nome) values ('stelle-insegnante-2026-10.sql')
on conflict (nome) do nothing;

commit;
