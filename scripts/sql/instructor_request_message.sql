-- ============================================================================
-- BridgeLab: admin can attach a message when reviewing an instructor request.
-- Run on Supabase Dashboard -> SQL Editor (idempotent).
-- Depends on instructor_requests.sql.
-- ============================================================================

ALTER TABLE instructor_requests ADD COLUMN IF NOT EXISTS review_message text;

-- Replace the 2-arg review function with a 3-arg one (optional message).
DROP FUNCTION IF EXISTS review_instructor_request(uuid, boolean);

CREATE OR REPLACE FUNCTION review_instructor_request(
  p_request_id uuid,
  p_approve boolean,
  p_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r instructor_requests;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO r FROM instructor_requests WHERE id = p_request_id;
  IF r.id IS NULL THEN
    RAISE EXCEPTION 'request not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE instructor_requests
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_message = nullif(btrim(coalesce(p_message, '')), '')
  WHERE id = p_request_id;

  IF p_approve THEN
    UPDATE profiles SET role = 'instructor' WHERE id = r.user_id AND role = 'user';
  END IF;
END $$;

-- list_instructor_requests: include the review_message in the admin feed.
-- (Return type changes -> must drop the old signature first.)
DROP FUNCTION IF EXISTS list_instructor_requests(text);

CREATE OR REPLACE FUNCTION list_instructor_requests(p_status text DEFAULT NULL)
RETURNS TABLE (
  id           uuid,
  user_id      uuid,
  display_name text,
  email        text,
  status       text,
  message      text,
  asd_code     text,
  created_at   timestamptz,
  review_message text
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
  SELECT r.id, r.user_id, p.display_name, u.email::text, r.status, r.message, r.asd_code, r.created_at, r.review_message
  FROM instructor_requests r
  JOIN profiles p ON p.id = r.user_id
  JOIN auth.users u ON u.id = r.user_id
  WHERE p_status IS NULL OR r.status = p_status
  ORDER BY r.created_at DESC;
END $$;
