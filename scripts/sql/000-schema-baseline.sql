-- ============================================================================
-- SCHEMA DI RIFERIMENTO — public
--
-- GENERATO AUTOMATICAMENTE. Non modificare a mano: si rigenera con
--   node scripts/dump-schema.mjs
--
-- A cosa serve: ricostruire il database da zero. Gli script numerati in
-- questa cartella sono la STORIA delle modifiche, applicate a mano una alla
-- volta; questo file e' lo STATO attuale, ed e' l'unico punto da cui partire
-- per un ambiente nuovo o un ripristino.
--
-- Ordine di esecuzione su un database vuoto:
--   1. questo file
--   2. i dati di partenza (contenuti didattici, catalogo circoli)
--
-- Rigenerare e committare dopo OGNI modifica allo schema, insieme allo script
-- che l'ha causata.
--
-- Estratto il: 2026-08-13
-- ============================================================================

SET check_function_bodies = false;

-- ESTENSIONI
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SEQUENZE
CREATE SEQUENCE IF NOT EXISTS public.asd_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.badges_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.completed_modules_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.email_events_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.forum_comments_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.forum_likes_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.forum_poll_votes_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.forum_posts_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.friendships_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.push_subscriptions_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.review_items_id_seq;

-- TABELLE (senza valori predefiniti: vedi più avanti)
CREATE TABLE IF NOT EXISTS public.asd (
  id integer NOT NULL,
  name text NOT NULL,
  active boolean
);

CREATE TABLE IF NOT EXISTS public.asd_clubs (
  code text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  active boolean NOT NULL,
  has_school boolean NOT NULL,
  region text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  cap text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid NOT NULL,
  class_id uuid NOT NULL,
  title text NOT NULL,
  instructor_note text,
  smazzata_ids text[] NOT NULL,
  due_date timestamp with time zone,
  mode text NOT NULL,
  unlock_mode text NOT NULL,
  live_active_index integer,
  created_at timestamp with time zone NOT NULL,
  custom_hands jsonb
);

