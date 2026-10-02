-- Rollback di `registro-script-2026-10.sql`. ESEGUIRE A MANO su Supabase → SQL Editor.
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
begin;
drop table if exists public.script_applicati;
commit;
