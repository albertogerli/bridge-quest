-- ============================================================================
-- BridgeLab: PBN import for instructors.
-- Custom hands (parsed client-side from .pbn files) are stored as full
-- Smazzata JSON on the assignment itself, so students resolve them without
-- touching the global smazzate catalog. RLS on `assignments` already limits
-- visibility to class members + owning instructor.
-- Run on Supabase Dashboard -> SQL Editor (idempotent).
-- ============================================================================

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS custom_hands jsonb;

COMMENT ON COLUMN assignments.custom_hands IS
  'Array of Smazzata objects imported from PBN (ids referenced by smazzata_ids)';
