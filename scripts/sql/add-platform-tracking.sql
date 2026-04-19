-- ============================================================================
-- BridgeLab: Platform tracking (web / ios / android / pwa)
-- Run this SQL on Supabase Dashboard -> SQL Editor
--
-- Adds a `platform` column to profiles, login_history, and game_results,
-- and extends the login trigger so each login_history row captures the
-- platform the user was on at the time.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Add platform column to profiles (last known platform for each user)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform text;

-- 2. Add platform column to login_history (per-login truth)
ALTER TABLE public.login_history
  ADD COLUMN IF NOT EXISTS platform text;

CREATE INDEX IF NOT EXISTS idx_login_history_platform
  ON public.login_history (platform, logged_in_at DESC);

-- 3. Add platform column to game_results (per-game truth)
ALTER TABLE public.game_results
  ADD COLUMN IF NOT EXISTS platform text;

CREATE INDEX IF NOT EXISTS idx_game_results_platform
  ON public.game_results (platform, created_at DESC);

-- 4. Update the login trigger to propagate NEW.platform into login_history.
--    The trigger fires when profiles.last_login changes; it now also copies
--    whatever platform value the client wrote on the same UPDATE.
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.last_login IS DISTINCT FROM OLD.last_login THEN
    INSERT INTO public.login_history (user_id, logged_in_at, platform)
    VALUES (NEW.id, COALESCE(NEW.last_login, now()), NEW.platform);
  END IF;
  RETURN NEW;
END;
$$;

-- Done. Old rows keep platform = NULL (shown as "non tracciato" in admin).
