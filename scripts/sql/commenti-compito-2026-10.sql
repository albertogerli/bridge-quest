-- ============================================================================
-- Commenti dell'insegnante sulle mani di un compito
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `commenti-compito-2026-10-rollback.sql`.
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `is_instructor_of_assignment`, `is_member_of_class` (già nel
-- baseline).
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- L'insegnante correggeva le aste dei compiti di licita facendo lo screenshot
-- di ogni mano e mandandolo su WhatsApp (23/10/2026). Il commento ora sta
-- dentro il compito, accanto alla mano che corregge:
--
--   - `student_id` valorizzato: il commento è per quell'allievo solo;
--   - `student_id` NULL: il commento è sulla mano per tutta la classe.
--
-- UN COMMENTO PER (compito, mano, allievo): riscriverlo lo sostituisce, e un
-- testo vuoto lo cancella. Si scrive solo dalla RPC `salva_commento_compito`,
-- che controlla che chi scrive sia l'insegnante della classe: niente
-- INSERT/UPDATE diretti dal client.
--
-- LEGGONO: l'insegnante della classe tutti i commenti del compito; l'allievo
-- iscritto solo i suoi e quelli per tutta la classe.
-- ============================================================================

begin;

create table if not exists public.commenti_compito (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  smazzata_id text not null,
  student_id uuid references auth.users(id) on delete cascade,
  testo text not null check (char_length(testo) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.commenti_compito is
  'Commento dell''insegnante su una mano di un compito: per un allievo (student_id) o per tutta la classe (student_id null). Si scrive solo da salva_commento_compito.';

create unique index if not exists commenti_compito_unico
  on public.commenti_compito (assignment_id, smazzata_id, coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid));

drop trigger if exists commenti_compito_updated_at on public.commenti_compito;
create trigger commenti_compito_updated_at
  before update on public.commenti_compito
  for each row execute function public.touch_updated_at();

alter table public.commenti_compito enable row level security;

revoke all on table public.commenti_compito from anon, authenticated;
grant select on table public.commenti_compito to authenticated;
grant all on table public.commenti_compito to service_role;

drop policy if exists "Insegnante legge i commenti del compito" on public.commenti_compito;
create policy "Insegnante legge i commenti del compito" on public.commenti_compito
  for select to authenticated
  using (public.is_instructor_of_assignment(assignment_id));

drop policy if exists "Allievo legge i commenti per lui" on public.commenti_compito;
create policy "Allievo legge i commenti per lui" on public.commenti_compito
  for select to authenticated
  using (
    (student_id is null or student_id = auth.uid())
    and exists (
      select 1 from public.assignments a
      where a.id = commenti_compito.assignment_id
        and public.is_member_of_class(a.class_id)
    )
  );

create or replace function public.salva_commento_compito(
  p_assignment_id uuid,
  p_smazzata_id text,
  p_student_id uuid,
  p_testo text
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_testo text := nullif(btrim(coalesce(p_testo, '')), '');
begin
  if not is_instructor_of_assignment(p_assignment_id) then
    raise exception 'non sei l''insegnante di questo compito' using errcode = '42501';
  end if;

  if v_testo is null then
    delete from commenti_compito
    where assignment_id = p_assignment_id
      and smazzata_id = p_smazzata_id
      and student_id is not distinct from p_student_id;
    return;
  end if;

  insert into commenti_compito (assignment_id, smazzata_id, student_id, testo)
  values (p_assignment_id, p_smazzata_id, p_student_id, v_testo)
  on conflict (assignment_id, smazzata_id, coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set testo = excluded.testo;
end;
$$;

revoke all on function public.salva_commento_compito(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.salva_commento_compito(uuid, text, uuid, text) to authenticated;

insert into public.script_applicati (nome) values ('commenti-compito-2026-10.sql')
on conflict (nome) do nothing;

commit;
