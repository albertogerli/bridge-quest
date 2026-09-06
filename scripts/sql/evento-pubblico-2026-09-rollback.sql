-- ============================================================================
-- ROLLBACK di `evento-pubblico-2026-09.sql`
--
-- Questo rollback cancella le locandine compilate dalle ASD: sono testi scritti
-- a mano — indirizzo, orario, vincoli — e riscriverli vuol dire richiederli a
-- chi li aveva già inseriti. La parte 0 li mette da parte.
--
-- Toglie anche la pagina pubblica dell'evento: i QR già STAMPATI e appesi in
-- bacheca smetteranno di funzionare, e quello non si annulla con uno script.
-- Se ci sono locandine in giro, valutare se non convenga lasciare la funzione
-- al suo posto e togliere solo il resto.
-- ============================================================================

-- 0 · Prima di tutto
create table if not exists public.locandine_salvate_2026_09 as
  select id, name, invite_code, locandina from public.classes
   where locandina <> '{}'::jsonb;

select count(*) as locandine_compilate from public.locandine_salvate_2026_09;

-- 1 · Si disfa
begin;
drop function if exists public.evento_da_codice(text);
alter table public.classes drop column if exists locandina;
commit;

-- ============================================================================
--   select to_regclass('public.locandine_salvate_2026_09');  -- deve ESISTERE
--
-- Prima di eseguire: togliere dal codice la pagina `/evento/[codice]`, che
-- altrimenti chiama una funzione che non esiste più. Nell'ordine: prima il
-- `git revert`, poi questo script.
--
-- Poi: node scripts/dump-schema.mjs e committare il baseline.
-- ============================================================================
