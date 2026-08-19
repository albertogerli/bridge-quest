-- Read-only aggregates by game type and recent day. No user IDs are returned.
SELECT game_type, count(*) AS events, count(DISTINCT user_id) AS users,
       min(created_at)::date AS first_event_date,
       max(created_at)::date AS last_event_date
FROM public.game_results
GROUP BY game_type
ORDER BY events DESC;

SELECT created_at::date AS day, count(*) AS results,
       count(DISTINCT user_id) AS active_players
FROM public.game_results
WHERE created_at >= current_date - interval '7 days'
GROUP BY 1
ORDER BY 1;

