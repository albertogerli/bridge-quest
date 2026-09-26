-- ROLLBACK di `classifica-anonima-2026-09.sql`
--
-- ATTENZIONE: tornare indietro rimette i nomi di tutti nella classifica anche
-- nelle classi che hanno scelto l'anonimato. Non è una perdita di dati, è una
-- promessa che si rompe di nuovo — e nessuno se ne accorgerà, perché non
-- produce errori.
--
-- Prima di eseguire, togliere dal codice `nomi_della_classe`: i posti al tavolo
-- resterebbero senza nomi.

begin;
drop function if exists public.nomi_della_classe(uuid);
-- Il corpo precedente di `get_class_leaderboard` si recupera dalla cronologia
-- di git: `git show <commit-prima>:scripts/sql/000-schema-baseline.sql`.
commit;

-- Poi: node scripts/dump-schema.mjs e committare il baseline.
