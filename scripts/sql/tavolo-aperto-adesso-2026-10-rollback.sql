-- Rollback di `tavolo-aperto-adesso-2026-10.sql`: torna a restituire qualunque
-- tavolo non chiuso, a qualunque riga di `class_members`.

begin;

create or replace function public.live_table_open(p_class_id uuid)
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $function$
  select t.id
  from public.live_tables t
  where t.class_id = p_class_id
    and t.closed_at is null
    and (
      t.instructor_id = auth.uid()
      or exists (select 1 from public.class_members m
                 where m.class_id = t.class_id and m.student_id = auth.uid())
    )
  order by t.created_at desc
  limit 1;
$function$;

delete from public.script_applicati where nome = 'tavolo-aperto-adesso-2026-10.sql';

commit;
