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
-- Estratto il: 2026-08-19
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
  custom_hands jsonb,
  soluzioni text NOT NULL
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

CREATE TABLE IF NOT EXISTS public.bidding_sessions (
  id uuid NOT NULL,
  south_id uuid NOT NULL,
  north_id uuid NOT NULL,
  hands jsonb NOT NULL,
  dealer text NOT NULL,
  vulnerability text NOT NULL,
  bids jsonb NOT NULL,
  closed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL,
  last_bid_at timestamp with time zone NOT NULL
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
  created_at timestamp with time zone NOT NULL,
  approvazione_automatica boolean NOT NULL,
  invite_expires_at timestamp with time zone,
  stato text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.club_posts (
  id uuid NOT NULL,
  asd_code text NOT NULL,
  author_id uuid NOT NULL,
  titolo text NOT NULL,
  corpo text NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.coda_sfide_coppie (
  id uuid NOT NULL,
  a1 uuid NOT NULL,
  a2 uuid NOT NULL,
  quante integer NOT NULL,
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
  updated_at timestamp with time zone NOT NULL,
  name_en text,
  description_en text
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
  updated_at timestamp with time zone NOT NULL,
  name_en text,
  subtitle_en text
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
  updated_at timestamp with time zone NOT NULL,
  name_en text,
  subtitle_en text
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
  updated_at timestamp with time zone NOT NULL,
  title_en text,
  content_en jsonb
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
  updated_at timestamp with time zone NOT NULL,
  term_en text,
  definition_en text,
  example_en text
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
  updated_at timestamp with time zone NOT NULL,
  title_en text,
  content_en jsonb
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id integer NOT NULL,
  world_id integer NOT NULL,
  title text NOT NULL,
  subtitle text,
  icon text,
  "position" integer NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  title_en text,
  subtitle_en text
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
  updated_at timestamp with time zone NOT NULL,
  played jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  logged_in_at timestamp with time zone NOT NULL,
  platform text
);

CREATE TABLE IF NOT EXISTS public.mani_generate (
  id uuid NOT NULL,
  scenario_id uuid,
  hands jsonb NOT NULL,
  dealer text NOT NULL,
  vulnerability text NOT NULL,
  par_contracts jsonb,
  par_score integer,
  dd_table jsonb,
  created_at timestamp with time zone NOT NULL,
  valore_atteso jsonb,
  distribuzioni jsonb,
  ns_hcp smallint
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
  role text NOT NULL,
  friend_code text,
  lingua text NOT NULL
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
  next_review timestamp with time zone,
  box smallint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.risultati_mano (
  id uuid NOT NULL,
  mano_id uuid NOT NULL,
  user_id uuid NOT NULL,
  partner_id uuid,
  contratto text,
  dichiarante text,
  punteggio integer NOT NULL,
  stelle numeric(2,1) NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.risultati_torneo (
  torneo_id uuid NOT NULL,
  mano_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contratto text,
  dichiarante text,
  punteggio integer NOT NULL,
  stelle numeric(2,1) NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.saved_hands (
  id uuid NOT NULL,
  owner_id uuid NOT NULL,
  titolo text NOT NULL,
  nota text,
  hands jsonb NOT NULL,
  contract text,
  declarer text,
  played jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.scenari (
  id uuid NOT NULL,
  nome text NOT NULL,
  descrizione text,
  vincoli jsonb NOT NULL,
  autore_id uuid,
  ufficiale boolean NOT NULL,
  pubblico boolean NOT NULL,
  modulo text,
  created_at timestamp with time zone NOT NULL,
  slug text
);

CREATE TABLE IF NOT EXISTS public.sfida_board (
  sfida_id uuid NOT NULL,
  mano_id uuid NOT NULL,
  coppia text NOT NULL,
  numero integer NOT NULL,
  sessione_id uuid NOT NULL,
  contratto text,
  dichiarante text,
  prese integer,
  punteggio integer
);

CREATE TABLE IF NOT EXISTS public.sfide_coppie (
  id uuid NOT NULL,
  creatore_id uuid NOT NULL,
  a1 uuid NOT NULL,
  a2 uuid NOT NULL,
  b1 uuid NOT NULL,
  b2 uuid NOT NULL,
  created_at timestamp with time zone NOT NULL,
  closed_at timestamp with time zone
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
  dd_tricks smallint,
  title_en text,
  commentary_en text
);

CREATE TABLE IF NOT EXISTS public.tornei (
  id uuid NOT NULL,
  tipo text NOT NULL,
  periodo integer NOT NULL,
  apre_at timestamp with time zone NOT NULL,
  chiude_at timestamp with time zone NOT NULL,
  creato_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.torneo_mani (
  torneo_id uuid NOT NULL,
  numero integer NOT NULL,
  mano_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tournament_results (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  week_num integer NOT NULL,
  total_tricks integer NOT NULL,
  total_needed integer NOT NULL,
  completed_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.traduzioni_stato (
  tabella text NOT NULL,
  riga_id text NOT NULL,
  campo text NOT NULL,
  impronta_it text NOT NULL,
  tradotto_il timestamp with time zone NOT NULL
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
  updated_at timestamp with time zone NOT NULL,
  situation_en text,
  error_description_en text,
  explanation_en text
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

CREATE OR REPLACE FUNCTION public.amico_da_codice(p_codice text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    ELSE (
      SELECT jsonb_build_object('id', p.id, 'nome', p.display_name)
      FROM public.profiles p
      WHERE upper(btrim(p.friend_code)) = upper(btrim(p_codice))
        AND p.id <> auth.uid()
      LIMIT 1
    )
  END;
$function$
;

CREATE OR REPLACE FUNCTION public.bidding_session_bid(p_id uuid, p_bid text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  s public.bidding_sessions%ROWTYPE;
  v_seat text; v_turno text;
  ordine text[] := ARRAY['north','east','south','west'];
  i_dealer int; n int; nuove jsonb; ultimo_contratto int;
BEGIN
  SELECT * INTO s FROM public.bidding_sessions WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR s.closed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'sessione non disponibile');
  END IF;
  v_seat := CASE WHEN s.south_id = auth.uid() THEN 'south'
                 WHEN s.north_id = auth.uid() THEN 'north' ELSE NULL END;
  IF v_seat IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'non fai parte di questa licita');
  END IF;
  n := jsonb_array_length(s.bids);
  i_dealer := array_position(ordine, s.dealer);
  v_turno := ordine[((i_dealer - 1 + n) % 4) + 1];
  IF v_turno <> v_seat THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'non è il tuo turno');
  END IF;
  nuove := s.bids || to_jsonb(p_bid);
  SELECT max(i) INTO ultimo_contratto
  FROM generate_series(0, jsonb_array_length(nuove) - 1) i
  WHERE nuove ->> i <> 'P';
  UPDATE public.bidding_sessions
  SET bids = nuove,
      closed_at = CASE
        WHEN ultimo_contratto IS NULL AND jsonb_array_length(nuove) >= 4 THEN now()
        WHEN ultimo_contratto IS NOT NULL AND jsonb_array_length(nuove) - ultimo_contratto - 1 >= 3 THEN now()
        ELSE NULL END
  WHERE id = p_id;
  RETURN jsonb_build_object('ok', true, 'turno', v_turno);
END $function$
;

CREATE OR REPLACE FUNCTION public.bidding_session_bid_server(p_id uuid, p_bid text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  s public.bidding_sessions%ROWTYPE;
  v_turno text; ordine text[] := ARRAY['north','east','south','west'];
  i_dealer int; n int; nuove jsonb; ultimo_contratto int;
BEGIN
  SELECT * INTO s FROM public.bidding_sessions WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR s.closed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'sessione non disponibile');
  END IF;

  n := jsonb_array_length(s.bids);
  i_dealer := array_position(ordine, s.dealer);
  v_turno := ordine[((i_dealer - 1 + n) % 4) + 1];

  -- Solo per gli avversari: il server non deve poter dichiarare al posto dei
  -- due amici, nemmeno per sbaglio.
  IF v_turno IN ('north','south') THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'non tocca a un avversario');
  END IF;

  nuove := s.bids || to_jsonb(p_bid);
  SELECT max(i) INTO ultimo_contratto
  FROM generate_series(0, jsonb_array_length(nuove) - 1) i
  WHERE nuove ->> i <> 'P';

  UPDATE public.bidding_sessions
  SET bids = nuove,
      closed_at = CASE
        WHEN ultimo_contratto IS NULL AND jsonb_array_length(nuove) >= 4 THEN now()
        WHEN ultimo_contratto IS NOT NULL AND jsonb_array_length(nuove) - ultimo_contratto - 1 >= 3 THEN now()
        ELSE NULL END
  WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'seat', v_turno);
END $function$
;

CREATE OR REPLACE FUNCTION public.bidding_session_create(p_partner uuid, p_hands jsonb, p_dealer text DEFAULT 'south'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_partner IS NULL OR p_partner = auth.uid() THEN
    RETURN NULL;
  END IF;
  -- Si può invitare solo un amico: la licita a due è fra persone che si
  -- conoscono, non un modo per mandare mani a sconosciuti.
  IF NOT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
      AND ((f.user_id = auth.uid() AND f.friend_id = p_partner)
        OR (f.friend_id = auth.uid() AND f.user_id = p_partner))
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.bidding_sessions (south_id, north_id, hands, dealer)
  VALUES (auth.uid(), p_partner, p_hands, coalesce(p_dealer, 'south'))
  RETURNING id INTO v_id;
  RETURN v_id;
END $function$
;

CREATE OR REPLACE FUNCTION public.bidding_session_view(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  s public.bidding_sessions%ROWTYPE;
  v_seat text; v_chiusa boolean; v_turno text; v_hands jsonb;
  ordine text[] := ARRAY['north','east','south','west']; i_dealer int;
BEGIN
  SELECT * INTO s FROM public.bidding_sessions WHERE id = p_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  v_seat := CASE WHEN s.south_id = auth.uid() THEN 'south'
                 WHEN s.north_id = auth.uid() THEN 'north' ELSE NULL END;
  IF v_seat IS NULL THEN RETURN NULL; END IF;
  v_chiusa := s.closed_at IS NOT NULL;
  i_dealer := array_position(ordine, s.dealer);
  v_turno := ordine[((i_dealer - 1 + jsonb_array_length(s.bids)) % 4) + 1];
  IF v_chiusa THEN v_hands := s.hands;
  ELSE v_hands := jsonb_build_object(v_seat, s.hands -> v_seat); END IF;
  RETURN jsonb_build_object('id', s.id, 'seat', v_seat, 'hands', v_hands,
    'bids', s.bids, 'dealer', s.dealer, 'turno', v_turno,
    'chiusa', v_chiusa, 'createdAt', s.created_at);
END $function$
;

CREATE OR REPLACE FUNCTION public.can_post_for_asd(p_asd_code text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
      AND (role = 'admin' OR asd_code = p_asd_code)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.classifica_torneo(p_torneo uuid, p_quanti integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object(
    'totale', (SELECT count(DISTINCT user_id) FROM public.risultati_torneo WHERE torneo_id = p_torneo),
    'mia', (
      SELECT jsonb_build_object('posizione', x.posizione, 'stelle', x.stelle, 'mani', x.mani)
      FROM (
        SELECT r.user_id,
               rank() OVER (ORDER BY sum(r.stelle) DESC, max(r.created_at)) AS posizione,
               sum(r.stelle) AS stelle, count(*) AS mani
        FROM public.risultati_torneo r WHERE r.torneo_id = p_torneo
        GROUP BY r.user_id
      ) x WHERE x.user_id = auth.uid()
    ),
    'righe', (
      SELECT coalesce(jsonb_agg(y ORDER BY (y->>'posizione')::int), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'posizione', rank() OVER (ORDER BY sum(r.stelle) DESC, max(r.created_at)),
          'nome', p.display_name,
          'asd', p.asd_name,
          'stelle', sum(r.stelle),
          'mani', count(*),
          'sonoIo', r.user_id = auth.uid()
        ) AS y
        FROM public.risultati_torneo r
        JOIN public.profiles p ON p.id = r.user_id
        WHERE r.torneo_id = p_torneo
        GROUP BY r.user_id, p.display_name, p.asd_name
        ORDER BY sum(r.stelle) DESC, max(r.created_at)
        LIMIT greatest(1, least(coalesce(p_quanti, 50), 200))
      ) t
    )
  ) END;
$function$
;

CREATE OR REPLACE FUNCTION public.commento_negato(p_smazzata_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from assignments a
    join class_members m
      on m.class_id = a.class_id
     and m.student_id = auth.uid()
     and m.status = 'active'
    where a.soluzioni <> 'subito'
      and p_smazzata_id = any (a.smazzata_ids)
      and not is_instructor_of_class(a.class_id)
      and case a.soluzioni
        when 'dopo-il-gioco' then not exists (
          select 1 from game_results gr
          where gr.assignment_id = a.id
            and gr.user_id = auth.uid()
            and gr.details->>'smazzata_id' = p_smazzata_id
        )
        when 'dopo-la-scadenza' then (a.due_date is null or now() < a.due_date)
        else false
      end
  );
$function$
;

CREATE OR REPLACE FUNCTION public.compito_per_allievo(p_assignment_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  a assignments;
  mani jsonb;
begin
  select * into a from assignments where id = p_assignment_id;
  if a.id is null then
    raise exception 'assignment not found' using errcode = 'P0002';
  end if;

  if not (is_instructor_of_class(a.class_id) or is_member_of_class(a.class_id)) then
    raise exception 'not authorized for assignment %', p_assignment_id
      using errcode = '42501';
  end if;

  mani := coalesce(a.custom_hands, '[]'::jsonb);

  if not is_instructor_of_class(a.class_id) and a.soluzioni <> 'subito' then
    select coalesce(jsonb_agg(
      case when public.commento_negato(mano->>'id')
        then mano - 'commentary'
        else mano
      end
    ), '[]'::jsonb)
    into mani
    from jsonb_array_elements(mani) as mano;
  end if;

  return to_jsonb(a) || jsonb_build_object('custom_hands', mani);
end $function$
;

CREATE OR REPLACE FUNCTION public.confronto_campo(p_mano_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object(
    'totale', (SELECT count(*) FROM public.risultati_mano r WHERE r.mano_id = p_mano_id),
    'mio', (
      SELECT jsonb_build_object('contratto', r.contratto, 'punteggio', r.punteggio, 'stelle', r.stelle)
      FROM public.risultati_mano r WHERE r.mano_id = p_mano_id AND r.user_id = auth.uid()
    ),
    'percentile', (
      SELECT CASE WHEN count(*) = 0 THEN NULL ELSE
        round(100.0 * count(*) FILTER (
          WHERE r.punteggio < (SELECT m.punteggio FROM public.risultati_mano m
                               WHERE m.mano_id = p_mano_id AND m.user_id = auth.uid())
        ) / count(*)) END
      FROM public.risultati_mano r WHERE r.mano_id = p_mano_id AND r.user_id <> auth.uid()
    ),
    'contratti', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'contratto', coalesce(r.contratto, 'passo'),
          'quanti', count(*),
          'punteggioMedio', round(avg(r.punteggio)),
          'stelleMedie', round(avg(r.stelle), 1)
        ) AS x
        FROM public.risultati_mano r WHERE r.mano_id = p_mano_id
        GROUP BY coalesce(r.contratto, 'passo')
        ORDER BY count(*) DESC
      ) t
    )
  ) END;
$function$
;

CREATE OR REPLACE FUNCTION public.confronto_campo_filtrato(p_mano_id uuid, p_filtro text DEFAULT 'tutti'::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH me AS (SELECT auth.uid() AS id),
  gruppo AS (
    SELECT r.user_id, r.contratto, r.punteggio, r.stelle
    FROM public.risultati_mano r, me
    WHERE me.id IS NOT NULL
      AND r.mano_id = p_mano_id
      AND (
        p_filtro = 'tutti'
        OR (p_filtro = 'amici' AND (
          r.user_id = me.id
          OR EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE f.status = 'accepted'
              AND ((f.user_id = me.id AND f.friend_id = r.user_id)
                OR (f.friend_id = me.id AND f.user_id = r.user_id))
          )))
        OR (p_filtro = 'classe' AND EXISTS (
          SELECT 1
          FROM public.class_members mio
          JOIN public.class_members suo ON suo.class_id = mio.class_id
          WHERE mio.student_id = me.id AND mio.status = 'active'
            AND suo.student_id = r.user_id AND suo.status = 'active'
        ))
        OR (p_filtro = 'asd' AND EXISTS (
          SELECT 1 FROM public.profiles p1, public.profiles p2
          WHERE p1.id = me.id AND p2.id = r.user_id
            AND p1.asd_code IS NOT NULL AND p1.asd_code = p2.asd_code
        ))
      )
  )
  SELECT CASE WHEN (SELECT id FROM me) IS NULL THEN NULL ELSE jsonb_build_object(
    'filtro', p_filtro,
    'totale', (SELECT count(*) FROM gruppo),
    'mio', (
      SELECT jsonb_build_object('contratto', g.contratto, 'punteggio', g.punteggio, 'stelle', g.stelle)
      FROM gruppo g, me WHERE g.user_id = me.id
    ),
    'percentile', (
      SELECT CASE WHEN count(*) = 0 THEN NULL ELSE
        round(100.0 * count(*) FILTER (
          WHERE g.punteggio < (SELECT g2.punteggio FROM gruppo g2, me WHERE g2.user_id = me.id)
        ) / count(*)) END
      FROM gruppo g, me WHERE g.user_id <> me.id
    ),
    'contratti', (
      SELECT coalesce(jsonb_agg(x ORDER BY (x->>'quanti')::int DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'contratto', coalesce(g.contratto, 'passo'),
          'quanti', count(*),
          'punteggioMedio', round(avg(g.punteggio)),
          'stelleMedie', round(avg(g.stelle), 1)
        ) AS x
        FROM gruppo g GROUP BY coalesce(g.contratto, 'passo')
      ) t
    ),
    'persone', CASE WHEN p_filtro = 'amici' THEN (
      SELECT coalesce(jsonb_agg(y ORDER BY (y->>'punteggio')::int DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'nome', p.display_name,
          'contratto', coalesce(g.contratto, 'passo'),
          'punteggio', g.punteggio,
          'stelle', g.stelle
        ) AS y
        FROM gruppo g JOIN public.profiles p ON p.id = g.user_id, me
        WHERE g.user_id <> me.id
      ) t2
    ) END
  ) END;
$function$
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

CREATE OR REPLACE FUNCTION public.genera_codice_amico()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  alfabeto text := 'ABCDEFGHJKMNPQRTUVWXYZ2346789';
  codice text; i int;
BEGIN
  LOOP
    codice := '';
    FOR i IN 1..6 LOOP
      codice := codice || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_code = codice);
  END LOOP;
  RETURN codice;
END $function$
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
  WITH ferme AS (
    SELECT x.chi AS user_id, count(*) AS n
    FROM (
      SELECT CASE WHEN t.turno IN ('south','east') THEN s.south_id ELSE s.north_id END AS chi
      FROM public.bidding_sessions s,
           LATERAL (SELECT (ARRAY['north','east','south','west'])[
                      ((array_position(ARRAY['north','east','south','west'], s.dealer) - 1
                        + jsonb_array_length(s.bids)) % 4) + 1] AS turno) t
      WHERE s.closed_at IS NULL
        AND s.last_bid_at < now() - interval '12 hours'
    ) x
    GROUP BY x.chi
  ),
  base AS (
    SELECT
      p.id,
      u.email,
      p.display_name,
      p.profile_type::text                              AS profile_type,
      p.created_at,
      p.last_login,
      COALESCE(p.streak, 0)                             AS streak,
      COALESCE(p.marketing_consent, false)              AS consent,
      (SELECT count(*) FROM public.completed_modules cm WHERE cm.user_id = p.id) AS modules_done,
      COALESCE(f.n, 0)                                  AS licite_ferme
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    LEFT JOIN ferme f ON f.user_id = p.id
    WHERE u.email IS NOT NULL
      AND u.email_confirmed_at IS NOT NULL
      AND COALESCE(u.banned_until, now() - interval '1 day') < now()
  ),
  scored AS (
    SELECT b.*,
      CASE
        WHEN b.licite_ferme > 0
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'turno_licita'
                               AND e.sent_at > now() - interval '20 hours')
          THEN 'turno_licita'
        WHEN b.consent
             AND b.streak >= 3
             AND b.last_login IS NOT NULL
             AND (b.last_login AT TIME ZONE 'Europe/Rome')::date
                   = (now() AT TIME ZONE 'Europe/Rome')::date - 1
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'streak_risk'
                               AND e.sent_at > now() - interval '20 hours')
          THEN 'streak_risk'
        WHEN b.consent
             AND b.created_at < now() - interval '20 hours'
             AND b.created_at > now() - interval '5 days'
             AND b.modules_done < 2
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'onboarding_start')
          THEN 'onboarding_start'
        WHEN b.consent
             AND b.last_login IS NOT NULL
             AND b.last_login < now() - interval '14 days'
             AND b.last_login > now() - interval '45 days'
             AND NOT EXISTS (SELECT 1 FROM public.email_events e
                             WHERE e.user_id = b.id AND e.email_type = 'inactive_14'
                               AND e.sent_at > now() - interval '30 days')
          THEN 'inactive_14'
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
    id AS user_id, email, display_name, profile_type, kind,
    jsonb_build_object(
      'streak', streak,
      'modules_done', modules_done,
      'licite_ferme', licite_ferme,
      'days_inactive',
        CASE WHEN last_login IS NOT NULL
             THEN GREATEST(0, (EXTRACT(EPOCH FROM (now() - last_login)) / 86400)::int)
             ELSE NULL END
    ) AS ctx
  FROM scored
  WHERE kind IS NOT NULL
  ORDER BY
    CASE kind
      WHEN 'turno_licita' THEN 0 WHEN 'streak_risk' THEN 1
      WHEN 'onboarding_start' THEN 2 WHEN 'inactive_14' THEN 3
      WHEN 'inactive_7' THEN 4 ELSE 5 END
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

CREATE OR REPLACE FUNCTION public.imp_da_differenza(p_diff integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE
    WHEN abs(p_diff) <= 10 THEN 0    WHEN abs(p_diff) <= 40 THEN 1
    WHEN abs(p_diff) <= 80 THEN 2    WHEN abs(p_diff) <= 120 THEN 3
    WHEN abs(p_diff) <= 160 THEN 4   WHEN abs(p_diff) <= 210 THEN 5
    WHEN abs(p_diff) <= 260 THEN 6   WHEN abs(p_diff) <= 310 THEN 7
    WHEN abs(p_diff) <= 360 THEN 8   WHEN abs(p_diff) <= 420 THEN 9
    WHEN abs(p_diff) <= 490 THEN 10  WHEN abs(p_diff) <= 590 THEN 11
    WHEN abs(p_diff) <= 740 THEN 12  WHEN abs(p_diff) <= 890 THEN 13
    WHEN abs(p_diff) <= 1090 THEN 14 WHEN abs(p_diff) <= 1290 THEN 15
    WHEN abs(p_diff) <= 1490 THEN 16 WHEN abs(p_diff) <= 1740 THEN 17
    WHEN abs(p_diff) <= 1990 THEN 18 WHEN abs(p_diff) <= 2240 THEN 19
    WHEN abs(p_diff) <= 2490 THEN 20 WHEN abs(p_diff) <= 2990 THEN 21
    WHEN abs(p_diff) <= 3490 THEN 22 WHEN abs(p_diff) <= 3990 THEN 23
    ELSE 24 END;
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

CREATE OR REPLACE FUNCTION public.is_pending_of_class(p_class_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from class_members m
    where m.class_id = p_class_id
      and m.student_id = auth.uid()
      and m.status = 'pending'
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
  precedente text;
  nuovo text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into c
  from classes
  where invite_code = upper(trim(p_code))
    and invite_active = true
    and stato = 'aperta'
    and (invite_expires_at is null or invite_expires_at > now());

  if c.id is null then
    raise exception 'invalid invite code' using errcode = 'P0002';
  end if;

  select status into precedente
  from class_members
  where class_id = c.id and student_id = auth.uid();

  if precedente in ('active', 'pending', 'rejected') then
    return c;
  end if;

  nuovo := case when c.approvazione_automatica then 'active' else 'pending' end;

  insert into class_members (class_id, student_id, status)
  values (c.id, auth.uid(), nuovo)
  on conflict (class_id, student_id) do update set status = nuovo;

  return c;
end $function$
;

CREATE OR REPLACE FUNCTION public.licite_in_attesa(p_user uuid, p_ore integer DEFAULT 12)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT count(*)::int
  FROM public.bidding_sessions s,
       LATERAL (SELECT (ARRAY['north','east','south','west'])[
                  ((array_position(ARRAY['north','east','south','west'], s.dealer) - 1
                    + jsonb_array_length(s.bids)) % 4) + 1] AS turno) t
  WHERE s.closed_at IS NULL
    AND p_user IN (s.south_id, s.north_id)
    AND s.last_bid_at < now() - (p_ore || ' hours')::interval
    AND (CASE WHEN t.turno IN ('south','east') THEN s.south_id ELSE s.north_id END) = p_user;
$function$
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

CREATE OR REPLACE FUNCTION public.live_table_play(p_table_id uuid, p_seat text, p_card jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t public.live_tables%ROWTYPE;
  v_is_owner boolean; v_my_seat text; v_seat text;
  v_in_mano boolean; v_gia_uscita boolean;
BEGIN
  SELECT * INTO t FROM public.live_tables WHERE id = p_table_id FOR UPDATE;
  IF NOT FOUND OR t.closed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'tavolo non disponibile');
  END IF;

  v_is_owner := (t.instructor_id = auth.uid());
  v_my_seat  := t.seat_of ->> auth.uid()::text;
  v_seat := CASE WHEN v_is_owner THEN coalesce(p_seat, v_my_seat) ELSE v_my_seat END;

  IF v_seat IS NULL OR v_seat NOT IN ('north','east','south','west') THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'nessun posto assegnato');
  END IF;

  IF NOT v_is_owner AND NOT EXISTS (
    SELECT 1 FROM public.class_members m
    WHERE m.class_id = t.class_id AND m.student_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'non fai parte di questa classe');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM jsonb_array_elements(t.hands -> v_seat) c
    WHERE c ->> 'suit' = p_card ->> 'suit' AND c ->> 'rank' = p_card ->> 'rank'
  ) INTO v_in_mano;

  SELECT EXISTS (
    SELECT 1 FROM jsonb_array_elements(t.played) g
    WHERE g -> 'card' ->> 'suit' = p_card ->> 'suit'
      AND g -> 'card' ->> 'rank' = p_card ->> 'rank'
  ) INTO v_gia_uscita;

  IF NOT v_in_mano OR v_gia_uscita THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'carta non giocabile');
  END IF;

  UPDATE public.live_tables
  SET played = played || jsonb_build_array(jsonb_build_object('seat', v_seat, 'card', p_card)),
      updated_at = now()
  WHERE id = p_table_id;

  RETURN jsonb_build_object('ok', true, 'seat', v_seat);
END
$function$
;

CREATE OR REPLACE FUNCTION public.live_table_undo(p_table_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE t public.live_tables%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.live_tables WHERE id = p_table_id FOR UPDATE;
  IF NOT FOUND OR t.instructor_id <> auth.uid() THEN RETURN false; END IF;
  UPDATE public.live_tables
  SET played = CASE WHEN jsonb_array_length(played) = 0 THEN played
                    ELSE played - (jsonb_array_length(played) - 1) END,
      updated_at = now()
  WHERE id = p_table_id;
  RETURN true;
END
$function$
;

CREATE OR REPLACE FUNCTION public.live_table_view(p_table_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t public.live_tables%ROWTYPE;
  v_is_owner boolean; v_is_member boolean; v_seat text;
  v_visible text[]; v_hands jsonb := '{}'::jsonb; s text; v_restanti jsonb;
BEGIN
  SELECT * INTO t FROM public.live_tables WHERE id = p_table_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_is_owner := (t.instructor_id = auth.uid());
  SELECT EXISTS (
    SELECT 1 FROM public.class_members m
    WHERE m.class_id = t.class_id AND m.student_id = auth.uid()
  ) INTO v_is_member;
  IF NOT v_is_owner AND NOT v_is_member THEN RETURN NULL; END IF;

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
      SELECT coalesce(jsonb_agg(c), '[]'::jsonb) INTO v_restanti
      FROM jsonb_array_elements(t.hands -> s) c
      WHERE NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(t.played) g
        WHERE g -> 'card' ->> 'suit' = c ->> 'suit'
          AND g -> 'card' ->> 'rank' = c ->> 'rank'
      );
      v_hands := v_hands || jsonb_build_object(s, v_restanti);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'id', t.id, 'classId', t.class_id, 'titolo', t.titolo,
    'hands', v_hands, 'played', t.played,
    'revealed', to_jsonb(t.revealed), 'seat', v_seat,
    'seatOf', CASE WHEN v_is_owner THEN t.seat_of ELSE NULL END,
    'isInstructor', v_is_owner,
    'contract', CASE WHEN v_is_owner OR t.show_contract THEN t.contract END,
    'declarer', CASE WHEN v_is_owner OR t.show_contract THEN t.declarer END,
    'showContract', t.show_contract,
    'closed', t.closed_at IS NOT NULL, 'updatedAt', t.updated_at
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

CREATE OR REPLACE FUNCTION public.mano_da_fare(p_slug text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT to_jsonb(m) || jsonb_build_object(
    'scenario', CASE WHEN s.id IS NULL THEN NULL ELSE to_jsonb(s) - 'vincoli' END)
  FROM public.mani_generate m
  LEFT JOIN public.scenari s ON s.id = m.scenario_id
  WHERE (p_slug IS NULL OR s.slug = p_slug)
    AND auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.risultati_mano r
      WHERE r.mano_id = m.id AND r.user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.torneo_mani tm
      JOIN public.tornei t ON t.id = tm.torneo_id
      WHERE tm.mano_id = m.id AND now() < t.chiude_at
    )
  ORDER BY random()
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.mie_sfide_coppie()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'creata' DESC), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'creata', s.created_at,
      'miaCoppia', CASE WHEN auth.uid() IN (s.a1, s.a2) THEN 'A' ELSE 'B' END,
      'avversari', (
        SELECT jsonb_agg(p.display_name) FROM public.profiles p
        WHERE p.id IN (CASE WHEN auth.uid() IN (s.a1, s.a2) THEN s.b1 ELSE s.a1 END,
                       CASE WHEN auth.uid() IN (s.a1, s.a2) THEN s.b2 ELSE s.a2 END)
      ),
      'daFare', (
        SELECT count(*) FROM public.sfida_board b
        WHERE b.sfida_id = s.id
          AND b.coppia = CASE WHEN auth.uid() IN (s.a1, s.a2) THEN 'A' ELSE 'B' END
          AND b.punteggio IS NULL
      ),
      'totale', (
        SELECT count(*) FROM public.sfida_board b
        WHERE b.sfida_id = s.id AND b.coppia = 'A'
      )
    ) AS x
    FROM public.sfide_coppie s
    WHERE auth.uid() IN (s.a1, s.a2, s.b1, s.b2)
  ) t;
$function$
;

CREATE OR REPLACE FUNCTION public.mie_statistiche_sfide()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH mie AS (
    SELECT s.id,
           CASE WHEN auth.uid() IN (s.a1, s.a2) THEN 'A' ELSE 'B' END AS mia,
           CASE WHEN auth.uid() = s.a1 THEN s.a2
                WHEN auth.uid() = s.a2 THEN s.a1
                WHEN auth.uid() = s.b1 THEN s.b2
                ELSE s.b1 END AS compagno,
           CASE WHEN auth.uid() IN (s.a1, s.a2) THEN s.b1 ELSE s.a1 END AS avv1,
           CASE WHEN auth.uid() IN (s.a1, s.a2) THEN s.b2 ELSE s.a2 END AS avv2
    FROM public.sfide_coppie s
    WHERE auth.uid() IN (s.a1, s.a2, s.b1, s.b2)
  ),
  board AS (
    SELECT m.id, m.mia, m.compagno, m.avv1, m.avv2,
           public.imp_da_differenza(mio.punteggio - altro.punteggio) AS imp,
           sign(mio.punteggio - altro.punteggio) AS verso
    FROM mie m
    JOIN public.sfida_board mio  ON mio.sfida_id = m.id AND mio.coppia = m.mia
    JOIN public.sfida_board altro ON altro.sfida_id = m.id
                                 AND altro.mano_id = mio.mano_id
                                 AND altro.coppia <> m.mia
    WHERE mio.punteggio IS NOT NULL AND altro.punteggio IS NOT NULL
  ),
  incontri AS (
    SELECT b.id, b.mia, b.compagno, b.avv1, b.avv2,
           sum(CASE WHEN b.verso > 0 THEN b.imp ELSE 0 END) AS miei,
           sum(CASE WHEN b.verso < 0 THEN b.imp ELSE 0 END) AS loro,
           count(*) AS confrontate,
           (SELECT count(*) FROM public.sfida_board t
             WHERE t.sfida_id = b.id AND t.coppia = b.mia) AS totale
    FROM board b GROUP BY b.id, b.mia, b.compagno, b.avv1, b.avv2
  ),
  esiti AS (
    SELECT *, CASE WHEN miei > loro THEN 1 WHEN miei < loro THEN -1 ELSE 0 END AS esito
    FROM incontri
    WHERE confrontate = totale
  )
  SELECT jsonb_build_object(
    'incontri', (SELECT count(*) FROM esiti),
    'vinti',    (SELECT count(*) FROM esiti WHERE esito = 1),
    'persi',    (SELECT count(*) FROM esiti WHERE esito = -1),
    'pari',     (SELECT count(*) FROM esiti WHERE esito = 0),
    'impFatti', (SELECT coalesce(sum(miei), 0) FROM esiti),
    'impSubiti',(SELECT coalesce(sum(loro), 0) FROM esiti),
    'perCompagno', (
      SELECT coalesce(jsonb_agg(y ORDER BY (y->>'incontri')::int DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'id', e.compagno,
          'nome', p.display_name,
          'incontri', count(*),
          'vinti', count(*) FILTER (WHERE e.esito = 1),
          'persi', count(*) FILTER (WHERE e.esito = -1),
          'impNetti', sum(e.miei - e.loro)
        ) AS y
        FROM esiti e LEFT JOIN public.profiles p ON p.id = e.compagno
        GROUP BY e.compagno, p.display_name
      ) t1
    ),
    'perAvversario', (
      SELECT coalesce(jsonb_agg(z ORDER BY (z->>'incontri')::int DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'id', avv.id,
          'nome', p.display_name,
          'incontri', count(*),
          'vinti', count(*) FILTER (WHERE e.esito = 1),
          'persi', count(*) FILTER (WHERE e.esito = -1),
          'impNetti', sum(e.miei - e.loro)
        ) AS z
        FROM esiti e
        CROSS JOIN LATERAL (VALUES (e.avv1), (e.avv2)) AS avv(id)
        LEFT JOIN public.profiles p ON p.id = avv.id
        GROUP BY avv.id, p.display_name
      ) t2
    )
  );
$function$
;

CREATE OR REPLACE FUNCTION public.mio_codice_amico()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_codice text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  SELECT friend_code INTO v_codice FROM public.profiles WHERE id = auth.uid();
  IF v_codice IS NOT NULL THEN RETURN v_codice; END IF;
  v_codice := public.genera_codice_amico();
  UPDATE public.profiles SET friend_code = v_codice WHERE id = auth.uid();
  RETURN v_codice;
END $function$
;

CREATE OR REPLACE FUNCTION public.my_asd_code()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT asd_code FROM public.profiles WHERE id = auth.uid(); $function$
;

CREATE OR REPLACE FUNCTION public.my_bidding_sessions()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', x.id, 'seat', x.seat, 'bids', x.bids, 'dealer', x.dealer,
    'chiusa', x.closed_at IS NOT NULL, 'compagno', x.compagno, 'createdAt', x.created_at
  ) ORDER BY x.created_at DESC), '[]'::jsonb)
  FROM (
    SELECT s.id, s.bids, s.dealer, s.closed_at, s.created_at,
           CASE WHEN s.south_id = auth.uid() THEN 'south' ELSE 'north' END AS seat,
           (SELECT p.display_name FROM public.profiles p
             WHERE p.id = CASE WHEN s.south_id = auth.uid() THEN s.north_id ELSE s.south_id END) AS compagno
    FROM public.bidding_sessions s
    WHERE s.south_id = auth.uid() OR s.north_id = auth.uid()
    ORDER BY s.created_at DESC LIMIT 30
  ) x;
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

