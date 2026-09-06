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
-- Si aggiunge il quarto valore. IL PREDEFINITO DEL DATABASE NON SI TOCCA, e la
-- ragione è emersa guardando il codice: dei tre punti che creano un compito,
-- due passano già `soluzioni` esplicitamente con «dopo-il-gioco» scritto nel
-- TypeScript, e solo uno si affida al valore iniziale della colonna.
--
-- Spostare il predefinito avrebbe quindi prodotto la cosa peggiore: nessun
-- cambiamento sui due percorsi principali, e un comportamento DIVERSO sul
-- terzo — la stessa riga di lezione, due pulsanti accanto, due esiti diversi.
--
-- Decide sempre il codice, partendo da `classes.soluzioni_predefinite`. Il
-- valore iniziale della colonna resta «dopo-il-gioco» e fa da rete: se un
-- percorso dimenticasse di passarlo, sbaglia verso la scelta di oggi invece
-- che verso una revisione chiusa senza spiegazione.
--
-- CONSEGUENZA UTILE: questo script si può eseguire PRIMA o DOPO il codice,
-- indifferentemente. Non esiste una finestra in cui il portale si comporta in
-- un modo che nessuno ha scelto.
--
-- I 14 COMPITI CHE ESISTONO NON SI TOCCANO. Sono tutti `dopo-il-gioco` e ci
-- restano: chi ha già giocato una di quelle mani la rivede come ieri. Togliere
-- una cosa già concessa è la regressione silenziosa che ci siamo vietati.
--
-- È UNA MODIFICA COMPATIBILE: si allarga un elenco di valori ammessi e si
-- Nessuna riga esistente diventa invalida, e il codice che oggi legge
-- `soluzioni` continua a funzionare: semplicemente non ha ancora un ramo per il
-- valore nuovo, che infatti nessuna riga usa finché non lo si imposta.
-- ============================================================================

begin;

alter table public.assignments drop constraint if exists assignments_soluzioni_check;
alter table public.assignments add constraint assignments_soluzioni_check
  check (soluzioni in ('subito', 'dopo-il-gioco', 'dopo-la-scadenza', 'quando-l-insegnante-decide'));

comment on column public.assignments.soluzioni is
  'Quando l''allievo puo'' rivedere le mani del compito: subito | dopo-il-gioco '
  '| dopo-la-scadenza | quando-l-insegnante-decide. '
  'La regola e'' applicata dal database, non dall''interfaccia. Il valore '
  'iniziale resta «dopo-il-gioco» e fa da rete: a scegliere e'' il codice, che '
  'parte da `classes.soluzioni_predefinite`.';

-- ----------------------------------------------------------------------------
-- 2 · Come lavora l'insegnante IN QUESTA CLASSE
--
-- DUE DOMANDE DIVERSE, E PRIMA ERANO COLLASSATE IN UNA.
--   · «come lavoro io in questa classe» — si decide una volta, a settembre;
--   · «questo compito quando si apre» — si decide caso per caso.
-- Tenendo solo la seconda, ogni insegnante doveva rispondere ogni volta a una
-- domanda che per lui ha una risposta stabile. Trevissoi terrà il manuale su
-- tutto; un altro metterà automatico e non ci penserà più. Sono due modi
-- legittimi di insegnare e lo strumento deve reggerli entrambi senza chiedere
-- conferma venti volte.
--
-- QUESTO È SOLO IL VALORE DI PARTENZA dei compiti nuovi. Il singolo compito
-- deroga sempre, perché `assignments.soluzioni` resta quello che comanda: chi
-- lavora in automatico può tenere chiusa UNA revisione — quella mano la spiega
-- giovedì — senza toccare l'impostazione della classe.
-- ----------------------------------------------------------------------------
-- LA COLONNA NASCE VUOTA, E QUESTO ELIMINA LA DATA.
--
-- «Esistente prima della modifica» si esprimeva con `created_at < '2026-09-05'`,
-- cioè con una data scritta a mano: se lo script si esegue il giorno dopo la
-- data è già sbagliata, e una classe creata stamattina si ritroverebbe la
-- novità senza averla scelta.
--
-- Aggiungendo la colonna SENZA valore iniziale, le righe che esistono restano a
-- `null`: sono esattamente quelle di prima, qualunque sia il giorno. Si
-- riempiono, e solo dopo si mette il valore per le righe future.
--
-- Ne guadagna anche la riesecuzione: al secondo giro non ci sono più `null` da
-- riempire, quindi non serve nessuna guardia. L'idempotenza viene dalla forma,
-- non da un controllo che qualcuno potrebbe togliere.
alter table public.classes
  add column if not exists soluzioni_predefinite text;

update public.classes
   set soluzioni_predefinite = 'dopo-il-gioco'
 where soluzioni_predefinite is null;

alter table public.classes
  alter column soluzioni_predefinite set default 'quando-l-insegnante-decide';
alter table public.classes
  alter column soluzioni_predefinite set not null;

alter table public.classes drop constraint if exists classes_soluzioni_predefinite_valide;
alter table public.classes add constraint classes_soluzioni_predefinite_valide
  check (soluzioni_predefinite in ('subito', 'dopo-il-gioco', 'dopo-la-scadenza', 'quando-l-insegnante-decide'));

comment on column public.classes.soluzioni_predefinite is
  'Valore di partenza di `assignments.soluzioni` per i compiti NUOVI di questa '
  'classe: lo applica il codice, non il database. Il singolo compito deroga '
  'sempre. Le classi che esistevano restano su «dopo-il-gioco», cioe'' come si '
  'comportavano gia''.';

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
--   -- atteso: 'dopo-il-gioco' — NON cambia: a scegliere è il codice.
--
-- Poi: node scripts/dump-schema.mjs e committare 000-schema-baseline.sql
-- ============================================================================
