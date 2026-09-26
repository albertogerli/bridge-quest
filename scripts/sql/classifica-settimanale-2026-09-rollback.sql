-- Rollback di classifica-settimanale-2026-09.sql.
--
-- Non simmetrico: va insieme al `git revert` del commit che chiama la
-- funzione, altrimenti la scheda «Settimanale» resta vuota. E tornando
-- indietro torna la classifica di sempre travestita da settimanale.

drop function if exists public.classifica_settimanale(integer);