CREATE OR REPLACE FUNCTION public.punteggio_contratto(p_level integer, p_strain text, p_prese integer, p_zona boolean, p_doppio integer DEFAULT 1)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$
  WITH v AS (
    SELECT
      coalesce(p_doppio, 1) AS d,
      (CASE WHEN p_strain = 'nt' THEN 40 + 30 * (p_level - 1)
            WHEN p_strain IN ('club','diamond') THEN 20 * p_level
            ELSE 30 * p_level END) AS base_liscio,
      p_level + 6 - p_prese AS sotto
  )
  SELECT CASE
    WHEN v.sotto > 0 THEN
      CASE WHEN v.d = 1 THEN -(v.sotto * CASE WHEN p_zona THEN 100 ELSE 50 END)
      ELSE
        -(CASE WHEN p_zona THEN 200 + (v.sotto - 1) * 300
               WHEN v.sotto = 1 THEN 100
               WHEN v.sotto <= 3 THEN 100 + (v.sotto - 1) * 200
               ELSE 500 + (v.sotto - 3) * 300 END)
        * CASE WHEN v.d = 4 THEN 2 ELSE 1 END
      END
    ELSE
      v.base_liscio * v.d
      + (CASE WHEN v.base_liscio * v.d >= 100
              THEN CASE WHEN p_zona THEN 500 ELSE 300 END
              ELSE 50 END)
      + (CASE WHEN p_level = 7 THEN CASE WHEN p_zona THEN 1500 ELSE 1000 END
              WHEN p_level = 6 THEN CASE WHEN p_zona THEN 750 ELSE 500 END
              ELSE 0 END)
      + (CASE WHEN v.d = 1
              THEN (-v.sotto) * CASE WHEN p_strain IN ('club','diamond') THEN 20 ELSE 30 END
              ELSE (-v.sotto) * (CASE WHEN p_zona THEN 200 ELSE 100 END)
                   * CASE WHEN v.d = 4 THEN 2 ELSE 1 END END)
      + (CASE WHEN v.d = 2 THEN 50 WHEN v.d = 4 THEN 100 ELSE 0 END)
  END
  FROM v;
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

