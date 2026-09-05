-- ============================================================================
-- La revisione si apre quando lo decide l'insegnante
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `revisione-quando-decide-2026-09-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- COSA CAMBIA
--
-- `assignments.soluzioni` ammette oggi tre valori: `subito`, `dopo-il-gioco`,
-- `dopo-la-scadenza`. Nessuno dei tre è «finché non lo dico io», che è quello
-- che ha chiesto Giuseppe Trevissoi:
--
--   «è l'insegnante che le deve rendere disponibili dopo che le ha spiegate».
--
-- Si aggiunge il quarto valore e si sposta il PREDEFINITO su di esso, così i
-- compiti nuovi nascono con la revisione chiusa.
--
-- I 14 COMPITI CHE ESISTONO NON SI TOCCANO. Sono tutti `dopo-il-gioco` e ci
-- restano: chi ha già giocato una di quelle mani la rivede come ieri. Togliere
-- una cosa già concessa è la regressione silenziosa che ci siamo vietati.
--
-- È UNA MODIFICA COMPATIBILE: si allarga un elenco di valori ammessi e si
-- cambia un valore iniziale. Nessuna riga esistente diventa invalida, e il
-- codice che oggi legge `soluzioni` continua a funzionare — semplicemente non
-- ha ancora un ramo per il valore nuovo, che infatti nessuna riga usa finché
-- non lo si imposta.
-- ============================================================================

begin;

alter table public.assignments drop constraint if exists assignments_soluzioni_check;
alter table public.assignments add constraint assignments_soluzioni_check
  check (soluzioni in ('subito', 'dopo-il-gioco', 'dopo-la-scadenza', 'quando-l-insegnante-decide'));

-- I compiti nuovi nascono chiusi. Quelli vecchi non si toccano: non c'è nessun
-- `update`, ed è voluto.
alter table public.assignments
  alter column soluzioni set default 'quando-l-insegnante-decide';

comment on column public.assignments.soluzioni is
  'Quando l''allievo puo'' rivedere le mani del compito: subito | dopo-il-gioco '
  '| dopo-la-scadenza | quando-l-insegnante-decide (predefinito dal 2026-09-05). '
  'La regola e'' applicata dal database, non dall''interfaccia.';

commit;

-- ============================================================================
-- VERIFICA
--
--   select soluzioni, count(*) from public.assignments group by 1;
--   -- atteso: dopo-il-gioco = 14, e nient'altro. I vecchi non si toccano.
--
--   select column_default from information_schema.columns
--    where table_schema='public' and table_name='assignments'
--      and column_name='soluzioni';
--   -- atteso: 'quando-l-insegnante-decide'
--
-- Poi: node scripts/dump-schema.mjs e committare 000-schema-baseline.sql
-- ============================================================================
