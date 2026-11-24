-- ============================================================================
-- BridgeLab: i corsi di bridge, caricati da chi li organizza e approvati
-- ============================================================================
--
-- 24/11/2026. Pagina pubblica /corsi: corsi Bridge 5.0 e tradizionali, i più
-- vicini per primi. Chiunque abbia un account carica un corso; lo pubblica solo
-- l'amministratore.
--
-- DIPENDENZE: `instructor_portal.sql` (is_admin), `asd_clubs` (elenco FIGB).
-- IDEMPOTENTE: si può rieseguire.
--
-- ----------------------------------------------------------------------------
-- CHI VEDE COSA
-- ----------------------------------------------------------------------------
--
-- La pagina pubblica NON legge questa tabella con la chiave anonima. La legge
-- il server, colonna per colonna, e solo i corsi `pubblicato`: così chi ha
-- caricato (`user_id`), il consenso e i messaggi dell'amministratore non
-- arrivano mai al browser di uno sconosciuto. Per questo qui non c'è nessuna
-- policy per `anon`.
--
-- Locandine e programmi stanno nel bucket privato `corsi`: un file caricato e
-- poi rifiutato non deve avere un indirizzo pubblico. La pagina pubblica chiede
-- al momento un indirizzo firmato, e solo per i corsi pubblicati.
--
-- ----------------------------------------------------------------------------
-- UNA MODIFICA NON TOGLIE IL CORSO DALLA PAGINA
-- ----------------------------------------------------------------------------
--
-- Un corso pubblicato non si modifica sul posto: chi lo corregge manda una
-- versione nuova con `sostituisce` = id del vecchio. Il vecchio resta online
-- finché la versione nuova non è approvata; all'approvazione diventa
-- `sostituito`. Altrimenti un refuso corretto il venerdì sera farebbe sparire
-- il corso per tutto il fine settimana.
-- ============================================================================

create table if not exists public.corsi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stato text not null default 'in-attesa',
  tipo text not null,
  asd_code text not null,
  livello text not null,
  maestro text not null,
  prima_lezione date not null,
  /** [{ "giorno": "lunedì", "dalle": "18:00", "alle": "20:00" }, …] */
  orari jsonb not null default '[]'::jsonb,
  telefono text not null,
  email text,
  whatsapp boolean not null default false,
  /** Percorso nel bucket `corsi`. */
  locandina_path text,
  programma text,
  /** Percorso nel bucket `corsi` di un programma in PDF. */
  programma_path text,
  costo text,
  note text,
  /** Chi carica conferma di poter pubblicare telefono e nome del maestro. */
  consenso boolean not null,
  /** Calcolato dal server all'invio: chi carica ha una classe su BridgeLab. */
  ha_classe_bridgelab boolean not null default false,
  messaggio_admin text,
  sostituisce uuid references public.corsi(id) on delete set null,
  approvato_il timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.corsi drop constraint if exists corsi_stato_check;
alter table public.corsi add constraint corsi_stato_check
  check (stato in ('in-attesa', 'pubblicato', 'da-modificare', 'rifiutato', 'sostituito', 'ritirato'));

alter table public.corsi drop constraint if exists corsi_tipo_check;
alter table public.corsi add constraint corsi_tipo_check
  check (tipo in ('bridge-5', 'tradizionale'));

alter table public.corsi drop constraint if exists corsi_livello_check;
alter table public.corsi add constraint corsi_livello_check
  check (livello in ('principianti', 'secondo-anno', 'perfezionamento', 'lezione-di-prova'));

alter table public.corsi drop constraint if exists corsi_consenso_check;
alter table public.corsi add constraint corsi_consenso_check check (consenso);

alter table public.corsi drop constraint if exists corsi_lunghezze_check;
alter table public.corsi add constraint corsi_lunghezze_check check (
  length(maestro) <= 120 and length(telefono) <= 40
  and coalesce(length(email), 0) <= 200
  and coalesce(length(programma), 0) <= 6000
  and coalesce(length(costo), 0) <= 300
  and coalesce(length(note), 0) <= 1500
  and coalesce(length(messaggio_admin), 0) <= 2000
  and jsonb_typeof(orari) = 'array' and jsonb_array_length(orari) <= 10
);

create index if not exists idx_corsi_stato on public.corsi (stato, prima_lezione);
create index if not exists idx_corsi_utente on public.corsi (user_id, created_at desc);

alter table public.corsi enable row level security;

-- Si carica solo a nome proprio e solo «in attesa»: senza il `with check`
-- chiunque potrebbe inserire un corso già pubblicato.
drop policy if exists "Chi ha un account propone un corso" on public.corsi;
create policy "Chi ha un account propone un corso" on public.corsi
  for insert to authenticated
  with check (user_id = auth.uid() and stato = 'in-attesa' and messaggio_admin is null
              and approvato_il is null and ha_classe_bridgelab = false);

drop policy if exists "Autore e amministratori leggono" on public.corsi;
create policy "Autore e amministratori leggono" on public.corsi
  for select to authenticated
  using (is_admin() or user_id = auth.uid());

-- Lo stato lo cambia solo l'amministratore (dal server, con la chiave di
-- servizio, che passa sopra a RLS; la policy copre anche il pannello).
drop policy if exists "Solo gli amministratori aggiornano" on public.corsi;
create policy "Solo gli amministratori aggiornano" on public.corsi
  for update to authenticated
  using (is_admin())
  with check (is_admin());

comment on table public.corsi is
  'Corsi di bridge proposti dagli utenti e approvati dall''amministratore. La pagina pubblica li legge dal server, mai con la chiave anonima.';

-- ----------------------------------------------------------------------------
-- Bucket privato per locandine e programmi
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('corsi', 'corsi', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- La cartella è l'id di chi carica.
drop policy if exists "corsi: carica nella propria cartella" on storage.objects;
create policy "corsi: carica nella propria cartella" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'corsi' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "corsi: autore e amministratori leggono" on storage.objects;
create policy "corsi: autore e amministratori leggono" on storage.objects
  for select to authenticated
  using (bucket_id = 'corsi' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- Registro (vedi registro-script-2026-10.sql).
insert into public.script_applicati (nome) values ('corsi-2026-11.sql')
on conflict (nome) do nothing;
