-- ============================================================================
-- BridgeLab: licita con un amico, avversari BEN (bidding_sessions)
-- ============================================================================
--
-- COSA FA
-- Due amici dichiarano insieme una smazzata: uno è Sud, l'altro Nord, e agli
-- avversari pensa la rete neurale. Ognuno vede SOLO la propria mano, come al
-- tavolo, e dichiara quando può — non serve essere collegati nello stesso
-- momento. È il modello di Cuebids, ed è quello giusto per il nostro pubblico:
-- chiedere a due persone di trovarsi online insieme è già metà della
-- rinuncia.
--
-- IL TURNO SI CONTROLLA QUI, e stavolta si può.
-- Al tavolo giocabile l'ordine di turno è rimasto nel browser perché avrebbe
-- richiesto di riscrivere in SQL chi vince una presa. In licita no: le
-- dichiarazioni girano in un ordine fisso a partire dal mazziere, quindi il
-- turno è una divisione con resto. Dove il controllo costa poco, va messo nel
-- posto che non si può aggirare.
--
-- LE MANI ALTRUI NON ESCONO finché la licita è aperta, nemmeno quella del
-- compagno: vedere la mano del compagno annullerebbe l'esercizio, che è
-- proprio intendersi senza vederla. A licita chiusa si aprono tutte, perché
-- serve a capire com'è andata.
--
-- GLI AVVERSARI LI FA DICHIARARE IL SERVER, e non è un dettaglio.
-- Il primo disegno li faceva calcolare al browser di chi aveva appena
-- parlato. Non poteva funzionare: il browser NON HA le mani di Est e Ovest,
-- ed è esattamente il punto — se le avesse, i due amici potrebbero leggerle e
-- la licita non varrebbe niente. Avrebbe chiesto a BEN di dichiarare con una
-- mano vuota, ottenendo risposte a caso senza che nulla lo segnalasse.
-- La dichiarazione dell'avversario passa quindi da `/api/licita/avversario`:
-- il server legge la mano, la manda a BEN e scrive il risultato con
-- `bidding_session_bid_server`, eseguibile SOLO da service_role. Al browser
-- torna cosa hanno detto, mai cosa hanno in mano.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

create table if not exists public.bidding_sessions (
  id uuid primary key default gen_random_uuid(),
  -- Chi apre siede a Sud, l'invitato a Nord.
  south_id uuid not null references public.profiles(id) on delete cascade,
  north_id uuid not null references public.profiles(id) on delete cascade,
  hands jsonb not null,
  dealer text not null default 'south'
    check (dealer in ('north','east','south','west')),
  vulnerability text not null default 'none',
  -- Le dichiarazioni in ordine, dal mazziere: ["1♠","P","2♠","P",…]
  bids jsonb not null default '[]'::jsonb,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  check (south_id <> north_id)
);

create index if not exists bidding_sessions_players_idx
  on public.bidding_sessions (south_id, created_at desc);
create index if not exists bidding_sessions_north_idx
  on public.bidding_sessions (north_id, created_at desc);

alter table public.bidding_sessions enable row level security;

-- NESSUNA policy: sulla tabella non si legge né si scrive direttamente.
-- `hands` contiene tutte e quattro le mani e con una policy di lettura
-- uscirebbe intera; e senza lettura nemmeno un `insert().select()` funziona,
-- perché per restituire l'id servirebbe comunque il permesso di SELECT.
-- Tutto passa dalle funzioni qui sotto, che filtrano prima di rispondere.

/**
 * Apre una licita con un amico.
 *
 * Solo con un AMICO: la licita a due è fra persone che si conoscono, non un
 * modo per recapitare mani a sconosciuti.
 */
create or replace function public.bidding_session_create(
  p_partner uuid, p_hands jsonb, p_dealer text default 'south'
)
returns uuid
language plpgsql security definer set search_path to 'public'
as $function$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_partner IS NULL OR p_partner = auth.uid() THEN
    RETURN NULL;
  END IF;
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
END $function$;

revoke execute on function public.bidding_session_create(uuid, jsonb, text) from public;
revoke execute on function public.bidding_session_create(uuid, jsonb, text) from anon;
grant execute on function public.bidding_session_create(uuid, jsonb, text) to authenticated;

/**
 * La sessione come la può vedere chi chiama: la propria mano, le
 * dichiarazioni, di chi è il turno. Le altre mani solo a licita chiusa.
 */
