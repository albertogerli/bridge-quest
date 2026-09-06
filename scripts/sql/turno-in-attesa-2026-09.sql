-- ============================================================================
-- Il nono allievo: si aspetta a turno, e si sa quando tocca
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `turno-in-attesa-2026-09-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ SERVE, E PERCHÉ ADESSO
--
-- Nove allievi: due tavoli da quattro e uno fuori. Il numero dispari alla prima
-- serata è la norma, non l'eccezione.
--
-- Lasciarlo a guardare è brutto; dargli un tavolo di soli robot è peggio, ed è
-- più umiliante che stare a guardare. In circolo si fa così: si sta al tavolo
-- come quinto, in attesa, e si entra a turno. Vede le mani vere degli altri e
-- alla smazzata dopo gioca.
--
-- `seat_of` associa una persona a un POSTO — nord, sud, est, ovest — e «in
-- attesa» non è un posto: da qui le due colonne nuove.
--
-- ----------------------------------------------------------------------------
-- IL CRITERIO: ESCE CHI HA GIOCATO PIÙ MANI
--
-- Non «chi è entrato da più tempo». Sono la stessa cosa finché nessuno arriva o
-- se ne va, e diventano diverse esattamente nella sera vera, dove qualcuno
-- entra alla terza smazzata: contando le mani, chi è appena arrivato non salta
-- il turno di chi sta giocando da un'ora.
-- ============================================================================

begin;

alter table public.live_tables
  add column if not exists in_attesa jsonb not null default '[]'::jsonb,
  add column if not exists partecipazioni jsonb not null default '{}'::jsonb;

comment on column public.live_tables.in_attesa is
  'Chi aspetta il proprio turno a questo tavolo, in coda. Non e'' un posto: '
  '`seat_of` associa una persona a nord/sud/est/ovest, e «in attesa» non lo e''.';
comment on column public.live_tables.partecipazioni is
  'Quante mani ha giocato ciascuno a questo tavolo. Decide chi esce al giro '
  'successivo: esce chi ne ha giocate di piu''.';

-- ----------------------------------------------------------------------------
-- Mettersi in coda
--
-- Serve quando i quattro posti sono presi. Non toglie il posto a nessuno: si
-- aspetta, e la rotazione fa il resto.
-- ----------------------------------------------------------------------------
create or replace function public.aula_aspetta(p_tavolo_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_class uuid; v_coda jsonb; v_posti jsonb;
begin
  select class_id, coalesce(in_attesa,'[]'::jsonb), coalesce(seat_of,'{}'::jsonb)
    into v_class, v_coda, v_posti
    from public.live_tables where id = p_tavolo_id and closed_at is null for update;

  if v_class is null then return jsonb_build_object('esito','tavolo-chiuso'); end if;
  if not (public.is_member_of_class(v_class) or public.is_instructor_of_class(v_class))
    then return jsonb_build_object('esito','non-della-classe'); end if;

  -- Chi è già seduto non entra in coda: uscirebbe e rientrerebbe da solo.
  if v_posti ? auth.uid()::text then
    return jsonb_build_object('esito','sei-gia-seduto');
  end if;
  if v_coda @> to_jsonb(auth.uid()::text) then
    return jsonb_build_object('esito','gia-in-coda',
      'mancano', public.aula_mani_al_turno(p_tavolo_id, auth.uid()));
  end if;

  update public.live_tables
     set in_attesa = v_coda || to_jsonb(auth.uid()::text), updated_at = now()
   where id = p_tavolo_id;

  return jsonb_build_object('esito','in-coda',
    'mancano', public.aula_mani_al_turno(p_tavolo_id, auth.uid()));
end $$;

-- ----------------------------------------------------------------------------
-- Quante mani mancano al proprio turno
--
-- «In attesa» da solo non basta: la parte fastidiosa dell'aspettare è non
-- sapere quanto. A ogni mano entra il primo della coda, quindi mancano tante
-- mani quanta è la propria posizione.
-- ----------------------------------------------------------------------------
create or replace function public.aula_mani_al_turno(p_tavolo_id uuid, p_utente uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select (ord)::integer
       from jsonb_array_elements_text(coalesce(t.in_attesa,'[]'::jsonb)) with ordinality as e(val, ord)
      where e.val = p_utente::text
      limit 1),
    0)
  from public.live_tables t where t.id = p_tavolo_id;
$$;

-- ----------------------------------------------------------------------------
-- Chi uscirà al prossimo giro
--
-- Si dice PRIMA, non lo si scopre quando le carte non arrivano.
-- ----------------------------------------------------------------------------
create or replace function public.aula_prossimo_a_uscire(p_tavolo_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select s.key::uuid
    from public.live_tables t,
         jsonb_each_text(coalesce(t.seat_of,'{}'::jsonb)) s
   where t.id = p_tavolo_id
     and jsonb_array_length(coalesce(t.in_attesa,'[]'::jsonb)) > 0
   order by coalesce((t.partecipazioni ->> s.key)::int, 0) desc, s.key
   limit 1;
$$;

-- ----------------------------------------------------------------------------
-- Il giro: si conta la mano appena finita e si cambia chi deve cambiare
-- ----------------------------------------------------------------------------
create or replace function public.aula_ruota(p_tavolo_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class uuid; v_posti jsonb; v_coda jsonb; v_part jsonb;
  v_esce uuid; v_posto text; v_entra text;
begin
  select class_id, coalesce(seat_of,'{}'::jsonb), coalesce(in_attesa,'[]'::jsonb),
         coalesce(partecipazioni,'{}'::jsonb)
    into v_class, v_posti, v_coda, v_part
    from public.live_tables where id = p_tavolo_id and closed_at is null for update;

  if v_class is null then return jsonb_build_object('esito','tavolo-chiuso'); end if;
  if not public.is_instructor_of_class(v_class)
    then return jsonb_build_object('esito','non-sei-l-insegnante'); end if;

  -- La mano appena finita si conta per chi l'ha giocata, SEMPRE: anche senza
  -- nessuno in coda, altrimenti al primo che arriva il conteggio è già falso.
  select coalesce(jsonb_object_agg(s.key, coalesce((v_part ->> s.key)::int, 0) + 1), '{}'::jsonb)
    into v_part
    from jsonb_each_text(v_posti) s;
  v_part := coalesce(v_part, '{}'::jsonb);

  if jsonb_array_length(v_coda) = 0 then
    update public.live_tables set partecipazioni = v_part, updated_at = now() where id = p_tavolo_id;
    return jsonb_build_object('esito','nessuno-in-attesa');
  end if;

  v_esce := public.aula_prossimo_a_uscire(p_tavolo_id);
  v_posto := v_posti ->> v_esce::text;
  v_entra := v_coda ->> 0;

  v_posti := (v_posti - v_esce::text) || jsonb_build_object(v_entra, v_posto);
  -- Chi esce va in fondo alla coda: il giro continua invece di fermarsi.
  v_coda := (v_coda - 0) || to_jsonb(v_esce::text);

  update public.live_tables
     set seat_of = v_posti, in_attesa = v_coda, partecipazioni = v_part, updated_at = now()
   where id = p_tavolo_id;

  return jsonb_build_object('esito','ruotato', 'esce', v_esce, 'entra', v_entra, 'posto', v_posto);
end $$;

revoke all on function public.aula_aspetta(uuid) from public;
revoke all on function public.aula_ruota(uuid) from public;
grant execute on function public.aula_aspetta(uuid) to authenticated;
grant execute on function public.aula_ruota(uuid) to authenticated;
grant execute on function public.aula_mani_al_turno(uuid, uuid) to authenticated;
grant execute on function public.aula_prossimo_a_uscire(uuid) to authenticated;

commit;
