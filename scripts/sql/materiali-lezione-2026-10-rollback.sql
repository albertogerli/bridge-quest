-- ============================================================================
-- ROLLBACK di `materiali-lezione-2026-10.sql`
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
--
-- CANCELLA i materiali che gli insegnanti hanno già preparato o programmato.
-- La parte 0 li mette da parte prima: eseguirla PRIMA del resto.
-- ============================================================================

-- 0 · La rete di sicurezza
create table if not exists public.materiali_lezione_salvati_2026_10 as
  select * from public.materiali_lezione;

select count(*) as materiali_messi_da_parte
  from public.materiali_lezione_salvati_2026_10;

-- 1 · Da qui in poi si disfa. Policy e indice cadono con la tabella.
begin;

drop table if exists public.materiali_lezione;

delete from public.script_applicati where nome = 'materiali-lezione-2026-10.sql';

commit;

-- ============================================================================
-- VERIFICA
--   select to_regclass('public.materiali_lezione');                  -- null
--   select to_regclass('public.materiali_lezione_salvati_2026_10');  -- esiste
--
-- Poi: node scripts/dump-schema.mjs   e committare 000-schema-baseline.sql
-- ============================================================================
