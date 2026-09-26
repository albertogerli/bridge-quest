-- Rollback di mani-compito-senza-corsa-2026-09.sql.
--
-- NON È SIMMETRICO, e va detto prima di eseguirlo: togliere la funzione non
-- riporta il codice al ramo di lettura-e-riscrittura, lo lascia senza niente.
-- Va eseguito SOLO insieme al `git revert` del commit che introduce la
-- chiamata, altrimenti «Assegna le mani» smette di funzionare del tutto.
--
-- E quando il codice torna indietro, torna anche il difetto: due insegnanti
-- che assegnano insieme alla stessa lezione, e le mani del primo spariscono.

drop function if exists public.aggiungi_mani_al_compito(uuid, integer, text, text[], text);
