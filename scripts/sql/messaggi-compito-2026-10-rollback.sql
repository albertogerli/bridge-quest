-- Rollback di `messaggi-compito-2026-10.sql`.
-- ATTENZIONE: cancella tutte le domande e risposte scambiate sulle mani dei compiti.
begin;
drop function if exists public.scrivi_messaggio_compito(uuid, text, uuid, text);
drop table if exists public.messaggi_compito;
delete from public.script_applicati where nome = 'messaggi-compito-2026-10.sql';
commit;
