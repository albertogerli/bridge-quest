-- ============================================================================
-- BridgeLab: Class chat (Instructor Portal)
-- Run on Supabase Dashboard -> SQL Editor (idempotent).
-- Depends on instructor_portal.sql (classes, is_member_of_class, is_instructor_of_class).
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_messages_class
  ON class_messages(class_id, created_at);

ALTER TABLE class_messages ENABLE ROW LEVEL SECURITY;

-- READ: the owning instructor and active members of the class.
DROP POLICY IF EXISTS "Members can read class messages" ON class_messages;
CREATE POLICY "Members can read class messages"
  ON class_messages
  FOR SELECT
  USING (is_instructor_of_class(class_id) OR is_member_of_class(class_id));

-- INSERT: a member/instructor sending their own message.
DROP POLICY IF EXISTS "Members can send class messages" ON class_messages;
CREATE POLICY "Members can send class messages"
  ON class_messages
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (is_instructor_of_class(class_id) OR is_member_of_class(class_id))
  );

-- DELETE: a user can remove their own message (optional moderation).
DROP POLICY IF EXISTS "Authors can delete own class messages" ON class_messages;
CREATE POLICY "Authors can delete own class messages"
  ON class_messages
  FOR DELETE
  USING (user_id = auth.uid() OR is_instructor_of_class(class_id));

-- Enable Realtime for live chat (add to the supabase_realtime publication).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND tablename = 'class_messages'
     )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE class_messages;
  END IF;
END $$;
