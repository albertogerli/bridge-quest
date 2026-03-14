-- ============================================================================
-- BridgeQuest: Per-game leaderboard RPC function
-- Run this SQL on Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Update CHECK constraint to include all game types
ALTER TABLE game_results DROP CONSTRAINT IF EXISTS game_results_game_type_check;
ALTER TABLE game_results ADD CONSTRAINT game_results_game_type_check
  CHECK (game_type IN (
    'mano-del-giorno', 'sfida', 'smazzata', 'torneo',
    'quiz-lampo', 'conta-veloce', 'impasse', 'memory',
    'trova-errore', 'dichiara', 'pratica-licita', 'mano-guidata'
  ));

-- 2. RPC function for per-game leaderboard (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_game_leaderboard(
  p_game_type text,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  best_score int,
  games_played bigint,
  last_played timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    gr.user_id,
    p.display_name,
    MAX(gr.score)::int AS best_score,
    COUNT(*)::bigint AS games_played,
    MAX(gr.created_at) AS last_played
  FROM game_results gr
  JOIN profiles p ON p.id = gr.user_id
  WHERE gr.game_type = p_game_type
    AND p.display_name IS NOT NULL
  GROUP BY gr.user_id, p.display_name
  ORDER BY best_score DESC
  LIMIT p_limit;
$$;
