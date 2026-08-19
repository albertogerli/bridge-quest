-- ============================================================================
-- BridgeLab: assegnare la lezione di stasera in un gesto
-- ============================================================================
--
-- Intervento 1 di `docs/feedback-insegnanti-piano.md`.
--
-- DIPENDENZE: `instructor_portal.sql`, `soluzioni-dopo-il-gioco-2026-08.sql`.
--
-- IDEMPOTENTE: si può rieseguire.
--
-- ----------------------------------------------------------------------------
-- IL GESTO PIÙ FREQUENTE COSTA UN MODULO CON CINQUE CAMPI
-- ----------------------------------------------------------------------------
--
-- «Assegna gli esercizi della lezione di stasera» è quello che l'insegnante fa
-- ogni settimana, e oggi passa da `/istruttori/[classId]/nuovo-compito`: titolo,
-- nota, scadenza, e la scelta a mano delle otto smazzate da un elenco. Il modulo
-- è fatto bene e resta — serve per i compiti costruiti su misura. Ma per il caso
-- normale sono cinque campi per dire una cosa sola.
--
-- ----------------------------------------------------------------------------
-- L'IDEMPOTENZA STA QUI, NON NEL CLIENT
-- ----------------------------------------------------------------------------
--
-- Un pulsante «assegna» premuto due volte — la rete lenta, il dito che scappa,
-- la pagina riaperta in due schede — creerebbe due compiti identici, e gli
-- allievi si troverebbero le stesse otto mani in doppia copia. Controllarlo nel
-- client non basta: due schede non si parlano. Serve un vincolo nel database, e
-- un `on conflict do nothing` che lo rispetti in silenzio.
--
-- Il vincolo è su (classe, lezione): una lezione si assegna una volta sola per
-- classe. I compiti costruiti a mano hanno `lesson_id` nullo e restano fuori dal
-- vincolo — se ne possono fare quanti se ne vuole, ed è giusto: sono diversi
-- l'uno dall'altro per definizione.
--
-- LE MANI LE SCEGLIE IL DATABASE, non il client. Passare l'elenco degli id
-- dalla pagina avrebbe voluto dire fidarsi che la pagina avesse il catalogo
-- aggiornato: se una smazzata viene aggiunta a una lezione, chi ha la scheda
-- aperta da ieri assegnerebbe la lezione monca senza accorgersene.
-- ============================================================================

-- ── 1. Quale lezione è, quando è una lezione ────────────────────────────────
--
-- NULL per i compiti costruiti a mano, che sono la maggioranza di oggi e non
-- corrispondono a nessuna lezione.
alter table public.assignments
  add column if not exists lesson_id integer references public.lessons(id) on delete set null;

comment on column public.assignments.lesson_id is
  'La lezione assegnata in blocco, se il compito nasce così. NULL per i compiti composti a mano.';

-- Una lezione, una volta sola per classe. Parziale, così i compiti a mano non
-- si pestano i piedi fra loro.
create unique index if not exists assignments_una_lezione_per_classe
  on public.assignments (class_id, lesson_id)
  where lesson_id is not null;

-- ── 2. Assegna la lezione ───────────────────────────────────────────────────
--
-- Restituisce il compito, che sia stato creato adesso o esistesse già: al
-- chiamante interessa che dopo la chiamata la lezione risulti assegnata, non
-- chi l'ha assegnata per primo.
create or replace function public.assegna_lezione(
  p_class_id uuid,
  p_lesson_id integer,
  p_soluzioni text default 'dopo-il-gioco',
  p_due_date timestamptz default null
)
returns assignments
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  esito assignments;
  mani text[];
  titolo text;
begin
  if not is_instructor_of_class(p_class_id) then
    raise exception 'not authorized for class %', p_class_id using errcode = '42501';
  end if;

  select array_agg(s.id order by s.board) into mani
  from smazzate s where s.lesson_id = p_lesson_id;

  if mani is null or array_length(mani, 1) = 0 then
    raise exception 'lesson % has no hands', p_lesson_id using errcode = 'P0002';
  end if;

  select l.title into titolo from lessons l where l.id = p_lesson_id;

  insert into assignments (class_id, title, smazzata_ids, lesson_id, soluzioni, due_date)
  values (
    p_class_id,
    coalesce(titolo, 'Lezione ' || p_lesson_id),
    mani,
    p_lesson_id,
    p_soluzioni,
    p_due_date
  )
  on conflict (class_id, lesson_id) where lesson_id is not null do nothing
  returning * into esito;

  -- `do nothing` non restituisce niente: la lezione era già assegnata, e si
  -- torna il compito che c'è già. Premere due volte non è un errore.
  if esito.id is null then
    select * into esito from assignments
    where class_id = p_class_id and lesson_id = p_lesson_id;
  end if;

  return esito;
end $$;

comment on function public.assegna_lezione(uuid, integer, text, timestamptz) is
  'Crea il compito con tutte le mani di una lezione. Premuto due volte non crea doppioni: restituisce quello che c''è già.';

revoke all on function public.assegna_lezione(uuid, integer, text, timestamptz) from public;
grant execute on function public.assegna_lezione(uuid, integer, text, timestamptz) to authenticated;

-- ── 3. A che punto è la classe, compito per compito ─────────────────────────
--
-- `get_class_results` esisteva già ma risponde su UN compito e restituisce una
-- riga per (allievo, mano): per una vista d'insieme vorrebbe dire una chiamata
-- per compito e il conteggio fatto nel client, su dati che il client non
-- dovrebbe nemmeno ricevere tutti.
--
-- «Completo» vuol dire che l'allievo ha giocato TUTTE le mani del compito. È il
-- numero che l'insegnante guarda per decidere se andare avanti: sapere che
-- venti mani su cento sono state giocate non dice quanti allievi sono pronti.
create or replace function public.stato_compiti_classe(p_class_id uuid)
returns table (
  assignment_id uuid,
  lesson_id integer,
  title text,
  n_mani integer,
  n_allievi integer,
  n_completi integer
)
language sql
stable
security definer
set search_path to 'public'
as $$
  with allievi as (
    select m.student_id
    from class_members m
    where m.class_id = p_class_id and m.status = 'active'
  ),
  per_allievo as (
    select a.id as aid,
           al.student_id,
           count(distinct gr.details->>'smazzata_id')
             filter (where gr.details->>'smazzata_id' = any (a.smazzata_ids)) as fatte
    from assignments a
    cross join allievi al
    left join game_results gr
      on gr.assignment_id = a.id and gr.user_id = al.student_id
    where a.class_id = p_class_id
    group by a.id, al.student_id
  )
  select a.id,
         a.lesson_id,
         a.title,
         coalesce(array_length(a.smazzata_ids, 1), 0)::integer,
         (select count(*) from allievi)::integer,
         count(*) filter (
           where pa.fatte >= coalesce(array_length(a.smazzata_ids, 1), 0)
         )::integer
  from assignments a
  left join per_allievo pa on pa.aid = a.id
  where a.class_id = p_class_id
    and is_instructor_of_class(p_class_id)
  group by a.id, a.lesson_id, a.title, a.smazzata_ids
  order by a.created_at desc;
$$;

comment on function public.stato_compiti_classe(uuid) is
  'Per ogni compito della classe: quante mani, quanti allievi, e quanti hanno finito TUTTE le mani.';

revoke all on function public.stato_compiti_classe(uuid) from public;
grant execute on function public.stato_compiti_classe(uuid) to authenticated;
