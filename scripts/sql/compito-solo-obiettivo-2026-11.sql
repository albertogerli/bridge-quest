-- ============================================================================
-- Compito: contratto visibile oppure solo «Obiettivo: almeno X prese»
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `compito-solo-obiettivo-2026-11-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- I DUE SET DI SMAZZATE (Trevissoi, 02/11/2026)
--
-- «Suggerirei di creare 2 set di 96 smazzate: il primo senza riferimenti ai
-- contratti e con la dicitura "Obiettivo: almeno X prese", il secondo così
-- com'è.» Le carte sono le stesse: cambia solo che cosa si dice all'allievo.
-- Quindi non si duplicano le smazzate, si sceglie nel compito.
--
-- NULL = come prima: nelle lezioni del gioco della carta (Fiori 1–6) solo
-- l'obiettivo, nelle altre il contratto. TRUE / FALSE = scelto
-- dall'insegnante, per qualunque mano.
-- ============================================================================

begin;

alter table public.assignments
  add column if not exists solo_obiettivo boolean;

comment on column public.assignments.solo_obiettivo is
  'TRUE: all''allievo si dice solo «almeno X prese», senza contratto. FALSE: '
  'il contratto. NULL: dipende dalla lezione (gioco della carta = solo '
  'obiettivo). Scelto dall''insegnante in «Nuovo compito».';

insert into public.script_applicati (nome) values ('compito-solo-obiettivo-2026-11.sql')
on conflict (nome) do nothing;

commit;

-- ============================================================================
-- VERIFICA
--   select solo_obiettivo, count(*) from public.assignments group by 1;
--   -- atteso: NULL per tutti i compiti esistenti
-- ============================================================================
