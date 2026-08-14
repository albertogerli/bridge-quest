-- ============================================================================
-- BridgeLab: il confronto su una mano, ristretto a un gruppo di persone
-- ============================================================================
--
-- PERCHÉ NON BASTA «TUTTI»
-- «Meglio del 74% del campo» è utile, ma il campo comprende chi gioca da
-- vent'anni e chi ha cominciato a marzo. Per un allievo il paragone che
-- significa qualcosa è con i suoi compagni di classe; per un socio, con quelli
-- del suo circolo. È il «Compare» di Cuebids, con in più i filtri che loro non
-- hanno perché non hanno né classi né circoli — cioè il posto dove
-- effettivamente si impara a giocare in Italia.
--
-- COSA ESCE E COSA NO
-- Con `tutti`, `classe` e `asd` escono soltanto numeri: nessun nome. Con
-- `amici` escono i nomi, perché fra amici il paragone col nome è il senso
-- della cosa — e l'amicizia è già un consenso reciproco, che chiedere a
-- qualcuno del proprio circolo invece no.
--
-- «CLASSE» VUOL DIRE: le persone che stanno in almeno una classe con te,
-- l'istruttore compreso. Non serve sceglierla: se uno segue due corsi, il
-- paragone li comprende entrambi.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

create or replace function public.confronto_campo_filtrato(
  p_mano_id uuid, p_filtro text default 'tutti'
)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
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
    -- I nomi solo fra amici: vedi sopra.
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
$function$;

revoke execute on function public.confronto_campo_filtrato(uuid, text) from public;
revoke execute on function public.confronto_campo_filtrato(uuid, text) from anon;
grant execute on function public.confronto_campo_filtrato(uuid, text) to authenticated;
