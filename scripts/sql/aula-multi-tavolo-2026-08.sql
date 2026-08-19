-- ============================================================================
-- BridgeLab: l'aula con più tavoli
-- ============================================================================
--
-- Intervento 20 del terzo lotto.
-- DIPENDENZE: `tavolo-condiviso-2026-08.sql`. IDEMPOTENTE.
--
-- Il tavolo condiviso è uno, e l'insegnante lo governa guardandolo. In circolo
-- la lezione ha dodici-ventiquattro allievi su più tavoli: senza il concetto di
-- aula bisognerebbe aprire sei tavoli scollegati e ricordarsi a che punto è
-- ognuno.
--
-- ----------------------------------------------------------------------------
-- QUELLO CHE HO MISURATO, IL 19/08/2026, SUL DATABASE DI PRODUZIONE
-- ----------------------------------------------------------------------------
--
--   aprire una sessione da 40 tavoli          13 ms
--   distribuire la stessa mano a 40 tavoli     3 ms
--   leggere lo stato di 40 tavoli              2 ms
--   160 letture di `live_table_view`          30 ms in tutto, 0,19 ms l'una
--
-- Il motivo per cui la distribuzione costa tre millisecondi è che è UNA sola
-- `update` su quaranta righe. Fatta dal client sarebbero quaranta andate e
-- ritorni: la differenza fra «la classe vede la mano insieme» e «la vede a
-- scaglioni».
--
-- QUELLO CHE NON HO MISURATO, e va detto invece di lasciarlo intendere: 160
-- browser veri collegati insieme. Le 160 letture sono in fila, non simultanee,
-- e non dicono niente sul limite di connessioni Realtime di Supabase né sulla
-- banda di una sala col wi-fi del circolo — che sono i due limiti che in aula
-- si incontrano per primi. Quel numero si scopre alla prima lezione con
-- quaranta tavoli veri; il polling di riserva ogni cinque secondi che il tavolo
-- già ha è la rete messa lì apposta per quel giorno.
--
-- IL TETTO DI 40 È NEL CODICE, non nella documentazione: `aula_apri` rifiuta
-- oltre. Un limite scritto solo in un commento è un limite che qualcuno supera.
-- ============================================================================

create table if not exists public.sessioni_aula (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  instructor_id uuid not null references auth.users(id) on delete cascade,
  titolo text,
  stato text not null default 'aperta',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

alter table public.sessioni_aula drop constraint if exists sessioni_aula_stato_check;
alter table public.sessioni_aula add constraint sessioni_aula_stato_check
  check (stato in ('aperta', 'chiusa'));

create index if not exists idx_sessioni_classe on public.sessioni_aula (class_id, created_at desc);

alter table public.live_tables
  add column if not exists sessione_id uuid references public.sessioni_aula(id) on delete set null;
alter table public.live_tables
  add column if not exists numero integer;

create index if not exists idx_live_tables_sessione on public.live_tables (sessione_id, numero);

alter table public.sessioni_aula enable row level security;

drop policy if exists "La sessione la vede la classe" on public.sessioni_aula;
create policy "La sessione la vede la classe" on public.sessioni_aula
  for select to authenticated
  using (is_instructor_of_class(class_id) or is_member_of_class(class_id));

drop policy if exists "L'insegnante gestisce la sessione" on public.sessioni_aula;
create policy "L'insegnante gestisce la sessione" on public.sessioni_aula
  for all to authenticated
  using (is_instructor_of_class(class_id))
  with check (is_instructor_of_class(class_id) and instructor_id = auth.uid());

create or replace function public.aula_apri(p_class_id uuid, p_tavoli integer, p_titolo text default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  sid uuid;
  n integer;
begin
  if not is_instructor_of_class(p_class_id) then
    raise exception 'not authorized for class %', p_class_id using errcode = '42501';
  end if;
  if p_tavoli < 1 or p_tavoli > 40 then
    raise exception 'numero di tavoli fuori scala: %', p_tavoli using errcode = '22023';
  end if;

  insert into sessioni_aula (class_id, instructor_id, titolo)
  values (p_class_id, auth.uid(), p_titolo)
  returning id into sid;

  for n in 1..p_tavoli loop
    insert into live_tables (class_id, instructor_id, hands, titolo, sessione_id, numero)
    values (p_class_id, auth.uid(), '{}'::jsonb, 'Tavolo ' || n, sid, n);
  end loop;

  return sid;
end $$;

comment on function public.aula_apri(uuid, integer, text) is
  'Apre una sessione d''aula con N tavoli. Il tetto di 40 e nel codice, non solo nella documentazione.';

revoke all on function public.aula_apri(uuid, integer, text) from public;
grant execute on function public.aula_apri(uuid, integer, text) to authenticated;

create or replace function public.aula_distribuisci(
  p_sessione_id uuid,
  p_hands jsonb,
  p_titolo text default null,
  p_contract text default null,
  p_declarer text default null
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  quanti integer;
  cid uuid;
begin
  select class_id into cid from sessioni_aula where id = p_sessione_id;
  if cid is null or not is_instructor_of_class(cid) then
    raise exception 'not authorized for session %' , p_sessione_id using errcode = '42501';
  end if;

  update live_tables
  set hands = p_hands,
      titolo = coalesce(p_titolo, titolo),
      contract = p_contract,
      declarer = p_declarer,
      played = '[]'::jsonb,
      revealed = '{}',
      show_contract = false,
      updated_at = now()
  where sessione_id = p_sessione_id and closed_at is null;

  get diagnostics quanti = row_count;
  return quanti;
end $$;

comment on function public.aula_distribuisci(uuid, jsonb, text, text, text) is
  'Manda la stessa mano a tutti i tavoli della sessione, in una sola scrittura.';

revoke all on function public.aula_distribuisci(uuid, jsonb, text, text, text) from public;
grant execute on function public.aula_distribuisci(uuid, jsonb, text, text, text) to authenticated;

create or replace function public.aula_stato(p_sessione_id uuid)
returns table (
  tavolo_id uuid,
  numero integer,
  titolo text,
  carte_giocate integer,
  posti_assegnati integer,
  aggiornato timestamptz
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select t.id, t.numero, t.titolo,
         jsonb_array_length(coalesce(t.played, '[]'::jsonb))::integer,
         (select count(*) from jsonb_object_keys(coalesce(t.seat_of, '{}'::jsonb)))::integer,
         t.updated_at
  from live_tables t
  join sessioni_aula s on s.id = t.sessione_id
  where t.sessione_id = p_sessione_id
    and (is_instructor_of_class(s.class_id) or is_member_of_class(s.class_id))
  order by t.numero;
$$;

comment on function public.aula_stato(uuid) is
  'A che punto e ogni tavolo della sessione: una riga per tavolo, in una query sola.';

revoke all on function public.aula_stato(uuid) from public;
grant execute on function public.aula_stato(uuid) to authenticated;

create or replace function public.aula_chiudi(p_sessione_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare cid uuid;
begin
  select class_id into cid from sessioni_aula where id = p_sessione_id;
  if cid is null or not is_instructor_of_class(cid) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update live_tables set closed_at = now() where sessione_id = p_sessione_id and closed_at is null;
  update sessioni_aula set stato = 'chiusa', closed_at = now() where id = p_sessione_id;
end $$;

revoke all on function public.aula_chiudi(uuid) from public;
grant execute on function public.aula_chiudi(uuid) to authenticated;

comment on table public.sessioni_aula is
  'Una lezione con piu tavoli: N tavoli condivisi governati da una console sola.';
