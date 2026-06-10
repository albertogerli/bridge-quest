-- ============================================================================
-- BridgeLab: "field" comparison for the Mano del Giorno.
-- Aggregates everyone's FIRST attempt on a given daily hand so the client can
-- show "you beat X% of today's field". Anonymous counts only — no user data
-- leaves the function. Run on Supabase Dashboard -> SQL Editor (idempotent).
-- ============================================================================

CREATE OR REPLACE FUNCTION get_daily_field_stats(p_date text)
RETURNS TABLE (
  result  int,   -- contract delta (e.g. -2, 0, +1)
  players int    -- how many users finished with that result
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Sanity check: the date key is always YYYY-MM-DD
  IF p_date !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'invalid date %', p_date USING ERRCODE = '22007';
  END IF;

  RETURN QUERY
  SELECT
    first_attempt.result,
    COUNT(*)::int AS players
  FROM (
    -- First attempt per user (replays must not improve the field score)
    SELECT DISTINCT ON (gr.user_id)
      (gr.details->>'result')::int AS result
    FROM game_results gr
    WHERE gr.game_type = 'mano-del-giorno'
      AND gr.details->>'date' = p_date
      AND gr.details->>'result' ~ '^-?\d+$'
    ORDER BY gr.user_id, gr.created_at ASC
  ) first_attempt
  GROUP BY first_attempt.result;
END $$;

REVOKE ALL ON FUNCTION get_daily_field_stats(text) FROM public;
GRANT EXECUTE ON FUNCTION get_daily_field_stats(text) TO authenticated;
