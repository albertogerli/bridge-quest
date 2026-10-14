-- ============================================================================
-- I materiali di ogni lezione, e l'insegnante che decide quando escono
--
-- ESEGUIRE A MANO su Supabase → SQL Editor. Non ci sono migrazioni automatiche.
-- IDEMPOTENTE: si può rieseguire senza danni.
-- Dipendenze: `classes`, `class_members` e le funzioni `is_instructor_of_class`,
-- `is_member_of_class`, `is_admin` (già nel baseline); `script_applicati`
-- (registro-script-2026-10.sql).
--
-- Rollback: `materiali-lezione-2026-10-rollback.sql`, nella stessa cartella.
-- DOPO l'esecuzione: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Richiesta di Giuseppe Trevissoi del 14/10/2026. Dopo ogni lezione
-- l'insegnante manda alla classe, in quest'ordine: il link alla videolezione,
-- quello alla dispensa da leggere o stampare, quello all'esercizio. Ma non ogni
-- lezione li ha tutti e tre, di uno stesso tipo possono essercene due, e
-- soprattutto è l'insegnante a decidere SE e QUANDO ciascuno esce: la dispensa
-- della lezione 4 non deve arrivare prima della lezione 4.
--
-- Finora l'unica cosa che si poteva «rilasciare» era un compito, ed era
-- visibile nell'istante in cui lo si creava. Qui ogni materiale ha la sua data.
--
-- `pubblica_dal` HA TRE SIGNIFICATI, e sono tutti voluti:
--   · null          → nascosto: preparato, ma l'allievo non lo vede;
--   · <= now()      → pubblicato;
--   · nel futuro    → programmato: esce da solo a quell'ora, senza che
--                     l'insegnante debba ricordarsi di tornare a premere.
-- La regola sta nella policy, non nell'applicazione: un allievo che interroga
-- la tabella a mano non vede la dispensa della settimana prossima.
--
-- NON È `link_video`. Quella colonna, su classi e compiti, è la stanza Zoom o
-- Meet dove si fa la lezione; qui c'è la lezione REGISTRATA da riguardare.
-- ============================================================================

begin;

create table if not exists public.materiali_lezione (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references public.classes(id) on delete cascade,
  -- La lezione del catalogo, quando il materiale ne fa parte. Testo e non
  -- intero: un insegnante può anche preparare materiali per lezioni sue, che
  -- nel catalogo non esistono, e allora resta vuoto.
  lesson_id    text,
  -- L'etichetta che vede l'allievo, ed è anche ciò che raggruppa: «Lezione 3 –
  -- Il piano di gioco». Scritta per esteso perché deve reggersi da sola.
  lezione      text not null,
  tipo         text not null,
  titolo       text not null,
  url          text not null,
  ordine       int not null default 0,
  pubblica_dal timestamptz,
  created_at   timestamptz not null default now(),

  constraint materiali_lezione_tipo
    check (tipo in ('video', 'dispensa', 'esercizio')),
  constraint materiali_lezione_testi
    check (
      char_length(btrim(lezione)) between 1 and 200
      and char_length(btrim(titolo)) between 1 and 200
    ),
  -- Solo indirizzi web veri o percorsi interni al sito. Il vincolo esiste
  -- perché l'allievo tocca questo link senza pensarci: un `javascript:` o un
  -- `//altro-sito` qui dentro arriverebbe a tutta la classe con la firma
  -- dell'insegnante. Il percorso interno comincia con UNA sola barra: con due
  -- il browser lo legge come un sito esterno.
  constraint materiali_lezione_url
    check (
      char_length(url) <= 2000
      and (
        url ~* '^https?://[^[:space:]]+$'
        or url ~ '^/([^/[:space:]][^[:space:]]*)?$'
      )
    )
);

-- La lettura tipica è «i materiali di questa classe, lezione per lezione».
create index if not exists materiali_lezione_per_classe
  on public.materiali_lezione (class_id, lezione);

alter table public.materiali_lezione enable row level security;

-- Niente agli anonimi: sono materiali di una classe, non del sito.
revoke all on table public.materiali_lezione from anon, authenticated;
grant select, insert, update, delete on table public.materiali_lezione to authenticated;

-- L'insegnante della classe prepara, pubblica, programma, nasconde e cancella.
-- Gli amministratori anche: è il modo di rimediare quando un insegnante chiede
-- aiuto, senza dover passare dal SQL Editor.
drop policy if exists "L'insegnante gestisce i materiali della sua classe" on public.materiali_lezione;
create policy "L'insegnante gestisce i materiali della sua classe"
  on public.materiali_lezione for all
  to authenticated
  using (public.is_instructor_of_class(class_id) or public.is_admin())
  with check (public.is_instructor_of_class(class_id) or public.is_admin());

-- L'allievo ATTIVO vede solo ciò che è già uscito. Chi è in attesa o respinto
-- no: `is_member_of_class` controlla `status = 'active'`. E il confronto con
-- `now()` è ciò che fa uscire da solo un materiale programmato, senza un
-- processo che lo «accenda» all'ora giusta.
drop policy if exists "L'allievo vede i materiali già pubblicati" on public.materiali_lezione;
create policy "L'allievo vede i materiali già pubblicati"
  on public.materiali_lezione for select
  to authenticated
  using (
    public.is_member_of_class(class_id)
    and pubblica_dal is not null
    and pubblica_dal <= now()
  );

comment on table public.materiali_lezione is
  'Videolezioni, dispense ed esercizi che l''insegnante manda alla classe dopo '
  'ogni lezione. `pubblica_dal`: null = nascosto, passato = pubblicato, '
  'futuro = programmato. L''allievo attivo vede solo i pubblicati (RLS).';
comment on column public.materiali_lezione.pubblica_dal is
  'Null = nascosto. Da questo istante l''allievo lo vede. Nel futuro = '
  'programmato: esce da solo, lo decide la policy confrontando con now().';
comment on column public.materiali_lezione.url is
  'Indirizzo http(s) o percorso interno che comincia con una sola barra.';

insert into public.script_applicati (nome) values ('materiali-lezione-2026-10.sql')
on conflict (nome) do nothing;

commit;

-- ============================================================================
-- VERIFICA (dopo l'esecuzione)
--
--   select count(*) from public.materiali_lezione;            -- 0, la tabella c'è
--   select policyname, cmd from pg_policies
--    where tablename = 'materiali_lezione';                    -- due policy
--
--   -- Il vincolo sull'indirizzo rifiuta questi (devono dare errore 23514):
--   --   insert ... url = 'javascript:alert(1)'
--   --   insert ... url = '//altro-sito.example'
--
-- Poi: node scripts/dump-schema.mjs   e committare 000-schema-baseline.sql
-- ============================================================================
