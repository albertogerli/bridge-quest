-- ============================================================================
-- Segnalare e bloccare: forum e chat di classe
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- DIPENDENZE: `instructor_portal.sql` (is_admin, is_instructor_of_class),
--             `class_chat.sql`, le tabelle del forum.
-- IDEMPOTENTE. Rollback: `moderazione-contenuti-2026-11-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Google Play (questionario IARC, 07/11/2026) chiede se chi usa l'app può
-- segnalare e bloccare altri utenti e se la chat è moderata. Il forum era
-- aperto a tutti gli iscritti senza nessuna delle tre cose: un messaggio
-- offensivo lo poteva togliere solo chi l'aveva scritto.
--
-- `segnalazioni` (2026-08) resta per i difetti dell'app: una segnalazione di
-- un contenuto ha un'altra coda, un altro destinatario e un'altra urgenza.
--
-- ----------------------------------------------------------------------------
-- COSA SI CONSERVA
--
-- `testo` è una copia del contenuto al momento della segnalazione: chi lo ha
-- scritto può cancellarlo subito dopo, e chi modera deve poter vedere cosa è
-- stato segnalato. La copia sparisce con la segnalazione; le segnalazioni
-- scollegate (autore cancellato) restano senza autore.
-- ============================================================================

begin;

create table if not exists public.segnalazioni_contenuti (
  id uuid primary key default gen_random_uuid(),
  segnalato_da uuid references auth.users(id) on delete set null default auth.uid(),
  tipo text not null,
  /** L'id del post, del commento o del messaggio, come testo: i tipi di chiave sono diversi. */
  contenuto_id text not null,
  /** Per i messaggi di classe: dove sta, così chi modera ci arriva. Per il forum: il post. */
  contenitore_id text,
  autore_id uuid references auth.users(id) on delete set null,
  testo text not null,
  motivo text not null,
  nota text,
  stato text not null default 'nuova',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.segnalazioni_contenuti drop constraint if exists segnalazioni_contenuti_tipo_check;
alter table public.segnalazioni_contenuti add constraint segnalazioni_contenuti_tipo_check
  check (tipo in ('forum_post', 'forum_commento', 'messaggio_classe'));
alter table public.segnalazioni_contenuti drop constraint if exists segnalazioni_contenuti_motivo_check;
alter table public.segnalazioni_contenuti add constraint segnalazioni_contenuti_motivo_check
  check (motivo in ('offensivo', 'spam', 'inappropriato', 'altro'));
alter table public.segnalazioni_contenuti drop constraint if exists segnalazioni_contenuti_stato_check;
alter table public.segnalazioni_contenuti add constraint segnalazioni_contenuti_stato_check
  check (stato in ('nuova', 'rimosso', 'nessuna-azione'));
alter table public.segnalazioni_contenuti drop constraint if exists segnalazioni_contenuti_lunghezze_check;
alter table public.segnalazioni_contenuti add constraint segnalazioni_contenuti_lunghezze_check
  check (char_length(testo) <= 20000 and char_length(coalesce(nota, '')) <= 1000);

create index if not exists idx_segnalazioni_contenuti_stato
  on public.segnalazioni_contenuti (stato, created_at desc);

alter table public.segnalazioni_contenuti enable row level security;

-- Chi segnala scrive solo a nome proprio e non rilegge: l'elenco delle
-- segnalazioni non è cosa da allievi.
drop policy if exists "Chi è iscritto segnala" on public.segnalazioni_contenuti;
create policy "Chi è iscritto segnala"
  on public.segnalazioni_contenuti
  for insert
  to authenticated
  with check (segnalato_da = (select auth.uid()) and stato = 'nuova');

drop policy if exists "L'amministratore legge le segnalazioni" on public.segnalazioni_contenuti;
create policy "L'amministratore legge le segnalazioni"
  on public.segnalazioni_contenuti
  for select
  to authenticated
  using (is_admin());

drop policy if exists "L'amministratore chiude le segnalazioni" on public.segnalazioni_contenuti;
create policy "L'amministratore chiude le segnalazioni"
  on public.segnalazioni_contenuti
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

revoke all on table public.segnalazioni_contenuti from anon;
grant select, insert, update on table public.segnalazioni_contenuti to authenticated;

-- ----------------------------------------------------------------------------
-- Utenti bloccati: chi blocca smette di vedere i post, i commenti e i messaggi
-- dell'altro. L'altro non lo sa, e la riga la legge solo chi l'ha creata.
-- ----------------------------------------------------------------------------

create table if not exists public.utenti_bloccati (
  utente_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  bloccato_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (utente_id, bloccato_id)
);

alter table public.utenti_bloccati drop constraint if exists utenti_bloccati_non_se_stessi;
alter table public.utenti_bloccati add constraint utenti_bloccati_non_se_stessi
  check (utente_id <> bloccato_id);

alter table public.utenti_bloccati enable row level security;

drop policy if exists "Ognuno gestisce i suoi blocchi" on public.utenti_bloccati;
create policy "Ognuno gestisce i suoi blocchi"
  on public.utenti_bloccati
  for all
  to authenticated
  using (utente_id = (select auth.uid()))
  with check (utente_id = (select auth.uid()));

revoke all on table public.utenti_bloccati from anon;
grant select, insert, delete on table public.utenti_bloccati to authenticated;

-- ----------------------------------------------------------------------------
-- L'amministratore toglie ciò che viene segnalato. Nella chat di classe
-- l'insegnante poteva già cancellare (class_chat.sql); il forum no.
-- ----------------------------------------------------------------------------

drop policy if exists "L'amministratore modera i post" on public.forum_posts;
create policy "L'amministratore modera i post"
  on public.forum_posts
  for delete
  to authenticated
  using (is_admin());

drop policy if exists "L'amministratore modera i commenti" on public.forum_comments;
create policy "L'amministratore modera i commenti"
  on public.forum_comments
  for delete
  to authenticated
  using (is_admin());

drop policy if exists "L'amministratore modera la chat" on public.class_messages;
create policy "L'amministratore modera la chat"
  on public.class_messages
  for delete
  to authenticated
  using (is_admin());

insert into public.script_applicati (nome) values ('moderazione-contenuti-2026-11.sql')
on conflict (nome) do nothing;

commit;
