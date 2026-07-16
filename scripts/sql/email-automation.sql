-- ============================================================================
-- BridgeLab: Email automation & re-engagement
-- Run this SQL on Supabase Dashboard -> SQL Editor
--
-- Creates:
--   1. profiles.marketing_consent columns (idempotent; may already exist)
--   2. email_events table (records every email we send -> idempotency / anti-spam)
--   3. RLS: users read their own events, only service role writes
--   4. get_engagement_targets() RPC: returns, per eligible user, the SINGLE
--      best email to send today (priority order), with email + context.
--
-- The cron endpoint (/api/cron/engagement) calls the RPC with the service role,
-- sends each email via Resend, then inserts an email_events row so the same
-- drip is never sent twice.
-- ============================================================================

-- 1. Marketing consent (safe if a prior migration already added these) --------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_consent_date timestamptz;

-- 2. email_events table -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_type text NOT NULL,             -- welcome | onboarding_start | inactive_7 | inactive_14 | streak_risk | unsubscribe
  sent_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_events_user_type
  ON public.email_events (user_id, email_type, sent_at DESC);

-- One-shot emails (welcome, onboarding_start) must never be sent twice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_events_oneshot
  ON public.email_events (user_id, email_type)
  WHERE email_type IN ('welcome', 'onboarding_start');

-- 3. RLS ----------------------------------------------------------------------
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own email events" ON public.email_events;
CREATE POLICY "Users read own email events"
  ON public.email_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
-- No INSERT/UPDATE policy: only the service role (cron) writes, and it bypasses RLS.

-- 4. get_engagement_targets() -------------------------------------------------
-- Returns at most one row per user: the highest-priority email they qualify
-- for today. All marketing emails require marketing_consent = true. Welcome is
-- transactional and handled separately (auth callback), not here.
CREATE OR REPLACE FUNCTION public.get_engagement_targets(p_limit int DEFAULT 300)
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  profile_type text,
  kind text,
  ctx jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id,
      u.email,
      p.display_name,
      p.profile_type::text                              AS profile_type,
      p.created_at,
      p.last_login,
      COALESCE(p.streak, 0)                             AS streak,
      COALESCE(p.marketing_consent, false)              AS consent,
      (SELECT count(*) FROM public.completed_modules cm WHERE cm.user_id = p.id) AS modules_done
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email IS NOT NULL
      AND u.email_confirmed_at IS NOT NULL
      AND COALESCE(u.banned_until, now() - interval '1 day') < now()
  ),
  scored AS (
    SELECT b.*,
      CASE
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
      'days_inactive',
        CASE WHEN last_login IS NOT NULL
             THEN GREATEST(0, (EXTRACT(EPOCH FROM (now() - last_login)) / 86400)::int)
             ELSE NULL END
    ) AS ctx
  FROM scored
  WHERE kind IS NOT NULL
  ORDER BY
    CASE kind
      WHEN 'streak_risk' THEN 1
      WHEN 'onboarding_start' THEN 2
      WHEN 'inactive_14' THEN 3
      WHEN 'inactive_7' THEN 4
      ELSE 5
    END
  LIMIT p_limit;
$$;

-- Lock the function down: only the service role may call it.
REVOKE ALL ON FUNCTION public.get_engagement_targets(int) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_engagement_targets(int) TO service_role;

-- Done. Grant the service role is implicit (bypasses RLS). Test with:
--   SELECT * FROM public.get_engagement_targets(50);
