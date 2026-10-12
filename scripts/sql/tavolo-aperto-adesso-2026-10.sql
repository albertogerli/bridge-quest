-- ============================================================================
-- «C'è un tavolo aperto» solo se c'è davvero, adesso
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `tavolo-aperto-adesso-2026-10-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Feedback Trevissoi del 12/10/2026, punto 3.1: un allievo appena iscritto
-- vedeva «C'è un tavolo aperto — l'insegnante sta mostrando una mano adesso»
-- in un giorno in cui l'insegnante non aveva aperto niente. `live_table_open`
-- restituiva qualunque tavolo mai chiuso, e un tavolo si chiude solo se
-- l'insegnante se ne ricorda: quello di una lezione di giorni prima restava
-- «aperto» per sempre. In più bastava una riga qualsiasi in `class_members`,
-- anche in attesa o respinta.
--
-- Per l'allievo: iscritto ATTIVO, e tavolo toccato nelle ultime otto ore (una
-- lezione, con margine). Per l'insegnante nulla cambia: deve continuare a
-- vedere il proprio tavolo dimenticato, per chiuderlo.
-- ============================================================================

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
      or (
        exists (select 1 from public.class_members m
                 where m.class_id = t.class_id
                   and m.student_id = auth.uid()
                   and m.status = 'active')
        and greatest(t.created_at, coalesce(t.updated_at, t.created_at)) > now() - interval '8 hours'
      )
    )
  order by t.created_at desc
  limit 1;
$function$;

revoke all on function public.live_table_open(uuid) from public, anon;
grant execute on function public.live_table_open(uuid) to authenticated;

insert into public.script_applicati (nome) values ('tavolo-aperto-adesso-2026-10.sql')
on conflict (nome) do nothing;

commit;
