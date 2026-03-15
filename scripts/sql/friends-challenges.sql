-- ============================================================================
-- BridgeLab: Friendships & Challenges Schema
-- Run this SQL on Supabase Dashboard -> SQL Editor
--
-- Creates:
--   1. friendships table (with RLS policies)
--   2. challenges table (with RLS policies)
--   3. Indexes for both tables
--   4. RPC functions: search_users, get_pending_challenges,
--      get_challenge_history, get_challenge_stats
--   5. profiles table additions (bbo_username)
--
-- Idempotent: safe to run multiple times (uses IF NOT EXISTS, OR REPLACE).
-- ============================================================================


-- ============================================================================
-- 0. Profiles additions
-- ============================================================================

-- bbo_username may already exist; IF NOT EXISTS makes this safe to re-run
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bbo_username text;


-- ============================================================================
-- 1. Friendships table
-- ============================================================================

CREATE TABLE IF NOT EXISTS friendships (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),

  -- Prevent duplicate friendship rows in the same direction
  UNIQUE(user_id, friend_id)
);

-- Enable Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- SELECT: user can see rows where they are either party
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
CREATE POLICY "Users can view own friendships"
  ON friendships
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- INSERT: only the initiator can create a friendship request
DROP POLICY IF EXISTS "Users can send friend requests" ON friendships;
CREATE POLICY "Users can send friend requests"
  ON friendships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: only the recipient (friend_id) can accept or decline
DROP POLICY IF EXISTS "Recipients can accept or decline" ON friendships;
CREATE POLICY "Recipients can accept or decline"
  ON friendships
  FOR UPDATE
  USING (auth.uid() = friend_id);

-- DELETE: either party can remove the friendship
DROP POLICY IF EXISTS "Either party can delete friendship" ON friendships;
CREATE POLICY "Either party can delete friendship"
  ON friendships
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);


-- ============================================================================
-- 2. Challenges table
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenges (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    -- NULL opponent = waiting for a random match
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN (
                         'pending', 'accepted', 'playing',
                         'completed', 'declined', 'expired'
                       )),
  board_count        int NOT NULL DEFAULT 4
                       CHECK (board_count IN (1, 4, 8)),
  hands              jsonb NOT NULL DEFAULT '[]'::jsonb,
  challenger_results jsonb,
  opponent_results   jsonb,
  challenger_imps    int,
  opponent_imps      int,
  created_at         timestamptz DEFAULT now(),
  completed_at       timestamptz
);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- SELECT: challenger or opponent can see their challenges
DROP POLICY IF EXISTS "Players can view own challenges" ON challenges;
CREATE POLICY "Players can view own challenges"
  ON challenges
  FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- INSERT: challenger_id must be the authenticated user
DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
CREATE POLICY "Users can create challenges"
  ON challenges
  FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

-- UPDATE: either player can update (e.g. submit results, accept/decline)
DROP POLICY IF EXISTS "Players can update own challenges" ON challenges;
CREATE POLICY "Players can update own challenges"
  ON challenges
  FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- DELETE: only challenger can cancel, and only while pending
DROP POLICY IF EXISTS "Challenger can delete pending challenges" ON challenges;
CREATE POLICY "Challenger can delete pending challenges"
  ON challenges
  FOR DELETE
  USING (auth.uid() = challenger_id AND status = 'pending');


-- ============================================================================
-- 3. Indexes
-- ============================================================================

-- Friendships indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user_id
  ON friendships(user_id);

CREATE INDEX IF NOT EXISTS idx_friendships_friend_id
  ON friendships(friend_id);

CREATE INDEX IF NOT EXISTS idx_friendships_status
  ON friendships(status);

-- Challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id
  ON challenges(challenger_id);

CREATE INDEX IF NOT EXISTS idx_challenges_opponent_id
  ON challenges(opponent_id);

CREATE INDEX IF NOT EXISTS idx_challenges_status
  ON challenges(status);

CREATE INDEX IF NOT EXISTS idx_challenges_created_at
  ON challenges(created_at DESC);