CREATE TABLE IF NOT EXISTS public.badges (
  id bigint NOT NULL,
  user_id uuid,
  badge_id text NOT NULL,
  earned_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.bbo_username_cleanup_2026_08 (
  profile_id uuid NOT NULL,
  old_bbo_username text NOT NULL,
  reason text NOT NULL,
  cleared_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid NOT NULL,
  challenger_id uuid NOT NULL,
  opponent_id uuid,
  status text NOT NULL,
  board_count integer NOT NULL,
  hands jsonb NOT NULL,
  challenger_results jsonb,
  opponent_results jsonb,
  challenger_imps integer,
  opponent_imps integer,
  created_at timestamp with time zone,
  completed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.class_members (
  class_id uuid NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL,
  joined_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.class_messages (
  id uuid NOT NULL,
  class_id uuid NOT NULL,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.classes (
  id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  asd_code text,
  name text NOT NULL,
  description text,
  invite_code text NOT NULL,
  invite_active boolean NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.collectible_cards (
  id text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  rarity text NOT NULL,
  emoji text NOT NULL,
  gradient text NOT NULL,
  unlock_condition text NOT NULL,
  unlock jsonb NOT NULL,
  "position" integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.completed_modules (
  id bigint NOT NULL,
  user_id uuid,
  lesson_id text NOT NULL,
  module_id text NOT NULL,
  completed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.course_worlds (
  id integer NOT NULL,
  course_id text NOT NULL,
  name text NOT NULL,
  subtitle text,
  icon text,
  gradient text,
  icon_bg text,
  "position" integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courses (
  id text NOT NULL,
  name text NOT NULL,
  subtitle text,
  icon text,
  color text,
  gradient text,
  level text NOT NULL,
  "position" integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.email_events (
  id bigint NOT NULL,
  user_id uuid NOT NULL,
  email_type text NOT NULL,
  sent_at timestamp with time zone NOT NULL,
  meta jsonb
);

CREATE TABLE IF NOT EXISTS public.eserciziario_exercises (
  id text NOT NULL,
  lesson_id integer NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  "position" integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.forum_comments (
  id bigint NOT NULL,
  post_id bigint,
  user_id uuid,
  body text NOT NULL,
  likes_count integer,
  created_at timestamp with time zone,
  parent_id bigint
);

CREATE TABLE IF NOT EXISTS public.forum_likes (
  id bigint NOT NULL,
  user_id uuid,
  post_id bigint,
  comment_id bigint,
  created_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.forum_poll_votes (
  id bigint NOT NULL,
  post_id bigint NOT NULL,
  user_id uuid NOT NULL,
  option_index integer NOT NULL,
  created_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id bigint NOT NULL,
  user_id uuid,
  category text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  likes_count integer,
  comments_count integer,
  pinned boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  poll_options jsonb
);

CREATE TABLE IF NOT EXISTS public.friendships (
  id bigint NOT NULL,
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text NOT NULL,
  created_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.game_results (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  game_type text NOT NULL,
  lesson_id integer,
  score integer NOT NULL,
  details jsonb,
  created_at timestamp with time zone,
  platform text,
  assignment_id uuid
);

CREATE TABLE IF NOT EXISTS public.glossary (
  id text NOT NULL,
  term text NOT NULL,
  definition text NOT NULL,
  emoji text NOT NULL,
  category text NOT NULL,
  example text,
  cards text,
  related_terms text[] NOT NULL,
  quiz jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.guided_hands (
  id integer NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL,
  hands jsonb NOT NULL,
  contract text NOT NULL,
  declarer text NOT NULL,
  opening_lead jsonb NOT NULL,
  hints jsonb NOT NULL,
  tricks_needed integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.instructor_requests (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL,
  message text,
  asd_code text,
  created_at timestamp with time zone NOT NULL,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  review_message text
);

CREATE TABLE IF NOT EXISTS public.lesson_modules (
  lesson_id integer NOT NULL,
  module_id text NOT NULL,
  title text NOT NULL,
  icon text,
  duration_minutes integer,
  module_type text NOT NULL,
  xp_reward integer NOT NULL,
  content jsonb NOT NULL,
  "position" integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id integer NOT NULL,
  world_id integer NOT NULL,
  title text NOT NULL,
  subtitle text,
  icon text,
  "position" integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.live_tables (
  id uuid NOT NULL,
  class_id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  hands jsonb NOT NULL,
  titolo text,
  contract text,
  declarer text,
  revealed text[] NOT NULL,
  seat_of jsonb NOT NULL,
  show_contract boolean NOT NULL,
  closed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  logged_in_at timestamp with time zone NOT NULL,
  platform text
);

CREATE TABLE IF NOT EXISTS public.partner_profiles (
  user_id uuid NOT NULL,
  looking boolean NOT NULL,
  level text NOT NULL,
  province text,
  availability text[] NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  username text,
  display_name text,
  bbo_username text,
  avatar_url text,
  asd_id integer,
  profile_type text,
  xp integer,
  streak integer,
  last_login date,
  hands_played integer,
  text_size text,
  anim_speed text,
  sound_on boolean,
  memory_best integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  marketing_consent boolean,
  marketing_consent_date timestamp with time zone,
  total_minutes integer,
  platform text,
  asd_code text,
  asd_name text,
  role text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id bigint NOT NULL,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.review_items (
  id bigint NOT NULL,
  user_id uuid,
  lesson_id text NOT NULL,
  module_id text NOT NULL,
  question text,
  wrong_count integer,
  last_review timestamp with time zone,
  next_review timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.smazzate (
  id text NOT NULL,
  lesson_id integer NOT NULL,
  board integer NOT NULL,
  title text NOT NULL,
  contract text NOT NULL,
  declarer text NOT NULL,
  vulnerability text NOT NULL,
  opening_lead jsonb NOT NULL,
  hands jsonb NOT NULL,
  bidding jsonb,
  commentary text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  dd_tricks smallint
);

CREATE TABLE IF NOT EXISTS public.tournament_results (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  week_num integer NOT NULL,
  total_tricks integer NOT NULL,
  total_needed integer NOT NULL,
  completed_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.trova_errore_scenarios (
  id integer NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  situation text NOT NULL,
  cards text,
  sequence text[],
  error_description text NOT NULL,
  options text[] NOT NULL,
  correct_answer integer NOT NULL,
  explanation text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id integer NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  gradient text NOT NULL,
  xp_multiplier real NOT NULL,
  badge_name text NOT NULL,
  tips text[] NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL
);

-- APPARTENENZA DELLE SEQUENZE
ALTER SEQUENCE public.asd_id_seq OWNED BY public.asd.id;
ALTER SEQUENCE public.badges_id_seq OWNED BY public.badges.id;
ALTER SEQUENCE public.completed_modules_id_seq OWNED BY public.completed_modules.id;
ALTER SEQUENCE public.forum_comments_id_seq OWNED BY public.forum_comments.id;
ALTER SEQUENCE public.forum_likes_id_seq OWNED BY public.forum_likes.id;
ALTER SEQUENCE public.forum_posts_id_seq OWNED BY public.forum_posts.id;
ALTER SEQUENCE public.review_items_id_seq OWNED BY public.review_items.id;

-- FUNZIONI
CREATE OR REPLACE FUNCTION public.admin_class_detail(p_class_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'members', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object('id', m.student_id, 'name', p.display_name, 'joined_at', m.joined_at)
        ORDER BY m.joined_at
      ), '[]'::jsonb)
      FROM class_members m
      JOIN profiles p ON p.id = m.student_id
      WHERE m.class_id = p_class_id AND m.status = 'active'
    ),
    'assignments', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', a.id, 'title', a.title, 'created_at', a.created_at,
          'hands', coalesce(array_length(a.smazzata_ids, 1), 0)
        ) ORDER BY a.created_at DESC
      ), '[]'::jsonb)
      FROM assignments a
      WHERE a.class_id = p_class_id
    )
  ) INTO result;

  RETURN result;
END $function$
;

CREATE OR REPLACE FUNCTION public.admin_game_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_totals  jsonb;
  v_by_game jsonb;
  v_daily   jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  -- Overall counters
  SELECT jsonb_build_object(
    'plays',       count(*),
    'playsToday',  count(*) FILTER (WHERE created_at >= date_trunc('day', now())),
    'plays7d',     count(*) FILTER (WHERE created_at >= now() - interval '7 days'),
    'players',     count(DISTINCT user_id),
    'players7d',   count(DISTINCT user_id) FILTER (WHERE created_at >= now() - interval '7 days')
  ) INTO v_totals
  FROM game_results;

  -- Per game type, most played first
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'game',       g.game_type,
    'plays',      g.plays,
    'plays7d',    g.plays7d,
    'players',    g.players,
    'avgScore',   g.avg_score,
    'lastPlayed', g.last_played
  ) ORDER BY g.plays DESC), '[]'::jsonb) INTO v_by_game
  FROM (
    SELECT game_type,
           count(*)::int AS plays,
           (count(*) FILTER (WHERE created_at >= now() - interval '7 days'))::int AS plays7d,
           count(DISTINCT user_id)::int AS players,
           round(avg(score))::int AS avg_score,
           max(created_at)::date AS last_played
    FROM game_results
    GROUP BY game_type
  ) g;

  -- Daily trend, last 30 days (zero-filled via generate_series)
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'date',    d.day,
    'plays',   coalesce(s.plays, 0),
    'players', coalesce(s.players, 0)
  ) ORDER BY d.day), '[]'::jsonb) INTO v_daily
  FROM generate_series(
    (now() - interval '29 days')::date, now()::date, interval '1 day'
  ) AS d(day)
  LEFT JOIN (
    SELECT created_at::date AS day,
           count(*)::int AS plays,
           count(DISTINCT user_id)::int AS players
    FROM game_results
    WHERE created_at >= (now() - interval '29 days')::date
    GROUP BY 1
  ) s ON s.day = d.day;

  RETURN jsonb_build_object(
    'totals', v_totals,
    'byGame', v_by_game,
    'daily',  v_daily
  );
END $function$
;

CREATE OR REPLACE FUNCTION public.admin_list_classes()
 RETURNS TABLE(id uuid, name text, asd_code text, invite_code text, invite_active boolean, instructor_id uuid, instructor_name text, instructor_email text, member_count bigint, assignment_count bigint, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    c.id, c.name, c.asd_code, c.invite_code, c.invite_active,
    c.instructor_id, p.display_name, u.email::text,
    (SELECT count(*) FROM class_members m WHERE m.class_id = c.id AND m.status = 'active'),
    (SELECT count(*) FROM assignments a WHERE a.class_id = c.id),
    c.created_at
  FROM classes c
  JOIN profiles p ON p.id = c.instructor_id
  JOIN auth.users u ON u.id = c.instructor_id
  ORDER BY c.created_at DESC;
END $function$
;

CREATE OR REPLACE FUNCTION public.admin_list_users()
 RETURNS TABLE(id uuid, display_name text, bbo_username text, profile_type text, xp integer, streak integer, hands_played integer, asd_code text, asd_name text, marketing_consent boolean, total_minutes integer, created_at timestamp with time zone, last_login date, platform text, role text, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Accesso negato: richiesti privilegi di amministratore';
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.display_name, p.bbo_username, p.profile_type, p.xp, p.streak,
    p.hands_played, p.asd_code, p.asd_name, p.marketing_consent,
    p.total_minutes, p.created_at, p.last_login, p.platform, p.role,
    u.email::text
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_login_history(p_days integer DEFAULT 30)
 RETURNS TABLE(user_id uuid, logged_in_at timestamp with time zone, platform text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT h.user_id, h.logged_in_at, h.platform
  FROM login_history h
  WHERE h.logged_in_at >= now() - (least(greatest(coalesce(p_days, 30), 1), 365) || ' days')::interval
  ORDER BY h.logged_in_at DESC;
END
$function$
;

CREATE OR REPLACE FUNCTION public.admin_school_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_classes     int;
  v_students    int;
  v_assignments int;
  v_expected    bigint;
  v_done        bigint;
  best_student  jsonb;
  best_teacher  jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_classes FROM classes;
  SELECT count(DISTINCT student_id) INTO v_students FROM class_members WHERE status = 'active';
  SELECT count(*) INTO v_assignments FROM assignments;

  -- Expected completions = for each assignment, (active members) * (number of hands)
  SELECT coalesce(sum(
    (SELECT count(*) FROM class_members m WHERE m.class_id = a.class_id AND m.status = 'active')
    * coalesce(array_length(a.smazzata_ids, 1), 0)
  ), 0) INTO v_expected
  FROM assignments a;

  -- Done = distinct (student, assignment, hand) results recorded
  SELECT count(*) INTO v_done FROM (
    SELECT DISTINCT gr.user_id, gr.assignment_id, gr.details->>'smazzata_id'
    FROM game_results gr
    WHERE gr.assignment_id IS NOT NULL
  ) t;

  -- Best student: most assignment hands completed
  SELECT jsonb_build_object('name', p.display_name, 'completed', s.cnt) INTO best_student
  FROM (
    SELECT gr.user_id,
           count(DISTINCT (gr.assignment_id::text || coalesce(gr.details->>'smazzata_id', ''))) AS cnt
    FROM game_results gr
    WHERE gr.assignment_id IS NOT NULL
    GROUP BY gr.user_id
    ORDER BY cnt DESC
    LIMIT 1
  ) s
  JOIN profiles p ON p.id = s.user_id;

  -- Best teacher: most active students across their classes
  SELECT jsonb_build_object('name', p.display_name, 'students', t.scnt, 'classes', t.ccnt) INTO best_teacher
  FROM (
    SELECT c.instructor_id,
           count(DISTINCT m.student_id) FILTER (WHERE m.status = 'active') AS scnt,
           count(DISTINCT c.id) AS ccnt
    FROM classes c
    LEFT JOIN class_members m ON m.class_id = c.id
    GROUP BY c.instructor_id
    ORDER BY scnt DESC, ccnt DESC
    LIMIT 1
  ) t
  JOIN profiles p ON p.id = t.instructor_id;

  RETURN jsonb_build_object(
    'classes', v_classes,
    'students', v_students,
    'assignments', v_assignments,
    'completionPct', CASE WHEN v_expected > 0 THEN round(100.0 * v_done / v_expected) ELSE 0 END,
    'bestStudent', best_student,
    'bestTeacher', best_teacher
  );
END $function$
;

CREATE OR REPLACE FUNCTION public.dump_schema()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  out text := '';
BEGIN
  -- Ordine studiato su un database VUOTO, verificato eseguendolo davvero:
  --   sequenze -> tabelle (senza valori predefiniti) -> funzioni ->
  --   valori predefiniti -> vincoli -> indici -> trigger -> RLS -> policy.
  -- I due nodi: una tabella puo' avere un DEFAULT che chiama una funzione
  -- (classes.invite_code), e una funzione puo' RESTITUIRE il tipo di una
  -- tabella (SETOF profiles). Le due dipendenze vanno in direzioni opposte, e
  -- si sciolgono staccando i valori predefiniti dalla CREATE TABLE.
  out := out || E'SET check_function_bodies = false;\n\n';

  out := out || E'-- ESTENSIONI\n';
  SELECT out || coalesce(string_agg(
    'CREATE EXTENSION IF NOT EXISTS ' || quote_ident(extname) || ';', E'\n' ORDER BY extname), '')
    INTO out FROM pg_extension WHERE extname <> 'plpgsql';

  out := out || E'\n\n-- SEQUENZE\n';
  SELECT out || coalesce(string_agg(
    'CREATE SEQUENCE IF NOT EXISTS public.' || quote_ident(c.relname) || ';', E'\n' ORDER BY c.relname), '')
    INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'S';

  out := out || E'\n\n-- TABELLE (senza valori predefiniti: vedi più avanti)\n';
  SELECT out || coalesce(string_agg(ddl, E'\n\n' ORDER BY tbl), '') INTO out FROM (
    SELECT c.relname AS tbl,
      'CREATE TABLE IF NOT EXISTS public.' || quote_ident(c.relname) || E' (\n' ||
      string_agg('  ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
        || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END, E',\n' ORDER BY a.attnum)
      || E'\n);' AS ddl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    GROUP BY c.relname) t;

  out := out || E'\n\n-- APPARTENENZA DELLE SEQUENZE\n';
  SELECT out || coalesce(string_agg(
    'ALTER SEQUENCE public.' || quote_ident(s.relname) || ' OWNED BY public.'
    || quote_ident(t.relname) || '.' || quote_ident(a.attname) || ';', E'\n' ORDER BY s.relname), '')
    INTO out
  FROM pg_class s
  JOIN pg_namespace n ON n.oid = s.relnamespace AND n.nspname = 'public' AND s.relkind = 'S'
  JOIN pg_depend d ON d.objid = s.oid AND d.deptype = 'a'
  JOIN pg_class t ON t.oid = d.refobjid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid;

  out := out || E'\n\n-- FUNZIONI\n';
  SELECT out || coalesce(string_agg(pg_get_functiondef(p.oid) || ';', E'\n\n' ORDER BY p.proname), '') INTO out
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f';

  out := out || E'\n\n-- VALORI PREDEFINITI\n';
  SELECT out || coalesce(string_agg(
    'ALTER TABLE public.' || quote_ident(c.relname) || ' ALTER COLUMN '
    || quote_ident(a.attname) || ' SET DEFAULT ' || pg_get_expr(d.adbin, d.adrelid) || ';',
    E'\n' ORDER BY c.relname, a.attnum), '') INTO out
  FROM pg_attrdef d
  JOIN pg_class c ON c.oid = d.adrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
  WHERE n.nspname = 'public' AND c.relkind = 'r';

  out := out || E'\n\n-- VINCOLI\n';
  SELECT out || coalesce(string_agg(
    'ALTER TABLE public.' || quote_ident(c.relname) || ' ADD CONSTRAINT '
    || quote_ident(con.conname) || ' ' || pg_get_constraintdef(con.oid) || ';',
    E'\n' ORDER BY CASE con.contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 WHEN 'c' THEN 3 ELSE 4 END,
    c.relname, con.conname), '') INTO out
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public';

  out := out || E'\n\n-- INDICI\n';
  SELECT out || coalesce(string_agg(indexdef || ';', E'\n' ORDER BY indexname), '') INTO out
  FROM pg_indexes WHERE schemaname = 'public'
    AND indexname NOT IN (SELECT conname FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n2 ON n2.oid = c.relnamespace WHERE n2.nspname = 'public');

  out := out || E'\n\n-- TRIGGER\n';
  SELECT out || coalesce(string_agg(pg_get_triggerdef(t.oid) || ';', E'\n' ORDER BY t.tgname), '') INTO out
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal;

  out := out || E'\n\n-- ROW LEVEL SECURITY\n';
  SELECT out || coalesce(string_agg(
    'ALTER TABLE public.' || quote_ident(c.relname) || ' ENABLE ROW LEVEL SECURITY;',
    E'\n' ORDER BY c.relname), '') INTO out
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity;

  out := out || E'\n\n-- POLICY\n';
  SELECT out || coalesce(string_agg(
    'CREATE POLICY ' || quote_ident(policyname) || ' ON public.' || quote_ident(tablename)
    || ' AS ' || permissive || ' FOR ' || cmd
    || ' TO ' || array_to_string(roles, ', ')
    || coalesce(' USING (' || qual || ')', '')
    || coalesce(' WITH CHECK (' || with_check || ')', '') || ';',
    E'\n' ORDER BY tablename, policyname), '') INTO out
  FROM pg_policies WHERE schemaname = 'public';

  out := out || E'\n\n-- PERMESSI SULLE TABELLE\n';
  SELECT out || coalesce(string_agg(stmt, E'\n' ORDER BY stmt), '') INTO out FROM (
    SELECT DISTINCT 'GRANT ' || privilege_type || ' ON public.' || quote_ident(table_name)
      || ' TO ' || grantee || ';' AS stmt
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'service_role')) g;

  out := out || E'\n\n-- PERMESSI SULLE FUNZIONI\n';
  SELECT out || coalesce(string_agg(
    'REVOKE ALL ON FUNCTION public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid)
    || ') FROM PUBLIC;' || coalesce(E'\n' || acl, ''), E'\n' ORDER BY p.proname), '') INTO out
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  LEFT JOIN LATERAL (
    SELECT string_agg('GRANT EXECUTE ON FUNCTION public.' || p.proname || '('
      || pg_get_function_identity_arguments(p.oid) || ') TO ' || grantee || ';', E'\n') AS acl
    FROM (SELECT (aclexplode(p.proacl)).grantee::regrole::text AS grantee) g
    WHERE grantee NOT IN ('postgres', '-')
  ) a ON true
  WHERE n.nspname = 'public' AND p.prokind = 'f';

  out := out || E'\n\n-- PUBLICATION (Realtime)\n';
  SELECT out || coalesce(string_agg(
    'ALTER PUBLICATION ' || quote_ident(pubname) || ' ADD TABLE public.' || quote_ident(tablename) || ';',
    E'\n' ORDER BY pubname, tablename), '') INTO out
  FROM pg_publication_tables WHERE schemaname = 'public';

  RETURN out;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_invite_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code     text := '';
  i        int;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
  END LOOP;
  RETURN code;
END $function$
;

CREATE OR REPLACE FUNCTION public.get_challenge_history(p_user_id uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, challenger_id uuid, opponent_id uuid, status text, board_count integer, created_at timestamp with time zone, completed_at timestamp with time zone, challenger_imps integer, opponent_imps integer, challenger_name text, challenger_avatar text, opponent_name text, opponent_avatar text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    c.id,
    c.challenger_id,
    c.opponent_id,
    c.status,
    c.board_count,
    c.created_at,
    c.completed_at,
    c.challenger_imps,
    c.opponent_imps,
    pc.display_name  AS challenger_name,
    pc.avatar_url    AS challenger_avatar,
    po.display_name  AS opponent_name,
    po.avatar_url    AS opponent_avatar
  FROM challenges c
  LEFT JOIN profiles pc ON pc.id = c.challenger_id
  LEFT JOIN profiles po ON po.id = c.opponent_id
  WHERE
    (c.challenger_id = p_user_id OR c.opponent_id = p_user_id)
    AND c.status = 'completed'
  ORDER BY c.completed_at DESC
  LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.get_challenge_stats(p_user_id uuid)
 RETURNS TABLE(played integer, won integer, lost integer, drawn integer, avg_imp_margin numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(*)::int AS played,

    COUNT(*) FILTER (WHERE
      -- User is challenger and scored higher
      (c.challenger_id = p_user_id AND c.challenger_imps > c.opponent_imps)
      OR
      -- User is opponent and scored higher
      (c.opponent_id = p_user_id AND c.opponent_imps > c.challenger_imps)
    )::int AS won,

    COUNT(*) FILTER (WHERE
      (c.challenger_id = p_user_id AND c.challenger_imps < c.opponent_imps)
      OR
      (c.opponent_id = p_user_id AND c.opponent_imps < c.challenger_imps)
    )::int AS lost,

    COUNT(*) FILTER (WHERE
      c.challenger_imps = c.opponent_imps
    )::int AS drawn,

    ROUND(AVG(
      CASE
        WHEN c.challenger_id = p_user_id
          THEN c.challenger_imps - c.opponent_imps
        ELSE
          c.opponent_imps - c.challenger_imps
      END
    ), 1) AS avg_imp_margin

  FROM challenges c
  WHERE
    (c.challenger_id = p_user_id OR c.opponent_id = p_user_id)
    AND c.status = 'completed'
    AND c.challenger_imps IS NOT NULL
    AND c.opponent_imps IS NOT NULL;
$function$
;

CREATE OR REPLACE FUNCTION public.get_class_leaderboard(p_class_id uuid)
 RETURNS TABLE(student_id uuid, student_name text, hands_made integer, hands_played integer, total_tricks integer, total_ms bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (is_member_of_class(p_class_id) OR is_instructor_of_class(p_class_id)) THEN
    RAISE EXCEPTION 'not authorized for class %', p_class_id USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH first_attempt AS (
    -- one row per (student, assignment, hand): the FIRST attempt
    SELECT DISTINCT ON (gr.user_id, gr.assignment_id, gr.details->>'smazzata_id')
      gr.user_id,
      (gr.score >= 0)                                  AS made,
      COALESCE((gr.details->>'tricksMade')::int, 0)    AS tricks,
      COALESCE((gr.details->>'durationMs')::bigint, 0) AS ms
    FROM game_results gr
    JOIN assignments a ON a.id = gr.assignment_id
    WHERE a.class_id = p_class_id
      AND gr.assignment_id IS NOT NULL
      AND gr.details->>'smazzata_id' IS NOT NULL
    ORDER BY gr.user_id, gr.assignment_id, gr.details->>'smazzata_id', gr.created_at ASC
  )
  SELECT
    fa.user_id                                         AS student_id,
    p.display_name                                     AS student_name,
    SUM(CASE WHEN fa.made THEN 1 ELSE 0 END)::int      AS hands_made,
    COUNT(*)::int                                      AS hands_played,
    SUM(fa.tricks)::int                                AS total_tricks,
    SUM(fa.ms)::bigint                                 AS total_ms
  FROM first_attempt fa
  JOIN profiles p ON p.id = fa.user_id
  GROUP BY fa.user_id, p.display_name
  ORDER BY hands_made DESC, total_tricks DESC, total_ms ASC;
END $function$
;

CREATE OR REPLACE FUNCTION public.get_class_results(p_assignment_id uuid)
 RETURNS TABLE(student_id uuid, student_name text, smazzata_id text, score integer, details jsonb, played_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- ASC = the FIRST attempt wins (was DESC = latest).
  ORDER BY gr.user_id, gr.details->>'smazzata_id', gr.created_at ASC;
END $function$
;

CREATE OR REPLACE FUNCTION public.get_club_leaderboard(p_asd_code text)
 RETURNS TABLE(id uuid, display_name text, xp integer, avatar_url text, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.display_name, p.xp, p.avatar_url, p.updated_at
  FROM profiles p
  WHERE p.asd_code = p_asd_code AND p.display_name IS NOT NULL
  ORDER BY p.xp DESC LIMIT 100;
$function$
;

CREATE OR REPLACE FUNCTION public.get_club_stats(p_asd_code text)
 RETURNS TABLE(member_count integer, total_xp bigint, avg_xp integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::int, COALESCE(SUM(xp), 0), COALESCE(AVG(xp), 0)::int
  FROM profiles WHERE asd_code = p_asd_code AND display_name IS NOT NULL;
$function$
;

CREATE OR REPLACE FUNCTION public.get_daily_field_stats(p_date text)
 RETURNS TABLE(result integer, players integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END $function$
;

CREATE OR REPLACE FUNCTION public.get_engagement_targets(p_limit integer DEFAULT 300)
 RETURNS TABLE(user_id uuid, email text, display_name text, profile_type text, kind text, ctx jsonb)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT
      p.id,
      u.email,
      p.display_name,
      p.profile_type::text                              AS profile_type,
      p.created_at,
      p.last_login,
      COALESCE(p.streak, 0)                             AS streak,
      COALESCE(p.marketing_consent, false)              AS consent,
      (SELECT count(*) FROM public.completed_modules cm WHERE cm.user_id = p.id) AS modules_done
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email IS NOT NULL
      AND u.email_confirmed_at IS NOT NULL
      AND COALESCE(u.banned_until, now() - interval '1 day') < now()
  ),
  scored AS (
    SELECT b.*,
      CASE
        -- (1) Streak at risk: had a real streak, active YESTERDAY but not today.
        WHEN b.consent
             AND b.streak >= 3
             AND b.last_login IS NOT NULL
             AND (b.last_login AT TIME ZONE 'Europe/Rome')::date
                   = (now() AT TIME ZONE 'Europe/Rome')::date - 1
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'streak_risk'
                               AND e.sent_at > now() - interval '20 hours')
          THEN 'streak_risk'
        -- (2) Onboarding: signed up 1-5 days ago, barely started, never nudged.
        WHEN b.consent
             AND b.created_at < now() - interval '20 hours'
             AND b.created_at > now() - interval '5 days'
             AND b.modules_done < 2
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'onboarding_start')
          THEN 'onboarding_start'
        -- (3) Inactive ~14 days.
        WHEN b.consent
             AND b.last_login IS NOT NULL
             AND b.last_login < now() - interval '14 days'
             AND b.last_login > now() - interval '45 days'
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'inactive_14'
                               AND e.sent_at > now() - interval '30 days')
          THEN 'inactive_14'
        -- (4) Inactive ~7 days.
        WHEN b.consent
             AND b.last_login IS NOT NULL
             AND b.last_login < now() - interval '7 days'
             AND b.last_login > now() - interval '14 days'
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'inactive_7'
                               AND e.sent_at > now() - interval '20 days')
          THEN 'inactive_7'
        ELSE NULL
      END AS kind
    FROM base b
  )
  SELECT
    id AS user_id,
    email,
    display_name,
    profile_type,
    kind,
    jsonb_build_object(
      'streak', streak,
      'modules_done', modules_done,
      'days_inactive',
        CASE WHEN last_login IS NOT NULL
             THEN GREATEST(0, (EXTRACT(EPOCH FROM (now() - last_login)) / 86400)::int)
             ELSE NULL END
    ) AS ctx
  FROM scored
  WHERE kind IS NOT NULL
  ORDER BY
    CASE kind
      WHEN 'streak_risk' THEN 1
      WHEN 'onboarding_start' THEN 2
      WHEN 'inactive_14' THEN 3
      WHEN 'inactive_7' THEN 4
      ELSE 5
    END
  LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.get_game_leaderboard(p_game_type text, p_limit integer DEFAULT 50)
 RETURNS TABLE(user_id uuid, display_name text, best_score integer, games_played bigint, last_played timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
       SELECT
         gr.user_id,
         p.display_name,
         MAX(gr.score)::int AS best_score,
         COUNT(*)::bigint AS games_played,
         MAX(gr.created_at) AS last_played
       FROM game_results gr
       JOIN profiles p ON p.id = gr.user_id
       WHERE gr.game_type = p_game_type
         AND p.display_name IS NOT NULL
       GROUP BY gr.user_id, p.display_name
       ORDER BY best_score DESC
       LIMIT p_limit;
     $function$
;

CREATE OR REPLACE FUNCTION public.get_own_profile()
 RETURNS SETOF profiles
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_pending_challenges(p_user_id uuid)
 RETURNS TABLE(id uuid, challenger_id uuid, opponent_id uuid, status text, board_count integer, created_at timestamp with time zone, challenger_name text, challenger_avatar text, opponent_name text, opponent_avatar text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    c.id,
    c.challenger_id,
    c.opponent_id,
    c.status,
    c.board_count,
    c.created_at,
    pc.display_name  AS challenger_name,
    pc.avatar_url    AS challenger_avatar,
    po.display_name  AS opponent_name,
    po.avatar_url    AS opponent_avatar
  FROM challenges c
  LEFT JOIN profiles pc ON pc.id = c.challenger_id
  LEFT JOIN profiles po ON po.id = c.opponent_id
  WHERE
    (c.challenger_id = p_user_id OR c.opponent_id = p_user_id)
    AND c.status IN ('pending', 'accepted', 'playing')
  ORDER BY c.created_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Bridgista'));
    RETURN NEW;
  END;
  $function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_bbo_username_taken(p_bbo_username text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN coalesce(btrim(p_bbo_username), '') = '' THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.bbo_username IS NOT NULL
        AND lower(btrim(p.bbo_username)) = lower(btrim(p_bbo_username))
        AND p.id IS DISTINCT FROM auth.uid()
    )
  END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_instructor_of_assignment(p_assignment_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM assignments a
    JOIN classes c ON c.id = a.class_id
    WHERE a.id = p_assignment_id AND c.instructor_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_instructor_of_class(p_class_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = p_class_id AND c.instructor_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_member_of_class(p_class_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM class_members m
    WHERE m.class_id = p_class_id
      AND m.student_id = auth.uid()
      AND m.status = 'active'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.join_class_by_code(p_code text)
 RETURNS classes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  declare
    c classes;
  begin
    if auth.uid() is null then
      raise exception 'not authenticated' using errcode = '42501';
    end if;

    select * into c
    from classes
    where invite_code = upper(trim(p_code)) and invite_active = true;

    if c.id is null then
      raise exception 'invalid invite code' using errcode = 'P0002';
    end if;

    insert into class_members (class_id, student_id, status)
    values (c.id, auth.uid(), 'active')
    on conflict (class_id, student_id) do update set status = 'active';

    return c;
  end $function$
;

CREATE OR REPLACE FUNCTION public.list_instructor_requests(p_status text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, email text, status text, message text, asd_code text, created_at timestamp with time zone, review_message text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT r.id, r.user_id, p.display_name, u.email::text, r.status, r.message, r.asd_code, r.created_at, r.review_message
  FROM instructor_requests r
  JOIN profiles p ON p.id = r.user_id
  JOIN auth.users u ON u.id = r.user_id
  WHERE p_status IS NULL OR r.status = p_status
  ORDER BY r.created_at DESC;
END $function$
;

CREATE OR REPLACE FUNCTION public.list_partner_candidates(p_level text DEFAULT NULL::text, p_province text DEFAULT NULL::text, p_availability text[] DEFAULT NULL::text[], p_limit integer DEFAULT 60)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, asd_name text, level text, province text, availability text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT pp.user_id, p.display_name, p.avatar_url, p.asd_name,
         pp.level, pp.province, pp.availability
  FROM public.partner_profiles pp
  JOIN public.profiles p ON p.id = pp.user_id
  WHERE auth.uid() IS NOT NULL          -- mai per anonimi
    AND pp.looking
    AND pp.user_id <> auth.uid()        -- mai sé stessi
    AND (p_level    IS NULL OR pp.level = p_level)
    AND (p_province IS NULL OR pp.province = p_province)
    -- Sovrapposizione, non uguaglianza: basta una fascia in comune.
    AND (p_availability IS NULL OR pp.availability && p_availability)
    -- Fuori chi è già in contatto: l'elenco serve a trovare gente nuova.
    AND NOT EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = pp.user_id)
         OR (f.friend_id = auth.uid() AND f.user_id = pp.user_id)
    )
  ORDER BY
    -- Chi è nella stessa provincia di chi cerca viene prima.
    (pp.province IS NOT DISTINCT FROM (
      SELECT province FROM public.partner_profiles WHERE user_id = auth.uid()
    )) DESC,
    p.last_login DESC NULLS LAST
  LIMIT least(greatest(coalesce(p_limit, 60), 1), 100);
$function$
;

CREATE OR REPLACE FUNCTION public.live_table_open(p_class_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT t.id
  FROM public.live_tables t
  WHERE t.class_id = p_class_id
    AND t.closed_at IS NULL
    AND (
      t.instructor_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.class_members m
                 WHERE m.class_id = t.class_id AND m.student_id = auth.uid())
    )
  ORDER BY t.created_at DESC
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.live_table_view(p_table_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t          public.live_tables%ROWTYPE;
  v_is_owner boolean;
  v_is_member boolean;
  v_seat     text;
  v_visible  text[];
  v_hands    jsonb := '{}'::jsonb;
  s          text;
BEGIN
  SELECT * INTO t FROM public.live_tables WHERE id = p_table_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_is_owner := (t.instructor_id = auth.uid());
  SELECT EXISTS (
    SELECT 1 FROM public.class_members m
    WHERE m.class_id = t.class_id AND m.student_id = auth.uid()
  ) INTO v_is_member;

  IF NOT v_is_owner AND NOT v_is_member THEN
    RETURN NULL;
  END IF;

  v_seat := t.seat_of ->> auth.uid()::text;

  IF v_is_owner THEN
    v_visible := ARRAY['north','east','south','west'];
  ELSE
    v_visible := t.revealed;
    IF v_seat IS NOT NULL AND NOT (v_seat = ANY(v_visible)) THEN
      v_visible := array_append(v_visible, v_seat);
    END IF;
  END IF;

  FOREACH s IN ARRAY v_visible LOOP
    IF t.hands ? s THEN
      v_hands := v_hands || jsonb_build_object(s, t.hands -> s);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'id',            t.id,
    'classId',       t.class_id,
    'titolo',        t.titolo,
    'hands',         v_hands,
    'revealed',      to_jsonb(t.revealed),
    'seat',          v_seat,
    'isInstructor',  v_is_owner,
    'contract',      CASE WHEN v_is_owner OR t.show_contract THEN t.contract END,
    'declarer',      CASE WHEN v_is_owner OR t.show_contract THEN t.declarer END,
    'showContract',  t.show_contract,
    'closed',        t.closed_at IS NOT NULL,
    'updatedAt',     t.updated_at
  );
END
$function$
;

CREATE OR REPLACE FUNCTION public.log_user_login()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.last_login IS DISTINCT FROM OLD.last_login THEN
    INSERT INTO public.login_history (user_id, logged_in_at, platform)
    VALUES (NEW.id, COALESCE(NEW.last_login, now()), NEW.platform);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.my_tournament_history(limite integer DEFAULT 12)
 RETURNS TABLE(week_num integer, total_tricks integer, total_needed integer, completed_at timestamp with time zone, posizione integer, partecipanti integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with mie as (
    select t.week_num, t.total_tricks, t.total_needed, t.completed_at
    from public.tournament_results t
    where t.user_id = auth.uid()
    order by t.week_num desc
    limit greatest(1, least(coalesce(limite, 12), 52))
  )
  select
    m.week_num,
    m.total_tricks,
    m.total_needed,
    m.completed_at,
    (select count(*) from public.tournament_results r
      where r.week_num = m.week_num and r.total_tricks > m.total_tricks)::integer + 1,
    (select count(*) from public.tournament_results r
      where r.week_num = m.week_num)::integer
  from mie m
  order by m.week_num desc;
$function$
;

CREATE OR REPLACE FUNCTION public.review_instructor_request(p_request_id uuid, p_approve boolean, p_message text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r instructor_requests;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO r FROM instructor_requests WHERE id = p_request_id;
  IF r.id IS NULL THEN
    RAISE EXCEPTION 'request not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE instructor_requests
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_message = nullif(btrim(coalesce(p_message, '')), '')
  WHERE id = p_request_id;

  IF p_approve THEN
    UPDATE profiles SET role = 'instructor' WHERE id = r.user_id AND role = 'user';
  END IF;
END $function$
;

CREATE OR REPLACE FUNCTION public.search_users(p_query text, p_user_id uuid)
 RETURNS TABLE(id uuid, display_name text, bbo_username text, avatar_url text, asd_code text, asd_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.display_name,
    p.bbo_username,
    p.avatar_url,
    p.asd_code,
    p.asd_name
  FROM profiles p
  WHERE
    p.id <> p_user_id
    AND p.display_name IS NOT NULL
    AND (
      p.display_name ILIKE '%' || p_query || '%'
      OR p.bbo_username ILIKE '%' || p_query || '%'
    )
  ORDER BY p.display_name
  LIMIT 20;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_asd_name()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.asd_code IS NULL THEN
    NEW.asd_name := NULL;
  ELSE
    SELECT c.name INTO NEW.asd_name FROM public.asd_clubs c WHERE c.code = NEW.asd_code;
  END IF;
  RETURN NEW;
END
$function$
;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
  begin
    new.updated_at = now();
    return new;
  end;
  $function$
;

-- VALORI PREDEFINITI
ALTER TABLE public.asd ALTER COLUMN id SET DEFAULT nextval('asd_id_seq'::regclass);
ALTER TABLE public.asd ALTER COLUMN active SET DEFAULT true;
ALTER TABLE public.asd_clubs ALTER COLUMN kind SET DEFAULT ''::text;
ALTER TABLE public.asd_clubs ALTER COLUMN active SET DEFAULT true;
ALTER TABLE public.asd_clubs ALTER COLUMN has_school SET DEFAULT false;
ALTER TABLE public.asd_clubs ALTER COLUMN region SET DEFAULT ''::text;
ALTER TABLE public.asd_clubs ALTER COLUMN address SET DEFAULT ''::text;
ALTER TABLE public.asd_clubs ALTER COLUMN city SET DEFAULT ''::text;
ALTER TABLE public.asd_clubs ALTER COLUMN province SET DEFAULT ''::text;
ALTER TABLE public.asd_clubs ALTER COLUMN cap SET DEFAULT ''::text;
ALTER TABLE public.asd_clubs ALTER COLUMN lat SET DEFAULT 0;
ALTER TABLE public.asd_clubs ALTER COLUMN lng SET DEFAULT 0;
ALTER TABLE public.asd_clubs ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.asd_clubs ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.assignments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.assignments ALTER COLUMN smazzata_ids SET DEFAULT '{}'::text[];
ALTER TABLE public.assignments ALTER COLUMN mode SET DEFAULT 'homework'::text;
ALTER TABLE public.assignments ALTER COLUMN unlock_mode SET DEFAULT 'free'::text;
ALTER TABLE public.assignments ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.badges ALTER COLUMN id SET DEFAULT nextval('badges_id_seq'::regclass);
ALTER TABLE public.badges ALTER COLUMN earned_at SET DEFAULT now();
ALTER TABLE public.bbo_username_cleanup_2026_08 ALTER COLUMN cleared_at SET DEFAULT now();
ALTER TABLE public.challenges ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.challenges ALTER COLUMN status SET DEFAULT 'pending'::text;
ALTER TABLE public.challenges ALTER COLUMN board_count SET DEFAULT 4;
ALTER TABLE public.challenges ALTER COLUMN hands SET DEFAULT '[]'::jsonb;
ALTER TABLE public.challenges ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.class_members ALTER COLUMN status SET DEFAULT 'active'::text;
ALTER TABLE public.class_members ALTER COLUMN joined_at SET DEFAULT now();
ALTER TABLE public.class_messages ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.class_messages ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.classes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.classes ALTER COLUMN invite_code SET DEFAULT generate_invite_code();
ALTER TABLE public.classes ALTER COLUMN invite_active SET DEFAULT true;
ALTER TABLE public.classes ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.collectible_cards ALTER COLUMN gradient SET DEFAULT ''::text;
ALTER TABLE public.collectible_cards ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.collectible_cards ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.completed_modules ALTER COLUMN id SET DEFAULT nextval('completed_modules_id_seq'::regclass);
ALTER TABLE public.completed_modules ALTER COLUMN completed_at SET DEFAULT now();
ALTER TABLE public.course_worlds ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.course_worlds ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.courses ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.courses ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.email_events ALTER COLUMN sent_at SET DEFAULT now();
ALTER TABLE public.eserciziario_exercises ALTER COLUMN content SET DEFAULT '[]'::jsonb;
ALTER TABLE public.eserciziario_exercises ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.eserciziario_exercises ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.forum_comments ALTER COLUMN id SET DEFAULT nextval('forum_comments_id_seq'::regclass);
ALTER TABLE public.forum_comments ALTER COLUMN likes_count SET DEFAULT 0;
ALTER TABLE public.forum_comments ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.forum_likes ALTER COLUMN id SET DEFAULT nextval('forum_likes_id_seq'::regclass);
ALTER TABLE public.forum_likes ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.forum_poll_votes ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.forum_posts ALTER COLUMN id SET DEFAULT nextval('forum_posts_id_seq'::regclass);
ALTER TABLE public.forum_posts ALTER COLUMN likes_count SET DEFAULT 0;
ALTER TABLE public.forum_posts ALTER COLUMN comments_count SET DEFAULT 0;
ALTER TABLE public.forum_posts ALTER COLUMN pinned SET DEFAULT false;
ALTER TABLE public.forum_posts ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.forum_posts ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.friendships ALTER COLUMN status SET DEFAULT 'pending'::text;
ALTER TABLE public.friendships ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.game_results ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.game_results ALTER COLUMN score SET DEFAULT 0;
ALTER TABLE public.game_results ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.glossary ALTER COLUMN related_terms SET DEFAULT '{}'::text[];
ALTER TABLE public.glossary ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.glossary ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.guided_hands ALTER COLUMN hints SET DEFAULT '[]'::jsonb;
ALTER TABLE public.guided_hands ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.guided_hands ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.instructor_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.instructor_requests ALTER COLUMN status SET DEFAULT 'pending'::text;
ALTER TABLE public.instructor_requests ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.lesson_modules ALTER COLUMN xp_reward SET DEFAULT 0;
ALTER TABLE public.lesson_modules ALTER COLUMN content SET DEFAULT '[]'::jsonb;
ALTER TABLE public.lesson_modules ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.lesson_modules ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.lessons ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.lessons ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.live_tables ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.live_tables ALTER COLUMN revealed SET DEFAULT '{}'::text[];
ALTER TABLE public.live_tables ALTER COLUMN seat_of SET DEFAULT '{}'::jsonb;
ALTER TABLE public.live_tables ALTER COLUMN show_contract SET DEFAULT false;
ALTER TABLE public.live_tables ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.live_tables ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.login_history ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.login_history ALTER COLUMN logged_in_at SET DEFAULT now();
ALTER TABLE public.partner_profiles ALTER COLUMN looking SET DEFAULT true;
ALTER TABLE public.partner_profiles ALTER COLUMN availability SET DEFAULT '{}'::text[];
ALTER TABLE public.partner_profiles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.partner_profiles ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN profile_type SET DEFAULT 'adulto'::text;
ALTER TABLE public.profiles ALTER COLUMN xp SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN streak SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN hands_played SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN text_size SET DEFAULT 'medio'::text;
ALTER TABLE public.profiles ALTER COLUMN anim_speed SET DEFAULT 'normale'::text;
ALTER TABLE public.profiles ALTER COLUMN sound_on SET DEFAULT true;
ALTER TABLE public.profiles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN total_minutes SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user'::text;
ALTER TABLE public.push_subscriptions ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.review_items ALTER COLUMN id SET DEFAULT nextval('review_items_id_seq'::regclass);
ALTER TABLE public.review_items ALTER COLUMN wrong_count SET DEFAULT 1;
ALTER TABLE public.smazzate ALTER COLUMN commentary SET DEFAULT ''::text;
ALTER TABLE public.smazzate ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.smazzate ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.tournament_results ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.tournament_results ALTER COLUMN total_tricks SET DEFAULT 0;
ALTER TABLE public.tournament_results ALTER COLUMN total_needed SET DEFAULT 0;
ALTER TABLE public.tournament_results ALTER COLUMN completed_at SET DEFAULT now();
ALTER TABLE public.trova_errore_scenarios ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.trova_errore_scenarios ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.weekly_challenges ALTER COLUMN gradient SET DEFAULT ''::text;
ALTER TABLE public.weekly_challenges ALTER COLUMN xp_multiplier SET DEFAULT 1.0;
ALTER TABLE public.weekly_challenges ALTER COLUMN tips SET DEFAULT '{}'::text[];
ALTER TABLE public.weekly_challenges ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.weekly_challenges ALTER COLUMN updated_at SET DEFAULT now();

-- VINCOLI
ALTER TABLE public.asd ADD CONSTRAINT asd_pkey PRIMARY KEY (id);
ALTER TABLE public.asd_clubs ADD CONSTRAINT asd_clubs_pkey PRIMARY KEY (code);
ALTER TABLE public.assignments ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);
ALTER TABLE public.badges ADD CONSTRAINT badges_pkey PRIMARY KEY (id);
ALTER TABLE public.bbo_username_cleanup_2026_08 ADD CONSTRAINT bbo_username_cleanup_2026_08_pkey PRIMARY KEY (profile_id);
ALTER TABLE public.challenges ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);
ALTER TABLE public.class_members ADD CONSTRAINT class_members_pkey PRIMARY KEY (class_id, student_id);
ALTER TABLE public.class_messages ADD CONSTRAINT class_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.classes ADD CONSTRAINT classes_pkey PRIMARY KEY (id);
ALTER TABLE public.collectible_cards ADD CONSTRAINT collectible_cards_pkey PRIMARY KEY (id);
ALTER TABLE public.completed_modules ADD CONSTRAINT completed_modules_pkey PRIMARY KEY (id);
ALTER TABLE public.course_worlds ADD CONSTRAINT course_worlds_pkey PRIMARY KEY (id);
ALTER TABLE public.courses ADD CONSTRAINT courses_pkey PRIMARY KEY (id);
ALTER TABLE public.email_events ADD CONSTRAINT email_events_pkey PRIMARY KEY (id);
ALTER TABLE public.eserciziario_exercises ADD CONSTRAINT eserciziario_exercises_pkey PRIMARY KEY (id);
ALTER TABLE public.forum_comments ADD CONSTRAINT forum_comments_pkey PRIMARY KEY (id);
ALTER TABLE public.forum_likes ADD CONSTRAINT forum_likes_pkey PRIMARY KEY (id);
ALTER TABLE public.forum_poll_votes ADD CONSTRAINT forum_poll_votes_pkey PRIMARY KEY (id);
ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_pkey PRIMARY KEY (id);
ALTER TABLE public.friendships ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);
ALTER TABLE public.game_results ADD CONSTRAINT game_results_pkey PRIMARY KEY (id);
ALTER TABLE public.glossary ADD CONSTRAINT glossary_pkey PRIMARY KEY (id);
ALTER TABLE public.guided_hands ADD CONSTRAINT guided_hands_pkey PRIMARY KEY (id);
ALTER TABLE public.instructor_requests ADD CONSTRAINT instructor_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.lesson_modules ADD CONSTRAINT lesson_modules_pkey PRIMARY KEY (lesson_id, module_id);
ALTER TABLE public.lessons ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);
ALTER TABLE public.live_tables ADD CONSTRAINT live_tables_pkey PRIMARY KEY (id);
ALTER TABLE public.login_history ADD CONSTRAINT login_history_pkey PRIMARY KEY (id);
ALTER TABLE public.partner_profiles ADD CONSTRAINT partner_profiles_pkey PRIMARY KEY (user_id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.review_items ADD CONSTRAINT review_items_pkey PRIMARY KEY (id);
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_pkey PRIMARY KEY (id);
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_pkey PRIMARY KEY (id);
ALTER TABLE public.trova_errore_scenarios ADD CONSTRAINT trova_errore_scenarios_pkey PRIMARY KEY (id);
ALTER TABLE public.weekly_challenges ADD CONSTRAINT weekly_challenges_pkey PRIMARY KEY (id);
ALTER TABLE public.asd ADD CONSTRAINT asd_name_key UNIQUE (name);
ALTER TABLE public.badges ADD CONSTRAINT badges_user_id_badge_id_key UNIQUE (user_id, badge_id);
ALTER TABLE public.classes ADD CONSTRAINT classes_invite_code_key UNIQUE (invite_code);
ALTER TABLE public.collectible_cards ADD CONSTRAINT collectible_cards_position_key UNIQUE ("position");
ALTER TABLE public.completed_modules ADD CONSTRAINT completed_modules_user_id_lesson_id_module_id_key UNIQUE (user_id, lesson_id, module_id);
ALTER TABLE public.course_worlds ADD CONSTRAINT course_worlds_course_id_position_key UNIQUE (course_id, "position");
ALTER TABLE public.courses ADD CONSTRAINT courses_position_key UNIQUE ("position");
ALTER TABLE public.eserciziario_exercises ADD CONSTRAINT eserciziario_exercises_lesson_id_position_key UNIQUE (lesson_id, "position");
ALTER TABLE public.forum_poll_votes ADD CONSTRAINT forum_poll_votes_post_id_user_id_key UNIQUE (post_id, user_id);
ALTER TABLE public.friendships ADD CONSTRAINT friendships_user_id_friend_id_key UNIQUE (user_id, friend_id);
ALTER TABLE public.instructor_requests ADD CONSTRAINT instructor_requests_user_id_key UNIQUE (user_id);
ALTER TABLE public.lesson_modules ADD CONSTRAINT lesson_modules_lesson_id_position_key UNIQUE (lesson_id, "position");
ALTER TABLE public.lessons ADD CONSTRAINT lessons_world_id_position_key UNIQUE (world_id, "position");
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_lesson_id_board_key UNIQUE (lesson_id, board);
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_user_id_week_num_key UNIQUE (user_id, week_num);
ALTER TABLE public.assignments ADD CONSTRAINT assignments_mode_check CHECK ((mode = ANY (ARRAY['homework'::text, 'live'::text])));
ALTER TABLE public.assignments ADD CONSTRAINT assignments_unlock_mode_check CHECK ((unlock_mode = ANY (ARRAY['free'::text, 'sequential'::text])));
ALTER TABLE public.challenges ADD CONSTRAINT challenges_board_count_check CHECK ((board_count = ANY (ARRAY[1, 4, 8])));
ALTER TABLE public.challenges ADD CONSTRAINT challenges_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'playing'::text, 'completed'::text, 'declined'::text, 'expired'::text])));
ALTER TABLE public.class_members ADD CONSTRAINT class_members_status_check CHECK ((status = ANY (ARRAY['active'::text, 'removed'::text])));
ALTER TABLE public.collectible_cards ADD CONSTRAINT collectible_cards_category_check CHECK ((category = ANY (ARRAY['tecnica'::text, 'convenzione'::text, 'strategia'::text, 'storia'::text, 'mossa'::text])));
ALTER TABLE public.collectible_cards ADD CONSTRAINT collectible_cards_rarity_check CHECK ((rarity = ANY (ARRAY['comune'::text, 'rara'::text, 'epica'::text, 'leggendaria'::text])));
ALTER TABLE public.collectible_cards ADD CONSTRAINT collectible_cards_unlock_check CHECK ((jsonb_typeof(unlock) = 'object'::text));
ALTER TABLE public.courses ADD CONSTRAINT courses_level_check CHECK ((level = ANY (ARRAY['base'::text, 'intermedio'::text, 'avanzato'::text])));
ALTER TABLE public.eserciziario_exercises ADD CONSTRAINT eserciziario_exercises_content_check CHECK ((jsonb_typeof(content) = 'array'::text));
ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_category_check CHECK ((category = ANY (ARRAY['lezioni'::text, 'strategia'::text, 'tornei'::text, 'generale'::text, 'off-topic'::text])));
ALTER TABLE public.friendships ADD CONSTRAINT friendships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])));
ALTER TABLE public.game_results ADD CONSTRAINT game_results_game_type_check CHECK ((game_type = ANY (ARRAY['compito'::text, 'conta-veloce'::text, 'dichiara'::text, 'impasse'::text, 'mano-del-giorno'::text, 'mano-guidata'::text, 'memory'::text, 'pratica-licita'::text, 'quiz-lampo'::text, 'sfida'::text, 'smazzata'::text, 'torneo'::text, 'trova-errore'::text])));
ALTER TABLE public.glossary ADD CONSTRAINT glossary_category_check CHECK ((category = ANY (ARRAY['base'::text, 'licita'::text, 'gioco'::text, 'difesa'::text, 'punteggio'::text])));
ALTER TABLE public.glossary ADD CONSTRAINT glossary_quiz_check CHECK (((quiz ? 'question'::text) AND (quiz ? 'options'::text) AND (quiz ? 'correctAnswer'::text) AND (quiz ? 'explanation'::text) AND (jsonb_typeof((quiz -> 'options'::text)) = 'array'::text)));
ALTER TABLE public.guided_hands ADD CONSTRAINT guided_hands_declarer_check CHECK ((declarer = ANY (ARRAY['north'::text, 'south'::text, 'east'::text, 'west'::text])));
ALTER TABLE public.guided_hands ADD CONSTRAINT guided_hands_difficulty_check CHECK ((difficulty = ANY (ARRAY['facile'::text, 'medio'::text])));
ALTER TABLE public.guided_hands ADD CONSTRAINT guided_hands_hands_check CHECK (((hands ? 'north'::text) AND (hands ? 'south'::text) AND (hands ? 'east'::text) AND (hands ? 'west'::text)));
ALTER TABLE public.guided_hands ADD CONSTRAINT guided_hands_hints_check CHECK ((jsonb_typeof(hints) = 'array'::text));
ALTER TABLE public.guided_hands ADD CONSTRAINT guided_hands_opening_lead_check CHECK (((opening_lead ? 'suit'::text) AND (opening_lead ? 'rank'::text)));
ALTER TABLE public.guided_hands ADD CONSTRAINT guided_hands_tricks_needed_check CHECK (((tricks_needed >= 1) AND (tricks_needed <= 13)));
ALTER TABLE public.instructor_requests ADD CONSTRAINT instructor_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));
ALTER TABLE public.lesson_modules ADD CONSTRAINT lesson_modules_content_check CHECK ((jsonb_typeof(content) = 'array'::text));
ALTER TABLE public.lesson_modules ADD CONSTRAINT lesson_modules_duration_minutes_check CHECK (((duration_minutes IS NULL) OR (duration_minutes >= 0)));
ALTER TABLE public.lesson_modules ADD CONSTRAINT lesson_modules_module_type_check CHECK ((module_type = ANY (ARRAY['theory'::text, 'exercise'::text, 'quiz'::text, 'practice'::text])));
ALTER TABLE public.lesson_modules ADD CONSTRAINT lesson_modules_xp_reward_check CHECK ((xp_reward >= 0));
ALTER TABLE public.partner_profiles ADD CONSTRAINT partner_profiles_availability_check CHECK ((availability <@ ARRAY['mattina'::text, 'pomeriggio'::text, 'sera'::text, 'weekend'::text]));
ALTER TABLE public.partner_profiles ADD CONSTRAINT partner_profiles_level_check CHECK ((level = ANY (ARRAY['principiante'::text, 'intermedio'::text, 'avanzato'::text])));
ALTER TABLE public.partner_profiles ADD CONSTRAINT partner_profiles_province_check CHECK (((province IS NULL) OR (province ~ '^[A-Z]{2}$'::text)));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_profile_type_check CHECK ((profile_type = ANY (ARRAY['giovane'::text, 'adulto'::text, 'senior'::text])));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'instructor'::text, 'admin'::text])));
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_bidding_check CHECK (((bidding IS NULL) OR ((bidding ? 'dealer'::text) AND (bidding ? 'bids'::text) AND (jsonb_typeof((bidding -> 'bids'::text)) = 'array'::text))));
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_declarer_check CHECK ((declarer = ANY (ARRAY['north'::text, 'south'::text, 'east'::text, 'west'::text])));
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_hands_check CHECK (((hands ? 'north'::text) AND (hands ? 'south'::text) AND (hands ? 'east'::text) AND (hands ? 'west'::text) AND (jsonb_typeof((hands -> 'north'::text)) = 'array'::text) AND (jsonb_typeof((hands -> 'south'::text)) = 'array'::text) AND (jsonb_typeof((hands -> 'east'::text)) = 'array'::text) AND (jsonb_typeof((hands -> 'west'::text)) = 'array'::text)));
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_opening_lead_check CHECK (((opening_lead ? 'suit'::text) AND (opening_lead ? 'rank'::text)));
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_vulnerability_check CHECK ((vulnerability = ANY (ARRAY['none'::text, 'ns'::text, 'ew'::text, 'both'::text])));
ALTER TABLE public.trova_errore_scenarios ADD CONSTRAINT trova_errore_scenarios_category_check CHECK ((category = ANY (ARRAY['licita'::text, 'gioco'::text, 'difesa'::text])));
ALTER TABLE public.trova_errore_scenarios ADD CONSTRAINT trova_errore_scenarios_correct_answer_check CHECK ((correct_answer >= 0));
ALTER TABLE public.trova_errore_scenarios ADD CONSTRAINT trova_errore_scenarios_difficulty_check CHECK ((difficulty = ANY (ARRAY['facile'::text, 'medio'::text, 'difficile'::text])));
ALTER TABLE public.weekly_challenges ADD CONSTRAINT weekly_challenges_xp_multiplier_check CHECK ((xp_multiplier > (0)::double precision));
ALTER TABLE public.assignments ADD CONSTRAINT assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.badges ADD CONSTRAINT badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.bbo_username_cleanup_2026_08 ADD CONSTRAINT bbo_username_cleanup_2026_08_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_challenger_id_fkey FOREIGN KEY (challenger_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_opponent_id_fkey FOREIGN KEY (opponent_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.class_members ADD CONSTRAINT class_members_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.class_members ADD CONSTRAINT class_members_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.class_messages ADD CONSTRAINT class_messages_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.class_messages ADD CONSTRAINT class_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.classes ADD CONSTRAINT classes_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.completed_modules ADD CONSTRAINT completed_modules_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.course_worlds ADD CONSTRAINT course_worlds_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE public.email_events ADD CONSTRAINT email_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.eserciziario_exercises ADD CONSTRAINT eserciziario_exercises_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
ALTER TABLE public.forum_comments ADD CONSTRAINT forum_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES forum_comments(id) ON DELETE CASCADE;
ALTER TABLE public.forum_comments ADD CONSTRAINT forum_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE;
ALTER TABLE public.forum_comments ADD CONSTRAINT forum_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.forum_likes ADD CONSTRAINT forum_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES forum_comments(id) ON DELETE CASCADE;
ALTER TABLE public.forum_likes ADD CONSTRAINT forum_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE;
ALTER TABLE public.forum_likes ADD CONSTRAINT forum_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.forum_poll_votes ADD CONSTRAINT forum_poll_votes_post_id_fkey FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE;
ALTER TABLE public.forum_poll_votes ADD CONSTRAINT forum_poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.friendships ADD CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.friendships ADD CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.game_results ADD CONSTRAINT game_results_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL;
ALTER TABLE public.game_results ADD CONSTRAINT game_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.instructor_requests ADD CONSTRAINT instructor_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE public.instructor_requests ADD CONSTRAINT instructor_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.lesson_modules ADD CONSTRAINT lesson_modules_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_world_id_fkey FOREIGN KEY (world_id) REFERENCES course_worlds(id) ON DELETE CASCADE;
ALTER TABLE public.live_tables ADD CONSTRAINT live_tables_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.live_tables ADD CONSTRAINT live_tables_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.login_history ADD CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.partner_profiles ADD CONSTRAINT partner_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_asd_id_fkey FOREIGN KEY (asd_id) REFERENCES asd(id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.review_items ADD CONSTRAINT review_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- INDICI
CREATE INDEX asd_clubs_active_idx ON public.asd_clubs USING btree (active);
CREATE INDEX asd_clubs_name_idx ON public.asd_clubs USING btree (name);
CREATE INDEX asd_clubs_province_idx ON public.asd_clubs USING btree (province) WHERE (province <> ''::text);
CREATE INDEX asd_clubs_region_idx ON public.asd_clubs USING btree (region) WHERE (region <> ''::text);
CREATE INDEX collectible_cards_category_idx ON public.collectible_cards USING btree (category);
CREATE INDEX collectible_cards_rarity_idx ON public.collectible_cards USING btree (rarity);
CREATE INDEX course_worlds_course_id_idx ON public.course_worlds USING btree (course_id);
CREATE INDEX eserciziario_lesson_idx ON public.eserciziario_exercises USING btree (lesson_id);
CREATE INDEX glossary_category_idx ON public.glossary USING btree (category);
CREATE INDEX glossary_related_terms_gin ON public.glossary USING gin (related_terms);
CREATE INDEX idx_assignments_class ON public.assignments USING btree (class_id, created_at DESC);
CREATE INDEX idx_challenges_challenger_id ON public.challenges USING btree (challenger_id);
CREATE INDEX idx_challenges_created_at ON public.challenges USING btree (created_at DESC);
CREATE INDEX idx_challenges_opponent_id ON public.challenges USING btree (opponent_id);
CREATE INDEX idx_challenges_status ON public.challenges USING btree (status);
CREATE INDEX idx_class_members_student ON public.class_members USING btree (student_id);
CREATE INDEX idx_class_messages_class ON public.class_messages USING btree (class_id, created_at);
CREATE INDEX idx_classes_instructor ON public.classes USING btree (instructor_id);
CREATE INDEX idx_classes_invite_code ON public.classes USING btree (invite_code);
CREATE INDEX idx_email_events_user_type ON public.email_events USING btree (user_id, email_type, sent_at DESC);
CREATE INDEX idx_forum_comments_parent_id ON public.forum_comments USING btree (parent_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships USING btree (friend_id);
CREATE INDEX idx_friendships_status ON public.friendships USING btree (status);
CREATE INDEX idx_friendships_user_id ON public.friendships USING btree (user_id);
CREATE INDEX idx_game_results_assignment ON public.game_results USING btree (assignment_id) WHERE (assignment_id IS NOT NULL);
CREATE INDEX idx_game_results_platform ON public.game_results USING btree (platform, created_at DESC);
CREATE INDEX idx_game_results_type ON public.game_results USING btree (game_type, score DESC);
CREATE INDEX idx_game_results_user ON public.game_results USING btree (user_id, created_at DESC);
CREATE INDEX idx_instructor_requests_status ON public.instructor_requests USING btree (status, created_at DESC);
CREATE INDEX idx_login_history_date ON public.login_history USING btree (logged_in_at DESC);
CREATE INDEX idx_login_history_platform ON public.login_history USING btree (platform, logged_in_at DESC);
CREATE INDEX idx_login_history_user_date ON public.login_history USING btree (user_id, logged_in_at DESC);
CREATE INDEX idx_poll_votes_post ON public.forum_poll_votes USING btree (post_id, option_index);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role) WHERE (role <> 'user'::text);
CREATE INDEX idx_tournament_results_week ON public.tournament_results USING btree (week_num, total_tricks DESC);
CREATE INDEX lesson_modules_content_gin ON public.lesson_modules USING gin (content jsonb_path_ops);
CREATE INDEX lesson_modules_lesson_id_idx ON public.lesson_modules USING btree (lesson_id);
CREATE INDEX lessons_world_id_idx ON public.lessons USING btree (world_id);
CREATE INDEX live_tables_class_idx ON public.live_tables USING btree (class_id, created_at DESC);
CREATE INDEX partner_profiles_looking_idx ON public.partner_profiles USING btree (looking, province) WHERE looking;
CREATE INDEX profiles_asd_code_idx ON public.profiles USING btree (asd_code);
CREATE INDEX smazzate_bidding_gin ON public.smazzate USING gin (bidding jsonb_path_ops);
CREATE INDEX smazzate_lesson_id_idx ON public.smazzate USING btree (lesson_id);
CREATE INDEX trova_errore_category_idx ON public.trova_errore_scenarios USING btree (category);
CREATE INDEX trova_errore_difficulty_idx ON public.trova_errore_scenarios USING btree (difficulty);
CREATE UNIQUE INDEX unique_comment_like ON public.forum_likes USING btree (user_id, comment_id) WHERE (comment_id IS NOT NULL);
CREATE UNIQUE INDEX unique_post_like ON public.forum_likes USING btree (user_id, post_id) WHERE (post_id IS NOT NULL);
CREATE UNIQUE INDEX uq_email_events_oneshot ON public.email_events USING btree (user_id, email_type) WHERE (email_type = ANY (ARRAY['welcome'::text, 'onboarding_start'::text]));

-- TRIGGER
CREATE TRIGGER asd_clubs_touch BEFORE UPDATE ON public.asd_clubs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER collectible_cards_touch BEFORE UPDATE ON public.collectible_cards FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER course_worlds_touch BEFORE UPDATE ON public.course_worlds FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER courses_touch BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER eserciziario_touch BEFORE UPDATE ON public.eserciziario_exercises FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER glossary_touch BEFORE UPDATE ON public.glossary FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER guided_hands_touch BEFORE UPDATE ON public.guided_hands FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER lesson_modules_touch BEFORE UPDATE ON public.lesson_modules FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER lessons_touch BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER on_login_update AFTER UPDATE OF last_login ON public.profiles FOR EACH ROW EXECUTE FUNCTION log_user_login();
CREATE TRIGGER profiles_sync_asd_name BEFORE INSERT OR UPDATE OF asd_code, asd_name ON public.profiles FOR EACH ROW EXECUTE FUNCTION sync_asd_name();
CREATE TRIGGER smazzate_touch BEFORE UPDATE ON public.smazzate FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trova_errore_touch BEFORE UPDATE ON public.trova_errore_scenarios FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER weekly_challenges_touch BEFORE UPDATE ON public.weekly_challenges FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ROW LEVEL SECURITY
ALTER TABLE public.asd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asd_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bbo_username_cleanup_2026_08 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectible_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eserciziario_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guided_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smazzate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trova_errore_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

-- POLICY
CREATE POLICY "ASD visible to all" ON public.asd AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY asd_clubs_public_read ON public.asd_clubs AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Instructor and members can view assignments" ON public.assignments AS PERMISSIVE FOR SELECT TO public USING ((is_instructor_of_class(class_id) OR is_member_of_class(class_id)));
CREATE POLICY "Instructor can create assignments" ON public.assignments AS PERMISSIVE FOR INSERT TO public WITH CHECK (is_instructor_of_class(class_id));
CREATE POLICY "Instructor can delete assignments" ON public.assignments AS PERMISSIVE FOR DELETE TO public USING (is_instructor_of_class(class_id));
CREATE POLICY "Instructor can update assignments" ON public.assignments AS PERMISSIVE FOR UPDATE TO public USING (is_instructor_of_class(class_id));
CREATE POLICY "Badges readable" ON public.badges AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Own badges write" ON public.badges AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Challenger can delete pending challenges" ON public.challenges AS PERMISSIVE FOR DELETE TO public USING (((auth.uid() = challenger_id) AND (status = 'pending'::text)));
CREATE POLICY "Players can update own challenges" ON public.challenges AS PERMISSIVE FOR UPDATE TO public USING (((auth.uid() = challenger_id) OR (auth.uid() = opponent_id)));
CREATE POLICY "Players can view own challenges" ON public.challenges AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = challenger_id) OR (auth.uid() = opponent_id)));
CREATE POLICY "Users can create challenges" ON public.challenges AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = challenger_id));
CREATE POLICY "Instructor or self can delete membership" ON public.class_members AS PERMISSIVE FOR DELETE TO public USING (((student_id = auth.uid()) OR is_instructor_of_class(class_id)));
CREATE POLICY "Instructor or self can update membership" ON public.class_members AS PERMISSIVE FOR UPDATE TO public USING (((student_id = auth.uid()) OR is_instructor_of_class(class_id)));
CREATE POLICY "Members and owning instructor can view membership" ON public.class_members AS PERMISSIVE FOR SELECT TO public USING (((student_id = auth.uid()) OR is_instructor_of_class(class_id)));
CREATE POLICY "Students can join themselves" ON public.class_members AS PERMISSIVE FOR INSERT TO public WITH CHECK ((student_id = auth.uid()));
CREATE POLICY "Authors can delete own class messages" ON public.class_messages AS PERMISSIVE FOR DELETE TO public USING (((user_id = auth.uid()) OR is_instructor_of_class(class_id)));
CREATE POLICY "Members can read class messages" ON public.class_messages AS PERMISSIVE FOR SELECT TO public USING ((is_instructor_of_class(class_id) OR is_member_of_class(class_id)));
CREATE POLICY "Members can send class messages" ON public.class_messages AS PERMISSIVE FOR INSERT TO public WITH CHECK (((user_id = auth.uid()) AND (is_instructor_of_class(class_id) OR is_member_of_class(class_id))));
CREATE POLICY "Instructors and members can view classes" ON public.classes AS PERMISSIVE FOR SELECT TO public USING (((instructor_id = auth.uid()) OR is_member_of_class(id)));
CREATE POLICY "Instructors can create classes" ON public.classes AS PERMISSIVE FOR INSERT TO public WITH CHECK (((instructor_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['instructor'::text, 'admin'::text])))))));
CREATE POLICY "Instructors can delete own classes" ON public.classes AS PERMISSIVE FOR DELETE TO public USING ((instructor_id = auth.uid()));
CREATE POLICY "Instructors can update own classes" ON public.classes AS PERMISSIVE FOR UPDATE TO public USING ((instructor_id = auth.uid()));
CREATE POLICY collectible_cards_public_read ON public.collectible_cards AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Own modules" ON public.completed_modules AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY course_worlds_public_read ON public.course_worlds AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY courses_public_read ON public.courses AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users read own email events" ON public.email_events AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY eserciziario_public_read ON public.eserciziario_exercises AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Comments delete own" ON public.forum_comments AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Comments insert" ON public.forum_comments AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Comments readable" ON public.forum_comments AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Likes delete own" ON public.forum_likes AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Likes insert" ON public.forum_likes AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Likes readable" ON public.forum_likes AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read poll votes" ON public.forum_poll_votes AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can vote" ON public.forum_poll_votes AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Forum posts delete own" ON public.forum_posts AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Forum posts insert" ON public.forum_posts AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Forum posts readable" ON public.forum_posts AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Forum posts update own" ON public.forum_posts AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Either party can delete friendship" ON public.friendships AS PERMISSIVE FOR DELETE TO public USING (((auth.uid() = user_id) OR (auth.uid() = friend_id)));
CREATE POLICY "Recipients can accept or decline" ON public.friendships AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = friend_id));
CREATE POLICY "Users can send friend requests" ON public.friendships AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own friendships" ON public.friendships AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = user_id) OR (auth.uid() = friend_id)));
CREATE POLICY "Instructors can read class assignment results" ON public.game_results AS PERMISSIVE FOR SELECT TO public USING (((assignment_id IS NOT NULL) AND is_instructor_of_assignment(assignment_id)));
CREATE POLICY "Users can insert own results" ON public.game_results AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can read own results" ON public.game_results AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY glossary_public_read ON public.glossary AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY guided_hands_public_read ON public.guided_hands AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Self or admin can read requests" ON public.instructor_requests AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR is_admin()));
CREATE POLICY "Self or admin can update request" ON public.instructor_requests AS PERMISSIVE FOR UPDATE TO public USING (((user_id = auth.uid()) OR is_admin()));
CREATE POLICY "Users can file own request" ON public.instructor_requests AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY lesson_modules_public_read ON public.lesson_modules AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY lessons_public_read ON public.lessons AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Instructor manages own live tables" ON public.live_tables AS PERMISSIVE FOR ALL TO authenticated USING (((instructor_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM classes c
  WHERE ((c.id = live_tables.class_id) AND (c.instructor_id = auth.uid())))))) WITH CHECK (((instructor_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM classes c
  WHERE ((c.id = live_tables.class_id) AND (c.instructor_id = auth.uid()))))));