CREATE OR REPLACE FUNCTION public.sfida_board_chiudi(p_sessione uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  b        public.sfida_board%ROWTYPE;
  s        public.bidding_sessions%ROWTYPE;
  m        public.mani_generate%ROWTYPE;
  ordine   text[] := ARRAY['north','east','south','west'];
  i_dealer int;
  i_ult    int;
  v_bid    text;
  v_liv    int;
  v_den    text;
  v_chi    text;
  v_linea  text;
  v_j      int;
  v_prese  int;
  v_zona   boolean;
  v_doppio int;
  v_punti  int;
  v_etichetta text;
BEGIN
  SELECT * INTO b FROM public.sfida_board WHERE sessione_id = p_sessione;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'board inesistente');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sfide_coppie s2
    WHERE s2.id = b.sfida_id AND auth.uid() IN (s2.a1, s2.a2, s2.b1, s2.b2)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'non fai parte di questa sfida');
  END IF;

  IF b.punteggio IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'giaFatto', true);
  END IF;

  SELECT * INTO s FROM public.bidding_sessions WHERE id = p_sessione;
  IF s.closed_at IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'licita non chiusa');
  END IF;

  SELECT * INTO m FROM public.mani_generate WHERE id = b.mano_id;
  IF m.dd_table IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'mano senza tabella');
  END IF;

  i_dealer := array_position(ordine, s.dealer);

  SELECT max(g.k) INTO i_ult
  FROM generate_series(0, jsonb_array_length(s.bids) - 1) AS g(k)
  WHERE s.bids ->> g.k ~ '^[1-7]';

  SELECT CASE WHEN bool_or(s.bids ->> g.k = 'XX') THEN 4
              WHEN bool_or(s.bids ->> g.k = 'X') THEN 2
              ELSE 1 END
  INTO v_doppio
  FROM generate_series(coalesce(i_ult, 0), jsonb_array_length(s.bids) - 1) AS g(k);

  IF i_ult IS NULL THEN
    UPDATE public.sfida_board SET contratto = NULL, dichiarante = NULL,
           prese = NULL, punteggio = 0
    WHERE sfida_id = b.sfida_id AND mano_id = b.mano_id AND coppia = b.coppia;
    RETURN jsonb_build_object('ok', true, 'contratto', NULL, 'punteggio', 0);
  END IF;

  v_bid := s.bids ->> i_ult;
  v_liv := substr(v_bid, 1, 1)::int;
  v_den := CASE substr(v_bid, 2)
    WHEN '♣' THEN 'club' WHEN '♦' THEN 'diamond'
    WHEN '♥' THEN 'heart' WHEN '♠' THEN 'spade'
    ELSE 'notrump' END;

  v_chi := ordine[((i_dealer - 1 + i_ult) % 4) + 1];
  v_linea := CASE WHEN v_chi IN ('north','south') THEN 'ns' ELSE 'ew' END;

  FOR v_j IN 0..i_ult LOOP
    IF (s.bids ->> v_j) <> 'P'
       AND substr(s.bids ->> v_j, 2) = substr(v_bid, 2)
       AND (CASE WHEN ordine[((i_dealer - 1 + v_j) % 4) + 1] IN ('north','south')
                 THEN 'ns' ELSE 'ew' END) = v_linea THEN
      v_chi := ordine[((i_dealer - 1 + v_j) % 4) + 1];
      EXIT;
    END IF;
  END LOOP;

  v_prese := (m.dd_table -> v_den ->> v_chi)::int;
  v_zona := m.vulnerability = 'both' OR m.vulnerability = v_linea;
  v_punti := public.punteggio_contratto(
    v_liv, CASE WHEN v_den = 'notrump' THEN 'nt' ELSE v_den END,
    v_prese, v_zona, v_doppio);

  IF v_linea = 'ew' THEN v_punti := -v_punti; END IF;

  v_etichetta := v_bid || repeat('X', CASE v_doppio WHEN 2 THEN 1 WHEN 4 THEN 2 ELSE 0 END);

  UPDATE public.sfida_board
  SET contratto = v_etichetta, dichiarante = v_chi, prese = v_prese, punteggio = v_punti
  WHERE sfida_id = b.sfida_id AND mano_id = b.mano_id AND coppia = b.coppia;

  RETURN jsonb_build_object('ok', true, 'contratto', v_etichetta,
                            'dichiarante', v_chi, 'prese', v_prese,
                            'punteggio', v_punti);
