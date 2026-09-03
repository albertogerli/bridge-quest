-- ============================================================================
-- Presenze con la data, e le date che mancano a classi e iscrizioni
--
-- ESEGUIRE A MANO su Supabase → SQL Editor. Non ci sono migrazioni automatiche.
-- Dipendenze: nessuna oltre allo schema attuale (classes, class_members,
-- elenco_allievi, profiles).
--
-- Rollback: `presenze-e-date-2026-09-rollback.sql`, nella stessa cartella.
-- DOPO l'esecuzione: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ ADESSO, E NON QUANDO SERVIRÀ
--
-- Il metodo Bridge 5.0 prevede una telefonata dopo due assenze consecutive.
-- Quella vista oggi NON è costruibile: `elenco_allievi.presente` è un booleano
-- «presente adesso» che si sovrascrive a ogni lezione. Non c'è storia.
--
-- È un dato che non si recupera. Ogni lezione che passa senza registrarla è
-- persa per sempre — nessun calcolo la ricostruisce dopo. Lo stesso vale per
-- «quando un allievo ha smesso» e per «quanto è durato il corso»: oggi si sa
-- che qualcuno è uscito, non quando; e una classe non ha né inizio né fine.
--
-- Per questo è la PRIMA modifica di schema di tutto il lavoro sul feedback
-- degli insegnanti: fin qui bastava un `git revert`, e non è più così.
-- Il rollback qui accanto esiste apposta.
--
-- COSA NON FA. Non tocca `elenco_allievi.presente`, che continua a servire per
-- la lezione in corso: è la spunta che l'insegnante mette mentre la gente
-- arriva. Questa tabella è il registro, quello è l'appello di oggi.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1 · Le presenze, una riga per persona e per giorno
--
-- DUE POPOLAZIONI, e servono entrambe. In aula ci sono gli iscritti con un
-- account (`class_members`) e le persone dell'elenco caricato dal CSV
-- (`elenco_allievi`), che un account non ce l'hanno — sono la maggioranza ai
-- corsi di primo livello. Registrare solo i primi vorrebbe dire un registro
-- vuoto proprio nelle classi dove serve.
--
-- Esattamente uno dei due riferimenti dev'essere valorizzato: il vincolo lo
-- impone, così non nascono righe che non si sa a chi appartengono.
-- ----------------------------------------------------------------------------
create table if not exists public.presenze (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes(id) on delete cascade,
  -- L'allievo con un account…
  student_id    uuid references auth.users(id) on delete cascade,
  -- …oppure la persona dell'elenco caricato, che l'account non ce l'ha.
  elenco_id     uuid references public.elenco_allievi(id) on delete cascade,
  data          date not null,
  presente      boolean not null,
  -- Chi ha fatto l'appello: serve a distinguere una lezione non registrata da
  -- una registrata con tutti assenti. Senza, le due si confondono.
  registrata_da uuid not null references auth.users(id),
  nota          text,
  created_at    timestamptz not null default now(),

  constraint presenze_una_sola_persona
    check ((student_id is not null) <> (elenco_id is not null))
);

-- Una sola riga per persona e giorno: rifare l'appello CORREGGE, non aggiunge.
-- Sono indici parziali distinti perché uno dei due riferimenti è sempre nullo,
-- e in SQL due NULL non sono uguali fra loro: un indice unico su tutte e tre
-- le colonne lascerebbe passare i doppioni.
create unique index if not exists presenze_una_per_iscritto_e_giorno
  on public.presenze (class_id, student_id, data) where student_id is not null;

create unique index if not exists presenze_una_per_elenco_e_giorno
  on public.presenze (class_id, elenco_id, data) where elenco_id is not null;

-- La lettura tipica è «questa classe, ultime lezioni»: l'indice segue quella.
create index if not exists presenze_per_classe_e_data
  on public.presenze (class_id, data desc);

alter table public.presenze enable row level security;

