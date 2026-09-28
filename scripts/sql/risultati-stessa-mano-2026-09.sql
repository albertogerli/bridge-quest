-- Come è andata agli altri sulla stessa mano: solo conteggi, nessun nome.
--
-- Dipendenze: game_results — presente dalla baseline.
-- Rollback: risultati-stessa-mano-2026-09-rollback.sql (toglie la funzione;
-- nessun dato viene toccato).
--
-- PERCHÉ. Nella revisione di BridgeChamp si vede come l'hanno giocata gli
-- altri sulla stessa smazzata, e il 28/09/2026 è stata chiesta anche qui.
-- `game_results` ha RLS «solo le proprie», giustamente: per questo serve una
-- funzione SECURITY DEFINER che restituisca l'aggregato e nient'altro.
--
-- COSA RESTITUISCE. Per ogni risultato (+1, =, −1…) quante persone l'hanno
-- ottenuto. Niente user_id, niente nomi, niente date: il contratto è fissato
-- dalla mano, quindi il risultato è l'unica cosa che distingue un giocatore
-- dall'altro, e da un conteggio non si risale a nessuno.
--
-- UNA PERSONA, UN RISULTATO: la PRIMA partita. Le smazzate si possono
-- rigiocare, e chi ha ritentato cinque volte peserebbe cinque volte, proprio
-- con i tentativi fatti dopo aver visto la soluzione.
--
-- QUALE MANO È «LA STESSA». Ogni gioco salva la sua chiave:
--   smazzata, mano-del-giorno → details.smazzataId
--   sfida (del giorno)        → details.date
--   sfida-settimanale         → details.weekChallenge || '#' || details.handNumber

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
