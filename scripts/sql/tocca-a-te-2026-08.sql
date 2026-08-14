-- ============================================================================
-- BridgeLab: «tocca a te» — la licita a due che aspetta te da troppo tempo
-- ============================================================================
--
-- IL PROBLEMA CHE RISOLVE
-- La licita a due è asincrona a posta: dichiari quando puoi. Ma asincrono
-- senza un richiamo vuol dire che la metà delle licite muore lì — il compagno
-- ha risposto martedì, tu non sei più tornato, e nessuno dei due sa che tocca
-- a te. È il modo più banale di perdere una funzione che funziona.
--
-- È UNA EMAIL DI SERVIZIO, NON PROMOZIONALE, e per questo non chiede il
-- consenso al marketing: riguarda una partita che hai cominciato tu e una
-- persona che sta aspettando una tua risposta. Le regole di frequenza restano
-- strette: una ogni venti ore al massimo, e solo se aspetti da più di dodici.
--
-- QUANDO «ASPETTA DA»
-- Serve sapere da quando la licita è ferma, e `bidding_sessions` aveva solo
-- `created_at`. Si aggiunge `last_bid_at`, tenuta aggiornata da un trigger e
-- non dalle funzioni: le funzioni che dichiarano sono due (giocatore e
-- server), e una regola scritta due volte è una regola che prima o poi vale
-- una volta sola.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

alter table public.bidding_sessions
  add column if not exists last_bid_at timestamptz not null default now();

create or replace function public.tocca_bidding_session()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
BEGIN
  IF NEW.bids IS DISTINCT FROM OLD.bids THEN
    NEW.last_bid_at := now();
  END IF;
  RETURN NEW;
END $function$;

drop trigger if exists bidding_sessions_last_bid on public.bidding_sessions;
create trigger bidding_sessions_last_bid
  before update on public.bidding_sessions
  for each row execute function public.tocca_bidding_session();

/**
 * Le licite aperte ferme da più di `p_ore` ore che aspettano `p_user`.
 *
 * Il turno è una divisione con resto a partire dal mazziere, la stessa di
 * `bidding_session_bid`: se cambia lì deve cambiare qui, e viceversa.
 *
 * CONTA ANCHE QUANDO IL TURNO È DI UN AVVERSARIO, e non è una svista. Gli
 * avversari li fa dichiarare il server, ma qualcuno deve chiederglielo: se il
 * browser si chiude fra la dichiarazione e quella chiamata, la licita resta
 * ferma su un robot e non si sblocca da sola. L'unica cosa che la rimette in
 * moto è che una delle due persone riapra la pagina — quindi il richiamo va
 * mandato lo stesso, e va mandato a chi parlerà per primo: da Est tocca poi a
 * Sud, da Ovest a Nord.
 */
create or replace function public.licite_in_attesa(p_user uuid, p_ore int default 12)
returns int
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT count(*)::int
  FROM public.bidding_sessions s
  WHERE s.closed_at IS NULL
    AND p_user IN (s.south_id, s.north_id)
    AND s.last_bid_at < now() - (p_ore || ' hours')::interval
    AND CASE (ARRAY['north','east','south','west'])[
              ((array_position(ARRAY['north','east','south','west'], s.dealer) - 1
                + jsonb_array_length(s.bids)) % 4) + 1]
          WHEN 'east' THEN 'south' WHEN 'west' THEN 'north'
          ELSE (ARRAY['north','east','south','west'])[
                 ((array_position(ARRAY['north','east','south','west'], s.dealer) - 1
                   + jsonb_array_length(s.bids)) % 4) + 1]
        END = CASE WHEN s.south_id = p_user THEN 'south' ELSE 'north' END;
$function$;

revoke execute on function public.licite_in_attesa(uuid, int) from public;
revoke execute on function public.licite_in_attesa(uuid, int) from anon;
grant execute on function public.licite_in_attesa(uuid, int) to authenticated, service_role;

/**
 * `get_engagement_targets` con in cima il richiamo «tocca a te».
 *
 * PRECEDE TUTTO IL RESTO perché è l'unica di queste email che riguarda una
 * persona in carne e ossa che sta aspettando: rimandarla per mandare prima un
 * invito a salvare la striscia sarebbe il contrario del buon senso.
 *
 * NON CHIEDE `consent`: non è promozione, è il servizio che hai chiesto tu
 * aprendo una licita. Tutte le altre righe restano subordinate al consenso
 * come prima.
 */
