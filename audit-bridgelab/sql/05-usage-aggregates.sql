-- Read-only usage aggregates. No email, name, user ID, or row-level event is returned.
SELECT
  now() AS measured_at,
  (SELECT count(*) FROM auth.users) AS registered_users,
  (SELECT count(*) FROM public.profiles) AS profiles,
  (SELECT count(*) FROM public.login_history) AS login_events,
  (SELECT coalesce(sum(total_minutes), 0) FROM public.profiles) AS cumulative_visible_minutes;

WITH monthly AS (
  SELECT date_trunc('month', created_at)::date AS month, count(*) AS registrations
  FROM auth.users
  GROUP BY 1
), growth AS (
  SELECT month, registrations,
         lag(registrations) OVER (ORDER BY month) AS prior_month
  FROM monthly
)
SELECT month, registrations,
       round(100.0 * (registrations - prior_month) / nullif(prior_month, 0), 2) AS monthly_growth_pct
FROM growth
ORDER BY month;

SELECT date_trunc('month', logged_in_at)::date AS month,
       count(DISTINCT user_id) AS monthly_active_users,
       count(*) AS login_events
FROM public.login_history
GROUP BY 1
ORDER BY 1;

WITH thresholds(days) AS (VALUES (5), (7), (9), (21), (30), (39)),
eligible AS (
  SELECT t.days, u.id, u.created_at
  FROM thresholds t
  CROSS JOIN auth.users u
  WHERE u.created_at <= now() - make_interval(days => t.days)
), retained AS (
  SELECT e.days, e.id,
         EXISTS (
           SELECT 1 FROM public.login_history lh
           WHERE lh.user_id = e.id
             AND lh.logged_in_at >= e.created_at + make_interval(days => e.days)
         ) AS retained
  FROM eligible e
)
SELECT days,
       count(*) AS eligible_users,
       count(*) FILTER (WHERE retained) AS retained_users,
       round(100.0 * count(*) FILTER (WHERE retained) / nullif(count(*), 0), 2) AS rolling_retention_pct
FROM retained
GROUP BY days
ORDER BY days;

WITH cm AS (
  SELECT user_id, lesson_id || '-' || module_id AS reconstructed_module_key, completed_at
  FROM public.completed_modules
), matched AS (
  SELECT cm.user_id, lm.lesson_id, lm.module_id, cm.completed_at
  FROM cm
  JOIN public.lesson_modules lm
    ON cm.reconstructed_module_key = lm.lesson_id::text || '-' || lm.module_id
), requirements AS (
  SELECT lesson_id, count(*) AS required_modules
  FROM public.lesson_modules
  GROUP BY lesson_id
), completions AS (
  SELECT m.user_id, m.lesson_id, max(m.completed_at) AS completed_at
  FROM matched m
  JOIN requirements r ON r.lesson_id = m.lesson_id
  GROUP BY m.user_id, m.lesson_id, r.required_modules
  HAVING count(DISTINCT m.module_id) >= r.required_modules
)
SELECT
  (SELECT count(*) FROM public.completed_modules) AS completed_module_rows,
  (SELECT count(*) FROM matched) AS matched_module_rows,
  (SELECT count(*) FROM public.completed_modules) - (SELECT count(*) FROM matched) AS unmatched_module_rows,
  count(*) AS completed_lesson_user_pairs,
  count(DISTINCT user_id) AS users_completing_at_least_one_lesson
FROM completions;

WITH cm AS (
  SELECT user_id, lesson_id || '-' || module_id AS reconstructed_module_key, completed_at
  FROM public.completed_modules
), matched AS (
  SELECT cm.user_id, lm.lesson_id, lm.module_id, cm.completed_at
  FROM cm
  JOIN public.lesson_modules lm
    ON cm.reconstructed_module_key = lm.lesson_id::text || '-' || lm.module_id
), requirements AS (
  SELECT lesson_id, count(*) AS required_modules
  FROM public.lesson_modules
  GROUP BY lesson_id
), completions AS (
  SELECT m.user_id, m.lesson_id, max(m.completed_at) AS completed_at
  FROM matched m
  JOIN requirements r ON r.lesson_id = m.lesson_id
  GROUP BY m.user_id, m.lesson_id, r.required_modules
  HAVING count(DISTINCT m.module_id) >= r.required_modules
)
SELECT date_trunc('month', completed_at)::date AS month, count(*) AS completed_lessons
FROM completions
GROUP BY 1
ORDER BY 1;
