-- ============================================================================
-- BridgeLab: chiedere alla classe
-- ============================================================================
--
-- Intervento 21 del terzo lotto.
-- DIPENDENZE: `instructor_portal.sql`. IDEMPOTENTE.
--
-- PERCHÉ SERVE. In una lezione frontale rispondono sempre i due che parlano;
-- gli altri annuiscono e l'insegnante non sa se hanno capito. Una domanda a cui
-- si risponde dal telefono la vedono tutti e rispondono tutti — e la
-- distribuzione delle risposte SBAGLIATE dice quale spiegazione è mancata, che
-- è un'informazione che a voce non si ottiene.
--
-- ANONIMO PER GLI ALLIEVI, NOMINATIVO PER L'INSEGNANTE, con lo stesso principio
-- del confronto sulle mani: sapere che in sei hanno detto 3SA serve a tutti,
-- sapere CHI serve solo a chi deve rispiegare. La distinzione sta dentro
-- `distribuzione_sondaggio`, non nel client.
--
-- I RISULTATI NON SI MOSTRANO DA SOLI: `mostra_risultati` è falso finché
-- l'insegnante non lo accende. Vederli prima di aver risposto vuol dire copiare
-- la maggioranza, che è esattamente l'opposto della domanda.
--
-- SI PUÒ CAMBIARE IDEA finché il sondaggio è aperto — la chiave primaria è
-- (sondaggio, utente) e il client fa upsert. Ripensarci fa parte del ragionare,
-- e bloccare la prima risposta trasformerebbe una domanda in un esame.
-- ============================================================================

create table if not exists public.sondaggi (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  autore_id uuid references auth.users(id) on delete set null,
  domanda text not null,
  opzioni text[] not null,
  risposta_giusta text,
  smazzata_id text,
  aperto boolean not null default true,
  mostra_risultati boolean not null default false,
  mostra_risposta boolean not null default false,
  riusabile boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_sondaggi_classe on public.sondaggi (class_id, created_at desc);
create index if not exists idx_sondaggi_riusabili on public.sondaggi (autore_id) where riusabile;

create table if not exists public.risposte_sondaggio (
  sondaggio_id uuid not null references public.sondaggi(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  risposta text not null,
  created_at timestamptz not null default now(),
  primary key (sondaggio_id, user_id)
);

alter table public.sondaggi enable row level security;
alter table public.risposte_sondaggio enable row level security;

drop policy if exists "La classe vede i sondaggi della classe" on public.sondaggi;
create policy "La classe vede i sondaggi della classe" on public.sondaggi
  for select to authenticated
  using (is_member_of_class(class_id) or is_instructor_of_class(class_id) or autore_id = auth.uid());

drop policy if exists "L'insegnante gestisce i sondaggi" on public.sondaggi;
create policy "L'insegnante gestisce i sondaggi" on public.sondaggi
  for insert to authenticated with check (is_instructor_of_class(class_id) and autore_id = auth.uid());

drop policy if exists "L'insegnante aggiorna i sondaggi" on public.sondaggi;
create policy "L'insegnante aggiorna i sondaggi" on public.sondaggi
  for update to authenticated using (is_instructor_of_class(class_id)) with check (is_instructor_of_class(class_id));

drop policy if exists "L'insegnante cancella i sondaggi" on public.sondaggi;
create policy "L'insegnante cancella i sondaggi" on public.sondaggi
  for delete to authenticated using (is_instructor_of_class(class_id));

-- Si risponde solo a un sondaggio APERTO della propria classe, e solo per sé.
drop policy if exists "Si risponde per se stessi" on public.risposte_sondaggio;
create policy "Si risponde per se stessi" on public.risposte_sondaggio
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from sondaggi s
      where s.id = sondaggio_id and s.aperto and is_member_of_class(s.class_id)
    )
  );

drop policy if exists "Si vede la propria risposta, e l'insegnante tutte" on public.risposte_sondaggio;
create policy "Si vede la propria risposta, e l'insegnante tutte" on public.risposte_sondaggio
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from sondaggi s
      where s.id = sondaggio_id and is_instructor_of_class(s.class_id)
    )
  );

create or replace function public.distribuzione_sondaggio(p_id uuid)
returns table (opzione text, quante integer, nomi text[])
language sql
stable
security definer
set search_path to 'public'
as $$
  with s as (select * from sondaggi where id = p_id),
  -- Vuota se chi chiama non è della classe: il cross join non produce righe.
  permesso as (
    select s.class_id, is_instructor_of_class(s.class_id) as sono_insegnante
    from s
    where is_member_of_class(s.class_id) or is_instructor_of_class(s.class_id)
  )
  select
    o.opzione,
    count(r.user_id)::integer,
    case when p.sono_insegnante
      then coalesce(array_agg(pr.display_name) filter (where r.user_id is not null), '{}')
      else '{}'::text[]
    end
  from s
  cross join permesso p
  cross join lateral unnest(s.opzioni) as o(opzione)
  left join risposte_sondaggio r on r.sondaggio_id = s.id and r.risposta = o.opzione
  left join profiles pr on pr.id = r.user_id
  group by o.opzione, p.sono_insegnante, array_position(s.opzioni, o.opzione)
  order by array_position(s.opzioni, o.opzione);
$$;

comment on function public.distribuzione_sondaggio(uuid) is
  'Quante risposte per opzione. I nomi solo all''insegnante: agli allievi il sondaggio resta anonimo.';

revoke all on function public.distribuzione_sondaggio(uuid) from public;
grant execute on function public.distribuzione_sondaggio(uuid) to authenticated;

comment on table public.sondaggi is
  'Domande lanciate in aula: la classe risponde dal proprio dispositivo e l''insegnante decide quando mostrare i risultati.';
