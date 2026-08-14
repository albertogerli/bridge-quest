-- ============================================================================
-- BridgeLab: sfida 2 contro 2 fra due coppie (sfide_coppie + sfida_board)
-- ============================================================================
--
-- COSA FA
-- Quattro persone, due coppie, le stesse smazzate. Ogni coppia dichiara le sue
-- mani con la licita a due che già c'è (`bidding_sessions`): avversari BEN,
-- ognuno vede solo la propria mano, e si dichiara quando si può. Alla fine i
-- contratti delle due coppie si confrontano in IMP, come in una gara a
-- squadre, e ognuna riceve le stelle rispetto al contratto migliore.
--
-- LE MANI SONO QUELLE DELLA SCORTA, e senza quelle questa cosa non esisteva:
-- «le stesse smazzate per tutti e quattro» è esattamente ciò che le mani
-- condivise rendono possibile.
--
-- IL PUNTEGGIO LO CALCOLA IL SERVER, e non è pignoleria.
-- Se il risultato lo dichiarasse il browser, vincere una sfida sarebbe
-- questione di aprire gli strumenti per sviluppatori. Qui il contratto si
-- ricava dalle dichiarazioni scritte in `bidding_sessions` — che il server ha
-- già validato una per una — le prese si leggono dalla tabella double dummy
-- calcolata alla generazione, e il punteggio esce dalla tavola ufficiale.
-- Nessuno di quei tre pezzi passa dal client.
--
-- NON SI VEDE COSA HA FATTO L'ALTRA COPPIA finché non hai finito la board.
-- Sapere che gli avversari sono in manche prima di dichiarare la stessa mano
-- è metà del lavoro fatto: il confronto compare solo quando entrambe le
-- coppie hanno chiuso quella smazzata.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

-- ── Il punteggio, secondo la tavola ufficiale ───────────────────────────────
--
-- Rifà `scoreContract` di src/lib/scoring.ts. La duplicazione è voluta e il
-- rischio è coperto: `scripts/prova-punteggio-sql.mjs` confronta le due
-- implementazioni su tutte le combinazioni possibili (7 livelli × 5
-- denominazioni × 14 prese × zona). Se una delle due cambia, quella prova
-- fallisce.
--
-- Contro e surcontro ci sono: BEN contra, e un 4♠ contrato caduto di due
-- segnato come se fosse passato liscio falserebbe il conto proprio nelle mani
-- andate peggio. `p_doppio` vale 1, 2 o 4.
create or replace function public.punteggio_contratto(
  p_level int, p_strain text, p_prese int, p_zona boolean, p_doppio int default 1
)
returns int
language sql
immutable
as $function$
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
      -- contratto
      v.base_liscio * v.d
      -- manche o parziale, sul contratto contrato
      + (CASE WHEN v.base_liscio * v.d >= 100
              THEN CASE WHEN p_zona THEN 500 ELSE 300 END
              ELSE 50 END)
      -- slam
      + (CASE WHEN p_level = 7 THEN CASE WHEN p_zona THEN 1500 ELSE 1000 END
              WHEN p_level = 6 THEN CASE WHEN p_zona THEN 750 ELSE 500 END
              ELSE 0 END)
      -- prese in più: contrate valgono 100 (200 in zona), non il valore del seme
      + (CASE WHEN v.d = 1
              THEN (-v.sotto) * CASE WHEN p_strain IN ('club','diamond') THEN 20 ELSE 30 END
              ELSE (-v.sotto) * (CASE WHEN p_zona THEN 200 ELSE 100 END)
                   * CASE WHEN v.d = 4 THEN 2 ELSE 1 END END)
      -- insulto
      + (CASE WHEN v.d = 2 THEN 50 WHEN v.d = 4 THEN 100 ELSE 0 END)
  END
  FROM v;
$function$;

-- ── Le sfide ────────────────────────────────────────────────────────────────
create table if not exists public.sfide_coppie (
  id uuid primary key default gen_random_uuid(),
  creatore_id uuid not null references public.profiles(id) on delete cascade,
  a1 uuid not null references public.profiles(id) on delete cascade,
  a2 uuid not null references public.profiles(id) on delete cascade,
  b1 uuid not null references public.profiles(id) on delete cascade,
  b2 uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  check (a1 <> a2 and b1 <> b2 and a1 <> b1 and a1 <> b2 and a2 <> b1 and a2 <> b2)
);

create index if not exists sfide_coppie_partecipanti_idx
  on public.sfide_coppie (a1, a2, b1, b2);

alter table public.sfide_coppie enable row level security;

drop policy if exists "Le mie sfide" on public.sfide_coppie;
create policy "Le mie sfide" on public.sfide_coppie
  for select to authenticated
  using (auth.uid() in (a1, a2, b1, b2));

-- ── Le board: una riga per smazzata e per coppia ────────────────────────────
create table if not exists public.sfida_board (
  sfida_id uuid not null references public.sfide_coppie(id) on delete cascade,
  mano_id uuid not null references public.mani_generate(id) on delete cascade,
  coppia text not null check (coppia in ('A','B')),
  numero int not null,
  sessione_id uuid not null references public.bidding_sessions(id) on delete cascade,
  -- Scritti dal server alla chiusura della licita, mai dal client.
  contratto text,
  dichiarante text,
  prese int,
  punteggio int,
  primary key (sfida_id, mano_id, coppia)
);

create index if not exists sfida_board_sessione_idx
  on public.sfida_board (sessione_id);