-- ============================================================================
-- 4. RPC Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- search_users: find players by display_name, bbo_username, or ASD name
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION search_users(
  p_query   text,
  p_user_id uuid
)
RETURNS TABLE (
  id           uuid,
  display_name text,
  bbo_username text,
  avatar_url   text,
  asd_id       int
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT
    p.id,
    p.display_name,
    p.bbo_username,
    p.avatar_url,
    p.asd_id
  FROM profiles p
  LEFT JOIN asd a ON a.id = p.asd_id
  WHERE
    -- Exclude the searching user
    p.id <> p_user_id
    -- Must have a display name
    AND p.display_name IS NOT NULL
    -- Match on display_name, bbo_username, or ASD name
    AND (
      p.display_name ILIKE '%' || p_query || '%'
      OR p.bbo_username ILIKE '%' || p_query || '%'
      OR a.name ILIKE '%' || p_query || '%'
    )
  ORDER BY p.display_name
  LIMIT 20;
$$;


-- ----------------------------------------------------------------------------
-- get_pending_challenges: active challenges for a user (pending/accepted/playing)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_pending_challenges(p_user_id uuid)
RETURNS TABLE (
  id               uuid,
  challenger_id    uuid,
  opponent_id      uuid,
  status           text,
  board_count      int,
  created_at       timestamptz,
  challenger_name  text,
  challenger_avatar text,
  opponent_name    text,
  opponent_avatar  text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    c.id,
    c.challenger_id,
    c.opponent_id,
    c.status,
    c.board_count,
    c.created_at,
    pc.display_name  AS challenger_name,
    pc.avatar_url    AS challenger_avatar,
    po.display_name  AS opponent_name,
    po.avatar_url    AS opponent_avatar
  FROM challenges c
  LEFT JOIN profiles pc ON pc.id = c.challenger_id
  LEFT JOIN profiles po ON po.id = c.opponent_id
  WHERE
    (c.challenger_id = p_user_id OR c.opponent_id = p_user_id)
    AND c.status IN ('pending', 'accepted', 'playing')
  ORDER BY c.created_at DESC;
$$;


-- ----------------------------------------------------------------------------
-- get_challenge_history: completed challenges for a user
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_challenge_history(
  p_user_id uuid,
  p_limit   int DEFAULT 20
)
RETURNS TABLE (
  id                uuid,
  challenger_id     uuid,
  opponent_id       uuid,
  status            text,
  board_count       int,
  created_at        timestamptz,
  completed_at      timestamptz,
  challenger_imps   int,
  opponent_imps     int,
  challenger_name   text,
  challenger_avatar text,
  opponent_name     text,
  opponent_avatar   text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    c.id,
    c.challenger_id,
    c.opponent_id,
    c.status,
    c.board_count,
    c.created_at,
    c.completed_at,
    c.challenger_imps,
    c.opponent_imps,
    pc.display_name  AS challenger_name,
    pc.avatar_url    AS challenger_avatar,
    po.display_name  AS opponent_name,
    po.avatar_url    AS opponent_avatar
  FROM challenges c
  LEFT JOIN profiles pc ON pc.id = c.challenger_id
  LEFT JOIN profiles po ON po.id = c.opponent_id
  WHERE
    (c.challenger_id = p_user_id OR c.opponent_id = p_user_id)
    AND c.status = 'completed'
  ORDER BY c.completed_at DESC
  LIMIT p_limit;
$$;


-- ----------------------------------------------------------------------------
-- get_challenge_stats: aggregate win/loss/draw stats for a user
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_challenge_stats(p_user_id uuid)
RETURNS TABLE (
  played         int,
  won            int,
  lost           int,
  drawn          int,
  avg_imp_margin numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    COUNT(*)::int AS played,

    COUNT(*) FILTER (WHERE
      -- User is challenger and scored higher
      (c.challenger_id = p_user_id AND c.challenger_imps > c.opponent_imps)
      OR
      -- User is opponent and scored higher
      (c.opponent_id = p_user_id AND c.opponent_imps > c.challenger_imps)
    )::int AS won,

    COUNT(*) FILTER (WHERE
      (c.challenger_id = p_user_id AND c.challenger_imps < c.opponent_imps)
      OR
      (c.opponent_id = p_user_id AND c.opponent_imps < c.challenger_imps)
    )::int AS lost,

    COUNT(*) FILTER (WHERE
      c.challenger_imps = c.opponent_imps
    )::int AS drawn,

    ROUND(AVG(
      CASE
        WHEN c.challenger_id = p_user_id
          THEN c.challenger_imps - c.opponent_imps
        ELSE
          c.opponent_imps - c.challenger_imps
      END
    ), 1) AS avg_imp_margin

  FROM challenges c
  WHERE
    (c.challenger_id = p_user_id OR c.opponent_id = p_user_id)
    AND c.status = 'completed'
    AND c.challenger_imps IS NOT NULL
    AND c.opponent_imps IS NOT NULL;
$$;
