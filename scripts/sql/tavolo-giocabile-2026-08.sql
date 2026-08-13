-- ============================================================================
-- BridgeLab: al tavolo condiviso si gioca (live_tables.played)
-- ============================================================================
--
-- COSA CAMBIA
-- Finora il tavolo condiviso mostrava le mani. Ora le carte si giocano: ogni
-- allievo gioca il proprio posto, l'insegnante può giocare per chiunque —
-- serve quando un allievo non sa che fare o gli cade la connessione, ed è la
-- ragione per cui un tavolo didattico non è un tavolo da torneo.
--
-- COSA VIENE CONTROLLATO QUI E COSA NO
-- Nel database si controlla la sola cosa che, sbagliata, sarebbe un problema
-- di SICUREZZA: che la carta appartenga davvero a quel posto e non sia già
-- uscita. Le mani coperte non escono mai dal database (`live_table_view`), e
-- questa funzione non le espone: risponde sì o no, senza dire cosa c'è in
-- mano agli altri.
--
-- L'ORDINE DI TURNO invece si controlla nel browser, ed è una scelta.
-- Verificarlo qui richiederebbe di riscrivere in SQL chi vince una presa —
-- logica che nel progetto esiste già, testata, in `bridge-engine`. Duplicarla
-- in un secondo linguaggio significa due regole che prima o poi divergono.
-- E il rischio è diverso: un allievo che gioca fuori turno in aula è una
-- monelleria che l'insegnante vede e annulla con un pulsante, non una falla —
-- non può comunque giocare carte che non ha, né vedere quelle degli altri.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

alter table public.live_tables
  add column if not exists played jsonb not null default '[]'::jsonb;

-- Gioca una carta. `p_seat` lo può indicare solo l'insegnante: un allievo
-- gioca il proprio posto e basta.
create or replace function public.live_table_play(
  p_table_id uuid,
  p_seat text,
  p_card jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  t            public.live_tables%ROWTYPE;
  v_is_owner   boolean;
  v_my_seat    text;
  v_seat       text;
  v_in_mano    boolean;
  v_gia_uscita boolean;
BEGIN
  SELECT * INTO t FROM public.live_tables WHERE id = p_table_id FOR UPDATE;
  IF NOT FOUND OR t.closed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'errore', 'tavolo non disponibile');
  END IF;

  v_is_owner := (t.instructor_id = auth.uid());
  v_my_seat  := t.seat_of ->> auth.uid()::text;

  -- L'insegnante gioca per chiunque; l'allievo solo per sé.
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

  -- La carta deve essere in quella mano...
  SELECT EXISTS (
    SELECT 1 FROM jsonb_array_elements(t.hands -> v_seat) c
    WHERE c ->> 'suit' = p_card ->> 'suit' AND c ->> 'rank' = p_card ->> 'rank'
  ) INTO v_in_mano;

  -- ...e non deve essere già uscita.
  SELECT EXISTS (
    SELECT 1 FROM jsonb_array_elements(t.played) g
    WHERE g -> 'card' ->> 'suit' = p_card ->> 'suit'
      AND g -> 'card' ->> 'rank' = p_card ->> 'rank'
  ) INTO v_gia_uscita;

  IF NOT v_in_mano OR v_gia_uscita THEN
    -- Messaggio volutamente generico: distinguere «non ce l'hai» da «è già
    -- uscita» direbbe qualcosa sulle mani altrui a chi provasse a indovinare.
    RETURN jsonb_build_object('ok', false, 'errore', 'carta non giocabile');
  END IF;

  UPDATE public.live_tables
  SET played = played || jsonb_build_array(jsonb_build_object('seat', v_seat, 'card', p_card)),
      updated_at = now()
  WHERE id = p_table_id;

  RETURN jsonb_build_object('ok', true, 'seat', v_seat);
END
$function$;

comment on function public.live_table_play(uuid, text, jsonb) is
  'Gioca una carta al tavolo condiviso. L''insegnante per chiunque, l''allievo solo per il proprio posto.';

revoke execute on function public.live_table_play(uuid, text, jsonb) from public;
revoke execute on function public.live_table_play(uuid, text, jsonb) from anon;
grant execute on function public.live_table_play(uuid, text, jsonb) to authenticated;

-- Annulla l'ultima carta. Solo l'insegnante: in aula si torna indietro spesso,
-- ed è lui a decidere quando.
create or replace function public.live_table_undo(p_table_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE t public.live_tables%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.live_tables WHERE id = p_table_id FOR UPDATE;
  IF NOT FOUND OR t.instructor_id <> auth.uid() THEN RETURN false; END IF;

  UPDATE public.live_tables
  SET played = CASE
        WHEN jsonb_array_length(played) = 0 THEN played
        ELSE played - (jsonb_array_length(played) - 1)
      END,
      updated_at = now()
  WHERE id = p_table_id;
  RETURN true;
END
$function$;

revoke execute on function public.live_table_undo(uuid) from public;
revoke execute on function public.live_table_undo(uuid) from anon;
grant execute on function public.live_table_undo(uuid) to authenticated;

-- La vista ora toglie dalle mani le carte già uscite e restituisce il giocato.
-- Le carte giocate sono pubbliche per definizione: le ha viste tutto il tavolo.
create or replace function public.live_table_view(p_table_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
DECLARE
  t          public.live_tables%ROWTYPE;
  v_is_owner boolean;
  v_is_member boolean;
  v_seat     text;
  v_visible  text[];
  v_hands    jsonb := '{}'::jsonb;
  s          text;
  v_restanti jsonb;
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
      -- Le carte già giocate escono dalla mano: altrimenti la schermata
      -- mostrerebbe carte che non esistono più.
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
    'id',            t.id,
    'classId',       t.class_id,
    'titolo',        t.titolo,
    'hands',         v_hands,
    'played',        t.played,
    'revealed',      to_jsonb(t.revealed),
    'seat',          v_seat,
    'seatOf',        CASE WHEN v_is_owner THEN t.seat_of ELSE NULL END,
    'isInstructor',  v_is_owner,
    'contract',      CASE WHEN v_is_owner OR t.show_contract THEN t.contract END,
    'declarer',      CASE WHEN v_is_owner OR t.show_contract THEN t.declarer END,
    'showContract',  t.show_contract,
    'closed',        t.closed_at IS NOT NULL,
    'updatedAt',     t.updated_at
  );
END
$function$;

revoke execute on function public.live_table_view(uuid) from public;
revoke execute on function public.live_table_view(uuid) from anon;
grant execute on function public.live_table_view(uuid) to authenticated;
