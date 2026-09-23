-- Atomic review replacement with optimistic concurrency. Apply before the frontend.
-- Additive, idempotent. No existing content/results altered by installation.
-- SECURITY INVOKER preserves RLS. No caller-supplied user ID.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_review_items_state()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE payload jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'lessonId', lesson_id, 'moduleId', module_id, 'question', question,
    'wrongCount', coalesce(wrong_count, 0), 'box', box,
    'lastReview', last_review, 'nextReview', next_review
  ) ORDER BY lesson_id, module_id, coalesce(question, ''), id), '[]'::jsonb)
  INTO payload FROM public.review_items WHERE user_id = auth.uid();
  RETURN jsonb_build_object('items', payload, 'revision', md5(payload::text));
END $$;

CREATE OR REPLACE FUNCTION public.sync_review_items(p_items jsonb, p_expected_revision text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' SET statement_timeout = '5s' AS $$
DECLARE normalized jsonb; current_state jsonb; owner uuid := auth.uid();
BEGIN
  IF owner IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) > 1000 THEN
    RAISE EXCEPTION 'Invalid review collection' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT FROM jsonb_to_recordset(p_items) AS x("lessonId" text, "moduleId" text, "wrongCount" int, box int)
    WHERE coalesce(length(x."lessonId"), 0) NOT BETWEEN 1 AND 100
       OR coalesce(length(x."moduleId"), 0) NOT BETWEEN 1 AND 100
       OR coalesce(x."wrongCount", 0) < 0 OR coalesce(x.box, 1) NOT BETWEEN 1 AND 5) THEN
    RAISE EXCEPTION 'Invalid review item' USING ERRCODE = '22023';
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'lessonId', x."lessonId", 'moduleId', x."moduleId", 'question', nullif(x.question, ''),
    'wrongCount', coalesce(x."wrongCount", 0), 'box', coalesce(x.box, 1),
    'lastReview', x."lastReview", 'nextReview', x."nextReview"
  ) ORDER BY x."lessonId", x."moduleId", coalesce(x.question, '')), '[]'::jsonb)
  INTO normalized FROM jsonb_to_recordset(p_items) AS x(
    "lessonId" text, "moduleId" text, question text, "wrongCount" int, box int,
    "lastReview" timestamptz, "nextReview" timestamptz);
  IF (SELECT count(*) FROM jsonb_array_elements(normalized)) <>
     (SELECT count(DISTINCT jsonb_build_array(x->>'lessonId', x->>'moduleId', coalesce(x->>'question', ''))) FROM jsonb_array_elements(normalized) x) THEN
    RAISE EXCEPTION 'Duplicate review item' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(owner::text, 20260923));
  current_state := public.get_review_items_state();
  -- Retry after a lost response is a no-op, even with the preceding revision.
  IF current_state->'items' = normalized THEN RETURN current_state->>'revision'; END IF;
  IF p_expected_revision IS DISTINCT FROM current_state->>'revision' THEN
    RAISE EXCEPTION 'Review conflict: reload before retry' USING ERRCODE = '40001';
  END IF;
  DELETE FROM public.review_items WHERE user_id = owner;
  INSERT INTO public.review_items(user_id, lesson_id, module_id, question, wrong_count, box, last_review, next_review)
    SELECT owner, x."lessonId", x."moduleId", x.question, x."wrongCount", x.box, x."lastReview", x."nextReview"
    FROM jsonb_to_recordset(normalized) AS x("lessonId" text, "moduleId" text, question text,
      "wrongCount" int, box smallint, "lastReview" timestamptz, "nextReview" timestamptz);
  RETURN md5(normalized::text);
END $$;

REVOKE ALL ON FUNCTION public.get_review_items_state() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sync_review_items(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_review_items_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_review_items(jsonb, text) TO authenticated;
COMMIT;
