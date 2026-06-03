-- ============================================================================
-- BridgeLab: class-wide leaderboard (all assignments of a class).
-- Ranking: hands kept on the FIRST attempt → total tricks → speed (fastest).
-- Visible to class members and the class instructor.
-- Run on Supabase Dashboard -> SQL Editor (idempotent). Depends on instructor_portal.sql.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_class_leaderboard(p_class_id uuid)
RETURNS TABLE (
  student_id    uuid,
  student_name  text,
  hands_made    int,
  hands_played  int,
  total_tricks  int,
  total_ms      bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF NOT (is_member_of_class(p_class_id) OR is_instructor_of_class(p_class_id)) THEN
    RAISE EXCEPTION 'not authorized for class %', p_class_id USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH first_attempt AS (
    -- one row per (student, assignment, hand): the FIRST attempt
    SELECT DISTINCT ON (gr.user_id, gr.assignment_id, gr.details->>'smazzata_id')
      gr.user_id,
      (gr.score >= 0)                                  AS made,
      COALESCE((gr.details->>'tricksMade')::int, 0)    AS tricks,
      COALESCE((gr.details->>'durationMs')::bigint, 0) AS ms
    FROM game_results gr
    JOIN assignments a ON a.id = gr.assignment_id
    WHERE a.class_id = p_class_id
      AND gr.assignment_id IS NOT NULL
      AND gr.details->>'smazzata_id' IS NOT NULL
    ORDER BY gr.user_id, gr.assignment_id, gr.details->>'smazzata_id', gr.created_at ASC
  )
  SELECT
    fa.user_id                                         AS student_id,
    p.display_name                                     AS student_name,
    SUM(CASE WHEN fa.made THEN 1 ELSE 0 END)::int      AS hands_made,
    COUNT(*)::int                                      AS hands_played,
    SUM(fa.tricks)::int                                AS total_tricks,
    SUM(fa.ms)::bigint                                 AS total_ms
  FROM first_attempt fa
  JOIN profiles p ON p.id = fa.user_id
  GROUP BY fa.user_id, p.display_name
  ORDER BY hands_made DESC, total_tricks DESC, total_ms ASC;
END $$;
