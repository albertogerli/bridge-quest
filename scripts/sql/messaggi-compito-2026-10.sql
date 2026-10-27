-- ============================================================================
-- Domande e risposte tra allievo e insegnante su una mano di un compito
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `messaggi-compito-2026-10-rollback.sql`.
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `is_instructor_of_assignment`, `is_member_of_class` (già nel
-- baseline). Indipendente da `commenti-compito-2026-10.sql`.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Il commento dell'insegnante (`commenti_compito`) andava in una direzione
-- sola: l'allievo che non lo capiva doveva aspettare la lezione dopo, tre
-- giorni, per chiedere (Saccomanno con la classe, 27/10/2026). Qui allievo e
-- insegnante si scrivono sulla mano, nel compito.
--
-- UNA CONVERSAZIONE PER (compito, mano, allievo): `student_id` dice di quale
-- allievo è il filo, `dall_insegnante` chi ha scritto il messaggio. Il
-- commento dell'insegnante resta dov'è e apre il filo; questi sono i messaggi
-- che seguono.
--
-- Si scrive solo da `scrivi_messaggio_compito`, che decide chi sei:
-- l'insegnante della classe scrive in qualunque filo del compito, l'allievo
-- iscritto solo nel suo. Niente INSERT/UPDATE/DELETE diretti dal client.
--
-- LEGGONO: l'insegnante tutti i fili del compito; l'allievo solo il suo.
-- ============================================================================

begin;

create table if not exists public.messaggi_compito (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  smazzata_id text not null,
  student_id uuid not null references auth.users(id) on delete cascade,
  autore_id uuid not null references auth.users(id) on delete cascade,
  dall_insegnante boolean not null,
  testo text not null check (char_length(testo) between 1 and 2000),
  created_at timestamptz not null default now()
);

comment on table public.messaggi_compito is
  'Domande e risposte tra allievo e insegnante su una mano di un compito: un filo per (assignment_id, smazzata_id, student_id). Si scrive solo da scrivi_messaggio_compito.';

create index if not exists messaggi_compito_filo
  on public.messaggi_compito (assignment_id, smazzata_id, student_id, created_at);

alter table public.messaggi_compito enable row level security;

revoke all on table public.messaggi_compito from anon, authenticated;
grant select on table public.messaggi_compito to authenticated;
grant all on table public.messaggi_compito to service_role;

drop policy if exists "Insegnante legge i messaggi del compito" on public.messaggi_compito;
create policy "Insegnante legge i messaggi del compito" on public.messaggi_compito
  for select to authenticated
  using (public.is_instructor_of_assignment(assignment_id));

drop policy if exists "Allievo legge il suo filo" on public.messaggi_compito;
create policy "Allievo legge il suo filo" on public.messaggi_compito
  for select to authenticated
  using (
    student_id = auth.uid()
    and exists (
      select 1 from public.assignments a
      where a.id = messaggi_compito.assignment_id
        and public.is_member_of_class(a.class_id)
    )
  );

create or replace function public.scrivi_messaggio_compito(
  p_assignment_id uuid,
  p_smazzata_id text,
  p_student_id uuid,
  p_testo text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_testo text := btrim(coalesce(p_testo, ''));
  v_class uuid;
  v_mani text[];
  v_insegnante boolean;
  v_riga messaggi_compito;
begin
  select class_id, smazzata_ids into v_class, v_mani
  from assignments where id = p_assignment_id;
  if v_class is null then
    raise exception 'compito non trovato' using errcode = '42501';
  end if;

  v_insegnante := is_instructor_of_assignment(p_assignment_id);
  if not v_insegnante
     and not (p_student_id = auth.uid() and is_member_of_class(v_class)) then
    raise exception 'non puoi scrivere in questa conversazione' using errcode = '42501';
  end if;

  -- 22023 (invalid_parameter_value), non 40001: PostgREST ritenterebbe
  -- all'infinito un errore che non cambia.
  if char_length(v_testo) = 0 or char_length(v_testo) > 2000 then
    raise exception 'messaggio vuoto o troppo lungo' using errcode = '22023';
  end if;
  if not (p_smazzata_id = any(v_mani)) then
    raise exception 'la mano non è di questo compito' using errcode = '22023';
  end if;
  -- L'insegnante scrive solo agli allievi della classe.
  if v_insegnante and not exists (
    select 1 from class_members m
    where m.class_id = v_class and m.student_id = p_student_id
  ) then
    raise exception 'l''allievo non è della classe' using errcode = '22023';
  end if;
  -- Un tetto contro i messaggi a raffica: 40 al giorno per allievo e compito.
  if not v_insegnante and (
    select count(*) from messaggi_compito
    where assignment_id = p_assignment_id
      and autore_id = auth.uid()
      and created_at > now() - interval '1 day'
  ) >= 40 then
    raise exception 'troppi messaggi oggi su questo compito' using errcode = 'PT429';
  end if;

  insert into messaggi_compito (assignment_id, smazzata_id, student_id, autore_id, dall_insegnante, testo)
  values (p_assignment_id, p_smazzata_id, p_student_id, auth.uid(), v_insegnante, v_testo)
  returning * into v_riga;

  return jsonb_build_object(
    'id', v_riga.id,
    'smazzata_id', v_riga.smazzata_id,
    'student_id', v_riga.student_id,
    'dall_insegnante', v_riga.dall_insegnante,
    'testo', v_riga.testo,
    'created_at', v_riga.created_at
  );
end;
$$;

revoke all on function public.scrivi_messaggio_compito(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.scrivi_messaggio_compito(uuid, text, uuid, text) to authenticated;

insert into public.script_applicati (nome) values ('messaggi-compito-2026-10.sql')
on conflict (nome) do nothing;

commit;
