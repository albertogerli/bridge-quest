-- Rollback di `figure-insegnante-2026-11.sql`: la tabella si toglie, e con
-- lei le figure salvate.

begin;

drop table if exists public.figure_insegnante;

delete from public.script_applicati where nome = 'figure-insegnante-2026-11.sql';

commit;
