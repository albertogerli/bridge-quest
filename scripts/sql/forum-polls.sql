-- Forum Polls Support
-- Run on Supabase Dashboard → SQL Editor

-- 1. Add poll_options column to forum_posts
ALTER TABLE forum_posts
ADD COLUMN IF NOT EXISTS poll_options jsonb DEFAULT NULL;

-- 2. Create poll votes table
CREATE TABLE IF NOT EXISTS forum_poll_votes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id bigint NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id) -- one vote per user per poll
);

-- 3. Enable RLS
ALTER TABLE forum_poll_votes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Anyone can read poll votes"
  ON forum_poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON forum_poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No update/delete: votes are final

-- 5. Index for fast vote counting
CREATE INDEX IF NOT EXISTS idx_poll_votes_post
  ON forum_poll_votes(post_id, option_index);
