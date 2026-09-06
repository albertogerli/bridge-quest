-- ============================================================================
-- La pagina dell'evento: cosa vede chi inquadra la locandina
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `evento-pubblico-2026-09-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- IL PROBLEMA CHE RISOLVE
--
-- Il QR della locandina porta a `/classi?codice=XXX`, dove chi arriva legge
-- «Iscriviti con il codice del tuo istruttore». Ogni parola presuppone che
-- abbia già un insegnante, sappia cosa sia una classe e abbia un codice. Chi ha
-- inquadrato un cartello in una sala d'attesa non ha nessuna delle tre cose —
-- e `/classi` non è nemmeno pubblica, quindi finisce prima al login.
--
-- Quella persona non si lamenta: se ne va, e nessuno lo viene a sapere.
--
-- DUE PEZZI. I campi della locandina vanno salvati (oggi vivono solo nel modulo
-- e spariscono con la pagina), e ci vuole un modo di leggerli SENZA account.
--
-- UNA COLONNA SOLA, jsonb. L'elenco dei campi è quello che Trevissoi ha mandato
-- oggi e cambierà: con una colonna per campo, ogni aggiunta sarebbe uno script
-- SQL e un passaggio a mano su Supabase. Il contenuto della locandina è un
-- documento, non uno schema.
-- ============================================================================

begin;

alter table public.classes
  add column if not exists locandina jsonb not null default '{}'::jsonb;

comment on column public.classes.locandina is
  'I campi della locandina, come documento: titolo, sottotitolo, evento, '
  'quando, dove, corso, insegnante, associazione, note, contatti. Alimentano '
  'anche la pagina pubblica dell''evento. Vuoto = nessuna locandina compilata.';

-- ----------------------------------------------------------------------------
-- Come si legge senza account
--
-- Le RLS di `classes` lasciano vedere la riga solo a chi insegna o è iscritto,
-- ed è giusto che resti così. Serviva quindi UNA PORTA STRETTA: una funzione
-- che restituisce SOLO i campi della locandina — cioè quello che è già scritto
-- su un cartello appeso in bacheca — e nient'altro della classe.
--
-- Non restituisce il nome della classe, chi ci è iscritto, lo stato, i compiti.
-- Chi ha il codice ha in mano un volantino, non una chiave.
--
-- `invite_active` è la condizione: se l'insegnante ha chiuso le iscrizioni, la
-- pagina non esiste più. Una locandina appesa che rimanda a un evento chiuso
-- è meglio che dia «non trovato» piuttosto che raccogliere adesioni che
-- nessuno leggerà.
-- ----------------------------------------------------------------------------
create or replace function public.evento_da_codice(p_codice text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select c.locandina
    from public.classes c
   where upper(c.invite_code) = upper(trim(p_codice))
     and c.invite_active
     and c.locandina <> '{}'::jsonb
     and (c.invite_expires_at is null or c.invite_expires_at > now())
   limit 1;
$$;

revoke all on function public.evento_da_codice(text) from public;
grant execute on function public.evento_da_codice(text) to anon, authenticated;

comment on function public.evento_da_codice(text) is
  'I soli campi della locandina, per la pagina pubblica dell''evento. '
  'Non espone nient''altro della classe: chi ha il codice ha un volantino, '
  'non una chiave.';

commit;

-- ============================================================================
-- VERIFICA
--
--   select public.evento_da_codice('CODICE');   -- null finché non c'è una locandina
--
--   -- da anonimo deve funzionare la funzione e NON la tabella:
--   set local role anon;
--   select public.evento_da_codice('CODICE');   -- ok
--   select count(*) from public.classes;        -- 0 righe o permesso negato
--   reset role;
--
-- Poi: node scripts/dump-schema.mjs e committare 000-schema-baseline.sql
-- ============================================================================
