-- ============================================================================
-- BridgeLab: entrare in aula senza registrarsi
-- ============================================================================
--
-- Intervento 19 del terzo lotto. Sblocca il 20 (aula multi-tavolo) e il 23
-- (elenco allievi).
--
-- DIPENDENZE: `instructor_portal.sql`, `iscrizioni-e-ciclo-classe-2026-08.sql`.
-- IDEMPOTENTE.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ L'OSPITE È UN UTENTE VERO
-- ----------------------------------------------------------------------------
--
-- La strada breve sarebbe un gettone in una tabella e un pugno di funzioni
-- `SECURITY DEFINER` per farci passare l'ospite. È la strada che si paga dopo:
-- ogni cosa che deve poter fare — vedere il tavolo, giocare una carta,
-- rispondere a un sondaggio — diventerebbe una funzione a sé con i controlli
-- riscritti a mano, e i controlli riscritti a mano sono dove si aprono i buchi.
--
-- Qui l'ospite È un utente, creato dal server in `/api/aula/entra`. Da quel
-- momento valgono le RLS che già esistono, senza toccarle: è membro di UNA
-- classe e vede quella. E la conversione in account vero è aggiungere un'email
-- allo stesso utente — quindi «eredita tutta la sua attività» non è una
-- migrazione da scrivere, è una conseguenza.
--
-- L'accesso anonimo di Supabase avrebbe fatto lo stesso lavoro ed è DISATTIVATO
-- su questo progetto (verificato il 19/08/2026). Accendendolo, la rotta si può
-- semplificare parecchio.
--
-- ----------------------------------------------------------------------------
-- COSA IMPEDISCE CHE DIVENTI UNA FABBRICA DI UTENTI
-- ----------------------------------------------------------------------------
--
-- Tre guardie, tutte lato server: serve un invito valido, c'è un tetto di
-- ospiti che decide l'insegnante, e l'ospite nasce con ruolo `user` e una sola
-- appartenenza. La scadenza predefinita è la fine della giornata, perché la
-- lezione è quella: un link che entra in una classe senza chiedere niente, se
-- vale per sempre, prima o poi gira.
-- ============================================================================

create table if not exists public.inviti_aula (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  -- In chiaro, ed è una scelta: quello che protegge è una classe di bridge per
  -- qualche ora, e conservarne solo l'impronta vorrebbe dire non poterlo più
  -- ristampare su una locandina — che è l'uso previsto.
  token text not null unique,
  creato_da uuid references auth.users(id) on delete set null,
  scade_il timestamptz not null,
  revocato boolean not null default false,
  max_ospiti integer not null default 40,
  created_at timestamptz not null default now()
);

create index if not exists idx_inviti_classe on public.inviti_aula (class_id, created_at desc);

alter table public.inviti_aula enable row level security;

-- Solo l'insegnante della classe, e solo sulla sua. La rotta di ingresso legge
-- con il service role: l'ospite non ha bisogno di vedere questa tabella.
drop policy if exists "L'insegnante gestisce gli inviti della sua classe" on public.inviti_aula;
create policy "L'insegnante gestisce gli inviti della sua classe" on public.inviti_aula
  for all to authenticated
  using (is_instructor_of_class(class_id))
  with check (is_instructor_of_class(class_id));

alter table public.profiles
  add column if not exists ospite boolean not null default false;
alter table public.profiles
  add column if not exists ospite_scade_il timestamptz;

comment on column public.profiles.ospite is
  'Entrato con un link d''aula, senza registrarsi. Diventa falso quando sceglie email e password.';
comment on column public.profiles.ospite_scade_il is
  'Quando la sessione ospite smette di valere. Dopo, per rientrare serve un account.';

comment on table public.inviti_aula is
  'Il link con cui si entra in aula senza registrarsi: a scadenza, revocabile, con un tetto di ospiti.';