alter table public.sfida_board enable row level security;

-- Nessuna policy di scrittura: si passa dalle funzioni.
drop policy if exists "Le board delle mie sfide" on public.sfida_board;
create policy "Le board delle mie sfide" on public.sfida_board
  for select to authenticated
  using (exists (
    select 1 from public.sfide_coppie s
    where s.id = sfida_id and auth.uid() in (s.a1, s.a2, s.b1, s.b2)
  ));

/**
 * Crea la sfida: due coppie, N smazzate della scorta, due licite per ognuna.
 *
 * CHI PUÒ INVITARE CHI: il compagno dev'essere un amico. Gli avversari no —
 * al circolo si sfida anche chi si conosce appena, e chiedere l'amicizia
 * prima di poter giocare è un attrito che non serve a niente. Il vincolo che
 * conta è un altro: quattro persone diverse.
 */
create or replace function public.sfida_coppie_crea(
  p_compagno uuid, p_b1 uuid, p_b2 uuid, p_quante int default 4
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
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
    -- Nessuna mano in scorta: meglio niente sfida che una sfida vuota.
    DELETE FROM public.sfide_coppie WHERE id = v_id;
    RETURN NULL;
  END IF;

  RETURN v_id;
END $function$;

revoke execute on function public.sfida_coppie_crea(uuid, uuid, uuid, int) from public;
revoke execute on function public.sfida_coppie_crea(uuid, uuid, uuid, int) from anon;
grant execute on function public.sfida_coppie_crea(uuid, uuid, uuid, int) to authenticated;

/**
 * Registra il risultato di una board a licita chiusa.
 *
 * Ricava il contratto dalle dichiarazioni, il dichiarante con la regola vera
 * (il primo della linea vincente ad aver nominato quella denominazione), le
 * prese dalla tabella double dummy e il punteggio dalla tavola ufficiale.
 * Chiamarla due volte non cambia niente: si scrive solo se il posto è vuoto.
 */
create or replace function public.sfida_board_chiudi(p_sessione uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  -- Solo chi gioca quella sfida. La funzione non fa danni — il punteggio lo
  -- ricava comunque da sé — ma quello che RESTITUISCE è il contratto di quella
  -- board, e chi non c'entra non deve poterselo far dire.
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

  -- L'ultima DICHIARAZIONE, non l'ultima parola: dopo il contratto possono
  -- esserci contro e surcontro, che non sono contratti.
  -- `g(k)` e non `i`: una variabile dichiarata con lo stesso nome di una
  -- colonna manda in errore la funzione a tempo di esecuzione, non di
  -- creazione, e l'errore parla di «riferimento ambiguo».
  SELECT max(g.k) INTO i_ult
  FROM generate_series(0, jsonb_array_length(s.bids) - 1) AS g(k)
  WHERE s.bids ->> g.k ~ '^[1-7]';

  SELECT CASE WHEN bool_or(s.bids ->> g.k = 'XX') THEN 4
              WHEN bool_or(s.bids ->> g.k = 'X') THEN 2
              ELSE 1 END
  INTO v_doppio
  FROM generate_series(coalesce(i_ult, 0), jsonb_array_length(s.bids) - 1) AS g(k);

  IF i_ult IS NULL THEN
    -- Passo generale: zero, ed è un risultato come un altro.
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

  -- Il dichiarante è il primo della linea vincente ad aver nominato quella
  -- denominazione, non chi ha detto l'ultima parola.
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

  -- Il punteggio è sempre scritto dal punto di vista di Nord-Sud, che è la
  -- linea dei due amici: se dichiarano gli avversari, va contro di loro.
  IF v_linea = 'ew' THEN v_punti := -v_punti; END IF;

  v_etichetta := v_bid || repeat('X', CASE v_doppio WHEN 2 THEN 1 WHEN 4 THEN 2 ELSE 0 END);

  UPDATE public.sfida_board
  SET contratto = v_etichetta, dichiarante = v_chi, prese = v_prese, punteggio = v_punti
  WHERE sfida_id = b.sfida_id AND mano_id = b.mano_id AND coppia = b.coppia;

  RETURN jsonb_build_object('ok', true, 'contratto', v_etichetta,
                            'dichiarante', v_chi, 'prese', v_prese,
                            'punteggio', v_punti);
END $function$;

revoke execute on function public.sfida_board_chiudi(uuid) from public;
revoke execute on function public.sfida_board_chiudi(uuid) from anon;
grant execute on function public.sfida_board_chiudi(uuid) to authenticated;

/**
 * La sfida come la può vedere chi chiama.
 *
 * Della board che non hai ancora chiuso non esce NIENTE dell'altra coppia:
 * né contratto né punteggio. Sapere che gli avversari sono in manche prima di
 * dichiarare vale metà del lavoro, e un confronto ottenuto così non
 * misurerebbe più niente.
 */
create or replace function public.sfida_coppie_vista(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
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
      -- L'altra coppia si vede solo quando hai finito anche tu.
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
END $function$;

revoke execute on function public.sfida_coppie_vista(uuid) from public;
revoke execute on function public.sfida_coppie_vista(uuid) from anon;
grant execute on function public.sfida_coppie_vista(uuid) to authenticated;

/** Le mie sfide, con quante board mancano. */
create or replace function public.mie_sfide_coppie()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
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
$function$;

revoke execute on function public.mie_sfide_coppie() from public;
revoke execute on function public.mie_sfide_coppie() from anon;
grant execute on function public.mie_sfide_coppie() to authenticated;