create or replace function public.get_engagement_targets(p_limit integer default 300)
returns table(user_id uuid, email text, display_name text, profile_type text, kind text, ctx jsonb)
language sql
security definer
set search_path to 'public'
as $function$
  WITH ferme AS (
    -- Chi ha licite aperte che aspettano lui, contate in un colpo solo: una
    -- chiamata a `licite_in_attesa` per ciascuno dei tremila iscritti sarebbe
    -- una scansione delle sessioni per ogni riga.
    SELECT x.chi AS user_id, count(*) AS n
    FROM (
      -- Da Est tocca poi a Sud, da Ovest a Nord: si scrive a chi parlerà.
      SELECT CASE WHEN t.turno IN ('south','east') THEN s.south_id ELSE s.north_id END AS chi
      FROM public.bidding_sessions s,
           LATERAL (SELECT (ARRAY['north','east','south','west'])[
                      ((array_position(ARRAY['north','east','south','west'], s.dealer) - 1
                        + jsonb_array_length(s.bids)) % 4) + 1] AS turno) t
      WHERE s.closed_at IS NULL
        AND s.last_bid_at < now() - interval '12 hours'
    ) x
    GROUP BY x.chi
  ),
  base AS (
    SELECT
      p.id,
      u.email,
      p.display_name,
      p.profile_type::text                              AS profile_type,
      p.created_at,
      p.last_login,
      COALESCE(p.streak, 0)                             AS streak,
      COALESCE(p.marketing_consent, false)              AS consent,
      (SELECT count(*) FROM public.completed_modules cm WHERE cm.user_id = p.id) AS modules_done,
      COALESCE(f.n, 0)                                  AS licite_ferme
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    LEFT JOIN ferme f ON f.user_id = p.id
    WHERE u.email IS NOT NULL
      AND u.email_confirmed_at IS NOT NULL
      AND COALESCE(u.banned_until, now() - interval '1 day') < now()
  ),
  scored AS (
    SELECT b.*,
      CASE
        -- (0) Tocca a te: una licita aperta aspetta te da più di 12 ore.
        WHEN b.licite_ferme > 0
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'turno_licita'
                               AND e.sent_at > now() - interval '20 hours')
          THEN 'turno_licita'
        -- (1) Streak at risk: had a real streak, active YESTERDAY but not today.
        WHEN b.consent
             AND b.streak >= 3
             AND b.last_login IS NOT NULL
             AND (b.last_login AT TIME ZONE 'Europe/Rome')::date
                   = (now() AT TIME ZONE 'Europe/Rome')::date - 1
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'streak_risk'
                               AND e.sent_at > now() - interval '20 hours')
          THEN 'streak_risk'
        -- (2) Onboarding: signed up 1-5 days ago, barely started, never nudged.
        WHEN b.consent
             AND b.created_at < now() - interval '20 hours'
             AND b.created_at > now() - interval '5 days'
             AND b.modules_done < 2
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'onboarding_start')
          THEN 'onboarding_start'
        -- (3) Inactive ~14 days.
        WHEN b.consent
             AND b.last_login IS NOT NULL
             AND b.last_login < now() - interval '14 days'
             AND b.last_login > now() - interval '45 days'
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'inactive_14'
                               AND e.sent_at > now() - interval '30 days')
          THEN 'inactive_14'
        -- (4) Inactive ~7 days.
        WHEN b.consent
             AND b.last_login IS NOT NULL
             AND b.last_login < now() - interval '7 days'
             AND b.last_login > now() - interval '14 days'
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'inactive_7'
                               AND e.sent_at > now() - interval '20 days')
          THEN 'inactive_7'
        ELSE NULL
      END AS kind
    FROM base b
  )
  SELECT
    id AS user_id,
    email,
    display_name,
    profile_type,
    kind,
    jsonb_build_object(
      'streak', streak,
      'modules_done', modules_done,
      'licite_ferme', licite_ferme,
      'days_inactive',
        CASE WHEN last_login IS NOT NULL
             THEN GREATEST(0, (EXTRACT(EPOCH FROM (now() - last_login)) / 86400)::int)
             ELSE NULL END
    ) AS ctx
  FROM scored
  WHERE kind IS NOT NULL
  ORDER BY
    CASE kind
      WHEN 'turno_licita' THEN 0
      WHEN 'streak_risk' THEN 1
      WHEN 'onboarding_start' THEN 2
      WHEN 'inactive_14' THEN 3
      WHEN 'inactive_7' THEN 4
      ELSE 5
    END
  LIMIT p_limit;
$function$;

-- Le stesse restrizioni di prima: la funzione restituisce email, e resta
-- eseguibile solo dal service_role (vedi engagement-targets-leak-2026-08.sql).
revoke all on function public.get_engagement_targets(integer) from public, anon, authenticated;
grant execute on function public.get_engagement_targets(integer) to service_role;
