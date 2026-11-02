-- Rollback di risultati-stessa-mano-indici-2026-11.sql. Nessun dato toccato.
-- Toglie i tre indici e rimette la funzione di settembre (quella col CASE).

drop index if exists public.idx_game_results_smazzata_id;
drop index if exists public.idx_game_results_sfida_data;
drop index if exists public.idx_game_results_sfida_settimanale;

create or replace function public.risultati_stessa_mano(p_tipo text, p_chiave text)
returns table(risultato integer, quanti bigint)
language sql
stable
security definer
set search_path = public
as $$
  with prime as (
    select distinct on (gr.user_id) (gr.details->>'result')::integer as r
      from public.game_results gr
     where gr.game_type = p_tipo
       and gr.details ? 'result'
       and (gr.details->>'result') ~ '^-?[0-9]+$'
       and case p_tipo
             when 'smazzata'          then gr.details->>'smazzataId' = p_chiave
             when 'mano-del-giorno'   then gr.details->>'smazzataId' = p_chiave
             when 'sfida'             then gr.details->>'date' = p_chiave
             when 'sfida-settimanale' then (gr.details->>'weekChallenge') || '#' || (gr.details->>'handNumber') = p_chiave
             else false
           end
     order by gr.user_id, gr.created_at asc
  )
  select r, count(*) from prime group by r order by r desc;
$$;

revoke all on function public.risultati_stessa_mano(text, text) from public;
grant execute on function public.risultati_stessa_mano(text, text) to authenticated;

comment on function public.risultati_stessa_mano(text, text) is
  'Quanti giocatori hanno ottenuto ciascun risultato sulla stessa mano, prima partita di ognuno. Solo conteggi.';
