-- =============================================
-- BridgeQuest Session 18 - Upgrade SQL
-- Eseguire su Supabase SQL Editor
-- =============================================

-- 1. Forum comments: aggiungi parent_id per risposte nidificate
ALTER TABLE forum_comments
  ADD COLUMN IF NOT EXISTS parent_id bigint REFERENCES forum_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_forum_comments_parent_id
  ON forum_comments(parent_id);

-- 2. Game results: nuova tabella per sync risultati gioco
CREATE TABLE IF NOT EXISTS game_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type text NOT NULL CHECK (game_type IN (
    'mano-del-giorno','sfida','smazzata','torneo',
    'quiz-lampo','conta-veloce','impasse','memory','trova-errore'
  )),
  lesson_id int,
  score int NOT NULL DEFAULT 0,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own results"
  ON game_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results"
  ON game_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_game_results_user
  ON game_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_results_type
  ON game_results(game_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_game_results_lesson
  ON game_results(lesson_id);

-- 3. View per leaderboard giochi
CREATE OR REPLACE VIEW game_results_leaderboard AS
SELECT
  user_id,
  game_type,
  count(*) as games_played,
  sum(score) as total_score,
  max(score) as best_score,
  round(avg(score)) as avg_score
FROM game_results
GROUP BY user_id, game_type;
