-- Rollback di `moderazione-contenuti-2026-11.sql`. Cancella le segnalazioni e i blocchi.
begin;
drop policy if exists "L'amministratore modera i post" on public.forum_posts;
drop policy if exists "L'amministratore modera i commenti" on public.forum_comments;
drop policy if exists "L'amministratore modera la chat" on public.class_messages;
drop table if exists public.utenti_bloccati;
drop table if exists public.segnalazioni_contenuti;
delete from public.script_applicati where nome = 'moderazione-contenuti-2026-11.sql';
commit;
