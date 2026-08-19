-- Read-only aggregates for the shared-hand and bidding product additions.
SELECT
  (SELECT count(*) FROM public.mani_generate) AS shared_generated_hands,
  (SELECT count(*) FROM public.scenari) AS shared_scenarios,
  (SELECT count(*) FROM public.tornei) AS bidding_tournaments,
  (SELECT count(*) FROM public.torneo_mani) AS bidding_tournament_boards,
  (SELECT count(*) FROM public.mani_generate WHERE distribuzioni IS NOT NULL) AS generated_with_distributions,
  (SELECT count(*) FROM public.mani_generate WHERE distribuzioni IS NULL) AS generated_without_distributions,
  (SELECT round(avg(ns_hcp), 2) FROM public.mani_generate) AS generated_avg_ns_hcp,
  (SELECT min(ns_hcp) FROM public.mani_generate) AS generated_min_ns_hcp,
  (SELECT max(ns_hcp) FROM public.mani_generate) AS generated_max_ns_hcp;

