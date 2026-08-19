-- ============================================================================
-- BridgeLab: le soluzioni non arrivano prima che l'allievo abbia giocato
-- ============================================================================
--
-- Intervento 4 di `docs/feedback-insegnanti-piano.md`.
--
-- DIPENDENZE: `instructor_portal.sql`, `first_attempt_results.sql`,
-- `iscrizioni-e-ciclo-classe-2026-08.sql`.
--
-- IDEMPOTENTE, ma va eseguito IN DUE TEMPI: vedi «ORDINE» in fondo. La parte
-- finale toglie un privilegio, e toglierlo prima del deploy rompe il sito.
--
-- ----------------------------------------------------------------------------
-- IL PROBLEMA È PIÙ GRANDE DI QUANTO SEMBRI DALLA PAGINA
-- ----------------------------------------------------------------------------
--
-- Nella pagina del compito il commento della smazzata sta dietro un pulsante
-- «Mostra suggerimento». Sembra un controllo, e non lo è: il commento è già nel
-- browser, e basta aprire gli strumenti per sviluppatori per leggerlo senza
-- aver giocato.
--
-- Ma il commento non arriva dal compito. Arriva dal CATALOGO, che l'app carica
-- tutto in una query sola all'avvio (`src/lib/catalog.ts`) — duecentosettanta
-- smazzate, commenti compresi. E la tabella ha `using (true)`: quei commenti
-- sono leggibili da chiunque, anche senza account, anche senza aprire il sito.
-- Nascondere il commento nella pagina del compito, con la tabella così, non
-- cambierebbe niente per chi sa dove guardare.
--
-- Quindi: il commento esce dal caricamento di massa e diventa una domanda a
-- sé, che il database sa a chi rispondere.
--
-- ----------------------------------------------------------------------------
-- LA REGOLA, IN UNA FRASE
-- ----------------------------------------------------------------------------
--
-- Il commento di una mano si nega quando quella mano è dentro un compito
-- ancora da fare di chi lo sta chiedendo. Fuori dai compiti resta quello che è
-- sempre stato: materiale didattico, aperto — chi studia da solo il commento se
-- lo merita quando vuole, non c'è nessuno da cui copiare.
--
-- Il divieto vale per la mano, non per la pagina: se una smazzata è nel compito
-- di stasera, non la si legge nemmeno andandola a cercare in «Gioca». Era la
-- scorciatoia più ovvia.
-- ============================================================================

-- ── 1. Quando si vedono le soluzioni, per ogni compito ──────────────────────
--
-- NON si riusa `unlock_mode`. Il piano dava per scontato che si potesse, ma
-- `unlock_mode` vale `free | sequential` ed è un'altra cosa: è l'ordine in cui
-- si sbloccano le mani, non la visibilità del commento. Due significati sulla
-- stessa colonna sono un errore che si paga dopo.
--
-- DEFAULT `dopo-il-gioco`, e cambia il comportamento dei compiti esistenti: è
-- esattamente ciò che gli insegnanti hanno chiesto. Chi vuole il commento come
-- aiuto durante l'esercizio mette `subito`.
alter table public.assignments
  add column if not exists soluzioni text not null default 'dopo-il-gioco';

alter table public.assignments
  drop constraint if exists assignments_soluzioni_check;

alter table public.assignments
  add constraint assignments_soluzioni_check
  check (soluzioni in ('subito', 'dopo-il-gioco', 'dopo-la-scadenza'));

comment on column public.assignments.soluzioni is
  'subito = il commento è un aiuto, si legge quando si vuole; dopo-il-gioco = solo dopo aver giocato quella mano; dopo-la-scadenza = solo a scadenza passata, anche a chi ha già giocato.';

-- ── 2. Chi sta chiedendo può vedere il commento di questa mano? ─────────────
--
-- Si nega se ESISTE anche un solo compito che lo vieta: fra due compiti che
-- contengono la stessa mano vince il più restrittivo, o basterebbe essere in
-- due classi per aggirare la regola.
--
-- L'insegnante della classe non è mai soggetto al divieto: è la stessa pagina,
-- e deve continuare a vedere tutto. Il controllo è qui dentro, non nel client.
create or replace function public.commento_negato(p_smazzata_id text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from assignments a
    join class_members m
      on m.class_id = a.class_id
     and m.student_id = auth.uid()
     and m.status = 'active'
    where a.soluzioni <> 'subito'
      and p_smazzata_id = any (a.smazzata_ids)
      -- L'insegnante della classe vede sempre tutto.
      and not is_instructor_of_class(a.class_id)
      and case a.soluzioni
        -- Visibile appena questa mano risulta giocata da questa persona.
        when 'dopo-il-gioco' then not exists (
          select 1 from game_results gr
          where gr.assignment_id = a.id
            and gr.user_id = auth.uid()
            and gr.details->>'smazzata_id' = p_smazzata_id
        )
        -- Visibile solo a scadenza passata. Senza scadenza non si apre mai da
        -- solo: è la scelta dell'insegnante che ha detto «dopo la scadenza» e
        -- poi non l'ha messa, e nel dubbio si tiene chiuso.
        when 'dopo-la-scadenza' then (a.due_date is null or now() < a.due_date)
        else false
      end
  );
