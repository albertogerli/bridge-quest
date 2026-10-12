-- ============================================================================
-- Al tavolo condiviso le regole del gioco le controlla anche il server
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `gioco-regole-server-2026-10-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `tavolo-giocabile-2026-08.sql` (definisce `live_table_play`).
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- `live_table_play` controllava solo che la carta fosse nella mano del posto e
-- non fosse già uscita. Turno e obbligo di rispondere al seme li controllava
-- soltanto l'interfaccia: chi chiamava la funzione direttamente poteva giocare
-- fuori turno o non rispondere (rilevato rifacendo il tavolo dell'allievo,
-- feedback Trevissoi 4, ottobre 2026). E bastava una riga qualsiasi in
-- `class_members` — anche `pending` o `rejected` — per poter giocare.
--
-- Ora, per gli ALLIEVI:
--  - serve un'iscrizione attiva;
--  - si deve rispondere al seme se se ne hanno ancora carte;
--  - si gioca solo quando tocca a sé, se il tavolo ha un dichiarante (attacca
--    chi sta alla sua sinistra, poi chi vince la presa: la stessa regola di
--    `statoDelGioco` in src/lib/live-table.ts);
--  - a mano finita non si gioca più.
-- L'INSEGNANTE resta libero: al tavolo condiviso gioca anche per gli altri
-- posti, rifà le carte, mostra varianti.
--
-- I nuovi rifiuti sono parole che il client già traduce in frasi chiare.
-- ============================================================================

begin;

create or replace function public.live_table_play(p_table_id uuid, p_seat text, p_card jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  t public.live_tables%rowtype;
  v_is_owner boolean; v_my_seat text; v_seat text;
  v_in_mano boolean; v_gia_uscita boolean;
  v_giocate jsonb; v_n int; v_k int;
  v_attacco text; v_ha_seme boolean;
  v_contratto text; v_atout text; v_leader text; v_turno text;
  v_presa jsonb; v_vince jsonb; v_carta jsonb; i int; j int;
  posti constant text[] := array['north','east','south','west'];
  ranghi constant text[] := array['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
begin
  select * into t from public.live_tables where id = p_table_id for update;
  if not found or t.closed_at is not null then
    return jsonb_build_object('ok', false, 'errore', 'tavolo non disponibile');
  end if;

  v_is_owner := (t.instructor_id = auth.uid());
  v_my_seat  := t.seat_of ->> auth.uid()::text;
  v_seat := case when v_is_owner then coalesce(p_seat, v_my_seat) else v_my_seat end;

  if v_seat is null or v_seat <> all (posti) then
    return jsonb_build_object('ok', false, 'errore', 'nessun posto assegnato');
  end if;

  if not v_is_owner and not exists (
    select 1 from public.class_members m
    where m.class_id = t.class_id and m.student_id = auth.uid() and m.status = 'active'
  ) then
    return jsonb_build_object('ok', false, 'errore', 'non fai parte di questa classe');
  end if;

  select exists (
    select 1 from jsonb_array_elements(t.hands -> v_seat) c
    where c ->> 'suit' = p_card ->> 'suit' and c ->> 'rank' = p_card ->> 'rank'
  ) into v_in_mano;

  v_giocate := coalesce(t.played, '[]'::jsonb);
  select exists (
    select 1 from jsonb_array_elements(v_giocate) g
    where g -> 'card' ->> 'suit' = p_card ->> 'suit'
      and g -> 'card' ->> 'rank' = p_card ->> 'rank'
  ) into v_gia_uscita;

  if not v_in_mano or v_gia_uscita then
    return jsonb_build_object('ok', false, 'errore', 'carta non giocabile');
  end if;

  if not v_is_owner then
    v_n := jsonb_array_length(v_giocate);
    if v_n >= 52 then
      return jsonb_build_object('ok', false, 'errore', 'mano finita');
    end if;
    v_k := v_n % 4;

    -- Rispondere al seme: il seme d'attacco della presa in corso, se il posto
    -- ne ha ancora carte non giocate.
    if v_k > 0 then
      v_attacco := v_giocate -> (v_n - v_k) -> 'card' ->> 'suit';
      if p_card ->> 'suit' <> v_attacco then
        select exists (
          select 1 from jsonb_array_elements(t.hands -> v_seat) c
          where c ->> 'suit' = v_attacco
            and not exists (
              select 1 from jsonb_array_elements(v_giocate) g
              where g -> 'card' ->> 'suit' = c ->> 'suit' and g -> 'card' ->> 'rank' = c ->> 'rank'
            )
        ) into v_ha_seme;
        if v_ha_seme then
          return jsonb_build_object('ok', false, 'errore', 'devi rispondere al seme');
        end if;
      end if;
    end if;

    -- Il turno, solo se si sa chi dichiara: attacca chi gli sta a sinistra,
    -- poi chi vince ogni presa (con l'atout del contratto).
    if t.declarer = any (posti) then
      v_contratto := upper(regexp_replace(coalesce(t.contract, ''), '[\s️]', '', 'g'));
      v_contratto := regexp_replace(v_contratto, 'X{1,2}$', '');
      v_atout := case substr(v_contratto, 2)
        when 'S' then 'spade' when '♠' then 'spade'
        when 'H' then 'heart' when '♥' then 'heart'
        when 'D' then 'diamond' when '♦' then 'diamond'
        when 'C' then 'club' when '♣' then 'club'
        else null end;
      v_leader := posti[(array_position(posti, t.declarer) % 4) + 1];

      i := 0;
      while i + 4 <= v_n loop
        v_vince := v_giocate -> i;
        for j in 1..3 loop
          v_carta := v_giocate -> (i + j);
          if (v_carta -> 'card' ->> 'suit') = (v_vince -> 'card' ->> 'suit') then
            if array_position(ranghi, v_carta -> 'card' ->> 'rank') > array_position(ranghi, v_vince -> 'card' ->> 'rank') then
              v_vince := v_carta;
            end if;
          elsif v_atout is not null and (v_carta -> 'card' ->> 'suit') = v_atout then
            v_vince := v_carta;
          end if;
        end loop;
        v_leader := v_vince ->> 'seat';
        i := i + 4;
      end loop;

      v_turno := case when v_k = 0 then v_leader
        else posti[(array_position(posti, v_giocate -> (v_n - 1) ->> 'seat') % 4) + 1] end;
      if v_seat <> v_turno then
        return jsonb_build_object('ok', false, 'errore', 'non tocca a te', 'turno', v_turno);
      end if;
    end if;
  end if;

  update public.live_tables
  set played = v_giocate || jsonb_build_array(jsonb_build_object('seat', v_seat, 'card', p_card)),
      updated_at = now()
  where id = p_table_id;

  return jsonb_build_object('ok', true, 'seat', v_seat);
end
$function$;

insert into public.script_applicati (nome) values ('gioco-regole-server-2026-10.sql')
on conflict (nome) do nothing;

commit;
