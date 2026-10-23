-- ============================================================================
-- Compito di licita: l'insegnante sceglie se dopo l'asta si gioca
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `compito-licita-gioco-2026-10-rollback.sql`.
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `compito-licita-2026-10.sql` (colonna `licita`).
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Dal 23/10/2026 l'allievo, chiusa l'asta su un contratto di Nord-Sud, gioca
-- il contratto che ha dichiarato. Un'insegnante (Allievi Mondello) lo voleva
-- per vedere insieme come ci arrivano e come lo giocano; ma non è sempre
-- quello che serve — dopo una lezione sulle risposte all'1SA si vuole far
-- dichiarare e basta. Quindi lo sceglie l'insegnante: dichiarano, giocano, o
-- tutte e due.
--
-- IL DEFAULT È TRUE perché è il comportamento già pubblicato: i compiti di
-- licita esistenti, e quelli creati prima di questo script, continuano a
-- giocare. «Solo licita» scrive false esplicitamente. Conta solo con
-- `licita = true`.
-- ============================================================================

begin;

alter table public.assignments
  add column if not exists licita_gioca boolean not null default true;

comment on column public.assignments.licita_gioca is
  'Compito di licita: dopo l''asta l''allievo gioca il contratto dichiarato (se e di Nord-Sud). Ignorata con licita = false.';

insert into public.script_applicati (nome) values ('compito-licita-gioco-2026-10.sql')
on conflict (nome) do nothing;

commit;
