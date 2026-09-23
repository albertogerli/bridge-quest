-- Run ONLY on the disposable local stack via scripts/quality-local.mjs.
-- Simulates platform defaults, then replays exported privileges. Rolls back.
BEGIN;
CREATE TABLE public.quality_acl_fixture (visible text, secret text);
REVOKE ALL ON public.quality_acl_fixture FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT (visible) ON public.quality_acl_fixture TO anon;
GRANT ALL ON public.quality_acl_fixture TO service_role;
CREATE SEQUENCE public.quality_acl_sequence;
REVOKE ALL ON SEQUENCE public.quality_acl_sequence FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SEQUENCE public.quality_acl_sequence TO authenticated;
CREATE FUNCTION public.quality_acl_function() RETURNS integer LANGUAGE sql AS 'SELECT 1';
REVOKE ALL ON FUNCTION public.quality_acl_function() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.quality_acl_function() TO authenticated;
DO $$
DECLARE dump text := public.dump_schema(); acl text;
BEGIN
  IF strpos(dump, 'CREATE TRIGGER on_auth_user_created') = 0 THEN
    RAISE EXCEPTION 'Application auth trigger absent from backup';
  END IF;
  acl := substring(dump FROM strpos(dump, E'\n\n-- PERMESSI ESATTI: TABELLE'));
  acl := substring(acl FOR strpos(acl, E'\n\n-- TRIGGER APPLICATIVI SU AUTH') - 1);
  IF length(acl) < 100 THEN RAISE EXCEPTION 'Missing exported ACLs'; END IF;
  GRANT ALL ON public.quality_acl_fixture TO anon, authenticated;
  GRANT ALL ON SEQUENCE public.quality_acl_sequence TO anon;
  GRANT EXECUTE ON FUNCTION public.quality_acl_function() TO anon, PUBLIC;
  EXECUTE acl;
  IF has_table_privilege('anon','public.quality_acl_fixture','SELECT')
    OR NOT has_column_privilege('anon','public.quality_acl_fixture','visible','SELECT')
    OR has_column_privilege('anon','public.quality_acl_fixture','secret','SELECT')
    OR has_function_privilege('anon','public.quality_acl_function()','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.quality_acl_function()','EXECUTE')
    OR has_sequence_privilege('anon','public.quality_acl_sequence','USAGE')
    OR NOT has_sequence_privilege('authenticated','public.quality_acl_sequence','USAGE')
  THEN RAISE EXCEPTION 'Restored ACLs differ from source'; END IF;
  RAISE NOTICE 'PASS: exact column, function and sequence privileges; auth trigger exported';
END $$;
ROLLBACK;
