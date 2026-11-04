-- ============================================================================
-- Domande a scelta con la figura: i test della Commissione con le loro mani
--
-- ESEGUIRE A MANO su Supabase → SQL Editor, DOPO
-- `esercizi-scelta-multipla-2026-11.sql`.
-- Rollback: `esercizi-figura-2026-11-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHE UNA COLONNA E NON LE MANI
--
-- I test Barion (Trevissoi, 04/11/2026) accompagnano quasi ogni domanda con
-- una figura: una mano, le due mani della linea, lo schema di un solo seme ai
-- quattro posti, due mani A e B da confrontare. `hands` non basta: tiene carte
-- intere, e l allievo ne riceve solo una. La figura e il testo della domanda,
-- non la soluzione: si legge come le opzioni.
--
-- `i_miei_esercizi` passa da 200 a 1000 righe: i dodici test sono 238
-- domande, e con il limite di prima l insegnante che li aggiunge tutti non
-- vedrebbe piu le sue domande piu vecchie.
-- ============================================================================

begin;

alter table public.esercizi_posizione
  add column if not exists figura jsonb;

comment on column public.esercizi_posizione.figura is
  'Domanda a scelta: la figura da mostrare (mano, linea, schema di un seme, '
  'confronto A/B). Formato in src/lib/figura-domanda.ts. Non contiene la soluzione.';

grant select (figura) on table public.esercizi_posizione to authenticated;

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
    'figura', e.figura,
    'quante_risposte', coalesce(array_length(e.risposte, 1), 0)
  );
end $fn$;

revoke all on function public.esercizio_per_allievo(uuid) from public, anon, authenticated, service_role;
grant execute on function public.esercizio_per_allievo(uuid) to authenticated;
grant execute on function public.esercizio_per_allievo(uuid) to service_role;

create or replace function public.i_miei_esercizi()
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $fn$
  select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc), '[]'::jsonb)
  from (
    select * from public.esercizi_posizione
    where autore_id = (select auth.uid())
    order by created_at desc limit 1000
  ) e;
$fn$;

revoke all on function public.i_miei_esercizi() from public, anon, authenticated, service_role;
grant execute on function public.i_miei_esercizi() to authenticated;

insert into public.script_applicati (nome) values ('esercizi-figura-2026-11.sql')
on conflict (nome) do nothing;

commit;

-- ============================================================================
-- VERIFICA
--   select column_name from information_schema.columns
--    where table_name = ’esercizi_posizione’ and column_name = ’figura’;
--   -- atteso: 1 riga
-- ============================================================================
