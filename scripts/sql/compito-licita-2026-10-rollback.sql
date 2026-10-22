-- Rollback di `compito-licita-2026-10.sql`.
-- I compiti di licita già creati tornano compiti di gioco: le mani restano,
-- con il contratto di riserva scelto quando sono state assegnate.
begin;
alter table public.assignments drop column if exists licita;
delete from public.script_applicati where nome = 'compito-licita-2026-10.sql';
commit;
