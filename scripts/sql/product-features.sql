-- BridgeLab Product Features SQL Migrations
-- Execute these on Supabase Dashboard -> SQL Editor

-- ============================================================
-- Feature 1: Push Subscriptions (for Daily Habit Loop)
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Feature 3: Club/ASD Leaderboard RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION get_club_leaderboard(p_asd_id int)
RETURNS TABLE (id uuid, display_name text, xp int, avatar_url text, updated_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT p.id, p.display_name, p.xp, p.avatar_url, p.updated_at
  FROM profiles p
  WHERE p.asd_id = p_asd_id AND p.display_name IS NOT NULL
  ORDER BY p.xp DESC LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION get_club_stats(p_asd_id int)
RETURNS TABLE (member_count int, total_xp bigint, avg_xp int)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COUNT(*)::int, COALESCE(SUM(xp), 0), COALESCE(AVG(xp), 0)::int
  FROM profiles WHERE asd_id = p_asd_id AND display_name IS NOT NULL;
$$;
