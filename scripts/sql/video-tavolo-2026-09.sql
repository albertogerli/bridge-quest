-- ============================================================================
-- La telecamera al tavolo, come opzione
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `video-tavolo-2026-09-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- SPENTA DI PARTENZA, E PER CLASSE
--
-- Il video fra persone è la funzione più delicata del portale: ci sono
-- principianti over 60 e, nei corsi giovani, dei minorenni. Non può essere una
-- cosa che si trova accesa senza averla scelta.
--
-- L'interruttore è della CLASSE e non del singolo, perché la responsabilità di
-- chi sta in quella stanza è dell'insegnante — lo stesso principio del
-- rubinetto. Acceso l'interruttore, ogni persona resta padrona della propria
-- telecamera: nessuno viene inquadrato senza aver toccato un pulsante.
--
-- NON SI REGISTRA NIENTE. Nessun flusso passa dai nostri server e niente viene
-- salvato: le connessioni sono dirette fra i browser, e questa colonna dice
-- solo se la funzione è disponibile.
-- ============================================================================

begin;

alter table public.classes
  add column if not exists video_tavolo boolean not null default false;

comment on column public.classes.video_tavolo is
  'Se al tavolo si puo'' accendere la telecamera. Spenta di partenza: il video '
  'fra persone non si trova acceso senza averlo scelto. Acceso questo, ogni '
  'persona resta padrona della propria telecamera. Niente passa dai nostri '
  'server e niente viene registrato.';

commit;

-- ============================================================================
-- VERIFICA
--   select video_tavolo, count(*) from public.classes group by 1;
--   -- atteso: false per tutte
-- Poi: node scripts/dump-schema.mjs e committare 000-schema-baseline.sql
-- ============================================================================