$$;

comment on function public.commento_negato(text) is
  'Vero se chi chiama ha un compito ancora da fare che contiene questa mano. Fra più compiti vince il più restrittivo.';

-- ── 3. Il commento, uno o molti ─────────────────────────────────────────────
--
-- Prende un elenco perché le pagine ne mostrano più d'uno: una chiamata sola
-- invece di una per mano. Le mani negate semplicemente non tornano — il client
-- non deve distinguere «non c'è commento» da «non te lo do», e infatti in
-- entrambi i casi non mostra niente.
create or replace function public.smazzate_commenti(p_ids text[])
returns table (id text, commentary text, commentary_en text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select s.id, s.commentary, s.commentary_en
  from smazzate s
  where s.id = any (p_ids)
    and not commento_negato(s.id);
$$;

comment on function public.smazzate_commenti(text[]) is
  'I commenti delle mani richieste, saltando quelle che l''utente non deve ancora vedere. Unica via d''accesso a smazzate.commentary.';

revoke all on function public.smazzate_commenti(text[]) from public;
grant execute on function public.smazzate_commenti(text[]) to anon, authenticated;

-- ── 4. Il compito, con le mani importate ripulite ───────────────────────────
--
-- Le mani caricate da PBN o generate dall'insegnante non stanno in `smazzate`:
-- stanno in `assignments.custom_hands`, un jsonb che la pagina dell'allievo
-- riceve intero con un `select *`. Chiudere solo il catalogo lascerebbe scoperti
-- proprio i compiti costruiti a mano — cioè quelli a cui l'insegnante tiene di
-- più.
--
-- L'insegnante riceve la riga com'è. All'allievo il commento viene tolto dal
-- jsonb quando la regola lo nega, PRIMA che parta dal database.
create or replace function public.compito_per_allievo(p_assignment_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  a assignments;
  mani jsonb;
begin
  select * into a from assignments where id = p_assignment_id;
  if a.id is null then
    raise exception 'assignment not found' using errcode = 'P0002';
  end if;

  -- Le RLS non si applicano dentro una SECURITY DEFINER: il controllo che
  -- normalmente farebbe la policy va rifatto qui, a mano.
  if not (is_instructor_of_class(a.class_id) or is_member_of_class(a.class_id)) then
    raise exception 'not authorized for assignment %', p_assignment_id
      using errcode = '42501';
  end if;

  mani := coalesce(a.custom_hands, '[]'::jsonb);

  if not is_instructor_of_class(a.class_id) and a.soluzioni <> 'subito' then
    select coalesce(jsonb_agg(
      case when public.commento_negato(mano->>'id')
        then mano - 'commentary'
        else mano
      end
    ), '[]'::jsonb)
    into mani
    from jsonb_array_elements(mani) as mano;
  end if;

  return to_jsonb(a) || jsonb_build_object('custom_hands', mani);
end $$;

comment on function public.compito_per_allievo(uuid) is
  'Il compito come deve vederlo chi lo apre: all''allievo le mani importate arrivano senza commento finché non gli spetta.';

revoke all on function public.compito_per_allievo(uuid) from public;
grant execute on function public.compito_per_allievo(uuid) to authenticated;

-- ============================================================================
-- ORDINE — la parte qui sotto va eseguita DOPO il deploy del codice
-- ============================================================================
--
-- Finché è in produzione una versione dell'app che chiede `commentary` nel
-- caricamento del catalogo, togliere il privilegio fa fallire quella query e
-- l'app resta senza smazzate. Prima si mette online il codice che non la chiede
-- più, poi si chiude.
--
-- Perché un `revoke` di colonna e non una policy: le RLS filtrano le RIGHE, non
-- le colonne. La riga della smazzata deve continuare ad arrivare — servono le
-- carte per giocare — è solo una colonna che non deve uscire, e per quello in
-- Postgres esistono i privilegi di colonna.
--
-- Va tolto prima il privilegio sull'intera tabella: finché c'è quello, un
-- `revoke` sulla singola colonna non ha effetto.
--
-- ESEGUITO il 19/08/2026, dopo il deploy. Resta qui, decommentato, perché lo
-- script deve poter ricostruire il database da zero — ma su un database vivo va
-- eseguito in questo ordine, non prima.
revoke select on public.smazzate from anon, authenticated;
grant select (
  id, lesson_id, board, title, contract, declarer, vulnerability,
  opening_lead, hands, bidding, created_at, updated_at, dd_tricks, title_en
) on public.smazzate to anon, authenticated;
--
-- Da quel momento `select *` su `smazzate` fallisce, ed è voluto: se qualcuno
-- riaggiunge una lettura di massa se ne accorge subito invece di riaprire il
-- buco in silenzio. L'unico lettore è `loadSmazzate` in `src/lib/catalog.ts`, e
-- ha già l'elenco esplicito delle colonne.
--
-- La verifica sta in `scripts/test-rls.mjs`: come anonimo, `commentary` non
-- deve essere leggibile.
