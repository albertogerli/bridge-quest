-- ============================================================================
-- Rollback di risultati-con-gioco-2026-11.sql: torna al primo tentativo
-- per tutte le mani (come first_attempt_results.sql).
-- ============================================================================

begin;

create or replace function public.get_class_results(p_assignment_id uuid)
returns table (
  student_id    uuid,
  student_name  text,
  smazzata_id   text,
  score         int,
  details       jsonb,
  played_at     timestamptz
)
language plpgsql
security definer
stable
set search_path to 'public'
as $fn$
begin
  if not is_instructor_of_assignment(p_assignment_id) then
    raise exception 'not authorized for assignment %', p_assignment_id
      using errcode = '42501';
  end if;

  return query
  select distinct on (gr.user_id, gr.details->>'smazzata_id')
    gr.user_id                      as student_id,
    p.display_name                  as student_name,
    gr.details->>'smazzata_id'      as smazzata_id,
    gr.score,
    gr.details,
    gr.created_at                   as played_at
  from game_results gr
  left join profiles p on p.id = gr.user_id
  where gr.assignment_id = p_assignment_id
  order by gr.user_id, gr.details->>'smazzata_id', gr.created_at asc;
end $fn$;

delete from public.script_applicati where nome = 'risultati-con-gioco-2026-11.sql';

commit;
