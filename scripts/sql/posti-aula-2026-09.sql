-- ============================================================================
-- Ci si siede dove si vuole, e nessuno perde il posto
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `posti-aula-2026-09-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- NESSUNA TABELLA E NESSUNA COLONNA cambiano: solo due funzioni nuove. Il
-- rollback è quindi davvero simmetrico, per una volta.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ NON BASTAVA QUELLO CHE C'ERA
--
-- I posti stanno in `live_tables.seat_of`, una mappa da persona a posto, e
-- l'unico modo di scriverla era RISCRIVERLA TUTTA. In una sala dove venti
-- persone entrano insieme, due che toccano lo stesso posto nello stesso istante
-- non è il caso raro: è la sera normale. Con la riscrittura totale il secondo
-- sovrascrive il primo, e il primo perde il posto SENZA UN ERRORE — si accorge
-- di essere altrove solo quando arrivano le carte.
--
-- L'atomicità deve stare qui, non nel browser: due browser non si parlano.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1 · L'allievo si siede
--
-- Restituisce cosa è successo, non un errore: chi arriva secondo deve CAPIRE,
-- non vedere un guasto. «Quel posto l'ha appena preso Maria» è
-- un'informazione; «errore 409» è una cosa che fa chiamare l'insegnante.
--
-- `for update` blocca la riga per il tempo della decisione: senza, due
-- richieste simultanee leggerebbero entrambe il posto libero.
-- ----------------------------------------------------------------------------
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

comment on function public.aula_siediti(uuid, text) is
  'L''allievo prende un posto libero. Atomica: due richieste simultanee sullo '
  'stesso posto non si sovrascrivono, e la seconda riceve «occupato» con il '
  'nome di chi c''e'' — un''informazione, non un errore.';

-- ----------------------------------------------------------------------------
-- 2 · L'insegnante sposta qualcuno
--
-- SOSTITUZIONE E SCAMBIO SONO LA STESSA COSA: «questo posto adesso lo occupa
-- quest'altra persona». Se il posto è libero è una sostituzione; se è occupato
-- i due si scambiano, che è quello che l'insegnante intende quando sposta
-- qualcuno su una sedia già presa — Trevissoi cura gli accoppiamenti per età e
-- carattere, e «dopo un po' ti rendi conto che ci sono delle piccole
-- incompatibilità».
--
-- Non c'è nessun controllo sul momento: lo scambio a metà mano cambierebbe
-- proprietario alle carte in mano, e quella regola sta nell'interfaccia, che
-- offre lo spostamento solo a mano finita. Qui si controlla CHI, non QUANDO.
-- ----------------------------------------------------------------------------
create or replace function public.aula_muovi(p_tavolo_id uuid, p_utente uuid, p_posto text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class uuid;
  v_posti jsonb;
  v_altro uuid;
  v_posto_di_chi_muovo text;
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
  if not public.is_instructor_of_class(v_class) then
    return jsonb_build_object('esito', 'non-sei-l-insegnante');
  end if;

  v_posto_di_chi_muovo := v_posti ->> p_utente::text;

  select key::uuid into v_altro
    from jsonb_each_text(v_posti)
   where value = p_posto and key <> p_utente::text
   limit 1;

  v_posti := v_posti || jsonb_build_object(p_utente::text, p_posto);

  if v_altro is not null then
    if v_posto_di_chi_muovo is not null then
      -- Scambio: l'altro prende il posto che si è liberato.
      v_posti := v_posti || jsonb_build_object(v_altro::text, v_posto_di_chi_muovo);
    else
      -- Sostituzione: chi c'era esce dal tavolo, non resta senza sedia.
      v_posti := v_posti - v_altro::text;
    end if;
  end if;

  update public.live_tables
     set seat_of = v_posti, updated_at = now()
   where id = p_tavolo_id;

  return jsonb_build_object(
    'esito', case when v_altro is null then 'spostato'
                  when v_posto_di_chi_muovo is not null then 'scambiati'
                  else 'sostituito' end);
end $$;

revoke all on function public.aula_muovi(uuid, uuid, text) from public;
grant execute on function public.aula_muovi(uuid, uuid, text) to authenticated;

comment on function public.aula_muovi(uuid, uuid, text) is
  'L''insegnante mette una persona su un posto. Se il posto e'' occupato i due '
  'si scambiano, oppure chi c''era esce se chi arriva non era seduto: '
  'sostituzione e scambio sono la stessa operazione.';

commit;

-- ============================================================================
-- VERIFICA
--
--   select public.aula_siediti('<tavolo>', 'north');   -- {"esito":"seduto"}
--   -- da un altro utente, stesso posto:               -- {"esito":"occupato","da":"..."}
--
-- Poi: node scripts/dump-schema.mjs e committare 000-schema-baseline.sql
-- ============================================================================
