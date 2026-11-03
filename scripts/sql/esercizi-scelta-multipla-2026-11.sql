-- ============================================================================
-- Esercizi a scelta multipla: i test della Commissione, con le risposte
-- registrate e la classifica
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `esercizi-scelta-multipla-2026-11-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ QUI E NON UNA TABELLA NUOVA
--
-- Trevissoi, 02/11/2026: far rispondere online, informare l’insegnante in
-- tempo reale e fare la classifica degli allievi esercizio per esercizio è
-- «una funzionalità essenziale del Bridge 5.0». Gli esercizi di posizione
-- fanno già tutto questo: entrano nei compiti, la correzione è lato server
-- (`verifica_esercizio`), la risposta va in `game_results`, l’insegnante vede
-- chi ha risposto cosa e la divisione delle risposte, e la classifica della
-- classe li conta. Manca solo il tipo di domanda: qui si aggiunge «scelta»,
-- una domanda con le sue opzioni, con o senza mano.
--
-- Le opzioni si leggono (l’allievo deve vederle); quali sono giuste resta in
-- `risposte`/`risposte_norm`, che l’allievo non legge mai direttamente.
-- ============================================================================

begin;

alter table public.esercizi_posizione
  add column if not exists opzioni text[] not null default '{}';

comment on column public.esercizi_posizione.opzioni is
  'Esercizio a scelta (consegna = ''scelta''): le risposte da cui l''allievo '
  'sceglie, in ordine. Quali sono giuste sta in risposte/risposte_norm.';

grant select (opzioni) on table public.esercizi_posizione to authenticated;

alter table public.esercizi_posizione drop constraint if exists esercizi_posizione_consegna_check;
alter table public.esercizi_posizione add constraint esercizi_posizione_consegna_check
  check (consegna = any (array['dichiara'::text, 'carta'::text, 'piano'::text, 'scelta'::text]));

-- Quello che l’allievo riceve: come prima, più le opzioni. Una domanda senza
-- mano ha `hands` vuoto, e allora non si manda nessuna mano.
create or replace function public.esercizio_per_allievo(p_id uuid)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $fn$
declare
  e public.esercizi_posizione%rowtype;
  v_morto text;
  v_mani jsonb := '{}'::jsonb;
begin
  if not public.puo_vedere_esercizio(p_id) then return null; end if;
  select * into e from public.esercizi_posizione where id = p_id;

  if jsonb_exists(e.hands, e.posizione) then
    v_mani := jsonb_build_object(e.posizione, e.hands -> e.posizione);
  end if;

  if jsonb_array_length(e.played) > 0 and e.declarer is not null then
    v_morto := case e.declarer
      when 'north' then 'south' when 'south' then 'north'
      when 'east'  then 'west'  when 'west'  then 'east' end;
    if v_morto is not null and v_morto <> e.posizione and jsonb_exists(e.hands, v_morto) then
      v_mani := v_mani || jsonb_build_object(v_morto, e.hands -> v_morto);
    end if;
  end if;

  return jsonb_build_object(
    'id', e.id, 'autore_id', e.autore_id, 'titolo', e.titolo,
    'consegna', e.consegna, 'domanda', e.domanda, 'hands', v_mani,
    'dealer', e.dealer, 'vulnerability', e.vulnerability,
    'bids', to_jsonb(e.bids), 'played', e.played, 'posizione', e.posizione,
    'contract', e.contract, 'declarer', e.declarer,
    'gruppo', e.gruppo, 'class_id', e.class_id, 'created_at', e.created_at,
    'opzioni', to_jsonb(e.opzioni),
    'quante_risposte', coalesce(array_length(e.risposte, 1), 0)
  );
end $fn$;

revoke all on function public.esercizio_per_allievo(uuid) from public, anon, authenticated, service_role;
grant execute on function public.esercizio_per_allievo(uuid) to authenticated;
grant execute on function public.esercizio_per_allievo(uuid) to service_role;

insert into public.script_applicati (nome) values ('esercizi-scelta-multipla-2026-11.sql')
on conflict (nome) do nothing;

commit;

-- ============================================================================
-- VERIFICA
--   select column_name from information_schema.columns
--    where table_name = ’esercizi_posizione’ and column_name = ’opzioni’;
--   -- atteso: 1 riga
-- ============================================================================
