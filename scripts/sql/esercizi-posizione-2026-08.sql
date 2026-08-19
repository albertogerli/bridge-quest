-- ============================================================================
-- BridgeLab: una posizione salvata diventa un esercizio
-- ============================================================================
--
-- Intervento 12 del secondo lotto.
--
-- DIPENDENZE: `instructor_portal.sql`, `iscrizioni-e-ciclo-classe-2026-08.sql`.
-- IDEMPOTENTE.
--
-- PERCHÉ È IL MODO PIÙ RAPIDO DI COSTRUIRE IL REPERTORIO. Un esercizio scritto
-- da zero costa mezz'ora: inventare la mano, verificare che l'argomento ci sia
-- davvero, scrivere la domanda. Una posizione appena vista a lezione costa un
-- clic e ha già tutto — la mano è quella su cui la classe stava discutendo un
-- minuto fa, e la domanda è quella che l'insegnante ha appena fatto a voce.
--
-- SI SALVA IL MOMENTO, NON LA SMAZZATA: dentro ci sono la dichiarazione fin lì
-- e le carte già giocate. L'allievo riparte da dove eravate, non dall'inizio.
--
-- L'ORDINE DI `assignments.esercizio_ids` CONTA e va rispettato in lettura: un
-- esercizio che introduce e uno che verifica non sono intercambiabili.
--
-- I RISULTATI VANNO IN `game_results`, con `game_type = 'compito'` e l'id
-- dell'esercizio dentro `details.smazzata_id`. Non è un trucco: è la chiave che
-- tutto il resto del codice — conteggio di completamento, classifica, tempi —
-- usa già per dire «questo pezzo l'ha fatto». Una tabella a parte sarebbe
-- invisibile a tutto ciò che funziona.
-- ============================================================================

alter table public.assignments
  add column if not exists esercizio_ids uuid[] not null default '{}';

comment on column public.assignments.esercizio_ids is
  'Esercizi di posizione assegnati insieme alle smazzate. L''ordine conta.';

create table if not exists public.esercizi_posizione (
  id uuid primary key default gen_random_uuid(),
  autore_id uuid references auth.users(id) on delete set null,
  titolo text not null,
  -- dichiara | carta | piano. «piano» non ha risposta confrontabile: la
  -- corregge l'insegnante leggendola, e fingere di saperla correggere sarebbe
  -- peggio che ammettere che non si può.
  consegna text not null,
  domanda text,
  -- Tutte e quattro le mani: `posizione` dice da quale si guarda. Toglierle
  -- vorrebbe dire non poter più dire quante prese faceva la carta giusta.
  hands jsonb not null,
  dealer text not null default 'south',
  vulnerability text not null default 'none',
  bids text[] not null default '{}',
  played jsonb not null default '[]'::jsonb,
  posizione text not null default 'south',
  contract text,
  declarer text,
  -- Più d'una, perché al bridge quasi sempre lo sono: accettarne una sola
  -- insegnerebbe una regola che non esiste.
  risposte text[] not null default '{}',
  soluzione text,
  gruppo text,
  class_id uuid references public.classes(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.esercizi_posizione
  drop constraint if exists esercizi_posizione_consegna_check;
alter table public.esercizi_posizione
  add constraint esercizi_posizione_consegna_check
  check (consegna in ('dichiara', 'carta', 'piano'));

create index if not exists idx_esercizi_autore on public.esercizi_posizione (autore_id, created_at desc);
create index if not exists idx_esercizi_classe on public.esercizi_posizione (class_id) where class_id is not null;
create index if not exists idx_esercizi_gruppo on public.esercizi_posizione (autore_id, gruppo) where gruppo is not null;

alter table public.esercizi_posizione enable row level security;

-- Lo legge l'autore, chi è nella classe a cui è legato, e chi ha un compito
-- che lo contiene: le tre strade da cui ci si arriva.
drop policy if exists "Autore e classe leggono l'esercizio" on public.esercizi_posizione;
create policy "Autore e classe leggono l'esercizio" on public.esercizi_posizione
  for select to authenticated
  using (
    autore_id = auth.uid()
    or (class_id is not null and (is_member_of_class(class_id) or is_instructor_of_class(class_id)))
    or exists (
      select 1 from assignments a
      where esercizi_posizione.id = any (a.esercizio_ids)
        and (is_member_of_class(a.class_id) or is_instructor_of_class(a.class_id))
    )
  );

drop policy if exists "Chi insegna crea esercizi" on public.esercizi_posizione;
create policy "Chi insegna crea esercizi" on public.esercizi_posizione
  for insert to authenticated
  with check (
    autore_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('instructor', 'admin')
    )
  );

drop policy if exists "L'autore modifica i suoi esercizi" on public.esercizi_posizione;
create policy "L'autore modifica i suoi esercizi" on public.esercizi_posizione
  for update to authenticated using (autore_id = auth.uid()) with check (autore_id = auth.uid());

drop policy if exists "L'autore cancella i suoi esercizi" on public.esercizi_posizione;
create policy "L'autore cancella i suoi esercizi" on public.esercizi_posizione
  for delete to authenticated using (autore_id = auth.uid());

comment on table public.esercizi_posizione is
  'Una posizione salvata come esercizio: smazzata, dichiarazione fin li, carte giocate, consegna e risposta attesa.';
