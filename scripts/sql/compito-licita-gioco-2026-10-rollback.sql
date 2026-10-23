-- Rollback di `compito-licita-gioco-2026-10.sql`.
-- I compiti di licita tornano tutti a «dichiarano e poi giocano».
begin;
alter table public.assignments drop column if exists licita_gioca;
delete from public.script_applicati where nome = 'compito-licita-gioco-2026-10.sql';
commit;
