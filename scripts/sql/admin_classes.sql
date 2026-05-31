-- ============================================================================
-- BridgeLab: Admin oversight of all classes
-- Run on Supabase Dashboard -> SQL Editor (idempotent).
-- Depends on instructor_portal.sql (classes, is_admin from instructor_requests.sql).
-- SECURITY DEFINER RPCs guarded by is_admin() so only the admin sees everything.
-- ============================================================================

-- Overview list: every class with instructor, ASD, member + assignment counts.
CREATE OR REPLACE FUNCTION admin_list_classes()
RETURNS TABLE (
  id               uuid,
  name             text,
  asd_code         text,
  invite_code      text,
  invite_active    boolean,
  instructor_id    uuid,
  instructor_name  text,
  instructor_email text,
  member_count     bigint,
  assignment_count bigint,
  created_at       timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    c.id, c.name, c.asd_code, c.invite_code, c.invite_active,
    c.instructor_id, p.display_name, u.email::text,
    (SELECT count(*) FROM class_members m WHERE m.class_id = c.id AND m.status = 'active'),
    (SELECT count(*) FROM assignments a WHERE a.class_id = c.id),
    c.created_at
  FROM classes c
  JOIN profiles p ON p.id = c.instructor_id
  JOIN auth.users u ON u.id = c.instructor_id
  ORDER BY c.created_at DESC;
END $$;

-- Drill-down: members + assignments of one class (as JSON).
CREATE OR REPLACE FUNCTION admin_class_detail(p_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'members', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object('id', m.student_id, 'name', p.display_name, 'joined_at', m.joined_at)
        ORDER BY m.joined_at
      ), '[]'::jsonb)
      FROM class_members m
      JOIN profiles p ON p.id = m.student_id
      WHERE m.class_id = p_class_id AND m.status = 'active'
    ),
    'assignments', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', a.id, 'title', a.title, 'created_at', a.created_at,
          'hands', coalesce(array_length(a.smazzata_ids, 1), 0)
        ) ORDER BY a.created_at DESC
      ), '[]'::jsonb)
      FROM assignments a
      WHERE a.class_id = p_class_id
    )
  ) INTO result;

  RETURN result;
END $$;
