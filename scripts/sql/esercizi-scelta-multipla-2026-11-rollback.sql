-- Rollback di `esercizi-scelta-multipla-2026-11.sql`. Prima si tolgono gli
-- esercizi a scelta, che il vecchio vincolo non accetterebbe.
begin;
delete from public.esercizi_posizione where consegna = 'scelta';
alter table public.esercizi_posizione drop constraint if exists esercizi_posizione_consegna_check;
alter table public.esercizi_posizione add constraint esercizi_posizione_consegna_check
  check (consegna = any (array['dichiara'::text, 'carta'::text, 'piano'::text]));
-- La funzione torna quella di prima, che non legge `opzioni`.
CREATE OR REPLACE FUNCTION public.esercizio_per_allievo(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $fn$
declare
  e public.esercizi_posizione%rowtype;
  v_morto text;
  v_mani jsonb := '{}'::jsonb;
begin
  if not public.puo_vedere_esercizio(p_id) then return null; end if;
  select * into e from public.esercizi_posizione where id = p_id;

  v_mani := jsonb_build_object(e.posizione, e.hands -> e.posizione);

  if jsonb_array_length(e.played) > 0 and e.declarer is not null then
    v_morto := case e.declarer
      when 'north' then 'south' when 'south' then 'north'
      when 'east'  then 'west'  when 'west'  then 'east' end;
    if v_morto is not null and v_morto <> e.posizione then
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
    'quante_risposte', coalesce(array_length(e.risposte, 1), 0)
  );
end $fn$;

alter table public.esercizi_posizione drop column if exists opzioni;
delete from public.script_applicati where nome = 'esercizi-scelta-multipla-2026-11.sql';
commit;
