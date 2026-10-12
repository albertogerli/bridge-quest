-- ============================================================================
-- L'allievo non cambia posto da solo
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `posto-fisso-2026-10-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `posti-liberi-2026-10.sql` (riscrive `aula_siediti`).
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Feedback Trevissoi del 12/10/2026, punto 3.4: un allievo si siede, vede le
-- sue carte, poi si siede in un altro posto e vede quelle di un avversario o
-- del compagno. `aula_siediti` lo permetteva: «chi si sposta lascia libero il
-- posto di prima». Al bridge è barare, e in aula lo fa chiunque per curiosità.
--
-- Da qui: l'allievo sceglie il posto UNA volta per tavolo. Rifare la stessa
-- scelta va bene (un doppio tocco non è un errore); cambiarla no — risponde
-- `posto-gia-scelto`. A spostarlo resta l'insegnante, con `aula_muovi`, che
-- già scambia e sostituisce. L'insegnante stesso continua a sedersi dove vuole.
-- ============================================================================

begin;

create or replace function public.aula_siediti(p_tavolo_id uuid, p_posto text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_class uuid;
  v_posti jsonb;
  v_occupante uuid;
  v_nome text;
  v_mio text;
begin
  if p_posto not in ('north', 'south', 'east', 'west') then
    return jsonb_build_object('esito', 'posto-inesistente');
  end if;

  select class_id, coalesce(seat_of, '{}'::jsonb)
    into v_class, v_posti
    from public.live_tables
   where id = p_tavolo_id and closed_at is null
     for update;

  if v_class is null then
    return jsonb_build_object('esito', 'tavolo-chiuso');
  end if;

  -- Solo chi è iscritto a quella classe, o chi la insegna.
  if not (public.is_member_of_class(v_class) or public.is_instructor_of_class(v_class)) then
    return jsonb_build_object('esito', 'non-della-classe');
  end if;

  -- Posti decisi dall'insegnante: l'allievo non si siede da solo.
  if not public.is_instructor_of_class(v_class)
     and not coalesce((select posti_liberi from public.classes where id = v_class), true) then
    return jsonb_build_object('esito', 'posti-dall-insegnante');
  end if;

  -- Il posto si sceglie una volta: cambiarlo vorrebbe dire vedere le carte di
  -- un altro posto. Rifare la stessa scelta è innocuo.
  v_mio := v_posti ->> auth.uid()::text;
  if v_mio is not null and not public.is_instructor_of_class(v_class) then
    if v_mio = p_posto then
      return jsonb_build_object('esito', 'seduto', 'posto', p_posto);
    end if;
    return jsonb_build_object('esito', 'posto-gia-scelto', 'posto', v_mio);
  end if;

  select key::uuid into v_occupante
    from jsonb_each_text(v_posti)
   where value = p_posto
   limit 1;

  if v_occupante is not null and v_occupante <> auth.uid() then
    select display_name into v_nome from public.profiles where id = v_occupante;
    return jsonb_build_object('esito', 'occupato', 'da', coalesce(v_nome, 'un compagno'));
  end if;

  -- (Solo l'insegnante arriva qui già seduto.) Chi si sposta lascia libero il
  -- posto di prima: senza, resterebbe seduto in due punti.
  v_posti := (
    select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each_text(v_posti)
     where key <> auth.uid()::text
  );
  v_posti := v_posti || jsonb_build_object(auth.uid()::text, p_posto);

  update public.live_tables
     set seat_of = v_posti, updated_at = now()
   where id = p_tavolo_id;

  return jsonb_build_object('esito', 'seduto', 'posto', p_posto);
end $function$;

revoke all on function public.aula_siediti(uuid, text) from public, anon;
grant execute on function public.aula_siediti(uuid, text) to authenticated;

insert into public.script_applicati (nome) values ('posto-fisso-2026-10.sql')
on conflict (nome) do nothing;

commit;
