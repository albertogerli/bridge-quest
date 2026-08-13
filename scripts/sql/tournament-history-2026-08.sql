-- ============================================================================
-- STATO: APPLICATO in produzione il 2026-08-13 (migrazione Supabase
--   `tournament_history`). Verificato sui dati reali: settimana 135, tre
--   partecipanti con 51/47/46 prese, posizioni 1/2/3.
--
-- BridgeLab: storico personale del torneo settimanale
-- ============================================================================
--
-- PERCHÉ
-- Segnalazione di un iscritto: «ho partecipato per la prima volta la settimana
-- scorsa, non si vede la performance, valore essenziale!».
-- Aveva ragione: la pagina del torneo è cablata sulla settimana corrente.
-- Chi ha giocato la settimana prima, il lunedì successivo trova un torneo
-- nuovo, nessuna scheda risultato e una classifica in cui non compare. Il dato
-- c'era già in `tournament_results`, mancava il modo di rivederlo.
--
-- PERCHÉ UNA FUNZIONE E NON UNA QUERY DAL CLIENT
-- Per dire «5º su 49» servono, per ogni settimana giocata, il totale dei
-- partecipanti e quanti hanno fatto meglio. Dal client vorrebbe dire o due
-- richieste per settimana, o scaricare tutte le righe di dodici settimane —
-- e scaricare tutte le righe è esattamente il difetto appena corretto nel
-- pannello admin, dove il server tronca a 1000 e non lo dice. Qui il conto si
-- fa dove stanno i dati, e torna una riga per settimana.
--
-- SICUREZZA
-- `security invoker`: la funzione vede quello che vedrebbe l'utente, quindi
-- le policy di `tournament_results` restano l'unica autorità. `auth.uid()`
-- non è un parametro: nessuno può chiedere lo storico di un altro.
-- La classifica è già leggibile da qualunque utente autenticato (policy
-- "Authenticated can read tournament results"), quindi posizione e numero di
-- partecipanti non espongono nulla di nuovo — e non esce alcun nome.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

create or replace function public.my_tournament_history(limite integer default 12)
returns table (
  week_num integer,
  total_tricks integer,
  total_needed integer,
  completed_at timestamptz,
  posizione integer,
  partecipanti integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with mie as (
    select t.week_num, t.total_tricks, t.total_needed, t.completed_at
    from public.tournament_results t
    where t.user_id = auth.uid()
    order by t.week_num desc
    -- Limite comunque imbrigliato: un client che chiedesse 100000 settimane
    -- non deve poter trasformare una schermata in una scansione.
    limit greatest(1, least(coalesce(limite, 12), 52))
  )
  select
    m.week_num,
    m.total_tricks,
    m.total_needed,
    m.completed_at,
    -- Posizione secca: uno più quanti hanno fatto MEGLIO. A parità di prese
    -- si divide il posto, invece di inventare un ordine fra pari merito.
    (select count(*) from public.tournament_results r
      where r.week_num = m.week_num and r.total_tricks > m.total_tricks)::integer + 1,
    (select count(*) from public.tournament_results r
      where r.week_num = m.week_num)::integer
  from mie m
  order by m.week_num desc;
$$;

comment on function public.my_tournament_history(integer) is
  'Storico dei tornei settimanali dell''utente corrente, con posizione e numero di partecipanti per ogni settimana giocata.';

-- ATTENZIONE: Postgres concede EXECUTE a PUBLIC su ogni nuova funzione, e
-- `anon` eredita da PUBLIC. Togliere il permesso al solo `anon` non serve a
-- niente — verificato: dopo un `revoke ... from anon`
-- has_function_privilege('anon', ...) restava true. Va revocato a PUBLIC.
revoke execute on function public.my_tournament_history(integer) from public;
grant execute on function public.my_tournament_history(integer) to authenticated;