CREATE POLICY "Authenticated can insert own login history" ON public.login_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can read own login history" ON public.login_history AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY partner_profiles_delete ON public.partner_profiles AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY partner_profiles_insert ON public.partner_profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY partner_profiles_select ON public.partner_profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((looking OR (user_id = auth.uid())));
CREATE POLICY partner_profiles_update ON public.partner_profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Authenticated users can read profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = id));
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Own reviews" ON public.review_items AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY smazzate_public_read ON public.smazzate AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can read tournament results" ON public.tournament_results AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own tournament result" ON public.tournament_results AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update own tournament result" ON public.tournament_results AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY trova_errore_public_read ON public.trova_errore_scenarios AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY weekly_challenges_public_read ON public.weekly_challenges AS PERMISSIVE FOR SELECT TO public USING (true);

-- PERMESSI SULLE TABELLE
GRANT DELETE ON public.asd TO anon;
GRANT DELETE ON public.asd TO authenticated;
GRANT DELETE ON public.asd TO service_role;
GRANT DELETE ON public.asd_clubs TO anon;
GRANT DELETE ON public.asd_clubs TO authenticated;
GRANT DELETE ON public.asd_clubs TO service_role;
GRANT DELETE ON public.assignments TO anon;
GRANT DELETE ON public.assignments TO authenticated;
GRANT DELETE ON public.assignments TO service_role;
GRANT DELETE ON public.badges TO anon;
GRANT DELETE ON public.badges TO authenticated;
GRANT DELETE ON public.badges TO service_role;
GRANT DELETE ON public.bbo_username_cleanup_2026_08 TO anon;
GRANT DELETE ON public.bbo_username_cleanup_2026_08 TO authenticated;
GRANT DELETE ON public.bbo_username_cleanup_2026_08 TO service_role;
GRANT DELETE ON public.challenges TO anon;
GRANT DELETE ON public.challenges TO authenticated;
GRANT DELETE ON public.challenges TO service_role;
GRANT DELETE ON public.class_members TO anon;
GRANT DELETE ON public.class_members TO authenticated;
GRANT DELETE ON public.class_members TO service_role;
GRANT DELETE ON public.class_messages TO anon;
GRANT DELETE ON public.class_messages TO authenticated;
GRANT DELETE ON public.class_messages TO service_role;
GRANT DELETE ON public.classes TO anon;
GRANT DELETE ON public.classes TO authenticated;
GRANT DELETE ON public.classes TO service_role;
GRANT DELETE ON public.collectible_cards TO anon;
GRANT DELETE ON public.collectible_cards TO authenticated;
GRANT DELETE ON public.collectible_cards TO service_role;
GRANT DELETE ON public.completed_modules TO anon;
GRANT DELETE ON public.completed_modules TO authenticated;
GRANT DELETE ON public.completed_modules TO service_role;
GRANT DELETE ON public.course_worlds TO anon;
GRANT DELETE ON public.course_worlds TO authenticated;
GRANT DELETE ON public.course_worlds TO service_role;
GRANT DELETE ON public.courses TO anon;
GRANT DELETE ON public.courses TO authenticated;
GRANT DELETE ON public.courses TO service_role;
GRANT DELETE ON public.email_events TO anon;
GRANT DELETE ON public.email_events TO authenticated;
GRANT DELETE ON public.email_events TO service_role;
GRANT DELETE ON public.eserciziario_exercises TO anon;
GRANT DELETE ON public.eserciziario_exercises TO authenticated;
GRANT DELETE ON public.eserciziario_exercises TO service_role;
GRANT DELETE ON public.forum_comments TO anon;
GRANT DELETE ON public.forum_comments TO authenticated;
GRANT DELETE ON public.forum_comments TO service_role;
GRANT DELETE ON public.forum_likes TO anon;
GRANT DELETE ON public.forum_likes TO authenticated;
GRANT DELETE ON public.forum_likes TO service_role;
GRANT DELETE ON public.forum_poll_votes TO anon;
GRANT DELETE ON public.forum_poll_votes TO authenticated;
GRANT DELETE ON public.forum_poll_votes TO service_role;
GRANT DELETE ON public.forum_posts TO anon;
GRANT DELETE ON public.forum_posts TO authenticated;
GRANT DELETE ON public.forum_posts TO service_role;
GRANT DELETE ON public.friendships TO anon;
GRANT DELETE ON public.friendships TO authenticated;
GRANT DELETE ON public.friendships TO service_role;
GRANT DELETE ON public.game_results TO anon;
GRANT DELETE ON public.game_results TO authenticated;
GRANT DELETE ON public.game_results TO service_role;
GRANT DELETE ON public.glossary TO anon;
GRANT DELETE ON public.glossary TO authenticated;
GRANT DELETE ON public.glossary TO service_role;
GRANT DELETE ON public.guided_hands TO anon;
GRANT DELETE ON public.guided_hands TO authenticated;
GRANT DELETE ON public.guided_hands TO service_role;
GRANT DELETE ON public.instructor_requests TO anon;
GRANT DELETE ON public.instructor_requests TO authenticated;
GRANT DELETE ON public.instructor_requests TO service_role;
GRANT DELETE ON public.lesson_modules TO anon;
GRANT DELETE ON public.lesson_modules TO authenticated;
GRANT DELETE ON public.lesson_modules TO service_role;
GRANT DELETE ON public.lessons TO anon;
GRANT DELETE ON public.lessons TO authenticated;
GRANT DELETE ON public.lessons TO service_role;
GRANT DELETE ON public.live_tables TO anon;
GRANT DELETE ON public.live_tables TO authenticated;
GRANT DELETE ON public.live_tables TO service_role;
GRANT DELETE ON public.login_history TO anon;
GRANT DELETE ON public.login_history TO authenticated;
GRANT DELETE ON public.login_history TO service_role;
GRANT DELETE ON public.partner_profiles TO anon;
GRANT DELETE ON public.partner_profiles TO authenticated;
GRANT DELETE ON public.partner_profiles TO service_role;
GRANT DELETE ON public.profiles TO anon;
GRANT DELETE ON public.profiles TO authenticated;
GRANT DELETE ON public.profiles TO service_role;
GRANT DELETE ON public.push_subscriptions TO anon;
GRANT DELETE ON public.push_subscriptions TO authenticated;
GRANT DELETE ON public.push_subscriptions TO service_role;
GRANT DELETE ON public.review_items TO anon;
GRANT DELETE ON public.review_items TO authenticated;
GRANT DELETE ON public.review_items TO service_role;
GRANT DELETE ON public.smazzate TO anon;
GRANT DELETE ON public.smazzate TO authenticated;
GRANT DELETE ON public.smazzate TO service_role;
GRANT DELETE ON public.tournament_results TO anon;
GRANT DELETE ON public.tournament_results TO authenticated;
GRANT DELETE ON public.tournament_results TO service_role;
GRANT DELETE ON public.trova_errore_scenarios TO anon;
GRANT DELETE ON public.trova_errore_scenarios TO authenticated;
GRANT DELETE ON public.trova_errore_scenarios TO service_role;
GRANT DELETE ON public.weekly_challenges TO anon;
GRANT DELETE ON public.weekly_challenges TO authenticated;
GRANT DELETE ON public.weekly_challenges TO service_role;
GRANT INSERT ON public.asd TO anon;
GRANT INSERT ON public.asd TO authenticated;
GRANT INSERT ON public.asd TO service_role;
GRANT INSERT ON public.asd_clubs TO anon;
GRANT INSERT ON public.asd_clubs TO authenticated;
GRANT INSERT ON public.asd_clubs TO service_role;
GRANT INSERT ON public.assignments TO anon;
GRANT INSERT ON public.assignments TO authenticated;
GRANT INSERT ON public.assignments TO service_role;
GRANT INSERT ON public.badges TO anon;
GRANT INSERT ON public.badges TO authenticated;
GRANT INSERT ON public.badges TO service_role;
GRANT INSERT ON public.bbo_username_cleanup_2026_08 TO anon;
GRANT INSERT ON public.bbo_username_cleanup_2026_08 TO authenticated;
GRANT INSERT ON public.bbo_username_cleanup_2026_08 TO service_role;
GRANT INSERT ON public.challenges TO anon;
GRANT INSERT ON public.challenges TO authenticated;
GRANT INSERT ON public.challenges TO service_role;
GRANT INSERT ON public.class_members TO anon;
GRANT INSERT ON public.class_members TO authenticated;
GRANT INSERT ON public.class_members TO service_role;
GRANT INSERT ON public.class_messages TO anon;
GRANT INSERT ON public.class_messages TO authenticated;
GRANT INSERT ON public.class_messages TO service_role;
GRANT INSERT ON public.classes TO anon;
GRANT INSERT ON public.classes TO authenticated;
GRANT INSERT ON public.classes TO service_role;
GRANT INSERT ON public.collectible_cards TO anon;
GRANT INSERT ON public.collectible_cards TO authenticated;
GRANT INSERT ON public.collectible_cards TO service_role;
GRANT INSERT ON public.completed_modules TO anon;
GRANT INSERT ON public.completed_modules TO authenticated;
GRANT INSERT ON public.completed_modules TO service_role;
GRANT INSERT ON public.course_worlds TO anon;
GRANT INSERT ON public.course_worlds TO authenticated;
GRANT INSERT ON public.course_worlds TO service_role;
GRANT INSERT ON public.courses TO anon;
GRANT INSERT ON public.courses TO authenticated;
GRANT INSERT ON public.courses TO service_role;
GRANT INSERT ON public.email_events TO anon;
GRANT INSERT ON public.email_events TO authenticated;
GRANT INSERT ON public.email_events TO service_role;
GRANT INSERT ON public.eserciziario_exercises TO anon;
GRANT INSERT ON public.eserciziario_exercises TO authenticated;
GRANT INSERT ON public.eserciziario_exercises TO service_role;
GRANT INSERT ON public.forum_comments TO anon;
GRANT INSERT ON public.forum_comments TO authenticated;
GRANT INSERT ON public.forum_comments TO service_role;
GRANT INSERT ON public.forum_likes TO anon;
GRANT INSERT ON public.forum_likes TO authenticated;
GRANT INSERT ON public.forum_likes TO service_role;
GRANT INSERT ON public.forum_poll_votes TO anon;
GRANT INSERT ON public.forum_poll_votes TO authenticated;
GRANT INSERT ON public.forum_poll_votes TO service_role;
GRANT INSERT ON public.forum_posts TO anon;
GRANT INSERT ON public.forum_posts TO authenticated;
GRANT INSERT ON public.forum_posts TO service_role;
GRANT INSERT ON public.friendships TO anon;
GRANT INSERT ON public.friendships TO authenticated;
GRANT INSERT ON public.friendships TO service_role;
GRANT INSERT ON public.game_results TO anon;
GRANT INSERT ON public.game_results TO authenticated;
GRANT INSERT ON public.game_results TO service_role;
GRANT INSERT ON public.glossary TO anon;
GRANT INSERT ON public.glossary TO authenticated;
GRANT INSERT ON public.glossary TO service_role;
GRANT INSERT ON public.guided_hands TO anon;
GRANT INSERT ON public.guided_hands TO authenticated;
GRANT INSERT ON public.guided_hands TO service_role;
GRANT INSERT ON public.instructor_requests TO anon;
GRANT INSERT ON public.instructor_requests TO authenticated;
GRANT INSERT ON public.instructor_requests TO service_role;
GRANT INSERT ON public.lesson_modules TO anon;
GRANT INSERT ON public.lesson_modules TO authenticated;
GRANT INSERT ON public.lesson_modules TO service_role;
GRANT INSERT ON public.lessons TO anon;
GRANT INSERT ON public.lessons TO authenticated;
GRANT INSERT ON public.lessons TO service_role;
GRANT INSERT ON public.live_tables TO anon;
GRANT INSERT ON public.live_tables TO authenticated;
GRANT INSERT ON public.live_tables TO service_role;
GRANT INSERT ON public.login_history TO anon;
GRANT INSERT ON public.login_history TO authenticated;
GRANT INSERT ON public.login_history TO service_role;
GRANT INSERT ON public.partner_profiles TO anon;
GRANT INSERT ON public.partner_profiles TO authenticated;
GRANT INSERT ON public.partner_profiles TO service_role;
GRANT INSERT ON public.profiles TO anon;
GRANT INSERT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO service_role;
GRANT INSERT ON public.push_subscriptions TO anon;
GRANT INSERT ON public.push_subscriptions TO authenticated;
GRANT INSERT ON public.push_subscriptions TO service_role;
GRANT INSERT ON public.review_items TO anon;
GRANT INSERT ON public.review_items TO authenticated;
GRANT INSERT ON public.review_items TO service_role;
GRANT INSERT ON public.smazzate TO anon;
GRANT INSERT ON public.smazzate TO authenticated;
GRANT INSERT ON public.smazzate TO service_role;
GRANT INSERT ON public.tournament_results TO anon;
GRANT INSERT ON public.tournament_results TO authenticated;
GRANT INSERT ON public.tournament_results TO service_role;
GRANT INSERT ON public.trova_errore_scenarios TO anon;
GRANT INSERT ON public.trova_errore_scenarios TO authenticated;
GRANT INSERT ON public.trova_errore_scenarios TO service_role;
GRANT INSERT ON public.weekly_challenges TO anon;
GRANT INSERT ON public.weekly_challenges TO authenticated;
GRANT INSERT ON public.weekly_challenges TO service_role;
GRANT REFERENCES ON public.asd TO anon;
GRANT REFERENCES ON public.asd TO authenticated;
GRANT REFERENCES ON public.asd TO service_role;
GRANT REFERENCES ON public.asd_clubs TO anon;
GRANT REFERENCES ON public.asd_clubs TO authenticated;
GRANT REFERENCES ON public.asd_clubs TO service_role;
GRANT REFERENCES ON public.assignments TO anon;
GRANT REFERENCES ON public.assignments TO authenticated;
GRANT REFERENCES ON public.assignments TO service_role;
GRANT REFERENCES ON public.badges TO anon;
GRANT REFERENCES ON public.badges TO authenticated;
GRANT REFERENCES ON public.badges TO service_role;
GRANT REFERENCES ON public.bbo_username_cleanup_2026_08 TO anon;
GRANT REFERENCES ON public.bbo_username_cleanup_2026_08 TO authenticated;
GRANT REFERENCES ON public.bbo_username_cleanup_2026_08 TO service_role;
GRANT REFERENCES ON public.challenges TO anon;
GRANT REFERENCES ON public.challenges TO authenticated;
GRANT REFERENCES ON public.challenges TO service_role;
GRANT REFERENCES ON public.class_members TO anon;
GRANT REFERENCES ON public.class_members TO authenticated;
GRANT REFERENCES ON public.class_members TO service_role;
GRANT REFERENCES ON public.class_messages TO anon;
GRANT REFERENCES ON public.class_messages TO authenticated;
GRANT REFERENCES ON public.class_messages TO service_role;
GRANT REFERENCES ON public.classes TO anon;
GRANT REFERENCES ON public.classes TO authenticated;
GRANT REFERENCES ON public.classes TO service_role;
GRANT REFERENCES ON public.collectible_cards TO anon;
GRANT REFERENCES ON public.collectible_cards TO authenticated;
GRANT REFERENCES ON public.collectible_cards TO service_role;
GRANT REFERENCES ON public.completed_modules TO anon;
GRANT REFERENCES ON public.completed_modules TO authenticated;
GRANT REFERENCES ON public.completed_modules TO service_role;
GRANT REFERENCES ON public.course_worlds TO anon;
GRANT REFERENCES ON public.course_worlds TO authenticated;
GRANT REFERENCES ON public.course_worlds TO service_role;
GRANT REFERENCES ON public.courses TO anon;
GRANT REFERENCES ON public.courses TO authenticated;
GRANT REFERENCES ON public.courses TO service_role;
GRANT REFERENCES ON public.email_events TO anon;
GRANT REFERENCES ON public.email_events TO authenticated;
GRANT REFERENCES ON public.email_events TO service_role;
GRANT REFERENCES ON public.eserciziario_exercises TO anon;
GRANT REFERENCES ON public.eserciziario_exercises TO authenticated;
GRANT REFERENCES ON public.eserciziario_exercises TO service_role;
GRANT REFERENCES ON public.forum_comments TO anon;
GRANT REFERENCES ON public.forum_comments TO authenticated;
GRANT REFERENCES ON public.forum_comments TO service_role;
GRANT REFERENCES ON public.forum_likes TO anon;
GRANT REFERENCES ON public.forum_likes TO authenticated;
GRANT REFERENCES ON public.forum_likes TO service_role;
GRANT REFERENCES ON public.forum_poll_votes TO anon;
GRANT REFERENCES ON public.forum_poll_votes TO authenticated;
GRANT REFERENCES ON public.forum_poll_votes TO service_role;
GRANT REFERENCES ON public.forum_posts TO anon;
GRANT REFERENCES ON public.forum_posts TO authenticated;
GRANT REFERENCES ON public.forum_posts TO service_role;
GRANT REFERENCES ON public.friendships TO anon;
GRANT REFERENCES ON public.friendships TO authenticated;
GRANT REFERENCES ON public.friendships TO service_role;
GRANT REFERENCES ON public.game_results TO anon;
GRANT REFERENCES ON public.game_results TO authenticated;
GRANT REFERENCES ON public.game_results TO service_role;
GRANT REFERENCES ON public.glossary TO anon;
GRANT REFERENCES ON public.glossary TO authenticated;
GRANT REFERENCES ON public.glossary TO service_role;
GRANT REFERENCES ON public.guided_hands TO anon;
GRANT REFERENCES ON public.guided_hands TO authenticated;
GRANT REFERENCES ON public.guided_hands TO service_role;
GRANT REFERENCES ON public.instructor_requests TO anon;
GRANT REFERENCES ON public.instructor_requests TO authenticated;
GRANT REFERENCES ON public.instructor_requests TO service_role;
GRANT REFERENCES ON public.lesson_modules TO anon;
GRANT REFERENCES ON public.lesson_modules TO authenticated;
GRANT REFERENCES ON public.lesson_modules TO service_role;
GRANT REFERENCES ON public.lessons TO anon;
GRANT REFERENCES ON public.lessons TO authenticated;
GRANT REFERENCES ON public.lessons TO service_role;
GRANT REFERENCES ON public.live_tables TO anon;
GRANT REFERENCES ON public.live_tables TO authenticated;
GRANT REFERENCES ON public.live_tables TO service_role;
GRANT REFERENCES ON public.login_history TO anon;
GRANT REFERENCES ON public.login_history TO authenticated;
GRANT REFERENCES ON public.login_history TO service_role;
GRANT REFERENCES ON public.partner_profiles TO anon;
GRANT REFERENCES ON public.partner_profiles TO authenticated;
GRANT REFERENCES ON public.partner_profiles TO service_role;
GRANT REFERENCES ON public.profiles TO anon;
GRANT REFERENCES ON public.profiles TO authenticated;
GRANT REFERENCES ON public.profiles TO service_role;
GRANT REFERENCES ON public.push_subscriptions TO anon;
GRANT REFERENCES ON public.push_subscriptions TO authenticated;
GRANT REFERENCES ON public.push_subscriptions TO service_role;
GRANT REFERENCES ON public.review_items TO anon;
GRANT REFERENCES ON public.review_items TO authenticated;
GRANT REFERENCES ON public.review_items TO service_role;
GRANT REFERENCES ON public.smazzate TO anon;
GRANT REFERENCES ON public.smazzate TO authenticated;
GRANT REFERENCES ON public.smazzate TO service_role;
GRANT REFERENCES ON public.tournament_results TO anon;
GRANT REFERENCES ON public.tournament_results TO authenticated;
GRANT REFERENCES ON public.tournament_results TO service_role;
GRANT REFERENCES ON public.trova_errore_scenarios TO anon;
GRANT REFERENCES ON public.trova_errore_scenarios TO authenticated;
GRANT REFERENCES ON public.trova_errore_scenarios TO service_role;
GRANT REFERENCES ON public.weekly_challenges TO anon;
GRANT REFERENCES ON public.weekly_challenges TO authenticated;
GRANT REFERENCES ON public.weekly_challenges TO service_role;
GRANT SELECT ON public.asd TO anon;
GRANT SELECT ON public.asd TO authenticated;
GRANT SELECT ON public.asd TO service_role;
GRANT SELECT ON public.asd_clubs TO anon;
GRANT SELECT ON public.asd_clubs TO authenticated;
GRANT SELECT ON public.asd_clubs TO service_role;
GRANT SELECT ON public.assignments TO anon;
GRANT SELECT ON public.assignments TO authenticated;
GRANT SELECT ON public.assignments TO service_role;
GRANT SELECT ON public.badges TO anon;
GRANT SELECT ON public.badges TO authenticated;
GRANT SELECT ON public.badges TO service_role;
GRANT SELECT ON public.bbo_username_cleanup_2026_08 TO anon;
GRANT SELECT ON public.bbo_username_cleanup_2026_08 TO authenticated;
GRANT SELECT ON public.bbo_username_cleanup_2026_08 TO service_role;
GRANT SELECT ON public.challenges TO anon;
GRANT SELECT ON public.challenges TO authenticated;
GRANT SELECT ON public.challenges TO service_role;
GRANT SELECT ON public.class_members TO anon;
GRANT SELECT ON public.class_members TO authenticated;
GRANT SELECT ON public.class_members TO service_role;
GRANT SELECT ON public.class_messages TO anon;
GRANT SELECT ON public.class_messages TO authenticated;
GRANT SELECT ON public.class_messages TO service_role;
GRANT SELECT ON public.classes TO anon;
GRANT SELECT ON public.classes TO authenticated;
GRANT SELECT ON public.classes TO service_role;
GRANT SELECT ON public.collectible_cards TO anon;
GRANT SELECT ON public.collectible_cards TO authenticated;
GRANT SELECT ON public.collectible_cards TO service_role;
GRANT SELECT ON public.completed_modules TO anon;
GRANT SELECT ON public.completed_modules TO authenticated;
GRANT SELECT ON public.completed_modules TO service_role;
GRANT SELECT ON public.course_worlds TO anon;
GRANT SELECT ON public.course_worlds TO authenticated;
GRANT SELECT ON public.course_worlds TO service_role;
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT ON public.courses TO service_role;
GRANT SELECT ON public.email_events TO anon;
GRANT SELECT ON public.email_events TO authenticated;
GRANT SELECT ON public.email_events TO service_role;
GRANT SELECT ON public.eserciziario_exercises TO anon;
GRANT SELECT ON public.eserciziario_exercises TO authenticated;
GRANT SELECT ON public.eserciziario_exercises TO service_role;
GRANT SELECT ON public.forum_comments TO anon;
GRANT SELECT ON public.forum_comments TO authenticated;
GRANT SELECT ON public.forum_comments TO service_role;
GRANT SELECT ON public.forum_likes TO anon;
GRANT SELECT ON public.forum_likes TO authenticated;
GRANT SELECT ON public.forum_likes TO service_role;
GRANT SELECT ON public.forum_poll_votes TO anon;
GRANT SELECT ON public.forum_poll_votes TO authenticated;
GRANT SELECT ON public.forum_poll_votes TO service_role;
GRANT SELECT ON public.forum_posts TO anon;
GRANT SELECT ON public.forum_posts TO authenticated;
GRANT SELECT ON public.forum_posts TO service_role;
GRANT SELECT ON public.friendships TO anon;
GRANT SELECT ON public.friendships TO authenticated;
GRANT SELECT ON public.friendships TO service_role;
GRANT SELECT ON public.game_results TO anon;
GRANT SELECT ON public.game_results TO authenticated;
GRANT SELECT ON public.game_results TO service_role;
GRANT SELECT ON public.glossary TO anon;
GRANT SELECT ON public.glossary TO authenticated;
GRANT SELECT ON public.glossary TO service_role;
GRANT SELECT ON public.guided_hands TO anon;
GRANT SELECT ON public.guided_hands TO authenticated;
GRANT SELECT ON public.guided_hands TO service_role;
GRANT SELECT ON public.instructor_requests TO anon;
GRANT SELECT ON public.instructor_requests TO authenticated;
GRANT SELECT ON public.instructor_requests TO service_role;
GRANT SELECT ON public.lesson_modules TO anon;
GRANT SELECT ON public.lesson_modules TO authenticated;
GRANT SELECT ON public.lesson_modules TO service_role;
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT ON public.lessons TO authenticated;
GRANT SELECT ON public.lessons TO service_role;
GRANT SELECT ON public.live_tables TO anon;
GRANT SELECT ON public.live_tables TO authenticated;
GRANT SELECT ON public.live_tables TO service_role;
GRANT SELECT ON public.login_history TO anon;
GRANT SELECT ON public.login_history TO authenticated;
GRANT SELECT ON public.login_history TO service_role;
GRANT SELECT ON public.partner_profiles TO anon;
GRANT SELECT ON public.partner_profiles TO authenticated;
GRANT SELECT ON public.partner_profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO service_role;
GRANT SELECT ON public.push_subscriptions TO anon;
GRANT SELECT ON public.push_subscriptions TO authenticated;
GRANT SELECT ON public.push_subscriptions TO service_role;
GRANT SELECT ON public.review_items TO anon;
GRANT SELECT ON public.review_items TO authenticated;
GRANT SELECT ON public.review_items TO service_role;
GRANT SELECT ON public.smazzate TO anon;
GRANT SELECT ON public.smazzate TO authenticated;
GRANT SELECT ON public.smazzate TO service_role;
GRANT SELECT ON public.tournament_results TO anon;
GRANT SELECT ON public.tournament_results TO authenticated;
GRANT SELECT ON public.tournament_results TO service_role;
GRANT SELECT ON public.trova_errore_scenarios TO anon;
GRANT SELECT ON public.trova_errore_scenarios TO authenticated;
GRANT SELECT ON public.trova_errore_scenarios TO service_role;
GRANT SELECT ON public.weekly_challenges TO anon;
GRANT SELECT ON public.weekly_challenges TO authenticated;
GRANT SELECT ON public.weekly_challenges TO service_role;
GRANT TRIGGER ON public.asd TO anon;
GRANT TRIGGER ON public.asd TO authenticated;
GRANT TRIGGER ON public.asd TO service_role;
GRANT TRIGGER ON public.asd_clubs TO anon;
GRANT TRIGGER ON public.asd_clubs TO authenticated;
GRANT TRIGGER ON public.asd_clubs TO service_role;
GRANT TRIGGER ON public.assignments TO anon;
GRANT TRIGGER ON public.assignments TO authenticated;
GRANT TRIGGER ON public.assignments TO service_role;
GRANT TRIGGER ON public.badges TO anon;
GRANT TRIGGER ON public.badges TO authenticated;
GRANT TRIGGER ON public.badges TO service_role;
GRANT TRIGGER ON public.bbo_username_cleanup_2026_08 TO anon;
GRANT TRIGGER ON public.bbo_username_cleanup_2026_08 TO authenticated;
GRANT TRIGGER ON public.bbo_username_cleanup_2026_08 TO service_role;
GRANT TRIGGER ON public.challenges TO anon;
GRANT TRIGGER ON public.challenges TO authenticated;
GRANT TRIGGER ON public.challenges TO service_role;
GRANT TRIGGER ON public.class_members TO anon;
GRANT TRIGGER ON public.class_members TO authenticated;
GRANT TRIGGER ON public.class_members TO service_role;
GRANT TRIGGER ON public.class_messages TO anon;
GRANT TRIGGER ON public.class_messages TO authenticated;
GRANT TRIGGER ON public.class_messages TO service_role;
GRANT TRIGGER ON public.classes TO anon;
GRANT TRIGGER ON public.classes TO authenticated;
GRANT TRIGGER ON public.classes TO service_role;
GRANT TRIGGER ON public.collectible_cards TO anon;
GRANT TRIGGER ON public.collectible_cards TO authenticated;
GRANT TRIGGER ON public.collectible_cards TO service_role;
GRANT TRIGGER ON public.completed_modules TO anon;
GRANT TRIGGER ON public.completed_modules TO authenticated;
GRANT TRIGGER ON public.completed_modules TO service_role;
GRANT TRIGGER ON public.course_worlds TO anon;
GRANT TRIGGER ON public.course_worlds TO authenticated;
GRANT TRIGGER ON public.course_worlds TO service_role;
GRANT TRIGGER ON public.courses TO anon;
GRANT TRIGGER ON public.courses TO authenticated;
GRANT TRIGGER ON public.courses TO service_role;
GRANT TRIGGER ON public.email_events TO anon;
GRANT TRIGGER ON public.email_events TO authenticated;
GRANT TRIGGER ON public.email_events TO service_role;
GRANT TRIGGER ON public.eserciziario_exercises TO anon;
GRANT TRIGGER ON public.eserciziario_exercises TO authenticated;
GRANT TRIGGER ON public.eserciziario_exercises TO service_role;
GRANT TRIGGER ON public.forum_comments TO anon;
GRANT TRIGGER ON public.forum_comments TO authenticated;
GRANT TRIGGER ON public.forum_comments TO service_role;
GRANT TRIGGER ON public.forum_likes TO anon;
GRANT TRIGGER ON public.forum_likes TO authenticated;
GRANT TRIGGER ON public.forum_likes TO service_role;
GRANT TRIGGER ON public.forum_poll_votes TO anon;
GRANT TRIGGER ON public.forum_poll_votes TO authenticated;
GRANT TRIGGER ON public.forum_poll_votes TO service_role;
GRANT TRIGGER ON public.forum_posts TO anon;
GRANT TRIGGER ON public.forum_posts TO authenticated;
GRANT TRIGGER ON public.forum_posts TO service_role;
GRANT TRIGGER ON public.friendships TO anon;
GRANT TRIGGER ON public.friendships TO authenticated;
GRANT TRIGGER ON public.friendships TO service_role;
GRANT TRIGGER ON public.game_results TO anon;
GRANT TRIGGER ON public.game_results TO authenticated;
GRANT TRIGGER ON public.game_results TO service_role;
GRANT TRIGGER ON public.glossary TO anon;
GRANT TRIGGER ON public.glossary TO authenticated;
GRANT TRIGGER ON public.glossary TO service_role;
GRANT TRIGGER ON public.guided_hands TO anon;
GRANT TRIGGER ON public.guided_hands TO authenticated;
GRANT TRIGGER ON public.guided_hands TO service_role;
GRANT TRIGGER ON public.instructor_requests TO anon;
GRANT TRIGGER ON public.instructor_requests TO authenticated;
GRANT TRIGGER ON public.instructor_requests TO service_role;
GRANT TRIGGER ON public.lesson_modules TO anon;
GRANT TRIGGER ON public.lesson_modules TO authenticated;
GRANT TRIGGER ON public.lesson_modules TO service_role;
GRANT TRIGGER ON public.lessons TO anon;
GRANT TRIGGER ON public.lessons TO authenticated;
GRANT TRIGGER ON public.lessons TO service_role;
GRANT TRIGGER ON public.live_tables TO anon;
GRANT TRIGGER ON public.live_tables TO authenticated;
GRANT TRIGGER ON public.live_tables TO service_role;
GRANT TRIGGER ON public.login_history TO anon;
GRANT TRIGGER ON public.login_history TO authenticated;
GRANT TRIGGER ON public.login_history TO service_role;
GRANT TRIGGER ON public.partner_profiles TO anon;
GRANT TRIGGER ON public.partner_profiles TO authenticated;
GRANT TRIGGER ON public.partner_profiles TO service_role;
GRANT TRIGGER ON public.profiles TO anon;
GRANT TRIGGER ON public.profiles TO authenticated;
GRANT TRIGGER ON public.profiles TO service_role;
GRANT TRIGGER ON public.push_subscriptions TO anon;
GRANT TRIGGER ON public.push_subscriptions TO authenticated;
GRANT TRIGGER ON public.push_subscriptions TO service_role;
GRANT TRIGGER ON public.review_items TO anon;
GRANT TRIGGER ON public.review_items TO authenticated;
GRANT TRIGGER ON public.review_items TO service_role;
GRANT TRIGGER ON public.smazzate TO anon;
GRANT TRIGGER ON public.smazzate TO authenticated;
GRANT TRIGGER ON public.smazzate TO service_role;
GRANT TRIGGER ON public.tournament_results TO anon;
GRANT TRIGGER ON public.tournament_results TO authenticated;
GRANT TRIGGER ON public.tournament_results TO service_role;
GRANT TRIGGER ON public.trova_errore_scenarios TO anon;
GRANT TRIGGER ON public.trova_errore_scenarios TO authenticated;
GRANT TRIGGER ON public.trova_errore_scenarios TO service_role;
GRANT TRIGGER ON public.weekly_challenges TO anon;
GRANT TRIGGER ON public.weekly_challenges TO authenticated;
GRANT TRIGGER ON public.weekly_challenges TO service_role;
GRANT TRUNCATE ON public.asd TO anon;
GRANT TRUNCATE ON public.asd TO authenticated;
GRANT TRUNCATE ON public.asd TO service_role;
GRANT TRUNCATE ON public.asd_clubs TO anon;
GRANT TRUNCATE ON public.asd_clubs TO authenticated;
GRANT TRUNCATE ON public.asd_clubs TO service_role;
GRANT TRUNCATE ON public.assignments TO anon;
GRANT TRUNCATE ON public.assignments TO authenticated;
GRANT TRUNCATE ON public.assignments TO service_role;
GRANT TRUNCATE ON public.badges TO anon;
GRANT TRUNCATE ON public.badges TO authenticated;
GRANT TRUNCATE ON public.badges TO service_role;
GRANT TRUNCATE ON public.bbo_username_cleanup_2026_08 TO anon;
GRANT TRUNCATE ON public.bbo_username_cleanup_2026_08 TO authenticated;
GRANT TRUNCATE ON public.bbo_username_cleanup_2026_08 TO service_role;
GRANT TRUNCATE ON public.challenges TO anon;
GRANT TRUNCATE ON public.challenges TO authenticated;
GRANT TRUNCATE ON public.challenges TO service_role;
GRANT TRUNCATE ON public.class_members TO anon;
GRANT TRUNCATE ON public.class_members TO authenticated;
GRANT TRUNCATE ON public.class_members TO service_role;
GRANT TRUNCATE ON public.class_messages TO anon;
GRANT TRUNCATE ON public.class_messages TO authenticated;
GRANT TRUNCATE ON public.class_messages TO service_role;
GRANT TRUNCATE ON public.classes TO anon;
GRANT TRUNCATE ON public.classes TO authenticated;
GRANT TRUNCATE ON public.classes TO service_role;
GRANT TRUNCATE ON public.collectible_cards TO anon;
GRANT TRUNCATE ON public.collectible_cards TO authenticated;
GRANT TRUNCATE ON public.collectible_cards TO service_role;
GRANT TRUNCATE ON public.completed_modules TO anon;
GRANT TRUNCATE ON public.completed_modules TO authenticated;
GRANT TRUNCATE ON public.completed_modules TO service_role;
GRANT TRUNCATE ON public.course_worlds TO anon;
GRANT TRUNCATE ON public.course_worlds TO authenticated;
GRANT TRUNCATE ON public.course_worlds TO service_role;
GRANT TRUNCATE ON public.courses TO anon;
GRANT TRUNCATE ON public.courses TO authenticated;
GRANT TRUNCATE ON public.courses TO service_role;
GRANT TRUNCATE ON public.email_events TO anon;
GRANT TRUNCATE ON public.email_events TO authenticated;
GRANT TRUNCATE ON public.email_events TO service_role;
GRANT TRUNCATE ON public.eserciziario_exercises TO anon;
GRANT TRUNCATE ON public.eserciziario_exercises TO authenticated;
GRANT TRUNCATE ON public.eserciziario_exercises TO service_role;
GRANT TRUNCATE ON public.forum_comments TO anon;
GRANT TRUNCATE ON public.forum_comments TO authenticated;
GRANT TRUNCATE ON public.forum_comments TO service_role;
GRANT TRUNCATE ON public.forum_likes TO anon;
GRANT TRUNCATE ON public.forum_likes TO authenticated;
GRANT TRUNCATE ON public.forum_likes TO service_role;
GRANT TRUNCATE ON public.forum_poll_votes TO anon;
GRANT TRUNCATE ON public.forum_poll_votes TO authenticated;
GRANT TRUNCATE ON public.forum_poll_votes TO service_role;
GRANT TRUNCATE ON public.forum_posts TO anon;
GRANT TRUNCATE ON public.forum_posts TO authenticated;
GRANT TRUNCATE ON public.forum_posts TO service_role;
GRANT TRUNCATE ON public.friendships TO anon;
GRANT TRUNCATE ON public.friendships TO authenticated;
GRANT TRUNCATE ON public.friendships TO service_role;
GRANT TRUNCATE ON public.game_results TO anon;
GRANT TRUNCATE ON public.game_results TO authenticated;
GRANT TRUNCATE ON public.game_results TO service_role;
GRANT TRUNCATE ON public.glossary TO anon;
GRANT TRUNCATE ON public.glossary TO authenticated;
GRANT TRUNCATE ON public.glossary TO service_role;
GRANT TRUNCATE ON public.guided_hands TO anon;
GRANT TRUNCATE ON public.guided_hands TO authenticated;
GRANT TRUNCATE ON public.guided_hands TO service_role;
GRANT TRUNCATE ON public.instructor_requests TO anon;
GRANT TRUNCATE ON public.instructor_requests TO authenticated;
GRANT TRUNCATE ON public.instructor_requests TO service_role;
GRANT TRUNCATE ON public.lesson_modules TO anon;
GRANT TRUNCATE ON public.lesson_modules TO authenticated;
GRANT TRUNCATE ON public.lesson_modules TO service_role;
GRANT TRUNCATE ON public.lessons TO anon;
GRANT TRUNCATE ON public.lessons TO authenticated;
GRANT TRUNCATE ON public.lessons TO service_role;
GRANT TRUNCATE ON public.live_tables TO anon;
GRANT TRUNCATE ON public.live_tables TO authenticated;
GRANT TRUNCATE ON public.live_tables TO service_role;
GRANT TRUNCATE ON public.login_history TO anon;
GRANT TRUNCATE ON public.login_history TO authenticated;
GRANT TRUNCATE ON public.login_history TO service_role;
GRANT TRUNCATE ON public.partner_profiles TO anon;
GRANT TRUNCATE ON public.partner_profiles TO authenticated;
GRANT TRUNCATE ON public.partner_profiles TO service_role;
GRANT TRUNCATE ON public.profiles TO anon;
GRANT TRUNCATE ON public.profiles TO authenticated;
GRANT TRUNCATE ON public.profiles TO service_role;
GRANT TRUNCATE ON public.push_subscriptions TO anon;
GRANT TRUNCATE ON public.push_subscriptions TO authenticated;
GRANT TRUNCATE ON public.push_subscriptions TO service_role;
GRANT TRUNCATE ON public.review_items TO anon;
GRANT TRUNCATE ON public.review_items TO authenticated;
GRANT TRUNCATE ON public.review_items TO service_role;
GRANT TRUNCATE ON public.smazzate TO anon;
GRANT TRUNCATE ON public.smazzate TO authenticated;
GRANT TRUNCATE ON public.smazzate TO service_role;
GRANT TRUNCATE ON public.tournament_results TO anon;
GRANT TRUNCATE ON public.tournament_results TO authenticated;
GRANT TRUNCATE ON public.tournament_results TO service_role;
GRANT TRUNCATE ON public.trova_errore_scenarios TO anon;
GRANT TRUNCATE ON public.trova_errore_scenarios TO authenticated;
GRANT TRUNCATE ON public.trova_errore_scenarios TO service_role;
GRANT TRUNCATE ON public.weekly_challenges TO anon;
GRANT TRUNCATE ON public.weekly_challenges TO authenticated;
GRANT TRUNCATE ON public.weekly_challenges TO service_role;
GRANT UPDATE ON public.asd TO anon;
GRANT UPDATE ON public.asd TO authenticated;
GRANT UPDATE ON public.asd TO service_role;
GRANT UPDATE ON public.asd_clubs TO anon;
GRANT UPDATE ON public.asd_clubs TO authenticated;
GRANT UPDATE ON public.asd_clubs TO service_role;
GRANT UPDATE ON public.assignments TO anon;
GRANT UPDATE ON public.assignments TO authenticated;
GRANT UPDATE ON public.assignments TO service_role;
GRANT UPDATE ON public.badges TO anon;
GRANT UPDATE ON public.badges TO authenticated;
GRANT UPDATE ON public.badges TO service_role;
GRANT UPDATE ON public.bbo_username_cleanup_2026_08 TO anon;
GRANT UPDATE ON public.bbo_username_cleanup_2026_08 TO authenticated;
GRANT UPDATE ON public.bbo_username_cleanup_2026_08 TO service_role;
GRANT UPDATE ON public.challenges TO anon;
GRANT UPDATE ON public.challenges TO authenticated;
GRANT UPDATE ON public.challenges TO service_role;
GRANT UPDATE ON public.class_members TO anon;
GRANT UPDATE ON public.class_members TO authenticated;
GRANT UPDATE ON public.class_members TO service_role;
GRANT UPDATE ON public.class_messages TO anon;
GRANT UPDATE ON public.class_messages TO authenticated;
GRANT UPDATE ON public.class_messages TO service_role;
GRANT UPDATE ON public.classes TO anon;
GRANT UPDATE ON public.classes TO authenticated;
GRANT UPDATE ON public.classes TO service_role;
GRANT UPDATE ON public.collectible_cards TO anon;
GRANT UPDATE ON public.collectible_cards TO authenticated;
GRANT UPDATE ON public.collectible_cards TO service_role;
GRANT UPDATE ON public.completed_modules TO anon;
GRANT UPDATE ON public.completed_modules TO authenticated;
GRANT UPDATE ON public.completed_modules TO service_role;
GRANT UPDATE ON public.course_worlds TO anon;
GRANT UPDATE ON public.course_worlds TO authenticated;
GRANT UPDATE ON public.course_worlds TO service_role;
GRANT UPDATE ON public.courses TO anon;
GRANT UPDATE ON public.courses TO authenticated;
GRANT UPDATE ON public.courses TO service_role;
GRANT UPDATE ON public.email_events TO anon;
GRANT UPDATE ON public.email_events TO authenticated;
GRANT UPDATE ON public.email_events TO service_role;
GRANT UPDATE ON public.eserciziario_exercises TO anon;
GRANT UPDATE ON public.eserciziario_exercises TO authenticated;
GRANT UPDATE ON public.eserciziario_exercises TO service_role;
GRANT UPDATE ON public.forum_comments TO anon;
GRANT UPDATE ON public.forum_comments TO authenticated;
GRANT UPDATE ON public.forum_comments TO service_role;
GRANT UPDATE ON public.forum_likes TO anon;
GRANT UPDATE ON public.forum_likes TO authenticated;
GRANT UPDATE ON public.forum_likes TO service_role;
GRANT UPDATE ON public.forum_poll_votes TO anon;
GRANT UPDATE ON public.forum_poll_votes TO authenticated;
GRANT UPDATE ON public.forum_poll_votes TO service_role;
GRANT UPDATE ON public.forum_posts TO anon;
GRANT UPDATE ON public.forum_posts TO authenticated;
GRANT UPDATE ON public.forum_posts TO service_role;
GRANT UPDATE ON public.friendships TO anon;
GRANT UPDATE ON public.friendships TO authenticated;
GRANT UPDATE ON public.friendships TO service_role;
GRANT UPDATE ON public.game_results TO anon;
GRANT UPDATE ON public.game_results TO authenticated;
GRANT UPDATE ON public.game_results TO service_role;
GRANT UPDATE ON public.glossary TO anon;
GRANT UPDATE ON public.glossary TO authenticated;
GRANT UPDATE ON public.glossary TO service_role;
GRANT UPDATE ON public.guided_hands TO anon;
GRANT UPDATE ON public.guided_hands TO authenticated;
GRANT UPDATE ON public.guided_hands TO service_role;
GRANT UPDATE ON public.instructor_requests TO anon;
GRANT UPDATE ON public.instructor_requests TO authenticated;
GRANT UPDATE ON public.instructor_requests TO service_role;
GRANT UPDATE ON public.lesson_modules TO anon;
GRANT UPDATE ON public.lesson_modules TO authenticated;
GRANT UPDATE ON public.lesson_modules TO service_role;
GRANT UPDATE ON public.lessons TO anon;
GRANT UPDATE ON public.lessons TO authenticated;
GRANT UPDATE ON public.lessons TO service_role;
GRANT UPDATE ON public.live_tables TO anon;
GRANT UPDATE ON public.live_tables TO authenticated;
GRANT UPDATE ON public.live_tables TO service_role;
GRANT UPDATE ON public.login_history TO anon;
GRANT UPDATE ON public.login_history TO authenticated;
GRANT UPDATE ON public.login_history TO service_role;
GRANT UPDATE ON public.partner_profiles TO anon;
GRANT UPDATE ON public.partner_profiles TO authenticated;
GRANT UPDATE ON public.partner_profiles TO service_role;
GRANT UPDATE ON public.profiles TO anon;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO service_role;
GRANT UPDATE ON public.push_subscriptions TO anon;
GRANT UPDATE ON public.push_subscriptions TO authenticated;
GRANT UPDATE ON public.push_subscriptions TO service_role;
GRANT UPDATE ON public.review_items TO anon;
GRANT UPDATE ON public.review_items TO authenticated;
GRANT UPDATE ON public.review_items TO service_role;
GRANT UPDATE ON public.smazzate TO anon;
GRANT UPDATE ON public.smazzate TO authenticated;
GRANT UPDATE ON public.smazzate TO service_role;
GRANT UPDATE ON public.tournament_results TO anon;
GRANT UPDATE ON public.tournament_results TO authenticated;
GRANT UPDATE ON public.tournament_results TO service_role;
GRANT UPDATE ON public.trova_errore_scenarios TO anon;
GRANT UPDATE ON public.trova_errore_scenarios TO authenticated;
GRANT UPDATE ON public.trova_errore_scenarios TO service_role;
GRANT UPDATE ON public.weekly_challenges TO anon;
GRANT UPDATE ON public.weekly_challenges TO authenticated;
GRANT UPDATE ON public.weekly_challenges TO service_role;

