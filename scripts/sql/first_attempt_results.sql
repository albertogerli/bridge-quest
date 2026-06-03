-- ============================================================================
-- BridgeLab: instructor heatmap should reflect each student's FIRST attempt
-- per hand (a later successful retry must NOT turn a failed hand green).
-- Run on Supabase Dashboard -> SQL Editor (idempotent). Depends on instructor_portal.sql.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_class_results(p_assignment_id uuid)
RETURNS TABLE (
  student_id    uuid,
  student_name  text,
  smazzata_id   text,
  score         int,
  details       jsonb,
  played_at     timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF NOT is_instructor_of_assignment(p_assignment_id) THEN
    RAISE EXCEPTION 'not authorized for assignment %', p_assignment_id
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (gr.user_id, gr.details->>'smazzata_id')
    gr.user_id                      AS student_id,
    p.display_name                  AS student_name,
    gr.details->>'smazzata_id'      AS smazzata_id,
    gr.score,
    gr.details,
    gr.created_at                   AS played_at
  FROM game_results gr
  LEFT JOIN profiles p ON p.id = gr.user_id
  WHERE gr.assignment_id = p_assignment_id
  -- ASC = the FIRST attempt wins (was DESC = latest).
  ORDER BY gr.user_id, gr.details->>'smazzata_id', gr.created_at ASC;
END $$;
