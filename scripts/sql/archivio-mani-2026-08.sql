-- ============================================================================
-- BridgeLab: archivio delle mani dell'insegnante (saved_hands)
-- ============================================================================
--
-- PERCHÉ
-- Una mano interessante non finisce con la lezione. Oggi, se durante una
-- spiegazione salta fuori la posizione perfetta per il taglio a scelta, per
-- ritrovarla la settimana dopo bisogna ricordarsi il seme del generatore.
--
-- SI SALVA ANCHE LA POSIZIONE, NON SOLO LA MANO
-- È la parte che serve davvero: non «questa smazzata», ma «questa smazzata a
-- metà della quarta presa, quando il dichiarante deve scegliere». Le carte già
-- giocate si conservano insieme alle mani, così la mano si riapre esattamente
-- dov'era.
--
-- SICUREZZA
-- L'archivio è personale: ognuno vede e gestisce solo le proprie mani. Non
-- c'è condivisione, e non è una dimenticanza — condividere una mano significa
-- decidere con chi, e quella domanda non è ancora stata posta. Meglio un
-- archivio privato che funziona di una condivisione approssimativa.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

create table if not exists public.saved_hands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  titolo text not null check (char_length(btrim(titolo)) between 1 and 120),
  nota text check (char_length(nota) <= 2000),
  -- Le quattro mani complete, come le genera il generatore.
  hands jsonb not null,
  contract text,
  declarer text,
  -- Le carte già giocate, per riaprire la mano nella posizione salvata.
  played jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists saved_hands_owner_idx
  on public.saved_hands (owner_id, created_at desc);

alter table public.saved_hands enable row level security;

drop policy if exists "Own saved hands" on public.saved_hands;
create policy "Own saved hands" on public.saved_hands
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
