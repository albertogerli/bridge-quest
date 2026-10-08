-- Rollback di `richieste-in-attesa-2026-10.sql`. La pagina `/classi` ignora
-- l'errore della funzione mancante e torna a non mostrare le richieste.

begin;

drop function if exists public.mie_richieste_in_attesa();

delete from public.script_applicati where nome = 'richieste-in-attesa-2026-10.sql';

commit;
