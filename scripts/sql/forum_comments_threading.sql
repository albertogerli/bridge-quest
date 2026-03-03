-- ============================================================================
-- BridgeQuest: Add threading (replies) to forum_comments
-- Adds parent_id column to support nested replies in forum threads.
-- Run this migration on your Supabase project.
-- ============================================================================

-- Add parent_id column (nullable: NULL = top-level comment, set = reply)
ALTER TABLE forum_comments
  ADD COLUMN IF NOT EXISTS parent_id bigint REFERENCES forum_comments(id) ON DELETE CASCADE;

-- Index for efficient reply lookups
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent_id
  ON forum_comments(parent_id)
  WHERE parent_id IS NOT NULL;

-- Index for fetching comments by post (already likely exists, but just in case)
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id
  ON forum_comments(post_id, created_at);
