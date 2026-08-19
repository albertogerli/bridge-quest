-- ============================================================================
-- BridgeLab: le email dei compiti
-- ============================================================================
--
-- Intervento 7 di `docs/feedback-insegnanti-piano.md`.
--
-- DIPENDENZE: `instructor_portal.sql`, `email-automation` (email_events),
-- `assegna-lezione-2026-08.sql`.
--
-- IDEMPOTENTE: si può rieseguire.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ NON DENTRO `get_engagement_targets`
-- ----------------------------------------------------------------------------
--
-- Quella funzione sceglie IL SINGOLO MIGLIOR messaggio da mandare oggi a una
-- persona, e fa bene: è una catena di messaggi promozionali che si contendono
-- la stessa attenzione, e mandarne due lo stesso giorno è il modo più veloce
-- per farsi mettere fra la posta indesiderata.
--
-- I compiti sono un'altra cosa. Sono transazionali — nascono da un'iscrizione
-- fatta con un codice che l'insegnante ha dato di persona — e non devono
-- competere con la striscia in scadenza: se l'insegnante assegna un compito e
-- quel giorno vince «la tua striscia sta per finire», il compito non lo sa
-- nessuno. Vanno in una coda a parte, che il cron svuota per prima.
--
-- Non chiedono `marketing_consent`, per lo stesso motivo. Chi non li vuole
-- esce dalla classe.
-- ============================================================================

-- ── 1. Ogni compito, una email sola ─────────────────────────────────────────
--
-- L'indice unico che c'era vale solo per `welcome` e `onboarding_start`: senza
-- questo, il promemoria di scadenza ripartirebbe a ogni giro del cron finché
-- la scadenza non passa, cioè tutti i giorni.
--
-- La chiave è (persona, tipo, compito): un «hai un compito» e un «sta per
-- scadere» per ciascun compito, e basta.
create unique index if not exists uq_email_events_compito
  on public.email_events (user_id, email_type, (meta->>'assignment_id'))
  where email_type in ('compito_assegnato', 'compito_in_scadenza');

-- ── 2. A chi va mandato qualcosa, oggi ──────────────────────────────────────
--
-- CHI HA GIÀ FINITO NON RICEVE IL PROMEMORIA. È la regola che decide se questi
-- messaggi verranno letti: un promemoria che arriva anche a chi ha già fatto il
-- compito insegna a ignorarli tutti, e la volta che serve davvero non lo apre
-- nessuno.
--
-- «Finito» vuol dire tutte le mani del compito, con lo stesso conto che usa
-- `stato_compiti_classe`.
create or replace function public.bersagli_email_compiti(p_limit integer default 300)
returns table (
  user_id uuid,
  email text,
  display_name text,
  profile_type text,
  kind text,
  assignment_id uuid,
  class_id uuid,
  titolo text,
  classe_nome text,
  n_mani integer,
  giorni_alla_scadenza integer
)
language sql
security definer
set search_path to 'public'
as $$
  with iscritti as (
    select m.class_id, m.student_id, c.name as classe_nome
    from class_members m
    join classes c on c.id = m.class_id
    where m.status = 'active'
      -- Da una classe archiviata non arrivano più compiti: se ne arriva uno è
      -- perché qualcuno sta sistemando il passato, e non va annunciato.
      and c.stato <> 'archiviata'
  ),
  candidati as (
    select
      i.student_id,
      a.id as assignment_id,
      a.class_id,
      a.title,
      i.classe_nome,
      coalesce(array_length(a.smazzata_ids, 1), 0) as n_mani,
      a.due_date,
      a.created_at,
      (
        select count(distinct gr.details->>'smazzata_id')
        from game_results gr
        where gr.assignment_id = a.id
          and gr.user_id = i.student_id
          and gr.details->>'smazzata_id' = any (a.smazzata_ids)
      ) as fatte
    from assignments a
    join iscritti i on i.class_id = a.class_id
  ),
  scelta as (
    select c.*,
      case
        -- Appena assegnato. Tre giorni di finestra: se il cron è fermo un
        -- giorno l'avviso parte comunque, ma non si annuncia un compito di
        -- due settimane fa come se fosse nuovo.
        when c.created_at > now() - interval '3 days'
          and not exists (
            select 1 from email_events e
            where e.user_id = c.student_id
              and e.email_type = 'compito_assegnato'
              and e.meta->>'assignment_id' = c.assignment_id::text
          )
        then 'compito_assegnato'
        -- Scadenza vicina, e non l'ha finito.
        when c.due_date is not null
          and c.due_date > now()
          and c.due_date < now() + interval '2 days'
          and c.fatte < c.n_mani
          and not exists (
            select 1 from email_events e
            where e.user_id = c.student_id
              and e.email_type = 'compito_in_scadenza'
              and e.meta->>'assignment_id' = c.assignment_id::text
          )
        then 'compito_in_scadenza'
        else null
      end as kind
    from candidati c
  )
  select
    s.student_id,
    u.email,
    p.display_name,
    p.profile_type::text,
    s.kind,
    s.assignment_id,
    s.class_id,
    s.title,
    s.classe_nome,
    s.n_mani::integer,
    case when s.due_date is null then null
         else greatest(0, ceil(extract(epoch from (s.due_date - now())) / 86400))::integer
    end
  from scelta s
  join profiles p on p.id = s.student_id
  join auth.users u on u.id = s.student_id
  where s.kind is not null
    and u.email is not null
    and u.email_confirmed_at is not null
    and coalesce(u.banned_until, now() - interval '1 day') < now()
  -- Prima le scadenze: un avviso di assegnazione in ritardo di un giorno non
  -- fa danno, un promemoria di scadenza sì.
  order by case s.kind when 'compito_in_scadenza' then 0 else 1 end, s.due_date nulls last
  limit p_limit;
$$;

comment on function public.bersagli_email_compiti(integer) is
  'Chi va avvisato oggi di un compito: nuovo, o in scadenza e non finito. Transazionale: non guarda marketing_consent.';

-- Solo il service role, cioè il cron: non è roba che il client debba chiedere.
revoke all on function public.bersagli_email_compiti(integer) from public, anon, authenticated;
