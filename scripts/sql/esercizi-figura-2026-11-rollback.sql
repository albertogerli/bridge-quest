-- Rollback di `esercizi-figura-2026-11.sql`: le funzioni tornano quelle di
-- prima e la colonna si toglie. Le domande restano, senza la figura.

begin;

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
    order by created_at desc limit 200
  ) e;
$fn$;

revoke all on function public.i_miei_esercizi() from public, anon, authenticated, service_role;
grant execute on function public.i_miei_esercizi() to authenticated;

alter table public.esercizi_posizione drop column if exists figura;

delete from public.script_applicati where nome = 'esercizi-figura-2026-11.sql';

commit;
