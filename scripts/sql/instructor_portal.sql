-- ============================================================================
-- BridgeLab: Instructor Portal (ASD B2B) Schema
-- Run this SQL on Supabase Dashboard -> SQL Editor
--
-- Creates:
--   0. profiles.role column (user | instructor | admin)
--   1. generate_invite_code() helper (no table deps)
--   2. classes / class_members / assignments tables
--   3. SQL helper functions (membership/ownership checks) -- AFTER tables exist
--   4. RLS policies for all of the above
--   5. game_results.assignment_id column (REUSE of existing results table)
--   6. RPC: get_class_results (aggregated dashboard / heatmap)
--
-- ORDER MATTERS: LANGUAGE sql functions are validated at creation time, so the
-- helpers that reference classes/class_members/assignments must be defined AFTER
-- those tables. The tables in turn only depend on generate_invite_code (plpgsql,
-- no table refs), which is defined first.
--
-- Idempotent: safe to run multiple times (IF NOT EXISTS, OR REPLACE, DROP POLICY IF EXISTS).
-- ============================================================================


-- ============================================================================
-- 0. Profiles: role column
--    Orthogonal to profile_type (which is an age/UI band). role gates features.
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Add the CHECK constraint separately so re-runs don't fail if it already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('user', 'instructor', 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role)
  WHERE role <> 'user';


-- ============================================================================
-- 1. generate_invite_code: random 6-char code, alphabet excludes ambiguous
--    chars (no 0/O, 1/I/L) so it's readable when projected in a classroom.
--    plpgsql + no table refs => safe to define before the tables.
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code     text := '';
  i        int;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
  END LOOP;
  RETURN code;
END $$;


-- ============================================================================
-- 2. Tables  (created BEFORE the sql helper functions that reference them)
-- ============================================================================

-- 2a. classes ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asd_code      text,                              -- link to ASD anagrafica
  name          text NOT NULL,
  description   text,
  invite_code   text NOT NULL UNIQUE DEFAULT generate_invite_code(),
  invite_active boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classes_instructor ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_invite_code ON classes(invite_code);

-- 2b. class_members (M:N) ----------------------------------------------------
CREATE TABLE IF NOT EXISTS class_members (
  class_id   uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'removed')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_members_student ON class_members(student_id);

-- 2c. assignments ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id          uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title             text NOT NULL,
  instructor_note   text,
  smazzata_ids      text[] NOT NULL DEFAULT '{}',   -- catalog smazzata ids ("1-1", "Q1-1")
  due_date          timestamptz,
  mode              text NOT NULL DEFAULT 'homework'
                      CHECK (mode IN ('homework', 'live')),
  unlock_mode       text NOT NULL DEFAULT 'free'
                      CHECK (unlock_mode IN ('free', 'sequential')),
  live_active_index int,                             -- current hand in live mode
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id, created_at DESC);


-- ============================================================================
-- 3. SQL helper functions (now that the tables exist).
--    SECURITY DEFINER so RLS policies can call them WITHOUT recursing into the
--    policies of classes/class_members (which would otherwise loop).
-- ============================================================================

CREATE OR REPLACE FUNCTION is_instructor_of_class(p_class_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = p_class_id AND c.instructor_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_member_of_class(p_class_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_members m
    WHERE m.class_id = p_class_id
      AND m.student_id = auth.uid()
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION is_instructor_of_assignment(p_assignment_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM assignments a
    JOIN classes c ON c.id = a.class_id
    WHERE a.id = p_assignment_id AND c.instructor_id = auth.uid()
  );
$$;


-- ============================================================================
-- 4. RLS policies
-- ============================================================================

-- 4a. classes ----------------------------------------------------------------
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- SELECT: instructor sees own classes; students see classes they belong to.
DROP POLICY IF EXISTS "Instructors and members can view classes" ON classes;
CREATE POLICY "Instructors and members can view classes"
  ON classes
  FOR SELECT
  USING (
    instructor_id = auth.uid()
    OR is_member_of_class(id)
  );

-- INSERT: only an instructor-role user, creating a class owned by themselves.
DROP POLICY IF EXISTS "Instructors can create classes" ON classes;
CREATE POLICY "Instructors can create classes"
  ON classes
  FOR INSERT
  WITH CHECK (
    instructor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'admin')
    )
  );

-- UPDATE: only the owning instructor (rename, regenerate code, deactivate).
DROP POLICY IF EXISTS "Instructors can update own classes" ON classes;
CREATE POLICY "Instructors can update own classes"
  ON classes
  FOR UPDATE
  USING (instructor_id = auth.uid());

-- DELETE: only the owning instructor.
DROP POLICY IF EXISTS "Instructors can delete own classes" ON classes;
CREATE POLICY "Instructors can delete own classes"
  ON classes
  FOR DELETE
  USING (instructor_id = auth.uid());

-- 4b. class_members ----------------------------------------------------------
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

-- SELECT: a student sees their own membership rows; the owning instructor sees
-- all rows for their classes.
DROP POLICY IF EXISTS "Members and owning instructor can view membership" ON class_members;
CREATE POLICY "Members and owning instructor can view membership"
  ON class_members
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR is_instructor_of_class(class_id)
  );

-- INSERT: a student joins themselves into a class. The invite-code check is
-- enforced in the app layer (joinClass looks up the class by active code, then
-- inserts), since RLS can't see the code the user typed. We still require the
-- row to be self-owned.
DROP POLICY IF EXISTS "Students can join themselves" ON class_members;
CREATE POLICY "Students can join themselves"
  ON class_members
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- UPDATE: owning instructor can change status (e.g. remove a student); a
-- student can update their own row (e.g. leave -> status 'removed').
DROP POLICY IF EXISTS "Instructor or self can update membership" ON class_members;
CREATE POLICY "Instructor or self can update membership"
  ON class_members
  FOR UPDATE
  USING (student_id = auth.uid() OR is_instructor_of_class(class_id));

