-- ============================================================================
-- BridgeLab: tavolo condiviso in aula (live_tables)
-- ============================================================================
--
-- COSA FA
-- L'insegnante apre un tavolo per la sua classe e vede tutte e quattro le
-- mani; gli allievi collegati vedono solo la propria, e le altre solo quando
-- l'insegnante decide di scoprirle. È la funzione che gli insegnanti chiedono
-- per la lezione dal vivo, e l'unica del gruppo che non si poteva fare con
-- quello che avevamo.
--
-- IL PUNTO DELICATO È UNO SOLO
-- Le mani coperte non devono essere leggibili dagli allievi. Non basta non
-- disegnarle: se la riga completa arriva al browser, chi apre gli strumenti
-- per sviluppatori le legge tutte, e in una classe di ragazzi succede il primo
-- giorno. Per questo `live_tables` NON è leggibile dagli allievi: ci arrivano
-- solo attraverso `live_table_view()`, che filtra prima di rispondere e
-- restituisce esclusivamente le mani che quell'allievo ha diritto di vedere.
--
-- REALTIME
-- La tabella entra nella publication perché il browser sappia QUANDO
-- ricaricare, non COSA: l'evento porta con sé solo l'id: le mani si
-- richiedono comunque alla funzione, che rifiltra. Senza `REPLICA IDENTITY`
-- ridotta, un UPDATE spedirebbe l'intera riga — mani coperte incluse — a
-- chiunque sia in ascolto.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

create table if not exists public.live_tables (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  -- La smazzata corrente: { north: [...], east: [...], south: [...], west: [...] }
  hands jsonb not null,
  titolo text,
  contract text,
  declarer text,
  -- Posti scoperti a tutta la classe, es. {north,south}
  revealed text[] not null default '{}',
  -- Assegnazione dei posti: { "<student_id>": "north", ... }
  seat_of jsonb not null default '{}'::jsonb,
  show_contract boolean not null default false,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_tables_class_idx
  on public.live_tables (class_id, created_at desc);

alter table public.live_tables enable row level security;

-- L'insegnante gestisce SOLO i tavoli delle proprie classi.
drop policy if exists "Instructor manages own live tables" on public.live_tables;
create policy "Instructor manages own live tables" on public.live_tables
  for all to authenticated
  using (
    instructor_id = auth.uid()
    and exists (select 1 from public.classes c where c.id = class_id and c.instructor_id = auth.uid())
  )
  with check (
    instructor_id = auth.uid()
    and exists (select 1 from public.classes c where c.id = class_id and c.instructor_id = auth.uid())
  );

-- NESSUNA policy di lettura per gli allievi: è voluto. Se potessero fare
-- SELECT sulla tabella, `hands` arriverebbe intero al browser e le mani
-- coperte sarebbero leggibili in tre clic. Passano da live_table_view().

-- Il tavolo come lo può vedere chi chiama.
-- 
-- All'insegnante restituisce tutto. All'allievo iscritto alla classe
-- restituisce la propria mano, più quelle che l'insegnante ha scoperto: il
-- filtro avviene QUI, prima che i dati escano dal database.
create or replace function public.live_table_view(p_table_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
DECLARE
  t          public.live_tables%ROWTYPE;
  v_is_owner boolean;
  v_is_member boolean;
  v_seat     text;
  v_visible  text[];
  v_hands    jsonb := '{}'::jsonb;
  s          text;
BEGIN
  SELECT * INTO t FROM public.live_tables WHERE id = p_table_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_is_owner := (t.instructor_id = auth.uid());
  SELECT EXISTS (
    SELECT 1 FROM public.class_members m
    WHERE m.class_id = t.class_id AND m.student_id = auth.uid()
  ) INTO v_is_member;

  IF NOT v_is_owner AND NOT v_is_member THEN
    -- Chi non c'entra nulla non riceve nemmeno la conferma che il tavolo esista.
    RETURN NULL;
  END IF;

  v_seat := t.seat_of ->> auth.uid()::text;

  IF v_is_owner THEN
    v_visible := ARRAY['north','east','south','west'];
  ELSE
    -- La propria mano più quelle scoperte dall'insegnante.
    v_visible := t.revealed;
    IF v_seat IS NOT NULL AND NOT (v_seat = ANY(v_visible)) THEN
      v_visible := array_append(v_visible, v_seat);
    END IF;
  END IF;

  FOREACH s IN ARRAY v_visible LOOP
    IF t.hands ? s THEN
      v_hands := v_hands || jsonb_build_object(s, t.hands -> s);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'id',            t.id,
    'classId',       t.class_id,
    'titolo',        t.titolo,
    'hands',         v_hands,
    'revealed',      to_jsonb(t.revealed),
    'seat',          v_seat,
    -- La mappa completa dei posti serve solo a chi assegna: un allievo non ha
    -- motivo di sapere dove siedono i compagni.
    'seatOf',        CASE WHEN v_is_owner THEN t.seat_of ELSE NULL END,
    'isInstructor',  v_is_owner,
    -- Il contratto è parte della soluzione: esce solo se l'insegnante lo mostra.
    'contract',      CASE WHEN v_is_owner OR t.show_contract THEN t.contract END,
    'declarer',      CASE WHEN v_is_owner OR t.show_contract THEN t.declarer END,
    'showContract',  t.show_contract,
    'closed',        t.closed_at IS NOT NULL,
    'updatedAt',     t.updated_at
  );
END
$function$;

comment on function public.live_table_view(uuid) is
  'Il tavolo condiviso filtrato per chi chiama: l''insegnante vede tutto, l''allievo la propria mano più quelle scoperte.';

-- Servono ENTRAMBE: PUBLIC riceve EXECUTE da Postgres su ogni funzione nuova,
-- e i default privileges di Supabase concedono ESPLICITAMENTE ad `anon`.
-- Revocare a uno solo dei due lascia il permesso in piedi per l'altra strada;
-- si controlla in `pg_proc.proacl`, dove `anon=X/postgres` è esplicita.
revoke execute on function public.live_table_view(uuid) from public;
revoke execute on function public.live_table_view(uuid) from anon;
grant execute on function public.live_table_view(uuid) to authenticated;

-- Il tavolo aperto adesso per una classe, per chi ne fa parte.
create or replace function public.live_table_open(p_class_id uuid)
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT t.id
  FROM public.live_tables t
  WHERE t.class_id = p_class_id
    AND t.closed_at IS NULL
    AND (
      t.instructor_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.class_members m
                 WHERE m.class_id = t.class_id AND m.student_id = auth.uid())
    )
  ORDER BY t.created_at DESC
  LIMIT 1;
$function$;

revoke execute on function public.live_table_open(uuid) from public;
revoke execute on function public.live_table_open(uuid) from anon;
grant execute on function public.live_table_open(uuid) to authenticated;

-- Realtime: serve come campanello, non come canale di dati. Con REPLICA
-- IDENTITY predefinita l'evento porta la sola chiave primaria; le mani si
-- richiedono a live_table_view(), che rifiltra per chi chiede.
alter table public.live_tables replica identity default;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'live_tables'
  ) then
    alter publication supabase_realtime add table public.live_tables;
  end if;
end $$;
