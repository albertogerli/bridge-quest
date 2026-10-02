-- ============================================================================
-- Posti liberi o decisi dall'insegnante
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `posti-liberi-2026-10-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
-- Dipende da: `posti-aula-2026-09.sql` (riscrive `aula_siediti`).
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Trevissoi (feedback del 2 ottobre 2026): l'insegnante deve poter scegliere
-- se gli allievi si siedono dove vogliono o se i posti li decide lui. Cura gli
-- accoppiamenti per età e carattere, e con i posti liberi si siedono vicino
-- agli amici. Una colonna sulla classe; `aula_siediti` la rispetta, l'insegnante
-- continua a spostare chiunque con `aula_muovi`.
-- ============================================================================

begin;

alter table public.classes
  add column if not exists posti_liberi boolean not null default true;

comment on column public.classes.posti_liberi is
  'true: gli allievi si siedono da soli al tavolo; false: i posti li assegna l''insegnante.';

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

  -- Posti decisi dall'insegnante: l'allievo non si siede da solo.
  if not public.is_instructor_of_class(v_class)
     and not coalesce((select posti_liberi from public.classes where id = v_class), true) then
    return jsonb_build_object('esito', 'posti-dall-insegnante');
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

insert into public.script_applicati (nome) values ('posti-liberi-2026-10.sql')
on conflict (nome) do nothing;

commit;
