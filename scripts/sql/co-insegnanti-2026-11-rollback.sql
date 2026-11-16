-- Rollback di `co-insegnanti-2026-11.sql`: una classe torna ad avere solo il
-- titolare. I colleghi aggiunti si perdono (la tabella si cancella).
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.

begin;

do $do$
declare
  sostituzioni constant text[][] := array[
    ['live_table_open',          'public.is_instructor_of_class(t.class_id)',
                                 't.instructor_id = auth.uid()'],
    ['live_table_play',          'v_is_owner := public.is_instructor_of_class(t.class_id);',
                                 'v_is_owner := (t.instructor_id = auth.uid());'],
    ['live_table_view',          'v_is_owner := public.is_instructor_of_class(t.class_id);',
                                 'v_is_owner := (t.instructor_id = auth.uid());'],
    ['live_table_undo',          'NOT public.is_instructor_of_class(t.class_id)',
                                 't.instructor_id <> auth.uid()'],
    ['live_table_registra_mano', 'NOT public.is_instructor_of_class(proprietario)',
                                 'proprietario <> auth.uid()'],
    ['live_table_registra_mano', 'select class_id into proprietario',
                                 'select instructor_id into proprietario']
  ];
  i int;
  def text;
begin
  for i in 1 .. array_length(sostituzioni, 1) loop
    select pg_get_functiondef(p.oid) into def
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = sostituzioni[i][1];
    if position(sostituzioni[i][2] in def) > 0 then
      execute replace(def, sostituzioni[i][2], sostituzioni[i][3]);
    end if;
  end loop;
end
$do$;

drop policy if exists "Instructors and members can view classes" on public.classes;
create policy "Instructors and members can view classes"
  on public.classes for select to public
  using ((instructor_id = auth.uid()) or is_member_of_class(id) or is_pending_of_class(id));

drop policy if exists "Instructors can update own classes" on public.classes;
create policy "Instructors can update own classes"
  on public.classes for update to public
  using (instructor_id = auth.uid());

drop policy if exists "Instructor manages own live tables" on public.live_tables;
create policy "Instructor manages own live tables"
  on public.live_tables for all to authenticated
  using ((instructor_id = auth.uid()) and exists (select 1 from classes c
          where c.id = live_tables.class_id and c.instructor_id = auth.uid()))
  with check ((instructor_id = auth.uid()) and exists (select 1 from classes c
          where c.id = live_tables.class_id and c.instructor_id = auth.uid()));

drop policy if exists "L'insegnante gestisce la sessione" on public.sessioni_aula;
create policy "L'insegnante gestisce la sessione"
  on public.sessioni_aula for all to authenticated
  using (is_instructor_of_class(class_id))
  with check (is_instructor_of_class(class_id) and instructor_id = auth.uid());

drop trigger if exists classes_titolare_custodito on public.classes;
drop function if exists public.custodisci_titolare_classe();

drop function if exists public.aggiungi_insegnante_classe(uuid, text);
drop function if exists public.togli_insegnante_classe(uuid, uuid);
drop function if exists public.insegnanti_della_classe(uuid);

create or replace function public.is_instructor_of_class(p_class_id uuid)
 returns boolean language sql stable security definer set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = p_class_id AND c.instructor_id = auth.uid()
  );
$function$;

create or replace function public.is_instructor_of_assignment(p_assignment_id uuid)
 returns boolean language sql stable security definer set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1
    FROM assignments a
    JOIN classes c ON c.id = a.class_id
    WHERE a.id = p_assignment_id AND c.instructor_id = auth.uid()
  );
$function$;

drop function if exists public.is_owner_of_class(uuid);
drop table if exists public.classe_insegnanti;

delete from public.script_applicati where nome = 'co-insegnanti-2026-11.sql';

commit;
