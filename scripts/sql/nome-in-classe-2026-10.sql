-- ============================================================================
-- Il nome dell'allievo nella classe, deciso dall'insegnante
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `nome-in-classe-2026-10-rollback.sql`.
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `class_members`, `is_instructor_of_class` (già nel baseline).
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- In una classe ci sono due allievi che si chiamano Giuseppe: uno dichiara
-- bene, l'altro no, e quello che dichiara male si vorrebbe prendere i meriti
-- dell'altro (regia di un corso, 29/10/2026). I risultati restano legati
-- all'account, ma l'insegnante vede due righe «Giuseppe» e non sa chi è chi.
--
-- Il nome del profilo lo sceglie l'allievo, e quindi non serve: chi vuole
-- confondere le carte si chiama come gli pare. Questo lo sceglie l'insegnante,
-- vale solo in quella classe, e l'allievo non lo può cambiare.
--
-- SI SCRIVE solo da `rinomina_allievo`. Il trigger `class_members_nome_custodito`
-- impedisce che lo tocchi chiunque non sia l'insegnante della classe: la policy
-- di UPDATE lascia all'allievo la propria riga (per uscire dalla classe), e
-- senza il trigger potrebbe riscriversi il nome uscendo.
--
-- Vuoto (null) = si usa il nome del profilo, come prima.
-- ============================================================================

begin;

alter table public.class_members
  add column if not exists nome_in_classe text;

alter table public.class_members
  drop constraint if exists class_members_nome_in_classe_check;
alter table public.class_members
  add constraint class_members_nome_in_classe_check
  check (nome_in_classe is null or char_length(nome_in_classe) between 1 and 60);

comment on column public.class_members.nome_in_classe is
  'Il nome dell''allievo in questa classe, scelto dall''insegnante (null = nome del profilo). Si scrive solo da rinomina_allievo.';

-- Chi non è l'insegnante della classe non cambia il nome: né l'allievo che
-- esce (UPDATE della propria riga) né quello che entra (INSERT).
create or replace function public.custodisci_nome_in_classe()
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
    if new.nome_in_classe is not null and not is_instructor_of_class(new.class_id) then
      new.nome_in_classe := null;
    end if;
  elsif new.nome_in_classe is distinct from old.nome_in_classe
        and not is_instructor_of_class(new.class_id) then
    new.nome_in_classe := old.nome_in_classe;
  end if;
  return new;
end;
$$;

revoke all on function public.custodisci_nome_in_classe() from public, anon, authenticated;

drop trigger if exists class_members_nome_custodito on public.class_members;
create trigger class_members_nome_custodito
  before insert or update on public.class_members
  for each row execute function public.custodisci_nome_in_classe();

create or replace function public.rinomina_allievo(
  p_class_id uuid,
  p_student_id uuid,
  p_nome text
) returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  -- Spazi ripetuti ridotti a uno: «Giuseppe   R.» e «Giuseppe R.» sono lo stesso nome.
  v_nome text := nullif(regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g'), '');
begin
  if not is_instructor_of_class(p_class_id) then
    raise exception 'solo l''insegnante della classe può rinominare' using errcode = '42501';
  end if;
  -- 22023 (invalid_parameter_value), non 40001: PostgREST ritenterebbe
  -- all'infinito un errore che non cambia.
  if v_nome is not null and char_length(v_nome) > 60 then
    raise exception 'nome troppo lungo' using errcode = '22023';
  end if;

  update class_members
     set nome_in_classe = v_nome
   where class_id = p_class_id and student_id = p_student_id;
  if not found then
    raise exception 'l''allievo non è della classe' using errcode = '22023';
  end if;

  return v_nome;
end;
$$;

revoke all on function public.rinomina_allievo(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.rinomina_allievo(uuid, uuid, text) to authenticated;

insert into public.script_applicati (nome) values ('nome-in-classe-2026-10.sql')
on conflict (nome) do nothing;

commit;
