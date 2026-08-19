-- ============================================================================
-- BridgeLab: approvazione delle iscrizioni e ciclo di vita della classe
-- ============================================================================
--
-- Interventi 2 e 3 di `docs/feedback-insegnanti-piano.md`. Stanno insieme
-- perché toccano le stesse due tabelle e la stessa funzione di iscrizione:
-- separarli vorrebbe dire riscrivere `join_class_by_code` due volte.
--
-- DIPENDENZE: `instructor_portal.sql` (classes, class_members,
-- is_member_of_class, is_instructor_of_class, join_class_by_code).
--
-- IDEMPOTENTE: si può rieseguire.
--
-- ----------------------------------------------------------------------------
-- DUE BUCHI CHE SI APRONO NEL MOMENTO IN CUI «IN ATTESA» ESISTE
-- ----------------------------------------------------------------------------
--
-- Oggi non c'è nulla da aggirare: chi ha il codice entra, e basta. Aggiungere
-- `pending` senza toccare altro creerebbe due strade per approvarsi da soli, e
-- un'interfaccia che promette un controllo che non c'è è peggio del non averlo.
--
-- 1. LA POLICY DI UPDATE SU `class_members` non ha `with check`. La condizione
--    vale sulla riga vecchia, quindi l'allievo può modificare la propria riga —
--    e la può modificare come vuole, `status` compreso. Non si può togliere,
--    perché serve a lasciare la classe (`leaveClass` scrive `removed`): si
--    aggiunge il `with check` che dallo studente ammette solo l'uscita.
--
-- 2. `join_class_by_code` FA `on conflict do update set status = 'active'`.
--    Chi è stato respinto rientra ridigitando il codice e si ritrova attivo.
--    Ora chi è già stato deciso non viene toccato.
--
-- Quello che invece è GIÀ a posto, e vale la pena scriverlo perché il piano
-- temeva il contrario: `is_member_of_class` chiede `status = 'active'`, e da lì
-- passano le letture di `classes`, `assignments` e `class_messages`. Un allievo
-- in attesa non vede i contenuti nemmeno oggi. La verifica, come utente in
-- attesa vero, sta in `scripts/test-rls.mjs`.
-- ============================================================================

-- ── 1. Le iscrizioni: due stati in più ──────────────────────────────────────
--
-- `pending` = ha chiesto di entrare, l'insegnante non ha ancora deciso.
-- `rejected` = l'insegnante ha detto di no. Diverso da `removed`, che è
-- l'allievo che se ne va da solo: la differenza serve a non riproporre
-- all'insegnante una richiesta che ha già respinto, e a non lasciar rientrare
-- dalla finestra chi è stato mandato via dalla porta.
alter table public.class_members
  drop constraint if exists class_members_status_check;

alter table public.class_members
  add constraint class_members_status_check
  check (status in ('active', 'removed', 'pending', 'rejected'));

comment on column public.class_members.status is
  'active = dentro; pending = in attesa di approvazione; rejected = respinto dall''insegnante; removed = uscito da solo.';

-- ── 2. La classe: approvazione, scadenza del codice, stato ──────────────────
--
-- `approvazione_automatica` DEFAULT VERO, e non è una svista. Le diciotto
-- classi esistenti funzionano così da sempre; con il default a `false`
-- domattina nessuno entrerebbe più in nessuna classe, e l'insegnante lo
-- scoprirebbe dagli allievi che non arrivano. Chi vuole il controllo lo accende.
alter table public.classes
  add column if not exists approvazione_automatica boolean not null default true;

-- NULL = non scade, che è il comportamento di oggi.
alter table public.classes
  add column if not exists invite_expires_at timestamptz;

-- `stato` racconta la vita della classe, che `invite_active` da solo non sa
-- dire: un codice spento può voler dire «ne ho fatto uno nuovo» oppure «il
-- corso è finito», e sono due cose diverse per chi guarda l'elenco.
--
-- I due campi restano entrambi perché rispondono a domande diverse: `stato` è
-- la classe, `invite_active` è il codice. Si può avere una classe aperta con il
-- codice spento — è il caso «il codice è girato troppo, chiudo e ne faccio un
-- altro» — mentre il contrario non ha effetto: da una classe non aperta non si
-- entra comunque (vedi `join_class_by_code` più sotto).
--
-- Le classi esistenti nascono `aperta`, perché è quello che sono.
alter table public.classes
  add column if not exists stato text not null default 'aperta';

