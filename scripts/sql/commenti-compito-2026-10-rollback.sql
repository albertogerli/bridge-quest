-- Rollback di `commenti-compito-2026-10.sql`.
-- ATTENZIONE: cancella tutti i commenti scritti dagli insegnanti.
begin;
drop function if exists public.salva_commento_compito(uuid, text, uuid, text);
drop table if exists public.commenti_compito;
delete from public.script_applicati where nome = 'commenti-compito-2026-10.sql';
commit;
