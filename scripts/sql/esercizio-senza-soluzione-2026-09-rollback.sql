-- Rollback di esercizio-senza-soluzione-2026-09.sql.
--
-- NON È SIMMETRICO, e la parte non simmetrica è quella che conta: rimettere
-- il privilegio di lettura su `hands`, `risposte` e `soluzione` riapre la
-- soluzione a chi deve risolvere l'esercizio. Va eseguito solo insieme al
-- `git revert` del commit che usa le funzioni, e solo se quelle funzioni
-- rompono qualcosa di peggio.
--
-- `risposte_norm` NON si toglie: è una colonna in più che non dà fastidio a
-- nessuno, e toglierla butterebbe via le normalizzazioni già salvate.

grant select on public.esercizi_posizione to authenticated, anon;

drop function if exists public.i_miei_esercizi();
drop function if exists public.esercizio_dell_autore(uuid);
drop function if exists public.verifica_esercizio(uuid, text);
drop function if exists public.esercizio_per_allievo(uuid);
drop function if exists public.insegna_esercizio(uuid);
drop function if exists public.puo_vedere_esercizio(uuid);