-- DELETE: owning instructor or the student themselves.
DROP POLICY IF EXISTS "Instructor or self can delete membership" ON class_members;
CREATE POLICY "Instructor or self can delete membership"
  ON class_members
  FOR DELETE
  USING (student_id = auth.uid() OR is_instructor_of_class(class_id));

-- 4c. assignments ------------------------------------------------------------
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- SELECT: owning instructor and members of the class.
DROP POLICY IF EXISTS "Instructor and members can view assignments" ON assignments;
CREATE POLICY "Instructor and members can view assignments"
  ON assignments
  FOR SELECT
  USING (
    is_instructor_of_class(class_id)
    OR is_member_of_class(class_id)
  );

-- INSERT / UPDATE / DELETE: only the owning instructor.
DROP POLICY IF EXISTS "Instructor can create assignments" ON assignments;
CREATE POLICY "Instructor can create assignments"
  ON assignments
  FOR INSERT
  WITH CHECK (is_instructor_of_class(class_id));

DROP POLICY IF EXISTS "Instructor can update assignments" ON assignments;
CREATE POLICY "Instructor can update assignments"
  ON assignments
  FOR UPDATE
  USING (is_instructor_of_class(class_id));

DROP POLICY IF EXISTS "Instructor can delete assignments" ON assignments;
CREATE POLICY "Instructor can delete assignments"
  ON assignments
  FOR DELETE
  USING (is_instructor_of_class(class_id));


-- ============================================================================
-- 5. game_results: reuse for assignment results
--    Add assignment_id; allow 'compito' game_type; add an instructor read policy.
-- ============================================================================

ALTER TABLE game_results ADD COLUMN IF NOT EXISTS assignment_id uuid
  REFERENCES assignments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_game_results_assignment
  ON game_results(assignment_id)
  WHERE assignment_id IS NOT NULL;

-- Extend the game_type CHECK to allow 'compito'. We don't hardcode the full
-- list (production has accumulated game_type values beyond the original
-- migration); instead we rebuild the constraint from the distinct values
-- ALREADY present in the table, UNION the known set and 'compito'. This can
-- never be violated by existing rows.
DO $$
DECLARE
  cname    text;
  allowed  text;
BEGIN
  -- Drop the current game_type CHECK if present.
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'game_results'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%game_type%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE game_results DROP CONSTRAINT %I', cname);
  END IF;

  -- Build the allowed-values list: known set + 'compito' + anything already in
  -- the table. quote_literal each value to be injection-safe.
  SELECT string_agg(quote_literal(v), ', ')
  INTO allowed
  FROM (
    SELECT unnest(ARRAY[
      'mano-del-giorno', 'sfida', 'smazzata', 'torneo',
      'quiz-lampo', 'conta-veloce', 'impasse', 'memory', 'trova-errore',
      'compito'
    ]) AS v
    UNION
    SELECT DISTINCT game_type FROM game_results WHERE game_type IS NOT NULL
  ) s;

  EXECUTE format(
    'ALTER TABLE game_results ADD CONSTRAINT game_results_game_type_check CHECK (game_type IN (%s))',
    allowed
  );
END $$;

-- Existing policies (read/insert own) are preserved. Add ONE extra read policy:
-- the owning instructor can read results tied to assignments of their classes.
DROP POLICY IF EXISTS "Instructors can read class assignment results" ON game_results;
CREATE POLICY "Instructors can read class assignment results"
  ON game_results
  FOR SELECT
  USING (
    assignment_id IS NOT NULL
    AND is_instructor_of_assignment(assignment_id)
  );


-- ============================================================================
-- 6. RPC: get_class_results
--    Dashboard / heatmap source: one row per (student, smazzata) for an
--    assignment, with the latest result. SECURITY DEFINER but guarded by an
--    explicit ownership check so only the owning instructor gets data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- join_class_by_code: a student joins a class using its invite code.
-- SECURITY DEFINER so the lookup bypasses the classes SELECT RLS (a student is
-- not yet a member, so they couldn't otherwise read the class to find it). The
-- invite code is the credential; we only ever join the CALLER (auth.uid()).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION join_class_by_code(p_code text)
RETURNS classes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  c classes;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO c
  FROM classes
  WHERE invite_code = upper(trim(p_code)) AND invite_active = true;

  IF c.id IS NULL THEN
    RAISE EXCEPTION 'invalid invite code' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO class_members (class_id, student_id, status)
  VALUES (c.id, auth.uid(), 'active')
  ON CONFLICT (class_id, student_id) DO UPDATE SET status = 'active';

  RETURN c;
END $$;


CREATE OR REPLACE FUNCTION get_class_results(p_assignment_id uuid)
RETURNS TABLE (
  student_id    uuid,
  student_name  text,
  smazzata_id   text,
  score         int,
  details       jsonb,
  played_at     timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF NOT is_instructor_of_assignment(p_assignment_id) THEN
    RAISE EXCEPTION 'not authorized for assignment %', p_assignment_id
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (gr.user_id, gr.details->>'smazzata_id')
    gr.user_id                      AS student_id,
    p.display_name                  AS student_name,
    gr.details->>'smazzata_id'      AS smazzata_id,
    gr.score,
    gr.details,
    gr.created_at                   AS played_at
  FROM game_results gr
  LEFT JOIN profiles p ON p.id = gr.user_id
  WHERE gr.assignment_id = p_assignment_id
  -- FIRST attempt per hand (fair assessment: a later retry no longer turns it green).
  ORDER BY gr.user_id, gr.details->>'smazzata_id', gr.created_at ASC;
END $$;
