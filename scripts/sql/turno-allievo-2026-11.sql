-- ============================================================================
-- Il turno dell'allievo nella classe (pomeriggio, sera…), deciso dall'insegnante
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `turno-allievo-2026-11-rollback.sql`.
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `class_members`, `is_instructor_of_class` (già nel baseline).
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Un insegnante tiene lo stesso corso al pomeriggio e alla sera, e qualche
-- allievo passa dall'uno all'altro da una lezione all'altra (14/11/2026). Due
-- classi separate dividerebbero a metà i risultati di chi cambia turno e gli
-- farebbero vedere ogni compito due volte. La classe resta UNA: l'aula si apre
-- al pomeriggio e si riapre la sera, e ognuno va quando viene.
--
-- Il turno è solo un'etichetta per l'insegnante: sapere chi aspettarsi e
-- tenere ordinato l'elenco. Non chiude niente a nessuno — chi è «sera» può
-- sedersi al tavolo del pomeriggio, perché è proprio il caso da cui nasce.
--
-- SI SCRIVE solo da `turno_allievo`, e il trigger impedisce che lo tocchi
-- chiunque non sia l'insegnante della classe: la policy di UPDATE lascia
-- all'allievo la propria riga (per uscire dalla classe). Stesso schema di
-- `nome-in-classe-2026-10.sql`.
--
-- Vuoto (null) = nessun turno, come prima.
-- ============================================================================

begin;

alter table public.class_members
  add column if not exists turno text;

alter table public.class_members
  drop constraint if exists class_members_turno_check;
alter table public.class_members
  add constraint class_members_turno_check
  check (turno is null or char_length(turno) between 1 and 30);

comment on column public.class_members.turno is
  'Il turno dell''allievo in questa classe (pomeriggio, sera…), scelto dall''insegnante; null = nessuno. Si scrive solo da turno_allievo.';

create or replace function public.custodisci_turno()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    -- service_role / SQL Editor: nessun vincolo.
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.turno is not null and not is_instructor_of_class(new.class_id) then
      new.turno := null;
    end if;
  elsif new.turno is distinct from old.turno
        and not is_instructor_of_class(new.class_id) then
    new.turno := old.turno;
  end if;
  return new;
end;
$$;

revoke all on function public.custodisci_turno() from public, anon, authenticated;

drop trigger if exists class_members_turno_custodito on public.class_members;
create trigger class_members_turno_custodito
  before insert or update on public.class_members
  for each row execute function public.custodisci_turno();

create or replace function public.turno_allievo(
  p_class_id uuid,
  p_student_id uuid,
  p_turno text
) returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_turno text := nullif(regexp_replace(btrim(coalesce(p_turno, '')), '\s+', ' ', 'g'), '');
begin
  if not is_instructor_of_class(p_class_id) then
    raise exception 'solo l''insegnante della classe può assegnare il turno' using errcode = '42501';
  end if;
  -- 22023, non 40001: PostgREST ritenterebbe all'infinito un errore che non cambia.
  if v_turno is not null and char_length(v_turno) > 30 then
    raise exception 'turno troppo lungo' using errcode = '22023';
  end if;

  update class_members
     set turno = v_turno
   where class_id = p_class_id and student_id = p_student_id;
  if not found then
    raise exception 'l''allievo non è della classe' using errcode = '22023';
  end if;

  return v_turno;
end;
$$;

revoke all on function public.turno_allievo(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.turno_allievo(uuid, uuid, text) to authenticated;

insert into public.script_applicati (nome) values ('turno-allievo-2026-11.sql')
on conflict (nome) do nothing;

commit;
