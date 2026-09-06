-- ROLLBACK di `adesioni-lezione-zero-2026-09.sql`
--
-- CANCELLA LE ADESIONI RACCOLTE. Sono nomi e recapiti di persone che hanno
-- detto «vengo» e che non hanno un account: se spariscono, l'ASD non sa più chi
-- aspettare e non ha modo di riottenerli — quelle persone hanno lasciato il
-- recapito una volta, davanti a un cartello.
--
-- Si perde anche il conteggio «quanti hanno aderito e quanti sono venuti», che
-- è il tasso di conversione della Lezione Zero: uno degli indicatori che vanno
-- in Consiglio. Non è un dato amministrativo, è la misura del metodo.

create table if not exists public.adesioni_salvate_2026_09 as
  select * from public.adesioni;

select count(*) as adesioni_messe_da_parte,
       count(*) filter (where user_id is not null) as gia_collegate_a_un_account
  from public.adesioni_salvate_2026_09;

begin;
drop function if exists public.adesione_invia(text, text, text, text);
drop table if exists public.adesioni;
commit;

-- Prima di eseguire: togliere dal codice il modulo «Vengo», che altrimenti
-- chiama una funzione inesistente e mostra un errore a chi sta aderendo.
-- Poi `node scripts/dump-schema.mjs` e il baseline.
