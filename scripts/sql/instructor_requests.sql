-- ============================================================================
-- BridgeLab: Instructor application & approval flow
-- Run on Supabase Dashboard -> SQL Editor (idempotent).
--
-- A user applies to become an instructor; the platform admin
-- (alberto@albertogerli.it) approves or rejects. Approval flips
-- profiles.role to 'instructor'.
--
-- Depends on instructor_portal.sql (profiles.role, is_admin not yet defined here).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Make the platform owner an admin so they can approve requests.
-- ----------------------------------------------------------------------------
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'alberto@albertogerli.it');


-- ----------------------------------------------------------------------------
-- 1. is_admin() helper (SECURITY DEFINER to avoid profiles RLS recursion).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;


-- ----------------------------------------------------------------------------
-- 2. instructor_requests table (one row per user; re-apply via upsert).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instructor_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  message     text,
  asd_code    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_instructor_requests_status
  ON instructor_requests(status, created_at DESC);

ALTER TABLE instructor_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: applicant sees own request; admin sees all.
DROP POLICY IF EXISTS "Self or admin can read requests" ON instructor_requests;
CREATE POLICY "Self or admin can read requests"
  ON instructor_requests
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- INSERT: a user files their own request.
DROP POLICY IF EXISTS "Users can file own request" ON instructor_requests;
CREATE POLICY "Users can file own request"
  ON instructor_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: applicant can resubmit their own row; admin can review.
DROP POLICY IF EXISTS "Self or admin can update request" ON instructor_requests;
CREATE POLICY "Self or admin can update request"
  ON instructor_requests
  FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());


-- ----------------------------------------------------------------------------
-- 3. review_instructor_request: admin approves/rejects + flips role on approve.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION review_instructor_request(p_request_id uuid, p_approve boolean)
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
      reviewed_by = auth.uid()
  WHERE id = p_request_id;

  IF p_approve THEN
    UPDATE profiles SET role = 'instructor' WHERE id = r.user_id AND role = 'user';
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 4. list_instructor_requests: admin dashboard feed (joins name + email).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION list_instructor_requests(p_status text DEFAULT NULL)
RETURNS TABLE (
  id           uuid,
  user_id      uuid,
  display_name text,
  email        text,
  status       text,
  message      text,
  asd_code     text,
  created_at   timestamptz
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
  SELECT r.id, r.user_id, p.display_name, u.email::text, r.status, r.message, r.asd_code, r.created_at
  FROM instructor_requests r
  JOIN profiles p ON p.id = r.user_id
  JOIN auth.users u ON u.id = r.user_id
  WHERE p_status IS NULL OR r.status = p_status
  ORDER BY r.created_at DESC;
END $$;
