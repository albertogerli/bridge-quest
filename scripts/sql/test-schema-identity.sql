-- Disposable local stack only. Restores fixture DDL and actually inserts a row.
BEGIN;
CREATE TABLE public.quality_identity_fixture (
  id bigint GENERATED ALWAYS AS IDENTITY (START WITH 42 INCREMENT BY 3),
  label text
);
ALTER TABLE public.quality_identity_fixture REPLICA IDENTITY FULL;
DO $$
DECLARE dump text:=public.dump_schema(); ddl text; identity_ddl text; replica_ddl text; actual bigint;
BEGIN
  ddl:=substring(dump FROM 'CREATE TABLE IF NOT EXISTS public.quality_identity_fixture [\s\S]*?\n\);');
  identity_ddl:=substring(dump FROM 'ALTER TABLE public.quality_identity_fixture ALTER COLUMN id ADD GENERATED [^;]+;');
  replica_ddl:=substring(dump FROM 'ALTER TABLE public.quality_identity_fixture REPLICA IDENTITY [^;]+;');
  IF ddl IS NULL OR identity_ddl IS NULL OR replica_ddl IS NULL THEN RAISE EXCEPTION 'Incomplete identity fixture export'; END IF;
  IF strpos(dump,'CREATE SEQUENCE IF NOT EXISTS public.quality_identity_fixture_id_seq;')>0 THEN RAISE EXCEPTION 'Identity sequence exported twice'; END IF;
  DROP TABLE public.quality_identity_fixture;
  EXECUTE ddl; EXECUTE identity_ddl; EXECUTE replica_ddl;
  INSERT INTO public.quality_identity_fixture(label) VALUES ('synthetic') RETURNING id INTO actual;
  IF actual<>42 THEN RAISE EXCEPTION 'Wrong identity start: %',actual; END IF;
  INSERT INTO public.quality_identity_fixture(label) VALUES ('synthetic') RETURNING id INTO actual;
  IF actual<>45 THEN RAISE EXCEPTION 'Wrong identity increment: %',actual; END IF;
  IF (SELECT relreplident FROM pg_class WHERE oid='public.quality_identity_fixture'::regclass)<>'f' THEN RAISE EXCEPTION 'Lost replica identity'; END IF;
  RAISE NOTICE 'PASS: restored generated identity, sequence options and replica identity';
END $$;
ROLLBACK;
