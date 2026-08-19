-- Read-only adoption aggregates for newly implemented features.
SELECT jsonb_build_object(
  'shared_hand_results', jsonb_build_object(
    'events', (SELECT count(*) FROM public.risultati_mano),
    'users', (SELECT count(DISTINCT user_id) FROM public.risultati_mano),
    'first', (SELECT min(created_at)::date FROM public.risultati_mano),
    'last', (SELECT max(created_at)::date FROM public.risultati_mano)
  ),
  'bidding_tournament_results', jsonb_build_object(
    'events', (SELECT count(*) FROM public.risultati_torneo),
    'users', (SELECT count(DISTINCT user_id) FROM public.risultati_torneo),
    'first', (SELECT min(created_at)::date FROM public.risultati_torneo),
    'last', (SELECT max(created_at)::date FROM public.risultati_torneo)
  ),
  'saved_hands', jsonb_build_object(
    'events', (SELECT count(*) FROM public.saved_hands),
    'users', (SELECT count(DISTINCT owner_id) FROM public.saved_hands)
  ),
  'two_player_bidding_sessions', jsonb_build_object(
    'events', (SELECT count(*) FROM public.bidding_sessions),
    'users', (SELECT count(DISTINCT u) FROM (
      SELECT south_id AS u FROM public.bidding_sessions
      UNION SELECT north_id FROM public.bidding_sessions
    ) x)
  ),
  'live_tables', jsonb_build_object(
    'events', (SELECT count(*) FROM public.live_tables),
    'instructors', (SELECT count(DISTINCT instructor_id) FROM public.live_tables),
    'first', (SELECT min(created_at)::date FROM public.live_tables),
    'last', (SELECT max(created_at)::date FROM public.live_tables)
  ),
  'partner_profiles', jsonb_build_object(
    'profiles', (SELECT count(*) FROM public.partner_profiles)
  ),
  'club_posts', jsonb_build_object(
    'posts', (SELECT count(*) FROM public.club_posts)
  ),
  'pair_challenges', jsonb_build_object(
    'challenges', (SELECT count(*) FROM public.sfide_coppie)
  )
) AS new_feature_usage;
