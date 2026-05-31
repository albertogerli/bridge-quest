-- ============================================================================
-- BridgeLab: admin school-wide stats (boxes on /admin/classi)
-- Run on Supabase Dashboard -> SQL Editor (idempotent). is_admin-guarded.
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_school_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_classes     int;
  v_students    int;
  v_assignments int;
  v_expected    bigint;
  v_done        bigint;
  best_student  jsonb;
  best_teacher  jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_classes FROM classes;
  SELECT count(DISTINCT student_id) INTO v_students FROM class_members WHERE status = 'active';
  SELECT count(*) INTO v_assignments FROM assignments;

  -- Expected completions = for each assignment, (active members) * (number of hands)
  SELECT coalesce(sum(
    (SELECT count(*) FROM class_members m WHERE m.class_id = a.class_id AND m.status = 'active')
    * coalesce(array_length(a.smazzata_ids, 1), 0)
  ), 0) INTO v_expected
  FROM assignments a;

  -- Done = distinct (student, assignment, hand) results recorded
  SELECT count(*) INTO v_done FROM (
    SELECT DISTINCT gr.user_id, gr.assignment_id, gr.details->>'smazzata_id'
    FROM game_results gr
    WHERE gr.assignment_id IS NOT NULL
  ) t;

  -- Best student: most assignment hands completed
  SELECT jsonb_build_object('name', p.display_name, 'completed', s.cnt) INTO best_student
  FROM (
    SELECT gr.user_id,
           count(DISTINCT (gr.assignment_id::text || coalesce(gr.details->>'smazzata_id', ''))) AS cnt
    FROM game_results gr
    WHERE gr.assignment_id IS NOT NULL
    GROUP BY gr.user_id
    ORDER BY cnt DESC
    LIMIT 1
  ) s
  JOIN profiles p ON p.id = s.user_id;

  -- Best teacher: most active students across their classes
  SELECT jsonb_build_object('name', p.display_name, 'students', t.scnt, 'classes', t.ccnt) INTO best_teacher
  FROM (
    SELECT c.instructor_id,
           count(DISTINCT m.student_id) FILTER (WHERE m.status = 'active') AS scnt,
           count(DISTINCT c.id) AS ccnt
    FROM classes c
    LEFT JOIN class_members m ON m.class_id = c.id
    GROUP BY c.instructor_id
    ORDER BY scnt DESC, ccnt DESC
    LIMIT 1
  ) t
  JOIN profiles p ON p.id = t.instructor_id;

  RETURN jsonb_build_object(
    'classes', v_classes,
    'students', v_students,
    'assignments', v_assignments,
    'completionPct', CASE WHEN v_expected > 0 THEN round(100.0 * v_done / v_expected) ELSE 0 END,
    'bestStudent', best_student,
    'bestTeacher', best_teacher
  );
END $$;
