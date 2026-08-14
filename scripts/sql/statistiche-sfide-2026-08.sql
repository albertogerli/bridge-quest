-- ============================================================================
-- BridgeLab: statistiche delle sfide a coppie (chi vince, con chi, contro chi)
-- ============================================================================
--
-- PERCHÉ SERVE
-- «Ho vinto» dura un pomeriggio; «con Marco vinciamo sette volte su dieci, con
-- Luigi tre» è la cosa che fa tornare. È anche l'informazione che un circolo
-- usa davvero: dice con chi si gioca bene, e non ha bisogno di nessun commento.
--
-- IL CONTO STA QUI E NON NEL BROWSER perché un browser vede solo le sfide che
-- ha aperto: per contare le vittorie di un anno servirebbe scaricarle tutte.
--
-- GLI IMP SI CONVERTONO ANCHE QUI. È la stessa tavola di
-- `rawToIMP` in src/lib/bridge-scoring.ts, e la duplicazione è coperta come
-- quella del punteggio: `scripts/prova-imp-sql.mjs` confronta le due
-- implementazioni su tutte le differenze da 0 a 4500.
--
-- COSA NON MOSTRA: i nomi di chi non ha giocato con te. Le statistiche
-- riguardano le TUE sfide, e da lì non esce nessuno che non fosse al tavolo.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

create or replace function public.imp_da_differenza(p_diff int)
returns int
language sql
immutable
as $function$
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
$function$;

/**
 * Le mie statistiche di sfida: in totale, per compagno e per avversario.
 *
 * SI CONTANO SOLO LE SFIDE FINITE da entrambe le coppie. Una sfida a metà non
 * è né vinta né persa, e metterla fra le sconfitte di chi non ha ancora
 * dichiarato sarebbe un modo di sbagliare che fa anche arrabbiare.
 */
create or replace function public.mie_statistiche_sfide()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
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
  -- Una board conta solo se l'hanno dichiarata tutte e due le coppie.
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
  -- Solo gli incontri finiti: `confrontate = totale`. Contare una sfida a
  -- metà farebbe ballare le statistiche a ogni board che arriva, e
  -- registrerebbe come sconfitta una partita che l'altra coppia non ha ancora
  -- giocato.
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
$function$;

revoke execute on function public.mie_statistiche_sfide() from public;
revoke execute on function public.mie_statistiche_sfide() from anon;
grant execute on function public.mie_statistiche_sfide() to authenticated;