-- PERMESSI SULLE FUNZIONI
REVOKE ALL ON FUNCTION public.admin_class_detail(p_class_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_class_detail(p_class_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_class_detail(p_class_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.admin_game_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_game_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_game_stats() TO service_role;
REVOKE ALL ON FUNCTION public.admin_list_classes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_classes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_classes() TO service_role;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO service_role;
REVOKE ALL ON FUNCTION public.admin_login_history(p_days integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_login_history(p_days integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_login_history(p_days integer) TO service_role;
REVOKE ALL ON FUNCTION public.admin_school_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_school_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_school_stats() TO service_role;
REVOKE ALL ON FUNCTION public.dump_schema() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dump_schema() TO service_role;
REVOKE ALL ON FUNCTION public.generate_invite_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO anon;
GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO service_role;
REVOKE ALL ON FUNCTION public.get_challenge_history(p_user_id uuid, p_limit integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_challenge_history(p_user_id uuid, p_limit integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_challenge_history(p_user_id uuid, p_limit integer) TO service_role;
REVOKE ALL ON FUNCTION public.get_challenge_stats(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_challenge_stats(p_user_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_challenge_stats(p_user_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.get_class_leaderboard(p_class_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_class_leaderboard(p_class_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_leaderboard(p_class_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.get_class_results(p_assignment_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_class_results(p_assignment_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_results(p_assignment_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.get_club_leaderboard(p_asd_code text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_club_leaderboard(p_asd_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_leaderboard(p_asd_code text) TO service_role;
REVOKE ALL ON FUNCTION public.get_club_stats(p_asd_code text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_club_stats(p_asd_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_club_stats(p_asd_code text) TO service_role;
REVOKE ALL ON FUNCTION public.get_daily_field_stats(p_date text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_daily_field_stats(p_date text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_field_stats(p_date text) TO service_role;
REVOKE ALL ON FUNCTION public.get_engagement_targets(p_limit integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_engagement_targets(p_limit integer) TO service_role;
REVOKE ALL ON FUNCTION public.get_game_leaderboard(p_game_type text, p_limit integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_game_leaderboard(p_game_type text, p_limit integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_game_leaderboard(p_game_type text, p_limit integer) TO service_role;
REVOKE ALL ON FUNCTION public.get_own_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO service_role;
REVOKE ALL ON FUNCTION public.get_pending_challenges(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pending_challenges(p_user_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_challenges(p_user_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
REVOKE ALL ON FUNCTION public.is_bbo_username_taken(p_bbo_username text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_bbo_username_taken(p_bbo_username text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_bbo_username_taken(p_bbo_username text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_bbo_username_taken(p_bbo_username text) TO anon;
REVOKE ALL ON FUNCTION public.is_instructor_of_assignment(p_assignment_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_instructor_of_assignment(p_assignment_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_instructor_of_assignment(p_assignment_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.is_instructor_of_class(p_class_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_instructor_of_class(p_class_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_instructor_of_class(p_class_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.is_member_of_class(p_class_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member_of_class(p_class_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_of_class(p_class_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.join_class_by_code(p_code text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(p_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(p_code text) TO service_role;
REVOKE ALL ON FUNCTION public.list_instructor_requests(p_status text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_instructor_requests(p_status text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_instructor_requests(p_status text) TO service_role;
REVOKE ALL ON FUNCTION public.list_partner_candidates(p_level text, p_province text, p_availability text[], p_limit integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_partner_candidates(p_level text, p_province text, p_availability text[], p_limit integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_partner_candidates(p_level text, p_province text, p_availability text[], p_limit integer) TO service_role;
REVOKE ALL ON FUNCTION public.live_table_open(p_class_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.live_table_open(p_class_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_table_open(p_class_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.live_table_view(p_table_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.live_table_view(p_table_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_table_view(p_table_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.log_user_login() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_user_login() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_login() TO service_role;
REVOKE ALL ON FUNCTION public.my_tournament_history(limite integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_tournament_history(limite integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_tournament_history(limite integer) TO service_role;
REVOKE ALL ON FUNCTION public.review_instructor_request(p_request_id uuid, p_approve boolean, p_message text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_instructor_request(p_request_id uuid, p_approve boolean, p_message text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_instructor_request(p_request_id uuid, p_approve boolean, p_message text) TO service_role;
REVOKE ALL ON FUNCTION public.search_users(p_query text, p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_users(p_query text, p_user_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users(p_query text, p_user_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.sync_asd_name() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_asd_name() TO anon;
GRANT EXECUTE ON FUNCTION public.sync_asd_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_asd_name() TO service_role;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO service_role;

-- PUBLICATION (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_tables;
