-- ============================================================================
-- L'allievo arriva al tavolo dove è seduto, non a uno a caso
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: rieseguire la definizione di `live_table_open` in
-- `000-schema-baseline.sql` (ordinava solo per `created_at desc`).
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Feedback Trevissoi 5 (19/10/2026). `aula_apri` crea tutti i tavoli dell'aula
-- nella stessa transazione, quindi con lo stesso `created_at`: «il più recente»
-- era un tavolo qualsiasi fra quelli aperti. Un allievo seduto al Tavolo 2 che
-- ricaricava la pagina poteva ritrovarsi al Tavolo 3, dove non ha posto e non
-- vede carte.
--
-- Ordine nuovo, per chi apre la pagina della classe:
--   1. il tavolo dove è seduto (`seat_of` ha per chiavi gli id degli utenti);
--   2. un tavolo con almeno un posto libero;
--   3. il più recente, e a parità il numero più basso (Tavolo 1 prima).
-- Per l'insegnante (che non siede in `seat_of`) cambia poco: dei tavoli
-- dell'aula riceve il primo con posti liberi; ai tavoli dell'aula arriva
-- comunque dal collegamento con l'id del tavolo.
-- ============================================================================

begin;

create or replace function public.live_table_open(p_class_id uuid)
returns uuid
language sql
stable security definer
set search_path to 'public'
as $function$
  select t.id
  from public.live_tables t
  where t.class_id = p_class_id
    and t.closed_at is null
    and (
      t.instructor_id = auth.uid()
      or (
        exists (select 1 from public.class_members m
                 where m.class_id = t.class_id
                   and m.student_id = auth.uid()
                   and m.status = 'active')
        and greatest(t.created_at, coalesce(t.updated_at, t.created_at)) > now() - interval '8 hours'
      )
    )
  order by
    coalesce(t.seat_of, '{}'::jsonb) ? auth.uid()::text desc,
    (select count(*) from jsonb_object_keys(coalesce(t.seat_of, '{}'::jsonb))) < 4 desc,
    t.created_at desc,
    t.numero nulls last
  limit 1;
$function$;

revoke all on function public.live_table_open(uuid) from public, anon;
grant execute on function public.live_table_open(uuid) to authenticated;

insert into public.script_applicati (nome) values ('tavolo-dove-sei-seduto-2026-10.sql')
on conflict (nome) do nothing;

commit;