-- L'insegnante della classe fa e legge l'appello.
drop policy if exists "L'insegnante gestisce le presenze della sua classe" on public.presenze;
create policy "L'insegnante gestisce le presenze della sua classe"
  on public.presenze for all
  using (public.is_instructor_of_class(class_id))
  with check (public.is_instructor_of_class(class_id) and registrata_da = auth.uid());

-- L'allievo vede SOLO le proprie. Le assenze dei compagni non sono affari suoi:
-- in una classe di quindici persone che si conoscono, chi manca e quando è
-- un'informazione personale.
drop policy if exists "L'allievo vede solo le proprie presenze" on public.presenze;
create policy "L'allievo vede solo le proprie presenze"
  on public.presenze for select
  using (student_id = auth.uid());

comment on table public.presenze is
  'Registro delle presenze, una riga per persona e giorno. Diverso da '
  '`elenco_allievi.presente`, che è la spunta della lezione in corso e si '
  'sovrascrive. Serve alla vista «chi non si vede da due lezioni», che il '
  'metodo Bridge 5.0 usa per decidere chi richiamare.';

-- ----------------------------------------------------------------------------
-- 2 · Quando un allievo ha smesso
--
-- `class_members.status` cambia da `active` a `removed` o `rejected` senza
-- lasciare una data: si sa che è uscito, non quando. Per «quanti abbandonano
-- dopo la terza lezione» quella data è tutto.
-- ----------------------------------------------------------------------------
alter table public.class_members
  add column if not exists uscito_il timestamptz;

comment on column public.class_members.uscito_il is
  'Quando lo stato è passato via da `active`. Lo scrive un trigger: se lo si '
  'lasciasse all''applicazione, basterebbe un punto che aggiorna lo stato '
  'senza saperlo e il dato sparirebbe in silenzio.';

-- Il trigger, e non l'applicazione, perché lo stato si cambia da più punti —
-- l'approvazione singola, quella in blocco, la rimozione — e ne basta uno
-- distratto per perdere il dato. Qui è impossibile dimenticarlo.
create or replace function public.segna_uscita_da_classe()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'active' and new.status <> 'active' then
      new.uscito_il := now();
    elsif new.status = 'active' then
      -- È rientrato: la data di uscita non vale più. Tenerla farebbe contare
      -- come abbandono chi è tornato.
      new.uscito_il := null;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists class_members_segna_uscita on public.class_members;
create trigger class_members_segna_uscita
  before update on public.class_members
  for each row execute function public.segna_uscita_da_classe();

-- ----------------------------------------------------------------------------
-- 3 · Inizio e fine del corso
--
-- `classes.created_at` dice quando la classe è stata creata nel portale, che
-- non è quando è cominciato il corso: un insegnante la prepara a settembre per
-- partire a ottobre. Senza le due date non si può dire quanto è durato un
-- corso né confrontare corsi diversi.
--
-- Restano facoltative: chi non le compila non deve essere bloccato, e una
-- data sbagliata è peggio di una data assente.
-- ----------------------------------------------------------------------------
alter table public.classes
  add column if not exists inizio_corso date,
  add column if not exists fine_corso   date;

alter table public.classes
  drop constraint if exists classes_periodo_coerente;
alter table public.classes
  add constraint classes_periodo_coerente
  check (fine_corso is null or inizio_corso is null or fine_corso >= inizio_corso);

comment on column public.classes.inizio_corso is
  'Prima lezione. Diversa da `created_at`, che è quando la classe è stata '
  'creata nel portale.';
comment on column public.classes.fine_corso is
  'Ultima lezione prevista o svolta. Facoltativa.';

commit;

-- ============================================================================
-- VERIFICA (dopo l'esecuzione)
--
--   select count(*) from public.presenze;                    -- 0, la tabella c'è
--   select uscito_il from public.class_members limit 1;      -- la colonna c'è
--   select inizio_corso, fine_corso from public.classes limit 1;
--
--   -- il trigger funziona: su una riga di prova, non in produzione
--   -- update class_members set status='removed' where ... ; select uscito_il ...
--
-- Poi: node scripts/dump-schema.mjs   e committare 000-schema-baseline.sql
-- ============================================================================
