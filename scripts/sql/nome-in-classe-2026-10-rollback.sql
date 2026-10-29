-- Rollback di `nome-in-classe-2026-10.sql`.
-- ATTENZIONE: cancella i nomi dati dagli insegnanti agli allievi nelle classi.
begin;
drop function if exists public.rinomina_allievo(uuid, uuid, text);
drop trigger if exists class_members_nome_custodito on public.class_members;
drop function if exists public.custodisci_nome_in_classe();
alter table public.class_members drop constraint if exists class_members_nome_in_classe_check;
alter table public.class_members drop column if exists nome_in_classe;
delete from public.script_applicati where nome = 'nome-in-classe-2026-10.sql';
commit;
