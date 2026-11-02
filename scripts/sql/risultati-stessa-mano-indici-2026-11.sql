-- «Come è andata agli altri»: indici per la chiave della mano, e la funzione
-- riscritta perché li usi.
--
-- Dipendenze: risultati-stessa-mano-2026-09.sql (eseguito).
-- Rollback: risultati-stessa-mano-indici-2026-11-rollback.sql (toglie gli
-- indici e rimette la funzione di settembre; nessun dato viene toccato).
--
-- PERCHÉ. Il 01/11/2026 alle 21:05 UTC la revisione di una smazzata ha
-- chiesto `risultati_stessa_mano` e la query è scaduta dopo gli 8 secondi di
-- statement_timeout del ruolo authenticated (Sentry, scope
-- revisione:confronto). A cache calda la stessa query costa circa 100 ms, ma
-- legge TUTTE le partite di quel tipo: ~51.000 righe di `smazzata`,
-- 35.000 pagine, per tenerne 150. Non c'era nessun indice su
-- `details->>'smazzataId'`, e anche ci fosse stato la funzione non l'avrebbe
-- usato: la chiave si sceglieva dentro un CASE su p_tipo, che il pianificatore
-- non sa scomporre. Il costo cresce con ogni partita salvata; a cache fredda o
-- con il database sotto carico arriva al timeout.
--
-- COSA CAMBIA. Un indice per ognuna delle tre chiavi, ristretto al tipo di
-- gioco che la usa, e la funzione in plpgsql con un ramo per tipo: ogni ramo
-- ha la sua espressione scritta uguale a quella dell'indice. Quello che la
-- funzione restituisce non cambia: stessi conteggi, stessa regola della
-- prima partita di ognuno, stesse chiavi.
--
-- Gli indici si creano senza CONCURRENTLY perché l'SQL Editor esegue lo
-- script in una transazione; sono ~97.000 righe, un blocco di pochi secondi
-- sulle scritture in game_results.

create index if not exists idx_game_results_smazzata_id
  on public.game_results (game_type, (details->>'smazzataId'))
  where game_type in ('smazzata', 'mano-del-giorno');

create index if not exists idx_game_results_sfida_data
  on public.game_results ((details->>'date'))
  where game_type = 'sfida';

create index if not exists idx_game_results_sfida_settimanale
  on public.game_results (((details->>'weekChallenge') || '#' || (details->>'handNumber')))
  where game_type = 'sfida-settimanale';

create or replace function public.risultati_stessa_mano(p_tipo text, p_chiave text)
returns table(risultato integer, quanti bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_tipo in ('smazzata', 'mano-del-giorno') then
    return query
      with prime as (
        select distinct on (gr.user_id) (gr.details->>'result')::integer as r
          from public.game_results gr
         where gr.game_type in ('smazzata', 'mano-del-giorno')
           and gr.game_type = p_tipo
           and gr.details->>'smazzataId' = p_chiave
           and (gr.details->>'result') ~ '^-?[0-9]+$'
         order by gr.user_id, gr.created_at asc
      )
      select p.r, count(*) from prime p group by p.r order by p.r desc;
  elsif p_tipo = 'sfida' then
    return query
      with prime as (
        select distinct on (gr.user_id) (gr.details->>'result')::integer as r
          from public.game_results gr
         where gr.game_type = 'sfida'
           and gr.details->>'date' = p_chiave
           and (gr.details->>'result') ~ '^-?[0-9]+$'
         order by gr.user_id, gr.created_at asc
      )
      select p.r, count(*) from prime p group by p.r order by p.r desc;
  elsif p_tipo = 'sfida-settimanale' then
    return query
      with prime as (
        select distinct on (gr.user_id) (gr.details->>'result')::integer as r
          from public.game_results gr
         where gr.game_type = 'sfida-settimanale'
           and (gr.details->>'weekChallenge') || '#' || (gr.details->>'handNumber') = p_chiave
           and (gr.details->>'result') ~ '^-?[0-9]+$'
         order by gr.user_id, gr.created_at asc
      )
      select p.r, count(*) from prime p group by p.r order by p.r desc;
  end if;
end;
$$;
revoke all on function public.risultati_stessa_mano(text, text) from public;
grant execute on function public.risultati_stessa_mano(text, text) to authenticated;

comment on function public.risultati_stessa_mano(text, text) is
  'Quanti giocatori hanno ottenuto ciascun risultato sulla stessa mano, prima partita di ognuno. Solo conteggi. Un ramo per tipo, ognuno sul suo indice.';
