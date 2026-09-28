-- Rollback di risultati-stessa-mano-2026-09.sql. Nessun dato toccato.
-- Prima: togliere dal codice la chiamata a risultati_stessa_mano (git revert).
drop function if exists public.risultati_stessa_mano(text, text);
