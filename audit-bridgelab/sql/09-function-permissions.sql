-- Read-only metadata for privileged functions; returns no application rows.
WITH defs AS (
  SELECT
    p.oid,
    p.proname,
    pg_get_function_result(p.oid) AS return_type,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_executable,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_executable,
    coalesce(array_to_string(p.proconfig, ','), '') AS config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prosecdef
)
SELECT
  count(*) AS security_definer_functions,
  count(*) FILTER (WHERE anon_executable) AS anon_executable,
  count(*) FILTER (WHERE authenticated_executable) AS authenticated_executable,
  count(*) FILTER (WHERE config LIKE '%search_path%') AS explicit_search_path,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', proname,
        'return_type', return_type,
        'config', config
      ) ORDER BY proname
    ) FILTER (WHERE anon_executable),
    '[]'::jsonb
  ) AS anon_functions
FROM defs;
