-- Rollback di `stelle-insegnante-2026-10.sql`.
-- ATTENZIONE: cancella tutte le stelle assegnate dagli insegnanti, e i compiti
-- con «le stelle le assegno io» tornano al voto del programma.
begin;
drop function if exists public.assegna_stelle_compito(uuid, text, uuid, numeric);
drop table if exists public.stelle_compito;
alter table public.assignments drop column if exists stelle_insegnante;
delete from public.script_applicati where nome = 'stelle-insegnante-2026-10.sql';
commit;
