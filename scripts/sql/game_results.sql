-- ============================================================================
-- BridgeQuest: game_results table
-- Stores individual game results for all game types.
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_results (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type   text NOT NULL CHECK (game_type IN (
    'mano-del-giorno', 'sfida', 'smazzata', 'torneo',
    'quiz-lampo', 'conta-veloce', 'impasse', 'memory', 'trova-errore'
  )),
  lesson_id   int,
  score       int NOT NULL DEFAULT 0,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fetching a user's results (most common query)
CREATE INDEX IF NOT EXISTS idx_game_results_user_id
  ON game_results(user_id, created_at DESC);

-- Index for leaderboard queries by game type
CREATE INDEX IF NOT EXISTS idx_game_results_game_type
  ON game_results(game_type, score DESC);

-- Index for per-lesson stats
CREATE INDEX IF NOT EXISTS idx_game_results_lesson
  ON game_results(lesson_id)
  WHERE lesson_id IS NOT NULL;

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Users can read their own results
CREATE POLICY "Users can read own game results"
  ON game_results
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own results
CREATE POLICY "Users can insert own game results"
  ON game_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete results (immutable log)
-- No UPDATE or DELETE policies = denied by default with RLS enabled

-- ============================================================================
-- Optional: view for leaderboard aggregation (top scores per game type)
-- ============================================================================

CREATE OR REPLACE VIEW game_results_leaderboard AS
SELECT
  user_id,
  game_type,
  COUNT(*) AS games_played,
  SUM(score) AS total_score,
  MAX(score) AS best_score,
  AVG(score)::int AS avg_score,
  MAX(created_at) AS last_played
FROM game_results
GROUP BY user_id, game_type;