create or replace function public.bidding_session_view(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
DECLARE
  s        public.bidding_sessions%ROWTYPE;
  v_seat   text;
  v_chiusa boolean;
  v_turno  text;
  v_hands  jsonb;
  ordine   text[] := ARRAY['north','east','south','west'];
  i_dealer int;
BEGIN
  SELECT * INTO s FROM public.bidding_sessions WHERE id = p_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_seat := CASE
    WHEN s.south_id = auth.uid() THEN 'south'
    WHEN s.north_id = auth.uid() THEN 'north'
    ELSE NULL END;
  IF v_seat IS NULL THEN RETURN NULL; END IF;

  v_chiusa := s.closed_at IS NOT NULL;

  -- Turno: l'ordine è fisso a partire dal mazziere.
  i_dealer := array_position(ordine, s.dealer);
  v_turno := ordine[((i_dealer - 1 + jsonb_array_length(s.bids)) % 4) + 1];

  IF v_chiusa THEN
    v_hands := s.hands;
  ELSE
    -- Solo la propria: vedere quella del compagno annullerebbe l'esercizio.
    v_hands := jsonb_build_object(v_seat, s.hands -> v_seat);
  END IF;

  RETURN jsonb_build_object(
    'id',      s.id,
    'seat',    v_seat,
    'hands',   v_hands,
    'bids',    s.bids,
    'dealer',  s.dealer,
    'turno',   v_turno,
    'chiusa',  v_chiusa,
    'createdAt', s.created_at
  );
END
$function$;

revoke execute on function public.bidding_session_view(uuid) from public;
revoke execute on function public.bidding_session_view(uuid) from anon;
grant execute on function public.bidding_session_view(uuid) to authenticated;

/**
 * Aggiunge una dichiarazione, verificando che sia davvero il turno di quel
 * posto. Chiude la licita a tre passi dopo un contratto, o a quattro passi.
 */
create or replace function public.bidding_session_bid(p_id uuid, p_bid text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  s       public.bidding_sessions%ROWTYPE;
  v_seat  text;
  v_turno text;
  ordine  text[] := ARRAY['north','east','south','west'];
  i_dealer int;
  n        int;
  nuove    jsonb;
  ultimo_contratto int;
BEGIN
  SELECT * INTO s FROM public.bidding_sessions WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR s.closed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'sessione non disponibile');
  END IF;

  v_seat := CASE
    WHEN s.south_id = auth.uid() THEN 'south'
    WHEN s.north_id = auth.uid() THEN 'north'
    ELSE NULL END;
  IF v_seat IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'non fai parte di questa licita');
  END IF;

  n := jsonb_array_length(s.bids);
  i_dealer := array_position(ordine, s.dealer);
  v_turno := ordine[((i_dealer - 1 + n) % 4) + 1];

  -- Si dichiara SOLO per il proprio posto: gli avversari li scrive il server,
  -- che è l'unico ad avere le loro mani.
  IF v_turno <> v_seat THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'non è il tuo turno');
  END IF;

  nuove := s.bids || to_jsonb(p_bid);

  -- Chiusura: tre passi dopo un contratto, o quattro passi in tutto.
  SELECT max(i) INTO ultimo_contratto
  FROM generate_series(0, jsonb_array_length(nuove) - 1) i
  WHERE nuove ->> i <> 'P';

  UPDATE public.bidding_sessions
  SET bids = nuove,
      closed_at = CASE
        WHEN ultimo_contratto IS NULL AND jsonb_array_length(nuove) >= 4 THEN now()
        WHEN ultimo_contratto IS NOT NULL
             AND jsonb_array_length(nuove) - ultimo_contratto - 1 >= 3 THEN now()
        ELSE NULL END
  WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'turno', v_turno);
END
$function$;

revoke execute on function public.bidding_session_bid(uuid, text) from public;
revoke execute on function public.bidding_session_bid(uuid, text) from anon;
grant execute on function public.bidding_session_bid(uuid, text) to authenticated;

/** Le licite in cui compaio, per l'elenco «tocca a te». */
create or replace function public.my_bidding_sessions()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', x.id,
    'seat', x.seat,
    'bids', x.bids,
    'dealer', x.dealer,
    'chiusa', x.closed_at IS NOT NULL,
    'compagno', x.compagno,
    'createdAt', x.created_at
  ) ORDER BY x.created_at DESC), '[]'::jsonb)
  FROM (
    SELECT s.id, s.bids, s.dealer, s.closed_at, s.created_at,
           CASE WHEN s.south_id = auth.uid() THEN 'south' ELSE 'north' END AS seat,
           (SELECT p.display_name FROM public.profiles p
             WHERE p.id = CASE WHEN s.south_id = auth.uid() THEN s.north_id ELSE s.south_id END) AS compagno
    FROM public.bidding_sessions s
    WHERE s.south_id = auth.uid() OR s.north_id = auth.uid()
    ORDER BY s.created_at DESC
    LIMIT 30
  ) x;
$function$;

revoke execute on function public.my_bidding_sessions() from public;
revoke execute on function public.my_bidding_sessions() from anon;
grant execute on function public.my_bidding_sessions() to authenticated;

/**
 * La dichiarazione di un avversario, scritta dal server.
 *
 * Eseguibile solo da `service_role`, cioè solo da `/api/licita/avversario`,
 * che ha già verificato con la sessione del chiamante che faccia parte della
 * licita. E non può dichiarare per i due amici: se il turno è loro, rifiuta.
 */
create or replace function public.bidding_session_bid_server(p_id uuid, p_bid text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
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
END $function$;

revoke execute on function public.bidding_session_bid_server(uuid, text) from public;
revoke execute on function public.bidding_session_bid_server(uuid, text) from anon;
revoke execute on function public.bidding_session_bid_server(uuid, text) from authenticated;
grant execute on function public.bidding_session_bid_server(uuid, text) to service_role;
