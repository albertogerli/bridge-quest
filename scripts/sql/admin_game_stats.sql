-- ============================================================================
-- BridgeLab: admin game stats (section "Statistiche giochi" on /admin)
-- Aggregates game_results across ALL users: totals, per-game breakdown and
-- a 30-day daily trend. is_admin-guarded (see instructor_requests.sql).
-- Run on Supabase Dashboard -> SQL Editor (idempotent).
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_game_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_totals  jsonb;
  v_by_game jsonb;
  v_daily   jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  -- Overall counters
  SELECT jsonb_build_object(
    'plays',       count(*),
    'playsToday',  count(*) FILTER (WHERE created_at >= date_trunc('day', now())),
    'plays7d',     count(*) FILTER (WHERE created_at >= now() - interval '7 days'),
    'players',     count(DISTINCT user_id),
    'players7d',   count(DISTINCT user_id) FILTER (WHERE created_at >= now() - interval '7 days')
  ) INTO v_totals
  FROM game_results;

  -- Per game type, most played first
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'game',       g.game_type,
    'plays',      g.plays,
    'plays7d',    g.plays7d,
    'players',    g.players,
    'avgScore',   g.avg_score,
    'lastPlayed', g.last_played
  ) ORDER BY g.plays DESC), '[]'::jsonb) INTO v_by_game
  FROM (
    SELECT game_type,
           count(*)::int AS plays,
           (count(*) FILTER (WHERE created_at >= now() - interval '7 days'))::int AS plays7d,
           count(DISTINCT user_id)::int AS players,
           round(avg(score))::int AS avg_score,
           max(created_at)::date AS last_played
    FROM game_results
    GROUP BY game_type
  ) g;

  -- Daily trend, last 30 days (zero-filled via generate_series)
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'date',    d.day,
    'plays',   coalesce(s.plays, 0),
    'players', coalesce(s.players, 0)
  ) ORDER BY d.day), '[]'::jsonb) INTO v_daily
  FROM generate_series(
    (now() - interval '29 days')::date, now()::date, interval '1 day'
  ) AS d(day)
  LEFT JOIN (
    SELECT created_at::date AS day,
           count(*)::int AS plays,
           count(DISTINCT user_id)::int AS players
    FROM game_results
    WHERE created_at >= (now() - interval '29 days')::date
    GROUP BY 1
  ) s ON s.day = d.day;

  RETURN jsonb_build_object(
    'totals', v_totals,
    'byGame', v_by_game,
    'daily',  v_daily
  );
END $$;

REVOKE ALL ON FUNCTION admin_game_stats() FROM public;
GRANT EXECUTE ON FUNCTION admin_game_stats() TO authenticated;