alter table public.classes
  drop constraint if exists classes_stato_check;

alter table public.classes
  add constraint classes_stato_check
  check (stato in ('bozza', 'aperta', 'chiusa', 'archiviata'));

comment on column public.classes.stato is
  'bozza = in preparazione, non si entra; aperta = si entra e si lavora; chiusa = niente nuovi iscritti, chi c''è continua; archiviata = corso finito, sola lettura. Archiviare NON cancella niente.';

comment on column public.classes.approvazione_automatica is
  'Vero = chi ha il codice entra subito (comportamento storico). Falso = l''iscrizione resta in attesa finché l''insegnante non decide.';

comment on column public.classes.invite_expires_at is
  'Quando il codice d''invito smette di funzionare. NULL = non scade.';

-- ── 3. Chi è in attesa deve poter vedere ALMENO il nome della classe ────────
--
-- Senza questo, chi si iscrive a una classe con approvazione manuale vede una
-- schermata vuota: `is_member_of_class` dice di no (giustamente), e la riga di
-- `classes` non gli arriva. Non saprebbe nemmeno per cosa sta aspettando.
--
-- Dà accesso alla riga della classe e a nient'altro: `assignments` e
-- `class_messages` continuano a passare da `is_member_of_class`, che resta
-- `active`. Il codice d'invito è dentro quella riga, ma è quello che la persona
-- ha appena digitato per arrivare fin lì.
create or replace function public.is_pending_of_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from class_members m
    where m.class_id = p_class_id
      and m.student_id = auth.uid()
      and m.status = 'pending'
  );
$$;

drop policy if exists "Instructors and members can view classes" on public.classes;
create policy "Instructors and members can view classes" on public.classes
  for select
  using (
    instructor_id = auth.uid()
    or is_member_of_class(id)
    or is_pending_of_class(id)
  );

-- ── 4. L'allievo può uscire, non può promuoversi ────────────────────────────
--
-- `using` guarda la riga com'era, `with check` come diventa. Senza il secondo,
-- «puoi modificare la tua riga» vuol dire «puoi scriverti `active`».
drop policy if exists "Instructor or self can update membership" on public.class_members;
create policy "Instructor or self can update membership" on public.class_members
  for update
  using (student_id = auth.uid() or is_instructor_of_class(class_id))
  with check (
    is_instructor_of_class(class_id)
    or (student_id = auth.uid() and status = 'removed')
  );

-- ── 5. L'iscrizione col codice ──────────────────────────────────────────────
--
-- Cambia in tre punti rispetto a prima: il codice deve essere non scaduto e la
-- classe aperta; lo stato iniziale dipende da `approvazione_automatica`; e chi
-- è già stato deciso — dentro, in attesa o respinto — non viene toccato.
--
-- Continua a restituire la riga della classe, con la stessa firma: il client
-- distingue «entrato» da «in attesa» leggendo la propria riga di
-- `class_members`, che le RLS gli lasciano vedere in entrambi i casi. Cambiare
-- il tipo di ritorno avrebbe rotto il sito nella finestra fra l'esecuzione di
-- questo script e il deploy.
create or replace function public.join_class_by_code(p_code text)
returns classes
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  c classes;
  precedente text;
  nuovo text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into c
  from classes
  where invite_code = upper(trim(p_code))
    and invite_active = true
    and stato = 'aperta'
    and (invite_expires_at is null or invite_expires_at > now());

  if c.id is null then
    raise exception 'invalid invite code' using errcode = 'P0002';
  end if;

  select status into precedente
  from class_members
  where class_id = c.id and student_id = auth.uid();

  -- Già dentro, già in attesa, o già respinto: non si cambia niente. Il
  -- rientro vale solo per chi se n'era andato da solo (`removed`).
  if precedente in ('active', 'pending', 'rejected') then
    return c;
  end if;

  nuovo := case when c.approvazione_automatica then 'active' else 'pending' end;

  insert into class_members (class_id, student_id, status)
  values (c.id, auth.uid(), nuovo)
  on conflict (class_id, student_id) do update set status = nuovo;

  return c;
end $$;

comment on function public.join_class_by_code(text) is
  'Iscrizione con il codice. Entra subito o resta in attesa secondo classes.approvazione_automatica; non riammette chi è stato respinto.';
