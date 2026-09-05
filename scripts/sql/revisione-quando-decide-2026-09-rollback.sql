-- ============================================================================
-- ROLLBACK di `revisione-quando-decide-2026-09.sql`
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
--
-- ----------------------------------------------------------------------------
-- QUESTO ROLLBACK PUÒ FALLIRE, ED È GIUSTO COSÌ
--
-- Se qualche compito usa già `quando-l-insegnante-decide`, rimettere il vincolo
-- stretto non riesce: PostgreSQL rifiuta di validare un `check` che le righe
-- esistenti violano. Non è un difetto dello script — è il database che impedisce
-- di lasciare dati in uno stato che il vincolo dichiara impossibile.
--
-- La parte 0 dice se sei in quel caso e come uscirne. La scelta di riportare
-- quei compiti a `dopo-il-gioco` NON è automatica: vuol dire aprire agli
-- allievi delle revisioni che l'insegnante aveva deciso di tenere chiuse, e
-- quella è una decisione sua, non di uno script.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0 · Guardare prima, e mettere da parte
-- ----------------------------------------------------------------------------
select soluzioni, count(*) as compiti
  from public.assignments group by soluzioni order by 2 desc;

-- Come lavora ogni insegnante nella sua classe: e'' una scelta sua, e il
-- rollback la cancella. Ricostruirla vuol dire chiederglielo di nuovo.
create table if not exists public.soluzioni_classe_salvate_2026_09 as
  select id, name, soluzioni_predefinite from public.classes;

select soluzioni_predefinite, count(*) as classi
  from public.soluzioni_classe_salvate_2026_09 group by 1 order by 2 desc;

-- Se la riga «quando-l-insegnante-decide» esiste, il blocco 1 fallirà finché
-- non si decide che farne. Per riportarli — SOLO se è quello che si vuole,
-- e sapendo che apre revisioni tenute chiuse di proposito:
--
--   update public.assignments set soluzioni = 'dopo-il-gioco'
--    where soluzioni = 'quando-l-insegnante-decide';

-- ----------------------------------------------------------------------------
-- 1 · Si disfa
-- ----------------------------------------------------------------------------
begin;

alter table public.assignments
  alter column soluzioni set default 'dopo-il-gioco';

-- Prima il vincolo, poi la colonna: al contrario resterebbe orfano e la
-- riesecuzione dello script principale fallirebbe.
alter table public.classes drop constraint if exists classes_soluzioni_predefinite_valide;
alter table public.classes drop column if exists soluzioni_predefinite;

alter table public.assignments drop constraint if exists assignments_soluzioni_check;
alter table public.assignments add constraint assignments_soluzioni_check
  check (soluzioni in ('subito', 'dopo-il-gioco', 'dopo-la-scadenza'));

commit;

-- ============================================================================
-- Prima di eseguire, togliere dal codice il ramo che imposta il valore nuovo:
-- altrimenti l'interfaccia prova a scrivere un valore che il vincolo rifiuta e
-- l'insegnante vede un errore senza capire perché. Nell'ordine: prima il
-- `git revert`, poi questo script.
--
-- Poi: node scripts/dump-schema.mjs e committare 000-schema-baseline.sql
--
-- Quando la copia non serve piu'':
--   drop table public.soluzioni_classe_salvate_2026_09;
-- ============================================================================
