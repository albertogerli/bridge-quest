-- ============================================================================
-- BridgeLab: le segnalazioni, con dentro il contesto
-- ============================================================================
--
-- Intervento 17 del secondo lotto.
--
-- DIPENDENZE: `instructor_portal.sql` (profiles.role, is_admin).
-- IDEMPOTENTE.
--
-- ----------------------------------------------------------------------------
-- «NON FUNZIONA» È UNA SEGNALAZIONE INUTILIZZABILE
-- ----------------------------------------------------------------------------
--
-- Allo stage di novembre useranno il portale centinaia di insegnanti poco
-- tecnici. Chiedere loro di descrivere il difetto non funziona — non perché non
-- vogliano, ma perché la descrizione che serve a chi ripara («ero sulla mano 3
-- del compito X, avevo giocato quattro carte, il pulsante non rispondeva») non
-- è quella che viene in mente a chi sta insegnando e vuole solo tornare alla
-- lezione.
--
-- Quindi si chiede una frase e si raccoglie il resto da soli.
--
-- ----------------------------------------------------------------------------
-- COSA NON SI RACCOGLIE
-- ----------------------------------------------------------------------------
--
-- Il contesto è una fotografia dello schermo di una persona, e va trattato
-- come tale. `contesto` contiene solo dati tecnici e di gioco: pagina, mano,
-- compito, classe, stato della partita, browser, risoluzione, errori di
-- console. NON contiene email, nome, o il contenuto della chat di classe.
-- L'identità sta in `user_id`, che è una chiave: chi guarda le segnalazioni è
-- amministratore e il nome lo può risalire, ma non ce l'ha davanti per caso.
--
-- Lo screenshot è un'altra cosa e ha un altro rischio: può contenere qualsiasi
-- cosa fosse sullo schermo. Sta in un bucket NON pubblico, si guarda solo con
-- un indirizzo firmato, e chi segnala lo vede prima di mandarlo — con la
-- possibilità di non mandarlo.
-- ============================================================================

create table if not exists public.segnalazioni (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  /** La frase scritta a mano. È l'unica cosa che chiediamo. */
  testo text not null,
  /** Pagina, mano, compito, classe, browser, errori: vedi sopra per i limiti. */
  contesto jsonb not null default '{}'::jsonb,
  /** Percorso nel bucket `segnalazioni`, non un indirizzo pubblico. */
  screenshot_path text,
  stato text not null default 'nuova',
  /** Le note di chi la prende in carico. */
  nota_admin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.segnalazioni
  drop constraint if exists segnalazioni_stato_check;

alter table public.segnalazioni
  add constraint segnalazioni_stato_check
  check (stato in ('nuova', 'presa-in-carico', 'risolta', 'archiviata'));

create index if not exists idx_segnalazioni_stato on public.segnalazioni (stato, created_at desc);

alter table public.segnalazioni enable row level security;

-- Chiunque sia autenticato può segnalare, ma solo a nome proprio: senza il
-- `with check` si potrebbero mandare segnalazioni a nome di un altro, e
-- l'unica informazione che rende utile una segnalazione è chi l'ha mandata.
drop policy if exists "Chiunque può segnalare" on public.segnalazioni;
create policy "Chiunque può segnalare" on public.segnalazioni
  for insert to authenticated
  with check (user_id = auth.uid());

-- Chi legge è l'amministratore. Chi segnala rivede le proprie, che serve a non
-- far mandare la stessa cosa tre volte.
drop policy if exists "Amministratori e autore leggono" on public.segnalazioni;
create policy "Amministratori e autore leggono" on public.segnalazioni
  for select to authenticated
  using (is_admin() or user_id = auth.uid());

-- Lo stato e le note li cambia solo l'amministratore: sono il registro del
-- lavoro, non della segnalazione.
drop policy if exists "Solo gli amministratori aggiornano" on public.segnalazioni;
create policy "Solo gli amministratori aggiornano" on public.segnalazioni
  for update to authenticated
  using (is_admin())
  with check (is_admin());

comment on table public.segnalazioni is
  'Segnalazioni con il contesto raccolto in automatico. Nessun dato personale in `contesto`; lo screenshot sta in un bucket privato.';
