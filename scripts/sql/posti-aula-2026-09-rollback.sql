-- ============================================================================
-- ROLLBACK di `posti-aula-2026-09.sql`
--
-- QUESTO È SIMMETRICO DAVVERO, per una volta: lo script non ha creato tabelle
-- né colonne, solo due funzioni. Nessun dato viene perso, e non c'è niente da
-- mettere da parte — i posti restano dove sono, in `live_tables.seat_of`.
--
-- L'unica conseguenza è che l'aula torna al comportamento di prima: i posti li
-- assegna l'insegnante riscrivendo l'intera mappa, con la corsa che ne
-- consegue. Prima di eseguire, togliere dal codice la pagina che chiama
-- `aula_siediti`, altrimenti l'allievo vede un errore invece di un posto.
-- ============================================================================

begin;
drop function if exists public.aula_siediti(uuid, text);
drop function if exists public.aula_muovi(uuid, uuid, text);
commit;

--   select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--    where n.nspname='public' and p.proname in ('aula_siediti','aula_muovi');  -- 0
--
-- Poi: node scripts/dump-schema.mjs e committare il baseline.
