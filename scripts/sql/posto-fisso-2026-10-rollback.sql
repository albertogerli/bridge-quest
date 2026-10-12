-- Rollback di `posto-fisso-2026-10.sql`: torna la versione di
-- `posti-liberi-2026-10.sql`, in cui l'allievo può cambiare posto da solo
-- (e quindi vedere le carte di un altro posto).

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
begin
  if p_posto not in ('north', 'south', 'east', 'west') then
    return jsonb_build_object('esito', 'posto-inesistente');
  end if;
  select class_id, coalesce(seat_of, '{}'::jsonb) into v_class, v_posti
    from public.live_tables where id = p_tavolo_id and closed_at is null for update;
  if v_class is null then
    return jsonb_build_object('esito', 'tavolo-chiuso');
  end if;
  if not (public.is_member_of_class(v_class) or public.is_instructor_of_class(v_class)) then
    return jsonb_build_object('esito', 'non-della-classe');
  end if;
  if not public.is_instructor_of_class(v_class)
     and not coalesce((select posti_liberi from public.classes where id = v_class), true) then
    return jsonb_build_object('esito', 'posti-dall-insegnante');
  end if;
  select key::uuid into v_occupante from jsonb_each_text(v_posti) where value = p_posto limit 1;
  if v_occupante is not null and v_occupante <> auth.uid() then
    select display_name into v_nome from public.profiles where id = v_occupante;
    return jsonb_build_object('esito', 'occupato', 'da', coalesce(v_nome, 'un compagno'));
  end if;
  v_posti := (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
                from jsonb_each_text(v_posti) where key <> auth.uid()::text);
  v_posti := v_posti || jsonb_build_object(auth.uid()::text, p_posto);
  update public.live_tables set seat_of = v_posti, updated_at = now() where id = p_tavolo_id;
  return jsonb_build_object('esito', 'seduto', 'posto', p_posto);
end $function$;

delete from public.script_applicati where nome = 'posto-fisso-2026-10.sql';

commit;
