-- ============================================================================
-- BridgeLab: la nota dell'insegnante su una mano
-- ============================================================================
--
-- Intervento 14 del secondo lotto.
-- DIPENDENZE: nessuna oltre a `auth.users`. IDEMPOTENTE.
--
-- SEGUE LA MANO, NON IL COMPITO. È la differenza che la rende utile: la nota
-- scritta l'anno scorso su una smazzata ricompare quest'anno, in un'altra
-- classe, senza che nessuno la cerchi — e finisce da sola nella dispensa da
-- stampare. Legarla al compito vorrebbe dire riscriverla a ogni corso, cioè
-- non scriverla.
--
-- È DELL'AUTORE, non della smazzata: due insegnanti che usano la stessa mano
-- hanno due note diverse, e va bene. La nota è come la spiega lui; per cos'è la
-- mano c'è già il commento del catalogo.
--
-- La chiave primaria è (autore, smazzata): una nota per mano per insegnante, e
-- l'aggiornamento è un upsert senza bisogno di cercare prima la riga.
-- ============================================================================

create table if not exists public.note_smazzate (
  autore_id uuid not null references auth.users(id) on delete cascade,
  smazzata_id text not null,
  testo text not null,
  updated_at timestamptz not null default now(),
  primary key (autore_id, smazzata_id)
);

alter table public.note_smazzate enable row level security;

drop policy if exists "Le note sono di chi le scrive" on public.note_smazzate;
create policy "Le note sono di chi le scrive" on public.note_smazzate
  for all to authenticated
  using (autore_id = auth.uid())
  with check (autore_id = auth.uid());

comment on table public.note_smazzate is
  'La nota che un insegnante allega a una smazzata. Segue la mano ovunque venga usata, in qualsiasi classe.';
