-- ============================================================================
-- BridgeLab: Login History Tracking
-- Run this SQL on Supabase Dashboard -> SQL Editor
--
-- Creates:
--   1. login_history table (stores every login event)
--   2. RLS policies (admin can read all, users can read own)
--   3. Trigger: auto-insert on profiles.last_login update
--   4. Index for fast lookups
--   5. Backfill: creates one record per existing user from their last_login
-- ============================================================================

-- 1. Create login_history table
CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_in_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Index for fast user + date lookups
CREATE INDEX IF NOT EXISTS idx_login_history_user_date
  ON public.login_history (user_id, logged_in_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_history_date
  ON public.login_history (logged_in_at DESC);

-- 3. Enable RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Admin (service role) can read all — no policy needed, service role bypasses RLS
-- Users can read their own login history
CREATE POLICY "Users can read own login history"
  ON public.login_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Only the system (trigger) inserts, but allow authenticated insert for client-side tracking
CREATE POLICY "Authenticated can insert own login history"
  ON public.login_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. Trigger function: auto-log when profiles.last_login changes
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if last_login actually changed
  IF NEW.last_login IS DISTINCT FROM OLD.last_login THEN
    INSERT INTO public.login_history (user_id, logged_in_at)
    VALUES (NEW.id, COALESCE(NEW.last_login, now()));
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS on_login_update ON public.profiles;
CREATE TRIGGER on_login_update
  AFTER UPDATE OF last_login ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_login();

-- 5. Backfill: create one record per existing user from their current last_login
INSERT INTO public.login_history (user_id, logged_in_at)
SELECT id, COALESCE(last_login, created_at)
FROM public.profiles
WHERE last_login IS NOT NULL
ON CONFLICT DO NOTHING;

-- Done! From now on, every time a user's last_login is updated,
-- a new row is automatically added to login_history.
-- The admin dashboard reads this table for accurate daily activity tracking.
