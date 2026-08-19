-- ============================================================================
-- BridgeLab: riprovare una mano, e vedere come è andata agli altri
-- ============================================================================
--
-- Intervento 13 del secondo lotto.
--
-- DIPENDENZE: `instructor_portal.sql`, `first_attempt_results.sql`.
-- IDEMPOTENTE.
--
-- ----------------------------------------------------------------------------
-- IL CONFRONTO È ANONIMO PER SCELTA, NON PER PRUDENZA
-- ----------------------------------------------------------------------------
--
-- La domanda a cui serve rispondere è «era una mano difficile o l'ho sbagliata
-- io», e quella risposta non ha bisogno dei nomi. Con i nomi diventa una
-- classifica, e una classifica in una classe di principianti fa smettere di
-- provare proprio quelli che avrebbero più da guadagnare.
--
-- `classes.risultati_nominativi` lascia all'insegnante la decisione, che è una
-- decisione didattica. Default falso.
--
-- IL PROPRIO RISULTATO SI RICONOSCE SEMPRE, anche da anonimo: senza, la riga
-- più importante della tabella sarebbe indistinguibile dalle altre.
--
-- SI CONFRONTA IL PRIMO TENTATIVO, come ovunque nel portale (vedi
-- `first_attempt_results.sql`): chi rigioca dieci volte non deve comparire col
-- decimo risultato accanto a chi ha giocato una volta sola. È anche ciò che
-- rende sicuro il «rigioca da qui»: si può riprovare quanto si vuole senza
-- toccare quello che risulta.
-- ============================================================================

create table if not exists public.posizioni_preferite (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titolo text not null,
  hands jsonb not null,
  contract text not null,
  declarer text not null,
  played jsonb not null default '[]'::jsonb,
  nota text,
  created_at timestamptz not null default now()
);

create index if not exists idx_preferite_utente on public.posizioni_preferite (user_id, created_at desc);

alter table public.posizioni_preferite enable row level security;

drop policy if exists "Ognuno vede solo le proprie" on public.posizioni_preferite;
create policy "Ognuno vede solo le proprie" on public.posizioni_preferite
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on table public.posizioni_preferite is
  'Posizioni che un allievo ha messo da parte per riprovarle. Solo sue.';

alter table public.classes
  add column if not exists risultati_nominativi boolean not null default false;

comment on column public.classes.risultati_nominativi is
  'Falso = nel confronto fra allievi i nomi non compaiono. Default falso: il confronto serve a capire dove si sta, non a fare classifica.';

create or replace function public.confronto_mano(p_assignment_id uuid, p_smazzata_id text)
returns table (
  nome text,
  prese integer,
  mantenuto boolean,
  e_mio boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  with compito as (
    select a.id, a.class_id from assignments a where a.id = p_assignment_id
  ),
  -- Se chi chiama non è della classe questa CTE è vuota, il cross join non
  -- produce righe, e la funzione non restituisce niente: il controllo di
  -- accesso è qui, perché dentro una SECURITY DEFINER le RLS non si applicano.
  permesso as (
    select c.class_id,
           (select cl.risultati_nominativi from classes cl where cl.id = c.class_id) as nominativi,
           is_instructor_of_class(c.class_id) as sono_insegnante
    from compito c
    where is_member_of_class(c.class_id) or is_instructor_of_class(c.class_id)
  ),
  primi as (
    select distinct on (gr.user_id)
      gr.user_id,
      (gr.details->>'tricksMade')::int as prese,
      gr.score >= 0 as mantenuto
    from game_results gr, compito c
    where gr.assignment_id = c.id
      and gr.details->>'smazzata_id' = p_smazzata_id
    order by gr.user_id, gr.created_at asc
  )
  select
    case
      when p.sono_insegnante or p.nominativi or primi.user_id = auth.uid()
        then coalesce(pr.display_name, 'Allievo')
      else 'Un compagno'
    end,
    primi.prese,
    primi.mantenuto,
    primi.user_id = auth.uid()
  from primi
  cross join permesso p
  left join profiles pr on pr.id = primi.user_id
  order by primi.prese desc nulls last;
$$;

comment on function public.confronto_mano(uuid, text) is
  'Come hanno giocato la stessa mano gli altri della classe. Anonimo salvo che l''insegnante non abbia acceso i nomi; il proprio risultato si riconosce sempre.';

revoke all on function public.confronto_mano(uuid, text) from public;
grant execute on function public.confronto_mano(uuid, text) to authenticated;