END $function$
;

CREATE OR REPLACE FUNCTION public.sfida_coppie_coda_stato()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mia record;
  v_totale int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('in_attesa', false, 'coppie_in_attesa', 0); END IF;

  SELECT c.*, p.display_name AS nome_compagno INTO v_mia
  FROM public.coda_sfide_coppie c
  LEFT JOIN public.profiles p
    ON p.id = CASE WHEN c.a1 = auth.uid() THEN c.a2 ELSE c.a1 END
  WHERE auth.uid() IN (c.a1, c.a2)
  LIMIT 1;

  SELECT count(*) INTO v_totale FROM public.coda_sfide_coppie;

  IF NOT FOUND OR v_mia IS NULL THEN
    RETURN jsonb_build_object('in_attesa', false, 'coppie_in_attesa', coalesce(v_totale, 0));
  END IF;

  RETURN jsonb_build_object(
    'in_attesa', true,
    'compagno', v_mia.nome_compagno,
    'sono_io_a_essermi_iscritto', v_mia.a1 = auth.uid(),
    'dal', v_mia.created_at,
    'quante', v_mia.quante,
    'coppie_in_attesa', coalesce(v_totale, 0)
  );
END $function$
;

CREATE OR REPLACE FUNCTION public.sfida_coppie_crea(p_compagno uuid, p_b1 uuid, p_b2 uuid, p_quante integer DEFAULT 4)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id    uuid;
  v_mano  record;
  v_n     int := 0;
  v_ses_a uuid;
  v_ses_b uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  IF p_compagno IS NULL OR p_b1 IS NULL OR p_b2 IS NULL THEN RETURN NULL; END IF;
  IF cardinality(ARRAY[auth.uid(), p_compagno, p_b1, p_b2]) <>
     cardinality(ARRAY(SELECT DISTINCT unnest(ARRAY[auth.uid(), p_compagno, p_b1, p_b2]))) THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
      AND ((f.user_id = auth.uid() AND f.friend_id = p_compagno)
        OR (f.friend_id = auth.uid() AND f.user_id = p_compagno))
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.sfide_coppie (creatore_id, a1, a2, b1, b2)
  VALUES (auth.uid(), auth.uid(), p_compagno, p_b1, p_b2)
  RETURNING id INTO v_id;

  FOR v_mano IN
    SELECT id, hands, dealer FROM public.mani_generate
    ORDER BY random() LIMIT greatest(1, least(coalesce(p_quante, 4), 12))
  LOOP
    v_n := v_n + 1;

    INSERT INTO public.bidding_sessions (south_id, north_id, hands, dealer)
    VALUES (auth.uid(), p_compagno, v_mano.hands, v_mano.dealer)
    RETURNING id INTO v_ses_a;

    INSERT INTO public.bidding_sessions (south_id, north_id, hands, dealer)
    VALUES (p_b1, p_b2, v_mano.hands, v_mano.dealer)
    RETURNING id INTO v_ses_b;

    INSERT INTO public.sfida_board (sfida_id, mano_id, coppia, numero, sessione_id)
    VALUES (v_id, v_mano.id, 'A', v_n, v_ses_a), (v_id, v_mano.id, 'B', v_n, v_ses_b);
  END LOOP;

  IF v_n = 0 THEN
    DELETE FROM public.sfide_coppie WHERE id = v_id;
    RETURN NULL;
  END IF;

  RETURN v_id;
END $function$
;

CREATE OR REPLACE FUNCTION public.sfida_coppie_esci()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tolte int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  DELETE FROM public.coda_sfide_coppie c
  WHERE auth.uid() IN (c.a1, c.a2);
  GET DIAGNOSTICS v_tolte = ROW_COUNT;
  RETURN v_tolte > 0;
END $function$
;

CREATE OR REPLACE FUNCTION public.sfida_coppie_iscrivi(p_compagno uuid, p_quante integer DEFAULT 4)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_altra record;
  v_sfida uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'non autenticato');
  END IF;
  IF p_compagno IS NULL OR p_compagno = auth.uid() THEN
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'compagno non valido');
  END IF;

  -- L'amicizia la ricontrolla anche `sfida_coppie_crea`, ma qui serve dirlo
  -- SUBITO: senza, chi sceglie un non-amico resterebbe in coda per sempre e
  -- scoprirebbe il rifiuto solo al momento dell'accoppiamento.
  IF NOT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
      AND ((f.user_id = auth.uid() AND f.friend_id = p_compagno)
        OR (f.friend_id = auth.uid() AND f.user_id = p_compagno))
  ) THEN
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'il compagno dev''essere un amico');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.coda_sfide_coppie c
    WHERE auth.uid() IN (c.a1, c.a2) OR p_compagno IN (c.a1, c.a2)
  ) THEN
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'tu o il tuo compagno siete già in attesa');
  END IF;

  -- La coppia che aspetta da più tempo, senza nessuno in comune con la nostra.
  -- `skip locked`: se due coppie si iscrivono nello stesso istante, una sola
  -- prende questa riga e l'altra va in coda invece di accoppiarsi due volte.
  SELECT * INTO v_altra
  FROM public.coda_sfide_coppie c
  WHERE c.a1 <> auth.uid() AND c.a2 <> auth.uid()
    AND c.a1 <> p_compagno AND c.a2 <> p_compagno
  ORDER BY c.created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.coda_sfide_coppie (a1, a2, quante)
    VALUES (auth.uid(), p_compagno, greatest(1, least(coalesce(p_quante, 4), 12)));
    RETURN jsonb_build_object('stato', 'in_attesa');
  END IF;

  -- Chi aspettava ha scelto per primo quante smazzate: si rispetta la sua
  -- richiesta, perché è stata fatta prima ed è quella su cui ha aspettato.
  v_sfida := public.sfida_coppie_crea(p_compagno, v_altra.a1, v_altra.a2, v_altra.quante);

  IF v_sfida IS NULL THEN
    -- Niente mani in scorta, o un controllo non passato: la coppia che
    -- aspettava deve restare in coda. L'eccezione annulla anche la sua
    -- rimozione, che senza questo `raise` avverrebbe al `delete` qui sotto.
    RAISE EXCEPTION 'sfida non creata';
  END IF;

  DELETE FROM public.coda_sfide_coppie WHERE id = v_altra.id;
  RETURN jsonb_build_object('stato', 'accoppiata', 'sfida', v_sfida);
EXCEPTION
  WHEN unique_violation THEN
    -- Due iscrizioni della stessa persona arrivate insieme.
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'tu o il tuo compagno siete già in attesa');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'non è stato possibile aprire la sfida');
END $function$
;

CREATE OR REPLACE FUNCTION public.sfida_coppie_vista(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  s       public.sfide_coppie%ROWTYPE;
  v_mia   text;
  v_board jsonb;
BEGIN
  SELECT * INTO s FROM public.sfide_coppie WHERE id = p_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_mia := CASE WHEN auth.uid() IN (s.a1, s.a2) THEN 'A'
                WHEN auth.uid() IN (s.b1, s.b2) THEN 'B' END;
  IF v_mia IS NULL THEN RETURN NULL; END IF;

  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'numero')::int), '[]'::jsonb) INTO v_board
  FROM (
    SELECT jsonb_build_object(
      'numero', mia.numero,
      'manoId', mia.mano_id,
      'sessioneId', mia.sessione_id,
      'contratto', mia.contratto,
      'punteggio', mia.punteggio,
      'chiusa', mia.punteggio IS NOT NULL,
      'altroContratto', CASE WHEN mia.punteggio IS NOT NULL THEN altra.contratto END,
      'altroPunteggio', CASE WHEN mia.punteggio IS NOT NULL THEN altra.punteggio END,
      'altraChiusa', altra.punteggio IS NOT NULL,
      'parScore', m.par_score,
      'valoreAtteso', m.valore_atteso
    ) AS x
    FROM public.sfida_board mia
    JOIN public.mani_generate m ON m.id = mia.mano_id
    LEFT JOIN public.sfida_board altra
      ON altra.sfida_id = mia.sfida_id AND altra.mano_id = mia.mano_id
     AND altra.coppia <> mia.coppia
    WHERE mia.sfida_id = p_id AND mia.coppia = v_mia
  ) t;

  RETURN jsonb_build_object(
    'id', s.id,
    'miaCoppia', v_mia,
    'coppiaA', (SELECT jsonb_agg(p.display_name) FROM public.profiles p WHERE p.id IN (s.a1, s.a2)),
    'coppiaB', (SELECT jsonb_agg(p.display_name) FROM public.profiles p WHERE p.id IN (s.b1, s.b2)),
    'board', v_board
  );
END $function$
;

CREATE OR REPLACE FUNCTION public.smazzate_commenti(p_ids text[])
 RETURNS TABLE(id text, commentary text, commentary_en text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.id, s.commentary, s.commentary_en
  from smazzate s
  where s.id = any (p_ids)
    and not commento_negato(s.id);
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

CREATE OR REPLACE FUNCTION public.tocca_bidding_session()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.bids IS DISTINCT FROM OLD.bids THEN
    NEW.last_bid_at := now();
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.torneo_corrente(p_tipo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_periodo int;
  v_apre timestamptz;
  v_chiude timestamptz;
  v_quante int;
  v_id uuid;
  v_oggi date := (now() AT TIME ZONE 'Europe/Rome')::date;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;

  IF p_tipo = 'giornaliero' THEN
    v_periodo := to_char(v_oggi, 'YYYYMMDD')::int;
    v_apre := v_oggi::timestamp AT TIME ZONE 'Europe/Rome';
    v_chiude := v_apre + interval '1 day';
    v_quante := 8;
  ELSIF p_tipo = 'settimanale' THEN
    v_periodo := to_char(v_oggi, 'IYYYIW')::int;
    v_apre := (date_trunc('week', v_oggi::timestamp)) AT TIME ZONE 'Europe/Rome';
    v_chiude := v_apre + interval '7 days';
    v_quante := 24;
  ELSE
    RETURN NULL;
  END IF;

  SELECT id INTO v_id FROM public.tornei WHERE tipo = p_tipo AND periodo = v_periodo;

  IF v_id IS NULL THEN
    INSERT INTO public.tornei (tipo, periodo, apre_at, chiude_at)
    VALUES (p_tipo, v_periodo, v_apre, v_chiude)
    ON CONFLICT (tipo, periodo) DO NOTHING
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      SELECT id INTO v_id FROM public.tornei WHERE tipo = p_tipo AND periodo = v_periodo;
    ELSE
      INSERT INTO public.torneo_mani (torneo_id, numero, mano_id)
      SELECT v_id, row_number() OVER (), m.id
      FROM (
        SELECT id FROM public.mani_generate
        WHERE distribuzioni IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.torneo_mani tm WHERE tm.mano_id = mani_generate.id)
        ORDER BY random()
        LIMIT v_quante
      ) m;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'id', v_id,
    'tipo', p_tipo,
    'periodo', v_periodo,
    'chiudeAt', v_chiude,
    'quante', (SELECT count(*) FROM public.torneo_mani WHERE torneo_id = v_id),
    'fatte', (
      SELECT count(*) FROM public.risultati_torneo r
      WHERE r.torneo_id = v_id AND r.user_id = auth.uid()
    )
  );
END $function$
;

