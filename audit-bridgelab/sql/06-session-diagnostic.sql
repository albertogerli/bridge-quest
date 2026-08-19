-- Diagnostic only: login events are insufficient for duration/session metrics.
-- The three thresholds are the requested ±30% sensitivity around 30 minutes.
WITH thresholds(minutes) AS (VALUES (21), (30), (39)), ordered AS (
  SELECT t.minutes, lh.user_id, lh.logged_in_at,
         lag(lh.logged_in_at) OVER (PARTITION BY t.minutes, lh.user_id ORDER BY lh.logged_in_at) AS previous_at
  FROM thresholds t
  CROSS JOIN public.login_history lh
), session_starts AS (
  SELECT *, CASE WHEN previous_at IS NULL OR logged_in_at - previous_at > make_interval(mins => minutes)
                 THEN 1 ELSE 0 END AS new_session
  FROM ordered
), numbered AS (
  SELECT *, sum(new_session) OVER (PARTITION BY minutes, user_id ORDER BY logged_in_at) AS session_no
  FROM session_starts
), sessions AS (
  SELECT minutes, user_id, session_no,
         min(logged_in_at) AS started_at, max(logged_in_at) AS ended_at,
         count(*) AS events
  FROM numbered
  GROUP BY minutes, user_id, session_no
)
SELECT minutes AS gap_threshold_minutes,
       count(*) AS inferred_sessions,
       round(avg(extract(epoch FROM ended_at - started_at) / 60.0), 2) AS inferred_mean_minutes,
       round(percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM ended_at - started_at) / 60.0)::numeric, 2) AS inferred_median_minutes,
       count(*) FILTER (WHERE events = 1) AS single_event_sessions
FROM sessions
GROUP BY minutes
ORDER BY minutes;

