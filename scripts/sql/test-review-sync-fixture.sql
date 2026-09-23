-- Synthetic local fixture ONLY; never run against a hosted database.
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
CREATE TABLE public.review_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid NOT NULL,
  lesson_id text NOT NULL, module_id text NOT NULL, question text,
  wrong_count integer, box smallint NOT NULL CHECK (box BETWEEN 1 AND 5),
  last_review timestamptz, next_review timestamptz
);
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_reviews ON public.review_items TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_items TO authenticated;
GRANT USAGE ON SEQUENCE public.review_items_id_seq TO authenticated;
CREATE FUNCTION public.fail_test_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NEW.module_id = '_fail' THEN RAISE EXCEPTION 'synthetic insert failure' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fail_test_insert BEFORE INSERT ON public.review_items FOR EACH ROW EXECUTE FUNCTION public.fail_test_insert();
