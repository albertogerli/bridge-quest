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
alter table public.classes
  add column if not exists soluzioni_predefinite text not null
  default 'quando-l-insegnante-decide';

alter table public.classes drop constraint if exists classes_soluzioni_predefinite_valide;
alter table public.classes add constraint classes_soluzioni_predefinite_valide
  check (soluzioni_predefinite in ('subito', 'dopo-il-gioco', 'dopo-la-scadenza', 'quando-l-insegnante-decide'));

comment on column public.classes.soluzioni_predefinite is
  'Valore iniziale di `assignments.soluzioni` per i compiti NUOVI di questa '
  'classe. Il singolo compito deroga sempre. Le classi esistenti al 2026-09-05 '
  'sono state messe su `dopo-il-gioco`, cioe'' come si comportavano gia''.';

-- Le classi che esistono oggi continuano a comportarsi come ieri — UNA VOLTA
-- SOLA. Stessa guardia del rubinetto e per lo stesso motivo: rieseguire lo
-- script rimetterebbe in automatico le classi che l'insegnante ha nel frattempo
-- messo in manuale, senza un errore e senza che nessuno se ne accorga.
--
-- Il motivo di merito: un insegnante di una classe attiva che crea un compito
-- domani troverebbe le revisioni chiuse e gli allievi a chiedergli perche''.
-- La novita'' vale per le classi nuove; le altre la adottano quando vogliono,
-- perche'' l'impostazione si vede ed e'' modificabile.
do $$
declare gia_fatto boolean; toccate integer;
begin
  select exists (
    select 1 from public.classes
     where created_at < timestamptz '2026-09-05'
       and soluzioni_predefinite <> 'quando-l-insegnante-decide'
  ) into gia_fatto;

  if gia_fatto then
    raise notice 'Riempimento gia'' avvenuto: non tocco niente.';
  else
    update public.classes
       set soluzioni_predefinite = 'dopo-il-gioco'
     where created_at < timestamptz '2026-09-05';
    get diagnostics toccate = row_count;
    raise notice 'Classi esistenti lasciate in automatico: %', toccate;
  end if;
end $$;

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
