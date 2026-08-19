-- Read-only product/content aggregates; returns no personal data.
SELECT
  (SELECT count(*) FROM public.courses) AS courses,
  (SELECT count(*) FROM public.course_worlds) AS worlds,
  (SELECT count(*) FROM public.lessons) AS lessons,
  (SELECT count(*) FROM public.lesson_modules) AS modules,
  (SELECT count(*) FROM public.smazzate) AS stored_hands,
  (SELECT count(*) FROM public.glossary) AS glossary_entries,
  (SELECT count(*) FROM public.collectible_cards) AS collectible_cards,
  (SELECT count(*) FROM public.weekly_challenges) AS weekly_challenges,
  (SELECT count(DISTINCT badge_name) FROM public.weekly_challenges) AS weekly_badge_names,
  (SELECT count(*) FROM public.guided_hands) AS guided_hands,
  (SELECT count(*) FROM public.eserciziario_exercises) AS workbook_exercises,
  (SELECT count(*) FROM public.trova_errore_scenarios) AS find_the_error_exercises;

SELECT c.id AS course_id, count(DISTINCT l.id) AS lessons, count(lm.*) AS modules
FROM public.courses c
LEFT JOIN public.course_worlds w ON w.course_id = c.id
LEFT JOIN public.lessons l ON l.world_id = w.id
LEFT JOIN public.lesson_modules lm ON lm.lesson_id = l.id
GROUP BY c.id
ORDER BY c.id;

SELECT module_type, count(*) AS modules
FROM public.lesson_modules
GROUP BY module_type
ORDER BY module_type;

SELECT block->>'type' AS content_block_type, count(*) AS blocks
FROM public.lesson_modules lm
CROSS JOIN LATERAL jsonb_array_elements(lm.content) AS block
GROUP BY block->>'type'
ORDER BY block->>'type';

SELECT block->>'type' AS exercise_block_type, count(*) AS blocks
FROM public.eserciziario_exercises e
CROSS JOIN LATERAL jsonb_array_elements(e.content) AS block
GROUP BY block->>'type'
ORDER BY block->>'type';
