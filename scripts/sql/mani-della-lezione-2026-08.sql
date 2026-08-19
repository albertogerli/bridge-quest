-- ============================================================================
-- BridgeLab: le mani viste a lezione diventano il compito
-- ============================================================================
--
-- Intervento 25 del terzo lotto.
-- DIPENDENZE: `tavolo-condiviso-2026-08.sql`. IDEMPOTENTE.
--
-- IL CERCHIO SI CHIUDE QUI, fra la lezione in presenza e il lavoro a casa, e
-- senza che l'insegnante faccia niente in più: preme un tasto e le mani che ha
-- mostrato diventano il compito, con le sue note già attaccate.
--
-- CHI ERA ASSENTE LO RICEVE COMUNQUE. È il caso più frequente e finora il meno
-- gestito: il compito va a tutta la classe, non ai presenti, così l'assente
-- perde la spiegazione a voce ma non il materiale.
--
-- L'ELENCO LO TIENE IL DATABASE. Senza, a fine sessione bisognerebbe
-- ricordarsi quali mani si sono mostrate e ricomporle a mano — esattamente il
-- lavoro aggiuntivo che il portale dovrebbe togliere.
--
-- L'aggiunta in coda è nella funzione e non nel client per una ragione precisa:
-- due schede aperte, o una mano rimandata per riguardarla, la
-- aggiungerebbero due volte, e nel compito comparirebbe doppia.
-- ============================================================================

alter table public.live_tables
  add column if not exists mani_viste jsonb not null default '[]'::jsonb;

comment on column public.live_tables.mani_viste is
  'Le mani mostrate alla classe in questa sessione, in ordine. Servono a trasformare la lezione nel compito con un clic.';

create or replace function public.live_table_registra_mano(p_id uuid, p_mano jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  proprietario uuid;
begin
  select instructor_id into proprietario from live_tables where id = p_id;
  if proprietario is null or proprietario <> auth.uid() then
    raise exception 'not authorized for table %', p_id using errcode = '42501';
  end if;

  update live_tables
  set mani_viste = case
        when jsonb_array_length(mani_viste) > 0
             and mani_viste -> (jsonb_array_length(mani_viste) - 1) -> 'hands' = p_mano -> 'hands'
        then mani_viste
        else mani_viste || jsonb_build_array(p_mano)
      end,
      updated_at = now()
  where id = p_id;
end $$;

comment on function public.live_table_registra_mano(uuid, jsonb) is
  'Segna una mano come mostrata alla classe. Solo l''insegnante del tavolo.';

revoke all on function public.live_table_registra_mano(uuid, jsonb) from public;
grant execute on function public.live_table_registra_mano(uuid, jsonb) to authenticated;