CREATE OR REPLACE FUNCTION public.torneo_mano(p_torneo uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE (
    SELECT to_jsonb(m) || jsonb_build_object('numero', tm.numero)
    FROM public.torneo_mani tm
    JOIN public.mani_generate m ON m.id = tm.mano_id
    WHERE tm.torneo_id = p_torneo
      AND NOT EXISTS (
        SELECT 1 FROM public.risultati_torneo r
        WHERE r.torneo_id = p_torneo AND r.mano_id = tm.mano_id AND r.user_id = auth.uid()
      )
      AND EXISTS (SELECT 1 FROM public.tornei t WHERE t.id = p_torneo AND now() < t.chiude_at)
    ORDER BY tm.numero
    LIMIT 1
  ) END;
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
ALTER TABLE public.assignments ALTER COLUMN soluzioni SET DEFAULT 'dopo-il-gioco'::text;
ALTER TABLE public.badges ALTER COLUMN id SET DEFAULT nextval('badges_id_seq'::regclass);
ALTER TABLE public.badges ALTER COLUMN earned_at SET DEFAULT now();
ALTER TABLE public.bbo_username_cleanup_2026_08 ALTER COLUMN cleared_at SET DEFAULT now();
ALTER TABLE public.bidding_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.bidding_sessions ALTER COLUMN dealer SET DEFAULT 'south'::text;
ALTER TABLE public.bidding_sessions ALTER COLUMN vulnerability SET DEFAULT 'none'::text;
ALTER TABLE public.bidding_sessions ALTER COLUMN bids SET DEFAULT '[]'::jsonb;
ALTER TABLE public.bidding_sessions ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.bidding_sessions ALTER COLUMN last_bid_at SET DEFAULT now();
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
ALTER TABLE public.classes ALTER COLUMN approvazione_automatica SET DEFAULT true;
ALTER TABLE public.classes ALTER COLUMN stato SET DEFAULT 'aperta'::text;
ALTER TABLE public.club_posts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.club_posts ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.coda_sfide_coppie ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.coda_sfide_coppie ALTER COLUMN quante SET DEFAULT 4;
ALTER TABLE public.coda_sfide_coppie ALTER COLUMN created_at SET DEFAULT now();
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
ALTER TABLE public.live_tables ALTER COLUMN played SET DEFAULT '[]'::jsonb;
ALTER TABLE public.login_history ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.login_history ALTER COLUMN logged_in_at SET DEFAULT now();
ALTER TABLE public.mani_generate ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.mani_generate ALTER COLUMN dealer SET DEFAULT 'south'::text;
ALTER TABLE public.mani_generate ALTER COLUMN vulnerability SET DEFAULT 'none'::text;
ALTER TABLE public.mani_generate ALTER COLUMN created_at SET DEFAULT now();
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
ALTER TABLE public.profiles ALTER COLUMN lingua SET DEFAULT 'it'::text;
ALTER TABLE public.push_subscriptions ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.review_items ALTER COLUMN id SET DEFAULT nextval('review_items_id_seq'::regclass);
ALTER TABLE public.review_items ALTER COLUMN wrong_count SET DEFAULT 1;
ALTER TABLE public.review_items ALTER COLUMN box SET DEFAULT 1;
ALTER TABLE public.risultati_mano ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.risultati_mano ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.risultati_torneo ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.saved_hands ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.saved_hands ALTER COLUMN played SET DEFAULT '[]'::jsonb;
ALTER TABLE public.saved_hands ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.scenari ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.scenari ALTER COLUMN ufficiale SET DEFAULT false;
ALTER TABLE public.scenari ALTER COLUMN pubblico SET DEFAULT false;
ALTER TABLE public.scenari ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.sfide_coppie ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.sfide_coppie ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.smazzate ALTER COLUMN commentary SET DEFAULT ''::text;
ALTER TABLE public.smazzate ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.smazzate ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.tornei ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.tornei ALTER COLUMN creato_at SET DEFAULT now();
ALTER TABLE public.tournament_results ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.tournament_results ALTER COLUMN total_tricks SET DEFAULT 0;
ALTER TABLE public.tournament_results ALTER COLUMN total_needed SET DEFAULT 0;
ALTER TABLE public.tournament_results ALTER COLUMN completed_at SET DEFAULT now();
ALTER TABLE public.traduzioni_stato ALTER COLUMN tradotto_il SET DEFAULT now();
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
ALTER TABLE public.bidding_sessions ADD CONSTRAINT bidding_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.challenges ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);
ALTER TABLE public.class_members ADD CONSTRAINT class_members_pkey PRIMARY KEY (class_id, student_id);
ALTER TABLE public.class_messages ADD CONSTRAINT class_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.classes ADD CONSTRAINT classes_pkey PRIMARY KEY (id);
ALTER TABLE public.club_posts ADD CONSTRAINT club_posts_pkey PRIMARY KEY (id);
ALTER TABLE public.coda_sfide_coppie ADD CONSTRAINT coda_sfide_coppie_pkey PRIMARY KEY (id);
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
ALTER TABLE public.mani_generate ADD CONSTRAINT mani_generate_pkey PRIMARY KEY (id);
ALTER TABLE public.partner_profiles ADD CONSTRAINT partner_profiles_pkey PRIMARY KEY (user_id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.review_items ADD CONSTRAINT review_items_pkey PRIMARY KEY (id);
ALTER TABLE public.risultati_mano ADD CONSTRAINT risultati_mano_pkey PRIMARY KEY (id);
ALTER TABLE public.risultati_torneo ADD CONSTRAINT risultati_torneo_pkey PRIMARY KEY (torneo_id, mano_id, user_id);
ALTER TABLE public.saved_hands ADD CONSTRAINT saved_hands_pkey PRIMARY KEY (id);
ALTER TABLE public.scenari ADD CONSTRAINT scenari_pkey PRIMARY KEY (id);
ALTER TABLE public.sfida_board ADD CONSTRAINT sfida_board_pkey PRIMARY KEY (sfida_id, mano_id, coppia);
ALTER TABLE public.sfide_coppie ADD CONSTRAINT sfide_coppie_pkey PRIMARY KEY (id);
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_pkey PRIMARY KEY (id);
ALTER TABLE public.tornei ADD CONSTRAINT tornei_pkey PRIMARY KEY (id);
ALTER TABLE public.torneo_mani ADD CONSTRAINT torneo_mani_pkey PRIMARY KEY (torneo_id, numero);
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_pkey PRIMARY KEY (id);
ALTER TABLE public.traduzioni_stato ADD CONSTRAINT traduzioni_stato_pkey PRIMARY KEY (tabella, riga_id, campo);
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
ALTER TABLE public.risultati_mano ADD CONSTRAINT risultati_mano_mano_id_user_id_key UNIQUE (mano_id, user_id);
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_lesson_id_board_key UNIQUE (lesson_id, board);
ALTER TABLE public.tornei ADD CONSTRAINT tornei_tipo_periodo_key UNIQUE (tipo, periodo);
ALTER TABLE public.torneo_mani ADD CONSTRAINT torneo_mani_torneo_id_mano_id_key UNIQUE (torneo_id, mano_id);
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_user_id_week_num_key UNIQUE (user_id, week_num);
ALTER TABLE public.assignments ADD CONSTRAINT assignments_mode_check CHECK ((mode = ANY (ARRAY['homework'::text, 'live'::text])));
ALTER TABLE public.assignments ADD CONSTRAINT assignments_soluzioni_check CHECK ((soluzioni = ANY (ARRAY['subito'::text, 'dopo-il-gioco'::text, 'dopo-la-scadenza'::text])));
ALTER TABLE public.assignments ADD CONSTRAINT assignments_unlock_mode_check CHECK ((unlock_mode = ANY (ARRAY['free'::text, 'sequential'::text])));
ALTER TABLE public.bidding_sessions ADD CONSTRAINT bidding_sessions_check CHECK ((south_id <> north_id));
ALTER TABLE public.bidding_sessions ADD CONSTRAINT bidding_sessions_dealer_check CHECK ((dealer = ANY (ARRAY['north'::text, 'east'::text, 'south'::text, 'west'::text])));
ALTER TABLE public.challenges ADD CONSTRAINT challenges_board_count_check CHECK ((board_count = ANY (ARRAY[1, 4, 8])));
ALTER TABLE public.challenges ADD CONSTRAINT challenges_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'playing'::text, 'completed'::text, 'declined'::text, 'expired'::text])));
ALTER TABLE public.class_members ADD CONSTRAINT class_members_status_check CHECK ((status = ANY (ARRAY['active'::text, 'removed'::text, 'pending'::text, 'rejected'::text])));
ALTER TABLE public.classes ADD CONSTRAINT classes_stato_check CHECK ((stato = ANY (ARRAY['bozza'::text, 'aperta'::text, 'chiusa'::text, 'archiviata'::text])));
ALTER TABLE public.club_posts ADD CONSTRAINT club_posts_corpo_check CHECK (((char_length(btrim(corpo)) >= 1) AND (char_length(btrim(corpo)) <= 4000)));
ALTER TABLE public.club_posts ADD CONSTRAINT club_posts_titolo_check CHECK (((char_length(btrim(titolo)) >= 1) AND (char_length(btrim(titolo)) <= 120)));
ALTER TABLE public.coda_sfide_coppie ADD CONSTRAINT coda_sfide_coppie_check CHECK ((a1 <> a2));
ALTER TABLE public.coda_sfide_coppie ADD CONSTRAINT coda_sfide_coppie_quante_check CHECK (((quante >= 1) AND (quante <= 12)));
ALTER TABLE public.collectible_cards ADD CONSTRAINT collectible_cards_category_check CHECK ((category = ANY (ARRAY['tecnica'::text, 'convenzione'::text, 'strategia'::text, 'storia'::text, 'mossa'::text])));
ALTER TABLE public.collectible_cards ADD CONSTRAINT collectible_cards_rarity_check CHECK ((rarity = ANY (ARRAY['comune'::text, 'rara'::text, 'epica'::text, 'leggendaria'::text])));
ALTER TABLE public.collectible_cards ADD CONSTRAINT collectible_cards_unlock_check CHECK ((jsonb_typeof(unlock) = 'object'::text));
ALTER TABLE public.courses ADD CONSTRAINT courses_level_check CHECK ((level = ANY (ARRAY['base'::text, 'intermedio'::text, 'avanzato'::text])));
ALTER TABLE public.eserciziario_exercises ADD CONSTRAINT eserciziario_exercises_content_check CHECK ((jsonb_typeof(content) = 'array'::text));
ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_category_check CHECK ((category = ANY (ARRAY['lezioni'::text, 'strategia'::text, 'tornei'::text, 'generale'::text, 'off-topic'::text])));
ALTER TABLE public.friendships ADD CONSTRAINT friendships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])));
ALTER TABLE public.game_results ADD CONSTRAINT game_results_game_type_check CHECK ((game_type = ANY (ARRAY['compito'::text, 'conta-veloce'::text, 'dichiara'::text, 'impasse'::text, 'mano-del-giorno'::text, 'mano-guidata'::text, 'memory'::text, 'pratica-licita'::text, 'quiz-lampo'::text, 'segnali'::text, 'sfida'::text, 'sfida-settimanale'::text, 'smazzata'::text, 'torneo'::text, 'trova-errore'::text])));
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
ALTER TABLE public.mani_generate ADD CONSTRAINT mani_generate_dealer_check CHECK ((dealer = ANY (ARRAY['north'::text, 'east'::text, 'south'::text, 'west'::text])));
ALTER TABLE public.partner_profiles ADD CONSTRAINT partner_profiles_availability_check CHECK ((availability <@ ARRAY['mattina'::text, 'pomeriggio'::text, 'sera'::text, 'weekend'::text]));
ALTER TABLE public.partner_profiles ADD CONSTRAINT partner_profiles_level_check CHECK ((level = ANY (ARRAY['principiante'::text, 'intermedio'::text, 'avanzato'::text])));
ALTER TABLE public.partner_profiles ADD CONSTRAINT partner_profiles_province_check CHECK (((province IS NULL) OR (province ~ '^[A-Z]{2}$'::text)));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_lingua_check CHECK ((lingua = ANY (ARRAY['it'::text, 'en'::text])));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_profile_type_check CHECK ((profile_type = ANY (ARRAY['junior'::text, 'giovane'::text, 'adulto'::text, 'senior'::text])));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'instructor'::text, 'admin'::text])));
ALTER TABLE public.review_items ADD CONSTRAINT review_items_box_check CHECK (((box >= 1) AND (box <= 5)));
ALTER TABLE public.risultati_mano ADD CONSTRAINT risultati_mano_stelle_check CHECK (((stelle >= (0)::numeric) AND (stelle <= (3)::numeric) AND ((stelle * (2)::numeric) = floor((stelle * (2)::numeric)))));
ALTER TABLE public.risultati_torneo ADD CONSTRAINT risultati_torneo_stelle_check CHECK (((stelle >= (0)::numeric) AND (stelle <= (3)::numeric) AND ((stelle * (2)::numeric) = floor((stelle * (2)::numeric)))));
ALTER TABLE public.saved_hands ADD CONSTRAINT saved_hands_nota_check CHECK ((char_length(nota) <= 2000));
ALTER TABLE public.saved_hands ADD CONSTRAINT saved_hands_titolo_check CHECK (((char_length(btrim(titolo)) >= 1) AND (char_length(btrim(titolo)) <= 120)));
ALTER TABLE public.scenari ADD CONSTRAINT scenari_descrizione_check CHECK ((char_length(descrizione) <= 1000));
ALTER TABLE public.scenari ADD CONSTRAINT scenari_nome_check CHECK (((char_length(btrim(nome)) >= 1) AND (char_length(btrim(nome)) <= 120)));
ALTER TABLE public.sfida_board ADD CONSTRAINT sfida_board_coppia_check CHECK ((coppia = ANY (ARRAY['A'::text, 'B'::text])));
ALTER TABLE public.sfide_coppie ADD CONSTRAINT sfide_coppie_check CHECK (((a1 <> a2) AND (b1 <> b2) AND (a1 <> b1) AND (a1 <> b2) AND (a2 <> b1) AND (a2 <> b2)));
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_bidding_check CHECK (((bidding IS NULL) OR ((bidding ? 'dealer'::text) AND (bidding ? 'bids'::text) AND (jsonb_typeof((bidding -> 'bids'::text)) = 'array'::text))));
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_declarer_check CHECK ((declarer = ANY (ARRAY['north'::text, 'south'::text, 'east'::text, 'west'::text])));
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_hands_check CHECK (((hands ? 'north'::text) AND (hands ? 'south'::text) AND (hands ? 'east'::text) AND (hands ? 'west'::text) AND (jsonb_typeof((hands -> 'north'::text)) = 'array'::text) AND (jsonb_typeof((hands -> 'south'::text)) = 'array'::text) AND (jsonb_typeof((hands -> 'east'::text)) = 'array'::text) AND (jsonb_typeof((hands -> 'west'::text)) = 'array'::text)));
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_opening_lead_check CHECK (((opening_lead ? 'suit'::text) AND (opening_lead ? 'rank'::text)));
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_vulnerability_check CHECK ((vulnerability = ANY (ARRAY['none'::text, 'ns'::text, 'ew'::text, 'both'::text])));
ALTER TABLE public.tornei ADD CONSTRAINT tornei_tipo_check CHECK ((tipo = ANY (ARRAY['giornaliero'::text, 'settimanale'::text])));
ALTER TABLE public.trova_errore_scenarios ADD CONSTRAINT trova_errore_scenarios_category_check CHECK ((category = ANY (ARRAY['licita'::text, 'gioco'::text, 'difesa'::text])));
ALTER TABLE public.trova_errore_scenarios ADD CONSTRAINT trova_errore_scenarios_correct_answer_check CHECK ((correct_answer >= 0));
ALTER TABLE public.trova_errore_scenarios ADD CONSTRAINT trova_errore_scenarios_difficulty_check CHECK ((difficulty = ANY (ARRAY['facile'::text, 'medio'::text, 'difficile'::text])));
ALTER TABLE public.weekly_challenges ADD CONSTRAINT weekly_challenges_xp_multiplier_check CHECK ((xp_multiplier > (0)::double precision));
ALTER TABLE public.assignments ADD CONSTRAINT assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.badges ADD CONSTRAINT badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.bbo_username_cleanup_2026_08 ADD CONSTRAINT bbo_username_cleanup_2026_08_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.bidding_sessions ADD CONSTRAINT bidding_sessions_north_id_fkey FOREIGN KEY (north_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.bidding_sessions ADD CONSTRAINT bidding_sessions_south_id_fkey FOREIGN KEY (south_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_challenger_id_fkey FOREIGN KEY (challenger_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_opponent_id_fkey FOREIGN KEY (opponent_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.class_members ADD CONSTRAINT class_members_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.class_members ADD CONSTRAINT class_members_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.class_messages ADD CONSTRAINT class_messages_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.class_messages ADD CONSTRAINT class_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.classes ADD CONSTRAINT classes_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.club_posts ADD CONSTRAINT club_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.coda_sfide_coppie ADD CONSTRAINT coda_sfide_coppie_a1_fkey FOREIGN KEY (a1) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.coda_sfide_coppie ADD CONSTRAINT coda_sfide_coppie_a2_fkey FOREIGN KEY (a2) REFERENCES profiles(id) ON DELETE CASCADE;
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
ALTER TABLE public.mani_generate ADD CONSTRAINT mani_generate_scenario_id_fkey FOREIGN KEY (scenario_id) REFERENCES scenari(id) ON DELETE CASCADE;
ALTER TABLE public.partner_profiles ADD CONSTRAINT partner_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_asd_id_fkey FOREIGN KEY (asd_id) REFERENCES asd(id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.review_items ADD CONSTRAINT review_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.risultati_mano ADD CONSTRAINT risultati_mano_mano_id_fkey FOREIGN KEY (mano_id) REFERENCES mani_generate(id) ON DELETE CASCADE;
ALTER TABLE public.risultati_mano ADD CONSTRAINT risultati_mano_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.risultati_mano ADD CONSTRAINT risultati_mano_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.risultati_torneo ADD CONSTRAINT risultati_torneo_mano_id_fkey FOREIGN KEY (mano_id) REFERENCES mani_generate(id) ON DELETE CASCADE;
ALTER TABLE public.risultati_torneo ADD CONSTRAINT risultati_torneo_torneo_id_fkey FOREIGN KEY (torneo_id) REFERENCES tornei(id) ON DELETE CASCADE;
ALTER TABLE public.risultati_torneo ADD CONSTRAINT risultati_torneo_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.saved_hands ADD CONSTRAINT saved_hands_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.scenari ADD CONSTRAINT scenari_autore_id_fkey FOREIGN KEY (autore_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.sfida_board ADD CONSTRAINT sfida_board_mano_id_fkey FOREIGN KEY (mano_id) REFERENCES mani_generate(id) ON DELETE CASCADE;
ALTER TABLE public.sfida_board ADD CONSTRAINT sfida_board_sessione_id_fkey FOREIGN KEY (sessione_id) REFERENCES bidding_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.sfida_board ADD CONSTRAINT sfida_board_sfida_id_fkey FOREIGN KEY (sfida_id) REFERENCES sfide_coppie(id) ON DELETE CASCADE;
ALTER TABLE public.sfide_coppie ADD CONSTRAINT sfide_coppie_a1_fkey FOREIGN KEY (a1) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.sfide_coppie ADD CONSTRAINT sfide_coppie_a2_fkey FOREIGN KEY (a2) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.sfide_coppie ADD CONSTRAINT sfide_coppie_b1_fkey FOREIGN KEY (b1) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.sfide_coppie ADD CONSTRAINT sfide_coppie_b2_fkey FOREIGN KEY (b2) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.sfide_coppie ADD CONSTRAINT sfide_coppie_creatore_id_fkey FOREIGN KEY (creatore_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.smazzate ADD CONSTRAINT smazzate_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
ALTER TABLE public.torneo_mani ADD CONSTRAINT torneo_mani_mano_id_fkey FOREIGN KEY (mano_id) REFERENCES mani_generate(id) ON DELETE CASCADE;
ALTER TABLE public.torneo_mani ADD CONSTRAINT torneo_mani_torneo_id_fkey FOREIGN KEY (torneo_id) REFERENCES tornei(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- INDICI
CREATE INDEX asd_clubs_active_idx ON public.asd_clubs USING btree (active);
CREATE INDEX asd_clubs_name_idx ON public.asd_clubs USING btree (name);
CREATE INDEX asd_clubs_province_idx ON public.asd_clubs USING btree (province) WHERE (province <> ''::text);
CREATE INDEX asd_clubs_region_idx ON public.asd_clubs USING btree (region) WHERE (region <> ''::text);
CREATE INDEX bidding_sessions_north_idx ON public.bidding_sessions USING btree (north_id, created_at DESC);
CREATE INDEX bidding_sessions_players_idx ON public.bidding_sessions USING btree (south_id, created_at DESC);
CREATE INDEX club_posts_asd_idx ON public.club_posts USING btree (asd_code, created_at DESC);
CREATE UNIQUE INDEX coda_sfide_coppie_a1_unico ON public.coda_sfide_coppie USING btree (a1);
CREATE UNIQUE INDEX coda_sfide_coppie_a2_unico ON public.coda_sfide_coppie USING btree (a2);
CREATE INDEX coda_sfide_coppie_attesa_idx ON public.coda_sfide_coppie USING btree (created_at);
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
CREATE INDEX mani_generate_ns_hcp_idx ON public.mani_generate USING btree (ns_hcp);
CREATE INDEX mani_generate_scenario_idx ON public.mani_generate USING btree (scenario_id, created_at DESC);
CREATE INDEX partner_profiles_looking_idx ON public.partner_profiles USING btree (looking, province) WHERE looking;
CREATE INDEX profiles_asd_code_idx ON public.profiles USING btree (asd_code);
CREATE UNIQUE INDEX profiles_friend_code_key ON public.profiles USING btree (friend_code) WHERE (friend_code IS NOT NULL);
CREATE INDEX risultati_mano_idx ON public.risultati_mano USING btree (mano_id);
CREATE INDEX risultati_torneo_classifica_idx ON public.risultati_torneo USING btree (torneo_id, user_id);
CREATE INDEX risultati_utente_idx ON public.risultati_mano USING btree (user_id, created_at DESC);
CREATE INDEX saved_hands_owner_idx ON public.saved_hands USING btree (owner_id, created_at DESC);
CREATE INDEX scenari_pubblici_idx ON public.scenari USING btree (pubblico, ufficiale, created_at DESC);
CREATE UNIQUE INDEX scenari_slug_key ON public.scenari USING btree (slug);
CREATE INDEX sfida_board_sessione_idx ON public.sfida_board USING btree (sessione_id);
CREATE INDEX sfide_coppie_partecipanti_idx ON public.sfide_coppie USING btree (a1, a2, b1, b2);
CREATE INDEX smazzate_bidding_gin ON public.smazzate USING gin (bidding jsonb_path_ops);
CREATE INDEX smazzate_lesson_id_idx ON public.smazzate USING btree (lesson_id);
CREATE INDEX tornei_aperti_idx ON public.tornei USING btree (chiude_at DESC);
CREATE INDEX torneo_mani_mano_idx ON public.torneo_mani USING btree (mano_id);
CREATE INDEX trova_errore_category_idx ON public.trova_errore_scenarios USING btree (category);
CREATE INDEX trova_errore_difficulty_idx ON public.trova_errore_scenarios USING btree (difficulty);
CREATE UNIQUE INDEX unique_comment_like ON public.forum_likes USING btree (user_id, comment_id) WHERE (comment_id IS NOT NULL);
CREATE UNIQUE INDEX unique_post_like ON public.forum_likes USING btree (user_id, post_id) WHERE (post_id IS NOT NULL);
CREATE UNIQUE INDEX uq_email_events_oneshot ON public.email_events USING btree (user_id, email_type) WHERE (email_type = ANY (ARRAY['welcome'::text, 'onboarding_start'::text]));

-- TRIGGER
CREATE TRIGGER asd_clubs_touch BEFORE UPDATE ON public.asd_clubs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER bidding_sessions_last_bid BEFORE UPDATE ON public.bidding_sessions FOR EACH ROW EXECUTE FUNCTION tocca_bidding_session();
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
ALTER TABLE public.bidding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coda_sfide_coppie ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.mani_generate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risultati_mano ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risultati_torneo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sfida_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sfide_coppie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smazzate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tornei ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneo_mani ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traduzioni_stato ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "Instructor or self can update membership" ON public.class_members AS PERMISSIVE FOR UPDATE TO public USING (((student_id = auth.uid()) OR is_instructor_of_class(class_id))) WITH CHECK ((is_instructor_of_class(class_id) OR ((student_id = auth.uid()) AND (status = 'removed'::text))));
CREATE POLICY "Members and owning instructor can view membership" ON public.class_members AS PERMISSIVE FOR SELECT TO public USING (((student_id = auth.uid()) OR is_instructor_of_class(class_id)));
CREATE POLICY "Students can join themselves" ON public.class_members AS PERMISSIVE FOR INSERT TO public WITH CHECK ((student_id = auth.uid()));
CREATE POLICY "Authors can delete own class messages" ON public.class_messages AS PERMISSIVE FOR DELETE TO public USING (((user_id = auth.uid()) OR is_instructor_of_class(class_id)));
CREATE POLICY "Members can read class messages" ON public.class_messages AS PERMISSIVE FOR SELECT TO public USING ((is_instructor_of_class(class_id) OR is_member_of_class(class_id)));
CREATE POLICY "Members can send class messages" ON public.class_messages AS PERMISSIVE FOR INSERT TO public WITH CHECK (((user_id = auth.uid()) AND (is_instructor_of_class(class_id) OR is_member_of_class(class_id))));
CREATE POLICY "Instructors and members can view classes" ON public.classes AS PERMISSIVE FOR SELECT TO public USING (((instructor_id = auth.uid()) OR is_member_of_class(id) OR is_pending_of_class(id)));
CREATE POLICY "Instructors can create classes" ON public.classes AS PERMISSIVE FOR INSERT TO public WITH CHECK (((instructor_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['instructor'::text, 'admin'::text])))))));
CREATE POLICY "Instructors can delete own classes" ON public.classes AS PERMISSIVE FOR DELETE TO public USING ((instructor_id = auth.uid()));
CREATE POLICY "Instructors can update own classes" ON public.classes AS PERMISSIVE FOR UPDATE TO public USING ((instructor_id = auth.uid()));
CREATE POLICY "Author or admin deletes" ON public.club_posts AS PERMISSIVE FOR DELETE TO authenticated USING (((author_id = auth.uid()) OR is_admin()));
CREATE POLICY "Instructors write for own club" ON public.club_posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((author_id = auth.uid()) AND can_post_for_asd(asd_code)));
CREATE POLICY "Members read own club posts" ON public.club_posts AS PERMISSIVE FOR SELECT TO authenticated USING (((asd_code = my_asd_code()) OR can_post_for_asd(asd_code)));
CREATE POLICY "La mia attesa" ON public.coda_sfide_coppie AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = a1) OR (auth.uid() = a2)));
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
CREATE POLICY "Istruttori generano mani" ON public.mani_generate AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['instructor'::text, 'admin'::text]))))));
CREATE POLICY "Mani leggibili" ON public.mani_generate AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY partner_profiles_delete ON public.partner_profiles AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY partner_profiles_insert ON public.partner_profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY partner_profiles_select ON public.partner_profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((looking OR (user_id = auth.uid())));
CREATE POLICY partner_profiles_update ON public.partner_profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Authenticated users can read profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = id));
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Own reviews" ON public.review_items AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Ognuno scrive il proprio risultato" ON public.risultati_mano AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Risultati leggibili" ON public.risultati_mano AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ognuno scrive il proprio risultato di torneo" ON public.risultati_torneo AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Risultati del torneo leggibili" ON public.risultati_torneo AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Own saved hands" ON public.saved_hands AS PERMISSIVE FOR ALL TO authenticated USING ((owner_id = auth.uid())) WITH CHECK ((owner_id = auth.uid()));
CREATE POLICY "Autore cancella i propri scenari" ON public.scenari AS PERMISSIVE FOR DELETE TO authenticated USING (((autore_id = auth.uid()) OR is_admin()));
CREATE POLICY "Autore modifica i propri scenari" ON public.scenari AS PERMISSIVE FOR UPDATE TO authenticated USING ((autore_id = auth.uid())) WITH CHECK ((autore_id = auth.uid()));
CREATE POLICY "Istruttori creano scenari" ON public.scenari AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((autore_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['instructor'::text, 'admin'::text])))))));
CREATE POLICY "Scenari leggibili" ON public.scenari AS PERMISSIVE FOR SELECT TO authenticated USING ((pubblico OR ufficiale OR (autore_id = auth.uid())));
CREATE POLICY "Le board delle mie sfide" ON public.sfida_board AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM sfide_coppie s
  WHERE ((s.id = sfida_board.sfida_id) AND ((((auth.uid() = s.a1) OR (auth.uid() = s.a2)) OR (auth.uid() = s.b1)) OR (auth.uid() = s.b2))))));
