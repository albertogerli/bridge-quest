-- ============================================================================
-- Il rubinetto dell'insegnante, e il livello della classe
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Dipendenze: `presenze-e-date-2026-09.sql` (non strettamente necessaria, ma è
-- lo script eseguito prima e il baseline lo presuppone).
--
-- Rollback: `rubinetto-e-livello-2026-09-rollback.sql`
-- DOPO l'esecuzione: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- COSA FA, E LA COSA DELICATA
--
-- Aggiunge tre colonne a `classes`. Due sono banali. La terza —
-- `accesso_libero` — ha un comportamento che va capito prima di eseguire:
--
--   · le classi NUOVE nascono chiuse (`solo-il-corso`);
--   · le 18 classi CHE ESISTONO OGGI restano aperte (`tutto-aperto`).
--
-- Non è un compromesso: è il vincolo che ci siamo dati. Chi è già dentro una
-- classe non deve perdere accesso a cose che vedeva. Cinquantadue allievi che
-- domani mattina trovano meno di ieri sarebbero una regressione silenziosa
-- introdotta proprio dalla funzione che dovrebbe far adottare il portale.
--
-- ATTENZIONE ALLA RIESECUZIONE. Il riempimento iniziale avviene SOLO la prima
-- volta, ed è protetto da un controllo esplicito sull'esistenza della colonna.
-- Senza quella guardia, rieseguire lo script riaprirebbe il rubinetto alle
-- classi che l'insegnante ha nel frattempo chiuso — un danno invisibile, del
-- tipo peggiore: nessun errore, solo allievi che rivedono cose che
-- l'insegnante aveva deciso di togliere.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1 · Il livello del corso
--
-- TESTO LIBERO E NON UN ELENCO CHIUSO. Il metodo prevede il Corso di
-- Approfondimento dopo qualche mese, e altri livelli arriveranno: un `check`
-- con due voci sarebbe da modificare al primo corso nuovo, cioè uno script SQL
-- da eseguire a mano per aggiungere una parola. Il costo di lasciarlo libero è
-- che due insegnanti scrivano «Primo livello» e «1° livello»: si risolve
-- proponendo i valori già usati quando si compila, non vietandone di nuovi.
--
-- FACOLTATIVO. Le 18 classi esistenti non ce l'hanno e non devono bloccarsi.
-- ----------------------------------------------------------------------------
alter table public.classes
  add column if not exists livello text;

-- Un limite alla lunghezza, non ai valori: serve solo a impedire che qualcuno
-- ci incolli dentro un paragrafo.
alter table public.classes drop constraint if exists classes_livello_breve;
alter table public.classes add constraint classes_livello_breve
  check (livello is null or char_length(livello) <= 60);

comment on column public.classes.livello is
  'Livello del corso, testo libero: «Primo livello», «Approfondimento», … '
  'Facoltativo. Non e'' un elenco chiuso perche'' i livelli aumenteranno.';

-- ----------------------------------------------------------------------------
-- 2 · Il rubinetto
--
-- Tre posizioni, che sono la forma che l'insegnante descrive: qualcosa che si
-- apre man mano che il corso procede. `personalizzato` non si sceglie dal
-- cursore — ci si finisce muovendo i singoli gruppi nelle avanzate.
-- ----------------------------------------------------------------------------
alter table public.classes
  add column if not exists accesso_libero text not null default 'solo-il-corso';

alter table public.classes drop constraint if exists classes_accesso_libero_valido;
alter table public.classes add constraint classes_accesso_libero_valido
  check (accesso_libero in ('solo-il-corso', 'con-pratica-libera', 'tutto-aperto', 'personalizzato'));

-- Le eccezioni per gruppo, per la minoranza che vuole la combinazione strana.
-- Vuoto = vale quello che dice il cursore.
alter table public.classes
  add column if not exists permessi jsonb not null default '{}'::jsonb;

comment on column public.classes.accesso_libero is
  'Quanto l''insegnante ha aperto: solo-il-corso | con-pratica-libera | '
  'tutto-aperto | personalizzato. Le classi nuove nascono chiuse; quelle '
  'esistenti al 2026-09-04 sono state aperte, per non togliere niente a chi '
  'era gia'' dentro.';

comment on column public.classes.permessi is
  'Eccezioni per gruppo, quando il cursore non basta. Vuoto = vale il cursore.';

-- ----------------------------------------------------------------------------
-- 3 · Le classi che esistono oggi restano aperte — UNA VOLTA SOLA
--
-- La guardia guarda se la colonna esisteva PRIMA di questo script. Il modo per
-- saperlo dopo averla aggiunta è indiretto ma affidabile: se ci sono ancora
-- classi create prima di oggi lasciate al valore iniziale, il riempimento non
-- è mai avvenuto. Alla seconda esecuzione non ne troverà nessuna, perché sono
-- già state aperte o perché l'insegnante le ha richiuse di proposito.
--
-- La data limite è FISSA e scritta a mano apposta: dopo l'esecuzione, una
-- classe creata domani non deve mai essere toccata da questo blocco, nemmeno
-- se lo script viene rieseguito per sbaglio fra sei mesi.
-- ----------------------------------------------------------------------------
do $$
declare
  gia_fatto boolean;
  toccate   integer;
begin
  select exists (
    select 1 from public.classes
     where created_at < timestamptz '2026-09-05'
       and accesso_libero <> 'solo-il-corso'
  ) into gia_fatto;

  if gia_fatto then
    raise notice 'Riempimento gia'' avvenuto: non tocco niente.';
  else
    update public.classes
       set accesso_libero = 'tutto-aperto'
     where created_at < timestamptz '2026-09-05';
    get diagnostics toccate = row_count;
    raise notice 'Classi esistenti lasciate aperte: %', toccate;
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICA (dopo l'esecuzione)
--
--   select accesso_libero, count(*) from public.classes group by 1;
--   -- atteso: tutto-aperto = 18, nient'altro
--
--   select count(*) from public.classes where livello is not null;  -- 0
--
--   -- la riesecuzione non deve riaprire niente: chiudi una classe a mano,
--   -- riesegui lo script, e ricontrolla che sia rimasta chiusa.
--
-- Poi: node scripts/dump-schema.mjs   e committare 000-schema-baseline.sql
-- ============================================================================
