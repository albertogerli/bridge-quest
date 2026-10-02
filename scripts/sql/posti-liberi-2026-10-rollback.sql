-- Rollback di `posti-liberi-2026-10.sql`. ESEGUIRE A MANO su Supabase → SQL Editor.
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
begin;

create or replace function public.aula_siediti(p_tavolo_id uuid, p_posto text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class uuid;
  v_posti jsonb;
  v_occupante uuid;
  v_nome text;
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

  select key::uuid into v_occupante
    from jsonb_each_text(v_posti)
   where value = p_posto
   limit 1;

  if v_occupante is not null and v_occupante <> auth.uid() then
    select display_name into v_nome from public.profiles where id = v_occupante;
    return jsonb_build_object('esito', 'occupato', 'da', coalesce(v_nome, 'un compagno'));
  end if;

  -- Chi si sposta lascia libero il posto di prima: senza, resterebbe seduto in
  -- due punti e il tavolo mostrerebbe cinque persone su quattro sedie.
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
end $$;

revoke all on function public.aula_siediti(uuid, text) from public;
grant execute on function public.aula_siediti(uuid, text) to authenticated;

alter table public.classes drop column if exists posti_liberi;

delete from public.script_applicati where nome = 'posti-liberi-2026-10.sql';

commit;
