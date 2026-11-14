-- Rollback di `turno-allievo-2026-11.sql`.
-- ATTENZIONE: cancella i turni assegnati dagli insegnanti agli allievi.
begin;
drop function if exists public.turno_allievo(uuid, uuid, text);
drop trigger if exists class_members_turno_custodito on public.class_members;
drop function if exists public.custodisci_turno();
alter table public.class_members drop constraint if exists class_members_turno_check;
alter table public.class_members drop column if exists turno;
delete from public.script_applicati where nome = 'turno-allievo-2026-11.sql';
commit;
