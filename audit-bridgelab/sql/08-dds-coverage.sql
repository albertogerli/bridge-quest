-- Read-only aggregate of double-dummy coverage; returns no hand or user rows.
SELECT
  count(*) AS catalog_hands,
  count(*) FILTER (WHERE dd_tricks IS NOT NULL) AS hands_with_dd_tricks,
  count(*) FILTER (WHERE dd_tricks IS NULL) AS hands_without_dd_tricks,
  min(dd_tricks) AS min_dd_tricks,
  max(dd_tricks) AS max_dd_tricks,
  count(*) FILTER (
    WHERE dd_tricks IS NOT NULL
      AND contract ~ '^[1-7]'
      AND dd_tricks < substring(contract FROM '^([1-7])')::int + 6
  ) AS defense_oriented_hands
FROM public.smazzate;
