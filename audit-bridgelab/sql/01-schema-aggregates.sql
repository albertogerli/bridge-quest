-- Read-only schema aggregates; returns no row-level or personal data.
WITH public_tables AS (
  SELECT c.oid
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
), constraint_counts AS (
  SELECT
    count(*) FILTER (WHERE con.contype = 'p') AS primary_keys,
    count(*) FILTER (WHERE con.contype = 'f') AS foreign_keys,
    count(*) FILTER (WHERE con.contype = 'c') AS check_constraints,
    count(*) FILTER (WHERE con.contype = 'u') AS unique_constraints
  FROM pg_constraint con
  WHERE con.conrelid IN (SELECT oid FROM public_tables)
)
SELECT
  (SELECT count(*) FROM public_tables) AS public_tables,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity) AS rls_enabled_tables,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') AS indexes,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') AS rls_policies,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public') AS functions,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef) AS security_definer_functions,
  (SELECT count(*) FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND NOT tg.tgisinternal) AS triggers,
  cc.primary_keys,
  cc.foreign_keys,
  cc.check_constraints,
  cc.unique_constraints
FROM constraint_counts cc;

SELECT cmd, count(*) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY cmd
ORDER BY cmd;
