-- Synthetic roles and UUIDs from test-review-sync-fixture.sql, not production accounts.
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
DO $$
DECLARE original text; updated text; state jsonb;
  items jsonb := '[{"lessonId":7,"moduleId":"7-3","question":"Synthetic question","wrongCount":1,"box":2,"lastReview":"2026-09-23","nextReview":"2026-09-25"}]';
BEGIN
  -- Make the fixture rerunnable; deleting only synthetic data in this isolated container.
  PERFORM public.sync_review_items('[]', public.get_review_items_state()->>'revision');
  original := public.get_review_items_state()->>'revision';
  updated := public.sync_review_items(items, original);
  IF public.get_review_items_state()->>'revision' <> updated THEN RAISE EXCEPTION 'revision mismatch'; END IF;
  IF public.sync_review_items(items, original) <> updated THEN RAISE EXCEPTION 'lost-response retry failed'; END IF;
  BEGIN
    PERFORM public.sync_review_items('[]', original);
    RAISE EXCEPTION 'stale writer accepted';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  state := public.get_review_items_state();
  BEGIN
    PERFORM public.sync_review_items('[{"lessonId":"7","moduleId":"_fail","wrongCount":1}]', updated);
    RAISE EXCEPTION 'synthetic insert unexpectedly passed';
  EXCEPTION WHEN check_violation THEN NULL; END;
  IF public.get_review_items_state() <> state THEN RAISE EXCEPTION 'failed insert deleted prior data'; END IF;
  RAISE NOTICE 'PASS: atomicity, conflict rejection, idempotent lost-response retry, matching revision';
END $$;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
DO $$ BEGIN
  IF jsonb_array_length(public.get_review_items_state()->'items') <> 0 THEN RAISE EXCEPTION 'owner isolation failed'; END IF;
  PERFORM public.sync_review_items('[]', public.get_review_items_state()->>'revision');
  RAISE NOTICE 'PASS: account isolation';
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  BEGIN
    PERFORM public.get_review_items_state(); RAISE EXCEPTION 'anon read accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.sync_review_items('[]', ''); RAISE EXCEPTION 'anon write accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE NOTICE 'PASS: anon cannot execute';
END $$;
RESET ROLE;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.review_items) <> 1 THEN RAISE EXCEPTION 'cross-account mutation'; END IF;
END $$;
