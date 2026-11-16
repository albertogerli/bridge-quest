-- ============================================================================
-- Più insegnanti nella stessa classe
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `co-insegnanti-2026-11-rollback.sql`.
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `classes`, `live_tables`, `sessioni_aula`, `profiles`,
-- `is_instructor_of_class`, `is_instructor_of_assignment` (già nel baseline).
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Un corso di primo livello tenuto da tre istruttori, due sere a settimana
-- (richiesta del 16/11/2026). Finora una classe aveva un solo insegnante,
-- `classes.instructor_id`, e un collega poteva entrarci solo da allievo.
--
-- COME
--
-- `classe_insegnanti` elenca i colleghi; il titolare resta in
-- `classes.instructor_id` e non sta nella tabella. Quasi tutti i permessi del
-- database passano da `is_instructor_of_class` / `is_instructor_of_assignment`:
-- basta che rispondano sì anche ai colleghi e allievi, compiti, risultati,
-- materiali, sondaggi, aula seguono da soli. Restano da allargare a mano:
--   - le policy di SELECT e UPDATE su `classes`;
--   - la policy dei tavoli (`live_tables`) e il WITH CHECK delle sessioni d'aula;
--   - cinque funzioni dei tavoli che confrontavano `instructor_id` con l'utente.
--     Si correggono sostituendo solo quel confronto nella definizione attuale
--     (pg_get_functiondef + replace): ricopiarle intere qui vorrebbe dire
--     rischiare di riportare indietro modifiche successive.
--
-- COSA NON PUÒ FARE UN COLLEGA: eliminare la classe (la policy di DELETE resta
-- al titolare), prendersene la titolarità (trigger `custodisci_titolare_classe`),
-- aggiungere o togliere altri insegnanti. Può togliere sé stesso.
--
-- I colleghi si aggiungono per email e devono essere insegnanti approvati
-- (`profiles.role` instructor o admin), come chi crea una classe.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. La tabella
-- ---------------------------------------------------------------------------
create table if not exists public.classe_insegnanti (
  class_id uuid not null references public.classes(id) on delete cascade,
  insegnante_id uuid not null references auth.users(id) on delete cascade,
  aggiunto_da uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (class_id, insegnante_id)
);

create index if not exists classe_insegnanti_insegnante_idx
  on public.classe_insegnanti (insegnante_id);

comment on table public.classe_insegnanti is
  'Colleghi che insegnano in una classe oltre al titolare (classes.instructor_id). Si scrive solo da aggiungi_insegnante_classe / togli_insegnante_classe.';

alter table public.classe_insegnanti enable row level security;

drop policy if exists "Gli insegnanti della classe vedono i colleghi" on public.classe_insegnanti;
create policy "Gli insegnanti della classe vedono i colleghi"
  on public.classe_insegnanti for select to authenticated
  using (insegnante_id = auth.uid()
         or exists (select 1 from public.classes c
                     where c.id = classe_insegnanti.class_id
                       and c.instructor_id = auth.uid()));

revoke all on public.classe_insegnanti from anon;
revoke insert, update, delete on public.classe_insegnanti from authenticated;
grant select on public.classe_insegnanti to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Le due funzioni da cui passano i permessi
-- ---------------------------------------------------------------------------
create or replace function public.is_instructor_of_class(p_class_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = p_class_id AND c.instructor_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM classe_insegnanti ci
    WHERE ci.class_id = p_class_id AND ci.insegnante_id = auth.uid()
  );
$function$;

create or replace function public.is_instructor_of_assignment(p_assignment_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = p_assignment_id AND is_instructor_of_class(a.class_id)
  );
$function$;

create or replace function public.is_owner_of_class(p_class_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = p_class_id AND c.instructor_id = auth.uid()
  );
$function$;

