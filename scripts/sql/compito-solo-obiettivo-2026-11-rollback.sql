-- Rollback di `compito-solo-obiettivo-2026-11.sql`. I compiti tornano a
-- decidere dalla lezione, come prima.
begin;
alter table public.assignments drop column if exists solo_obiettivo;
delete from public.script_applicati where nome = 'compito-solo-obiettivo-2026-11.sql';
commit;
