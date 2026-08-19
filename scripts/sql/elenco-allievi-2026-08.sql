-- ============================================================================
-- BridgeLab: l'elenco degli allievi e la formazione dei tavoli
-- ============================================================================
--
-- Intervento 23 del terzo lotto.
-- DIPENDENZE: `instructor_portal.sql`. IDEMPOTENTE.
--
-- ----------------------------------------------------------------------------
-- SI CONSERVA SOLO IL NOME, E NON È UNA SEMPLIFICAZIONE
-- ----------------------------------------------------------------------------
--
-- Il foglio dell'insegnante ha quasi sempre anche email e telefono. La pagina
-- di import li LEGGE — servono a riconoscere le colonne e a mostrare
-- l'anteprima giusta — e non li scrive da nessuna parte.
--
-- Sono dati personali di persone che non hanno un account e non hanno
-- acconsentito a niente: è lo stesso nodo che tiene ferma la Lezione Zero
-- (§4.5 di `feedback-insegnanti-piano.md`), e conservarli qui perché «tanto
-- c'erano nel file» sarebbe il modo classico di aggirare una decisione invece
-- di prenderla.
--
-- Per l'aula il nome basta: serve a dire «Maria, tu a Nord» e a stampare il
-- tagliando. Definita la base giuridica, si aggiungono due colonne.
--
-- ----------------------------------------------------------------------------
-- L'ASSENTE SI TOGLIE, NON SI CANCELLA
-- ----------------------------------------------------------------------------
--
-- `presente` invece della riga cancellata: alla lezione dopo torna, e
-- ricomporre i tavoli da zero ogni settimana è il motivo per cui una funzione
-- del genere si smette di usare.
-- ============================================================================

create table if not exists public.elenco_allievi (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  nome text not null,
  presente boolean not null default true,
  tavolo integer,
  posto text,
  created_at timestamptz not null default now()
);

create index if not exists idx_elenco_classe on public.elenco_allievi (class_id, tavolo, posto);

alter table public.elenco_allievi enable row level security;

drop policy if exists "L'elenco è della classe" on public.elenco_allievi;
create policy "L'elenco è della classe" on public.elenco_allievi
  for select to authenticated
  using (is_instructor_of_class(class_id) or is_member_of_class(class_id));

drop policy if exists "Solo l'insegnante compone l'elenco" on public.elenco_allievi;
create policy "Solo l'insegnante compone l'elenco" on public.elenco_allievi
  for all to authenticated
  using (is_instructor_of_class(class_id))
  with check (is_instructor_of_class(class_id));

comment on table public.elenco_allievi is
  'I nomi degli iscritti al corso e la disposizione ai tavoli. SOLO IL NOME: email e telefono NON si conservano qui finche non e definita la base giuridica per i dati di persone senza account (stesso nodo della Lezione Zero).';