revoke all on function public.is_owner_of_class(uuid) from public, anon, authenticated;
grant execute on function public.is_owner_of_class(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Policy su classes, live_tables, sessioni_aula
-- ---------------------------------------------------------------------------
drop policy if exists "Instructors and members can view classes" on public.classes;
create policy "Instructors and members can view classes"
  on public.classes for select to public
  using (instructor_id = auth.uid() or is_instructor_of_class(id)
         or is_member_of_class(id) or is_pending_of_class(id));

drop policy if exists "Instructors can update own classes" on public.classes;
create policy "Instructors can update own classes"
  on public.classes for update to public
  using (is_instructor_of_class(id))
  with check (is_instructor_of_class(id));

drop policy if exists "Instructor manages own live tables" on public.live_tables;
create policy "Instructor manages own live tables"
  on public.live_tables for all to authenticated
  using (is_instructor_of_class(class_id))
  with check (is_instructor_of_class(class_id));

drop policy if exists "L'insegnante gestisce la sessione" on public.sessioni_aula;
create policy "L'insegnante gestisce la sessione"
  on public.sessioni_aula for all to authenticated
  using (is_instructor_of_class(class_id))
  with check (is_instructor_of_class(class_id));

-- Un collega può cambiare nome, date, permessi… ma non il titolare.
create or replace function public.custodisci_titolare_classe()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or is_admin() then
    return new;  -- service_role / SQL Editor / amministratore
  end if;
  if new.instructor_id is distinct from old.instructor_id then
    raise exception 'il titolare della classe non si cambia da qui' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.custodisci_titolare_classe() from public, anon, authenticated;

drop trigger if exists classes_titolare_custodito on public.classes;
create trigger classes_titolare_custodito
  before update on public.classes
  for each row execute function public.custodisci_titolare_classe();

-- ---------------------------------------------------------------------------
-- 4. Le funzioni dei tavoli: solo il confronto con l'utente
-- ---------------------------------------------------------------------------
do $do$
declare
  sostituzioni constant text[][] := array[
    ['live_table_open',          't.instructor_id = auth.uid()',
                                 'public.is_instructor_of_class(t.class_id)'],
    ['live_table_play',          'v_is_owner := (t.instructor_id = auth.uid());',
                                 'v_is_owner := public.is_instructor_of_class(t.class_id);'],
    ['live_table_view',          'v_is_owner := (t.instructor_id = auth.uid());',
                                 'v_is_owner := public.is_instructor_of_class(t.class_id);'],
    ['live_table_undo',          't.instructor_id <> auth.uid()',
                                 'NOT public.is_instructor_of_class(t.class_id)'],
    ['live_table_registra_mano', 'proprietario <> auth.uid()',
                                 'NOT public.is_instructor_of_class(proprietario)'],
    ['live_table_registra_mano', 'select instructor_id into proprietario',
                                 'select class_id into proprietario']
  ];
  i int;
  f oid;
  def text;
begin
  for i in 1 .. array_length(sostituzioni, 1) loop
    select p.oid into f
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = sostituzioni[i][1];
    if f is null then
      raise exception 'funzione % non trovata', sostituzioni[i][1];
    end if;
    def := pg_get_functiondef(f);
    if position(sostituzioni[i][2] in def) > 0 then
      execute replace(def, sostituzioni[i][2], sostituzioni[i][3]);
    elsif position(sostituzioni[i][3] in def) = 0 then
      -- né il vecchio né il nuovo testo: la funzione è cambiata, meglio fermarsi.
      raise exception 'in % non trovo «%»', sostituzioni[i][1], sostituzioni[i][2];
    end if;
  end loop;
end
$do$;

-- ---------------------------------------------------------------------------
-- 5. Aggiungere, togliere, elencare
-- ---------------------------------------------------------------------------
create or replace function public.aggiungi_insegnante_classe(p_class_id uuid, p_email text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_id uuid;
  v_titolare uuid;
begin
  select instructor_id into v_titolare from classes where id = p_class_id;
  if v_titolare is null or (v_titolare <> auth.uid() and not is_admin()) then
    raise exception 'solo chi ha creato la classe può aggiungere insegnanti' using errcode = '42501';
  end if;

  -- 22023/PTxxx, mai 40001: PostgREST ritenterebbe all'infinito.
  select u.id into v_id
    from auth.users u
    join profiles p on p.id = u.id
   where lower(u.email) = lower(btrim(coalesce(p_email, '')))
     and p.role in ('instructor', 'admin');
  if v_id is null then
    raise exception 'nessun insegnante approvato con questa email' using errcode = 'PT404';
  end if;
  if v_id = v_titolare then
    raise exception 'è già l''insegnante della classe' using errcode = 'PT409';
  end if;

  insert into classe_insegnanti (class_id, insegnante_id, aggiunto_da)
  values (p_class_id, v_id, auth.uid())
  on conflict do nothing;

  return v_id;
end;
$$;

create or replace function public.togli_insegnante_classe(p_class_id uuid, p_insegnante_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not (is_owner_of_class(p_class_id) or p_insegnante_id = auth.uid() or is_admin()) then
    raise exception 'solo chi ha creato la classe può togliere un insegnante' using errcode = '42501';
  end if;
  delete from classe_insegnanti
   where class_id = p_class_id and insegnante_id = p_insegnante_id;
end;
$$;

create or replace function public.insegnanti_della_classe(p_class_id uuid)
returns table(insegnante_id uuid, nome text, email text, titolare boolean)
language sql
stable security definer
set search_path to 'public'
as $$
  select c.instructor_id, p.display_name, u.email::text, true
    from classes c
    join profiles p on p.id = c.instructor_id
    join auth.users u on u.id = c.instructor_id
   where c.id = p_class_id and is_instructor_of_class(p_class_id)
  union all
  select ci.insegnante_id, p.display_name, u.email::text, false
    from classe_insegnanti ci
    join profiles p on p.id = ci.insegnante_id
    join auth.users u on u.id = ci.insegnante_id
   where ci.class_id = p_class_id and is_instructor_of_class(p_class_id)
  order by 4 desc, 2;
$$;

revoke all on function public.aggiungi_insegnante_classe(uuid, text) from public, anon, authenticated;
revoke all on function public.togli_insegnante_classe(uuid, uuid) from public, anon, authenticated;
revoke all on function public.insegnanti_della_classe(uuid) from public, anon, authenticated;
grant execute on function public.aggiungi_insegnante_classe(uuid, text) to authenticated;
grant execute on function public.togli_insegnante_classe(uuid, uuid) to authenticated;
grant execute on function public.insegnanti_della_classe(uuid) to authenticated;

insert into public.script_applicati (nome) values ('co-insegnanti-2026-11.sql')
on conflict (nome) do nothing;

commit;