CREATE POLICY "Le mie sfide" ON public.sfide_coppie AS PERMISSIVE FOR SELECT TO authenticated USING (((((auth.uid() = a1) OR (auth.uid() = a2)) OR (auth.uid() = b1)) OR (auth.uid() = b2)));
CREATE POLICY smazzate_public_read ON public.smazzate AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Tornei leggibili" ON public.tornei AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mani del torneo leggibili" ON public.torneo_mani AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read tournament results" ON public.tournament_results AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own tournament result" ON public.tournament_results AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update own tournament result" ON public.tournament_results AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Stato traduzioni visibile" ON public.traduzioni_stato AS PERMISSIVE FOR SELECT TO authenticated USING (true);
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
GRANT DELETE ON public.bidding_sessions TO anon;
GRANT DELETE ON public.bidding_sessions TO authenticated;
GRANT DELETE ON public.bidding_sessions TO service_role;
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
GRANT DELETE ON public.club_posts TO anon;
GRANT DELETE ON public.club_posts TO authenticated;
GRANT DELETE ON public.club_posts TO service_role;
GRANT DELETE ON public.coda_sfide_coppie TO anon;
GRANT DELETE ON public.coda_sfide_coppie TO authenticated;
GRANT DELETE ON public.coda_sfide_coppie TO service_role;
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
GRANT DELETE ON public.mani_generate TO anon;
GRANT DELETE ON public.mani_generate TO authenticated;
GRANT DELETE ON public.mani_generate TO service_role;
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
GRANT DELETE ON public.risultati_mano TO anon;
GRANT DELETE ON public.risultati_mano TO authenticated;
GRANT DELETE ON public.risultati_mano TO service_role;
GRANT DELETE ON public.risultati_torneo TO anon;
GRANT DELETE ON public.risultati_torneo TO authenticated;
GRANT DELETE ON public.risultati_torneo TO service_role;
GRANT DELETE ON public.saved_hands TO anon;
GRANT DELETE ON public.saved_hands TO authenticated;
GRANT DELETE ON public.saved_hands TO service_role;
GRANT DELETE ON public.scenari TO anon;
GRANT DELETE ON public.scenari TO authenticated;
GRANT DELETE ON public.scenari TO service_role;
GRANT DELETE ON public.sfida_board TO anon;
GRANT DELETE ON public.sfida_board TO authenticated;
GRANT DELETE ON public.sfida_board TO service_role;
GRANT DELETE ON public.sfide_coppie TO anon;
GRANT DELETE ON public.sfide_coppie TO authenticated;
GRANT DELETE ON public.sfide_coppie TO service_role;
GRANT DELETE ON public.smazzate TO anon;
GRANT DELETE ON public.smazzate TO authenticated;
GRANT DELETE ON public.smazzate TO service_role;
GRANT DELETE ON public.tornei TO anon;
GRANT DELETE ON public.tornei TO authenticated;
GRANT DELETE ON public.tornei TO service_role;
GRANT DELETE ON public.torneo_mani TO anon;
GRANT DELETE ON public.torneo_mani TO authenticated;
GRANT DELETE ON public.torneo_mani TO service_role;
GRANT DELETE ON public.tournament_results TO anon;
GRANT DELETE ON public.tournament_results TO authenticated;
GRANT DELETE ON public.tournament_results TO service_role;
GRANT DELETE ON public.traduzioni_stato TO anon;
GRANT DELETE ON public.traduzioni_stato TO authenticated;
GRANT DELETE ON public.traduzioni_stato TO service_role;
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
GRANT INSERT ON public.bidding_sessions TO anon;
GRANT INSERT ON public.bidding_sessions TO authenticated;
GRANT INSERT ON public.bidding_sessions TO service_role;
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
GRANT INSERT ON public.club_posts TO anon;
GRANT INSERT ON public.club_posts TO authenticated;
GRANT INSERT ON public.club_posts TO service_role;
GRANT INSERT ON public.coda_sfide_coppie TO anon;
GRANT INSERT ON public.coda_sfide_coppie TO authenticated;
GRANT INSERT ON public.coda_sfide_coppie TO service_role;
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
GRANT INSERT ON public.mani_generate TO anon;
GRANT INSERT ON public.mani_generate TO authenticated;
GRANT INSERT ON public.mani_generate TO service_role;
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
GRANT INSERT ON public.risultati_mano TO anon;
GRANT INSERT ON public.risultati_mano TO authenticated;
GRANT INSERT ON public.risultati_mano TO service_role;
GRANT INSERT ON public.risultati_torneo TO anon;
GRANT INSERT ON public.risultati_torneo TO authenticated;
GRANT INSERT ON public.risultati_torneo TO service_role;
GRANT INSERT ON public.saved_hands TO anon;
GRANT INSERT ON public.saved_hands TO authenticated;
GRANT INSERT ON public.saved_hands TO service_role;
GRANT INSERT ON public.scenari TO anon;
GRANT INSERT ON public.scenari TO authenticated;
GRANT INSERT ON public.scenari TO service_role;
GRANT INSERT ON public.sfida_board TO anon;
GRANT INSERT ON public.sfida_board TO authenticated;
GRANT INSERT ON public.sfida_board TO service_role;
GRANT INSERT ON public.sfide_coppie TO anon;
GRANT INSERT ON public.sfide_coppie TO authenticated;
GRANT INSERT ON public.sfide_coppie TO service_role;
GRANT INSERT ON public.smazzate TO anon;
GRANT INSERT ON public.smazzate TO authenticated;
GRANT INSERT ON public.smazzate TO service_role;
GRANT INSERT ON public.tornei TO anon;
GRANT INSERT ON public.tornei TO authenticated;
GRANT INSERT ON public.tornei TO service_role;
GRANT INSERT ON public.torneo_mani TO anon;
GRANT INSERT ON public.torneo_mani TO authenticated;
GRANT INSERT ON public.torneo_mani TO service_role;
GRANT INSERT ON public.tournament_results TO anon;
GRANT INSERT ON public.tournament_results TO authenticated;
GRANT INSERT ON public.tournament_results TO service_role;
GRANT INSERT ON public.traduzioni_stato TO anon;
GRANT INSERT ON public.traduzioni_stato TO authenticated;
GRANT INSERT ON public.traduzioni_stato TO service_role;
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
GRANT REFERENCES ON public.bidding_sessions TO anon;
GRANT REFERENCES ON public.bidding_sessions TO authenticated;
GRANT REFERENCES ON public.bidding_sessions TO service_role;
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
GRANT REFERENCES ON public.club_posts TO anon;
GRANT REFERENCES ON public.club_posts TO authenticated;
GRANT REFERENCES ON public.club_posts TO service_role;
GRANT REFERENCES ON public.coda_sfide_coppie TO anon;
GRANT REFERENCES ON public.coda_sfide_coppie TO authenticated;
GRANT REFERENCES ON public.coda_sfide_coppie TO service_role;
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
GRANT REFERENCES ON public.mani_generate TO anon;
GRANT REFERENCES ON public.mani_generate TO authenticated;
GRANT REFERENCES ON public.mani_generate TO service_role;
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
GRANT REFERENCES ON public.risultati_mano TO anon;
GRANT REFERENCES ON public.risultati_mano TO authenticated;
GRANT REFERENCES ON public.risultati_mano TO service_role;
GRANT REFERENCES ON public.risultati_torneo TO anon;
GRANT REFERENCES ON public.risultati_torneo TO authenticated;
GRANT REFERENCES ON public.risultati_torneo TO service_role;
GRANT REFERENCES ON public.saved_hands TO anon;
GRANT REFERENCES ON public.saved_hands TO authenticated;
GRANT REFERENCES ON public.saved_hands TO service_role;
GRANT REFERENCES ON public.scenari TO anon;
GRANT REFERENCES ON public.scenari TO authenticated;
GRANT REFERENCES ON public.scenari TO service_role;
GRANT REFERENCES ON public.sfida_board TO anon;
GRANT REFERENCES ON public.sfida_board TO authenticated;
GRANT REFERENCES ON public.sfida_board TO service_role;
GRANT REFERENCES ON public.sfide_coppie TO anon;
GRANT REFERENCES ON public.sfide_coppie TO authenticated;
GRANT REFERENCES ON public.sfide_coppie TO service_role;
GRANT REFERENCES ON public.smazzate TO anon;
GRANT REFERENCES ON public.smazzate TO authenticated;
GRANT REFERENCES ON public.smazzate TO service_role;
GRANT REFERENCES ON public.tornei TO anon;
GRANT REFERENCES ON public.tornei TO authenticated;
GRANT REFERENCES ON public.tornei TO service_role;
GRANT REFERENCES ON public.torneo_mani TO anon;
GRANT REFERENCES ON public.torneo_mani TO authenticated;
GRANT REFERENCES ON public.torneo_mani TO service_role;
GRANT REFERENCES ON public.tournament_results TO anon;
GRANT REFERENCES ON public.tournament_results TO authenticated;
GRANT REFERENCES ON public.tournament_results TO service_role;
GRANT REFERENCES ON public.traduzioni_stato TO anon;
GRANT REFERENCES ON public.traduzioni_stato TO authenticated;
GRANT REFERENCES ON public.traduzioni_stato TO service_role;
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
GRANT SELECT ON public.bidding_sessions TO anon;
GRANT SELECT ON public.bidding_sessions TO authenticated;
GRANT SELECT ON public.bidding_sessions TO service_role;
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
GRANT SELECT ON public.club_posts TO anon;
GRANT SELECT ON public.club_posts TO authenticated;
GRANT SELECT ON public.club_posts TO service_role;
GRANT SELECT ON public.coda_sfide_coppie TO anon;
GRANT SELECT ON public.coda_sfide_coppie TO authenticated;
GRANT SELECT ON public.coda_sfide_coppie TO service_role;
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
GRANT SELECT ON public.mani_generate TO anon;
GRANT SELECT ON public.mani_generate TO authenticated;
GRANT SELECT ON public.mani_generate TO service_role;
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
GRANT SELECT ON public.risultati_mano TO anon;
GRANT SELECT ON public.risultati_mano TO authenticated;
GRANT SELECT ON public.risultati_mano TO service_role;
GRANT SELECT ON public.risultati_torneo TO anon;
GRANT SELECT ON public.risultati_torneo TO authenticated;
GRANT SELECT ON public.risultati_torneo TO service_role;
GRANT SELECT ON public.saved_hands TO anon;
GRANT SELECT ON public.saved_hands TO authenticated;
GRANT SELECT ON public.saved_hands TO service_role;
GRANT SELECT ON public.scenari TO anon;
GRANT SELECT ON public.scenari TO authenticated;
GRANT SELECT ON public.scenari TO service_role;
GRANT SELECT ON public.sfida_board TO anon;
GRANT SELECT ON public.sfida_board TO authenticated;
GRANT SELECT ON public.sfida_board TO service_role;
GRANT SELECT ON public.sfide_coppie TO anon;
GRANT SELECT ON public.sfide_coppie TO authenticated;
GRANT SELECT ON public.sfide_coppie TO service_role;
GRANT SELECT ON public.smazzate TO anon;
GRANT SELECT ON public.smazzate TO authenticated;
GRANT SELECT ON public.smazzate TO service_role;
GRANT SELECT ON public.tornei TO anon;
GRANT SELECT ON public.tornei TO authenticated;
GRANT SELECT ON public.tornei TO service_role;
GRANT SELECT ON public.torneo_mani TO anon;
GRANT SELECT ON public.torneo_mani TO authenticated;
GRANT SELECT ON public.torneo_mani TO service_role;
GRANT SELECT ON public.tournament_results TO anon;
GRANT SELECT ON public.tournament_results TO authenticated;
GRANT SELECT ON public.tournament_results TO service_role;
GRANT SELECT ON public.traduzioni_stato TO anon;
GRANT SELECT ON public.traduzioni_stato TO authenticated;
GRANT SELECT ON public.traduzioni_stato TO service_role;
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
GRANT TRIGGER ON public.bidding_sessions TO anon;
GRANT TRIGGER ON public.bidding_sessions TO authenticated;
GRANT TRIGGER ON public.bidding_sessions TO service_role;
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
GRANT TRIGGER ON public.club_posts TO anon;
GRANT TRIGGER ON public.club_posts TO authenticated;
GRANT TRIGGER ON public.club_posts TO service_role;
GRANT TRIGGER ON public.coda_sfide_coppie TO anon;
GRANT TRIGGER ON public.coda_sfide_coppie TO authenticated;
GRANT TRIGGER ON public.coda_sfide_coppie TO service_role;
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
GRANT TRIGGER ON public.mani_generate TO anon;
GRANT TRIGGER ON public.mani_generate TO authenticated;
GRANT TRIGGER ON public.mani_generate TO service_role;
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
GRANT TRIGGER ON public.risultati_mano TO anon;
GRANT TRIGGER ON public.risultati_mano TO authenticated;
GRANT TRIGGER ON public.risultati_mano TO service_role;
GRANT TRIGGER ON public.risultati_torneo TO anon;
GRANT TRIGGER ON public.risultati_torneo TO authenticated;
GRANT TRIGGER ON public.risultati_torneo TO service_role;
GRANT TRIGGER ON public.saved_hands TO anon;
GRANT TRIGGER ON public.saved_hands TO authenticated;
GRANT TRIGGER ON public.saved_hands TO service_role;
GRANT TRIGGER ON public.scenari TO anon;
GRANT TRIGGER ON public.scenari TO authenticated;
GRANT TRIGGER ON public.scenari TO service_role;
GRANT TRIGGER ON public.sfida_board TO anon;
GRANT TRIGGER ON public.sfida_board TO authenticated;
GRANT TRIGGER ON public.sfida_board TO service_role;
GRANT TRIGGER ON public.sfide_coppie TO anon;
GRANT TRIGGER ON public.sfide_coppie TO authenticated;
GRANT TRIGGER ON public.sfide_coppie TO service_role;
GRANT TRIGGER ON public.smazzate TO anon;
GRANT TRIGGER ON public.smazzate TO authenticated;
GRANT TRIGGER ON public.smazzate TO service_role;
GRANT TRIGGER ON public.tornei TO anon;
GRANT TRIGGER ON public.tornei TO authenticated;
GRANT TRIGGER ON public.tornei TO service_role;
GRANT TRIGGER ON public.torneo_mani TO anon;
GRANT TRIGGER ON public.torneo_mani TO authenticated;
GRANT TRIGGER ON public.torneo_mani TO service_role;
GRANT TRIGGER ON public.tournament_results TO anon;
GRANT TRIGGER ON public.tournament_results TO authenticated;
GRANT TRIGGER ON public.tournament_results TO service_role;
GRANT TRIGGER ON public.traduzioni_stato TO anon;
GRANT TRIGGER ON public.traduzioni_stato TO authenticated;
GRANT TRIGGER ON public.traduzioni_stato TO service_role;
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
GRANT TRUNCATE ON public.bidding_sessions TO anon;
GRANT TRUNCATE ON public.bidding_sessions TO authenticated;
GRANT TRUNCATE ON public.bidding_sessions TO service_role;
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
GRANT TRUNCATE ON public.club_posts TO anon;
GRANT TRUNCATE ON public.club_posts TO authenticated;
GRANT TRUNCATE ON public.club_posts TO service_role;
GRANT TRUNCATE ON public.coda_sfide_coppie TO anon;
GRANT TRUNCATE ON public.coda_sfide_coppie TO authenticated;
GRANT TRUNCATE ON public.coda_sfide_coppie TO service_role;
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
GRANT TRUNCATE ON public.mani_generate TO anon;
GRANT TRUNCATE ON public.mani_generate TO authenticated;
GRANT TRUNCATE ON public.mani_generate TO service_role;
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
GRANT TRUNCATE ON public.risultati_mano TO anon;
GRANT TRUNCATE ON public.risultati_mano TO authenticated;
GRANT TRUNCATE ON public.risultati_mano TO service_role;
GRANT TRUNCATE ON public.risultati_torneo TO anon;
GRANT TRUNCATE ON public.risultati_torneo TO authenticated;
GRANT TRUNCATE ON public.risultati_torneo TO service_role;
GRANT TRUNCATE ON public.saved_hands TO anon;
GRANT TRUNCATE ON public.saved_hands TO authenticated;
GRANT TRUNCATE ON public.saved_hands TO service_role;
GRANT TRUNCATE ON public.scenari TO anon;
GRANT TRUNCATE ON public.scenari TO authenticated;
GRANT TRUNCATE ON public.scenari TO service_role;
GRANT TRUNCATE ON public.sfida_board TO anon;
GRANT TRUNCATE ON public.sfida_board TO authenticated;
GRANT TRUNCATE ON public.sfida_board TO service_role;
GRANT TRUNCATE ON public.sfide_coppie TO anon;
GRANT TRUNCATE ON public.sfide_coppie TO authenticated;
GRANT TRUNCATE ON public.sfide_coppie TO service_role;
GRANT TRUNCATE ON public.smazzate TO anon;
GRANT TRUNCATE ON public.smazzate TO authenticated;
GRANT TRUNCATE ON public.smazzate TO service_role;
GRANT TRUNCATE ON public.tornei TO anon;
GRANT TRUNCATE ON public.tornei TO authenticated;
GRANT TRUNCATE ON public.tornei TO service_role;
GRANT TRUNCATE ON public.torneo_mani TO anon;
GRANT TRUNCATE ON public.torneo_mani TO authenticated;
GRANT TRUNCATE ON public.torneo_mani TO service_role;
GRANT TRUNCATE ON public.tournament_results TO anon;
GRANT TRUNCATE ON public.tournament_results TO authenticated;
GRANT TRUNCATE ON public.tournament_results TO service_role;
GRANT TRUNCATE ON public.traduzioni_stato TO anon;
GRANT TRUNCATE ON public.traduzioni_stato TO authenticated;
GRANT TRUNCATE ON public.traduzioni_stato TO service_role;
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
GRANT UPDATE ON public.bidding_sessions TO anon;
GRANT UPDATE ON public.bidding_sessions TO authenticated;
GRANT UPDATE ON public.bidding_sessions TO service_role;
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
GRANT UPDATE ON public.club_posts TO anon;
GRANT UPDATE ON public.club_posts TO authenticated;
GRANT UPDATE ON public.club_posts TO service_role;
GRANT UPDATE ON public.coda_sfide_coppie TO anon;
GRANT UPDATE ON public.coda_sfide_coppie TO authenticated;
GRANT UPDATE ON public.coda_sfide_coppie TO service_role;
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
GRANT UPDATE ON public.mani_generate TO anon;
GRANT UPDATE ON public.mani_generate TO authenticated;
GRANT UPDATE ON public.mani_generate TO service_role;
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
GRANT UPDATE ON public.risultati_mano TO anon;
GRANT UPDATE ON public.risultati_mano TO authenticated;
GRANT UPDATE ON public.risultati_mano TO service_role;
GRANT UPDATE ON public.risultati_torneo TO anon;
GRANT UPDATE ON public.risultati_torneo TO authenticated;
GRANT UPDATE ON public.risultati_torneo TO service_role;
GRANT UPDATE ON public.saved_hands TO anon;
GRANT UPDATE ON public.saved_hands TO authenticated;
GRANT UPDATE ON public.saved_hands TO service_role;
GRANT UPDATE ON public.scenari TO anon;
GRANT UPDATE ON public.scenari TO authenticated;
GRANT UPDATE ON public.scenari TO service_role;
GRANT UPDATE ON public.sfida_board TO anon;
GRANT UPDATE ON public.sfida_board TO authenticated;
GRANT UPDATE ON public.sfida_board TO service_role;
GRANT UPDATE ON public.sfide_coppie TO anon;
GRANT UPDATE ON public.sfide_coppie TO authenticated;
GRANT UPDATE ON public.sfide_coppie TO service_role;
GRANT UPDATE ON public.smazzate TO anon;
GRANT UPDATE ON public.smazzate TO authenticated;
GRANT UPDATE ON public.smazzate TO service_role;
GRANT UPDATE ON public.tornei TO anon;
GRANT UPDATE ON public.tornei TO authenticated;
GRANT UPDATE ON public.tornei TO service_role;
GRANT UPDATE ON public.torneo_mani TO anon;
GRANT UPDATE ON public.torneo_mani TO authenticated;
GRANT UPDATE ON public.torneo_mani TO service_role;
GRANT UPDATE ON public.tournament_results TO anon;
GRANT UPDATE ON public.tournament_results TO authenticated;
GRANT UPDATE ON public.tournament_results TO service_role;
GRANT UPDATE ON public.traduzioni_stato TO anon;
GRANT UPDATE ON public.traduzioni_stato TO authenticated;
GRANT UPDATE ON public.traduzioni_stato TO service_role;
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
REVOKE ALL ON FUNCTION public.amico_da_codice(p_codice text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.amico_da_codice(p_codice text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.amico_da_codice(p_codice text) TO service_role;
REVOKE ALL ON FUNCTION public.bidding_session_bid(p_id uuid, p_bid text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bidding_session_bid(p_id uuid, p_bid text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bidding_session_bid(p_id uuid, p_bid text) TO service_role;
REVOKE ALL ON FUNCTION public.bidding_session_bid_server(p_id uuid, p_bid text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bidding_session_bid_server(p_id uuid, p_bid text) TO service_role;
REVOKE ALL ON FUNCTION public.bidding_session_create(p_partner uuid, p_hands jsonb, p_dealer text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bidding_session_create(p_partner uuid, p_hands jsonb, p_dealer text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bidding_session_create(p_partner uuid, p_hands jsonb, p_dealer text) TO service_role;
REVOKE ALL ON FUNCTION public.bidding_session_view(p_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bidding_session_view(p_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bidding_session_view(p_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.can_post_for_asd(p_asd_code text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_post_for_asd(p_asd_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_post_for_asd(p_asd_code text) TO service_role;
REVOKE ALL ON FUNCTION public.classifica_torneo(p_torneo uuid, p_quanti integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.classifica_torneo(p_torneo uuid, p_quanti integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.classifica_torneo(p_torneo uuid, p_quanti integer) TO service_role;
REVOKE ALL ON FUNCTION public.commento_negato(p_smazzata_id text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.commento_negato(p_smazzata_id text) TO anon;
GRANT EXECUTE ON FUNCTION public.commento_negato(p_smazzata_id text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.commento_negato(p_smazzata_id text) TO service_role;
REVOKE ALL ON FUNCTION public.compito_per_allievo(p_assignment_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compito_per_allievo(p_assignment_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.compito_per_allievo(p_assignment_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compito_per_allievo(p_assignment_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.confronto_campo(p_mano_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confronto_campo(p_mano_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confronto_campo(p_mano_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.confronto_campo_filtrato(p_mano_id uuid, p_filtro text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confronto_campo_filtrato(p_mano_id uuid, p_filtro text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confronto_campo_filtrato(p_mano_id uuid, p_filtro text) TO service_role;
REVOKE ALL ON FUNCTION public.dump_schema() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dump_schema() TO service_role;
REVOKE ALL ON FUNCTION public.genera_codice_amico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.genera_codice_amico() TO authenticated;
GRANT EXECUTE ON FUNCTION public.genera_codice_amico() TO service_role;
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
REVOKE ALL ON FUNCTION public.imp_da_differenza(p_diff integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.imp_da_differenza(p_diff integer) TO anon;
GRANT EXECUTE ON FUNCTION public.imp_da_differenza(p_diff integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.imp_da_differenza(p_diff integer) TO service_role;
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
REVOKE ALL ON FUNCTION public.is_pending_of_class(p_class_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_pending_of_class(p_class_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_pending_of_class(p_class_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pending_of_class(p_class_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.join_class_by_code(p_code text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(p_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(p_code text) TO service_role;
REVOKE ALL ON FUNCTION public.licite_in_attesa(p_user uuid, p_ore integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.licite_in_attesa(p_user uuid, p_ore integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.licite_in_attesa(p_user uuid, p_ore integer) TO service_role;
REVOKE ALL ON FUNCTION public.list_instructor_requests(p_status text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_instructor_requests(p_status text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_instructor_requests(p_status text) TO service_role;
REVOKE ALL ON FUNCTION public.list_partner_candidates(p_level text, p_province text, p_availability text[], p_limit integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_partner_candidates(p_level text, p_province text, p_availability text[], p_limit integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_partner_candidates(p_level text, p_province text, p_availability text[], p_limit integer) TO service_role;
REVOKE ALL ON FUNCTION public.live_table_open(p_class_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.live_table_open(p_class_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_table_open(p_class_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.live_table_play(p_table_id uuid, p_seat text, p_card jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.live_table_play(p_table_id uuid, p_seat text, p_card jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_table_play(p_table_id uuid, p_seat text, p_card jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.live_table_undo(p_table_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.live_table_undo(p_table_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_table_undo(p_table_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.live_table_view(p_table_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.live_table_view(p_table_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_table_view(p_table_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.log_user_login() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_user_login() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_login() TO service_role;
REVOKE ALL ON FUNCTION public.mano_da_fare(p_slug text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mano_da_fare(p_slug text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mano_da_fare(p_slug text) TO service_role;
REVOKE ALL ON FUNCTION public.mie_sfide_coppie() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mie_sfide_coppie() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mie_sfide_coppie() TO service_role;
REVOKE ALL ON FUNCTION public.mie_statistiche_sfide() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mie_statistiche_sfide() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mie_statistiche_sfide() TO service_role;
REVOKE ALL ON FUNCTION public.mio_codice_amico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mio_codice_amico() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mio_codice_amico() TO service_role;
REVOKE ALL ON FUNCTION public.my_asd_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_asd_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_asd_code() TO service_role;
REVOKE ALL ON FUNCTION public.my_bidding_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_bidding_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_bidding_sessions() TO service_role;
REVOKE ALL ON FUNCTION public.my_tournament_history(limite integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_tournament_history(limite integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_tournament_history(limite integer) TO service_role;
REVOKE ALL ON FUNCTION public.punteggio_contratto(p_level integer, p_strain text, p_prese integer, p_zona boolean, p_doppio integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.punteggio_contratto(p_level integer, p_strain text, p_prese integer, p_zona boolean, p_doppio integer) TO anon;
GRANT EXECUTE ON FUNCTION public.punteggio_contratto(p_level integer, p_strain text, p_prese integer, p_zona boolean, p_doppio integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.punteggio_contratto(p_level integer, p_strain text, p_prese integer, p_zona boolean, p_doppio integer) TO service_role;
REVOKE ALL ON FUNCTION public.review_instructor_request(p_request_id uuid, p_approve boolean, p_message text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_instructor_request(p_request_id uuid, p_approve boolean, p_message text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_instructor_request(p_request_id uuid, p_approve boolean, p_message text) TO service_role;
REVOKE ALL ON FUNCTION public.search_users(p_query text, p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_users(p_query text, p_user_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users(p_query text, p_user_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.sfida_board_chiudi(p_sessione uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sfida_board_chiudi(p_sessione uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sfida_board_chiudi(p_sessione uuid) TO service_role;
REVOKE ALL ON FUNCTION public.sfida_coppie_coda_stato() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sfida_coppie_coda_stato() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sfida_coppie_coda_stato() TO service_role;
REVOKE ALL ON FUNCTION public.sfida_coppie_crea(p_compagno uuid, p_b1 uuid, p_b2 uuid, p_quante integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sfida_coppie_crea(p_compagno uuid, p_b1 uuid, p_b2 uuid, p_quante integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sfida_coppie_crea(p_compagno uuid, p_b1 uuid, p_b2 uuid, p_quante integer) TO service_role;
REVOKE ALL ON FUNCTION public.sfida_coppie_esci() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sfida_coppie_esci() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sfida_coppie_esci() TO service_role;
REVOKE ALL ON FUNCTION public.sfida_coppie_iscrivi(p_compagno uuid, p_quante integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sfida_coppie_iscrivi(p_compagno uuid, p_quante integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sfida_coppie_iscrivi(p_compagno uuid, p_quante integer) TO service_role;
REVOKE ALL ON FUNCTION public.sfida_coppie_vista(p_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sfida_coppie_vista(p_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sfida_coppie_vista(p_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.smazzate_commenti(p_ids text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.smazzate_commenti(p_ids text[]) TO anon;
GRANT EXECUTE ON FUNCTION public.smazzate_commenti(p_ids text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.smazzate_commenti(p_ids text[]) TO service_role;
REVOKE ALL ON FUNCTION public.sync_asd_name() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_asd_name() TO anon;
GRANT EXECUTE ON FUNCTION public.sync_asd_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_asd_name() TO service_role;
REVOKE ALL ON FUNCTION public.tocca_bidding_session() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tocca_bidding_session() TO anon;
GRANT EXECUTE ON FUNCTION public.tocca_bidding_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.tocca_bidding_session() TO service_role;
REVOKE ALL ON FUNCTION public.torneo_corrente(p_tipo text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.torneo_corrente(p_tipo text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.torneo_corrente(p_tipo text) TO service_role;
REVOKE ALL ON FUNCTION public.torneo_mano(p_torneo uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.torneo_mano(p_torneo uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.torneo_mano(p_torneo uuid) TO service_role;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO service_role;

-- PUBLICATION (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coda_sfide_coppie;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sfide_coppie;
