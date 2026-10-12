-- Rollback di `gioco-regole-server-2026-10.sql`: torna la versione che
-- controllava solo carta in mano e carta già uscita (turno e seme solo
-- nell'interfaccia, e iscrizione di qualunque stato).

begin;

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
$function$;

delete from public.script_applicati where nome = 'gioco-regole-server-2026-10.sql';

commit;
