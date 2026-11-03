-- ============================================================================
-- Compito di licita: l’insegnante vede anche la mano giocata
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `risultati-con-gioco-2026-11-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: first_attempt_results.sql
--
-- ----------------------------------------------------------------------------
-- IL DIFETTO (segnalato il 03/11/2026: «loro mi dicono di averle giocate ma
-- non visualizzo nulla»)
--
-- Nel compito di licita l’allievo prima dichiara, poi gioca il contratto. La
-- licita si registra subito, come prima riga; il gioco arriva dopo, come
-- seconda riga con la stessa licita più il campo `gioco`. Quella seconda riga
-- doveva sostituire la prima.
--
-- get_class_results però tiene il PRIMO tentativo di ogni mano (giusto per il
-- gioco della carta: un secondo tentativo riuscito non deve far diventare
-- verde una mano sbagliata). Così all’insegnante arrivava sempre la riga senza
-- gioco: al 03/11, 389 mani giocate a Mondello, zero visibili.
--
-- LA REGOLA, ADESSO. Per le mani di licita vince la prima riga che contiene
-- il gioco; se non c’è, la prima riga, come prima. Per tutte le altre mani
-- non cambia niente: il primo tentativo.
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
  order by
    gr.user_id,
    gr.details->>'smazzata_id',
    -- Licita: prima le righe con il gioco.
    (gr.details->>'licita' = 'true' and jsonb_exists(gr.details, 'gioco')) is true desc,
    -- Poi il primo tentativo.
    gr.created_at asc;
end $fn$;

insert into public.script_applicati (nome) values ('risultati-con-gioco-2026-11.sql')
on conflict (nome) do nothing;

commit;

-- ============================================================================
-- VERIFICA
--   La query di controllo sta nel messaggio di commit (qui romperebbe
--   l’editor di Supabase). Atteso: delle 643 mani di licita registrate al
--   03/11, 389 arrivano all’insegnante con il gioco; prima erano zero.
-- ============================================================================
