-- ============================================================================
-- BridgeLab: tornei di licita — giornaliero (8 mani) e settimanale (24)
-- ============================================================================
--
-- COSA SONO
-- Le stesse smazzate per tutti, nello stesso periodo, con una classifica. È la
-- cosa che le mani condivise rendevano possibile fin dall'inizio: senza mani
-- uguali per tutti una classifica non significa niente, perché ognuno avrebbe
-- avuto carte diverse.
--
-- Otto mani al giorno e ventiquattro alla settimana sono numeri di licita, non
-- di gioco della carta: una licita dura mezzo minuto, una mano giocata dieci.
-- Il torneo settimanale di gioco che esiste già (cinque mani, `/gioca/torneo`)
-- resta dov'è: sono due esercizi diversi.
--
-- LE MANI SI SCELGONO UNA VOLTA E RESTANO. Il torneo del giorno nasce alla
-- prima apertura e da quel momento le sue otto mani sono fissate: se le
-- scegliesse ogni volta a caso, due giocatori dello stesso giorno avrebbero
-- carte diverse e la classifica sarebbe una finzione.
--
-- E NON SI INCONTRANO PRIMA IN ALLENAMENTO. Le mani impegnate in un torneo
-- aperto escono da `mano_da_fare`: chi si allena molto avrebbe altrimenti un
-- vantaggio, e sarebbe pure il più penalizzato dal saperlo.
--
-- LA CLASSIFICA È IN STELLE, non in punti. I punti di bridge dipendono dalla
-- forza delle carte — otto mani da slam valgono più di otto parziali — mentre
-- le stelle misurano quanto bene hai dichiarato QUELLA mano, che è la cosa che
-- il torneo vuole premiare.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

create table if not exists public.tornei (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('giornaliero', 'settimanale')),
  /** Giorno (AAAAMMGG) o numero di settimana: identifica il periodo. */
  periodo integer not null,
  apre_at timestamptz not null,
  chiude_at timestamptz not null,
  creato_at timestamptz not null default now(),
  unique (tipo, periodo)
);

create index if not exists tornei_aperti_idx on public.tornei (chiude_at desc);

alter table public.tornei enable row level security;

drop policy if exists "Tornei leggibili" on public.tornei;
create policy "Tornei leggibili" on public.tornei for select to authenticated using (true);

-- ── Le mani di un torneo, in ordine ─────────────────────────────────────────
create table if not exists public.torneo_mani (
  torneo_id uuid not null references public.tornei(id) on delete cascade,
  numero integer not null,
  mano_id uuid not null references public.mani_generate(id) on delete cascade,
  primary key (torneo_id, numero),
  unique (torneo_id, mano_id)
);

create index if not exists torneo_mani_mano_idx on public.torneo_mani (mano_id);

alter table public.torneo_mani enable row level security;

-- Leggibili: servono a giocare. Le CARTE però passano da `torneo_mano`, che
-- consegna una mano per volta — vedi sotto.
drop policy if exists "Mani del torneo leggibili" on public.torneo_mani;
create policy "Mani del torneo leggibili" on public.torneo_mani
  for select to authenticated using (true);

-- ── I risultati ─────────────────────────────────────────────────────────────
create table if not exists public.risultati_torneo (
  torneo_id uuid not null references public.tornei(id) on delete cascade,
  mano_id uuid not null references public.mani_generate(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  contratto text,
  dichiarante text,
  punteggio integer not null,
  stelle numeric(2,1) not null
    check (stelle >= 0 and stelle <= 3 and (stelle * 2) = floor(stelle * 2)),
  created_at timestamptz not null default now(),
  -- Una mano si dichiara una volta sola, come nell'allenamento.
  primary key (torneo_id, mano_id, user_id)
);

create index if not exists risultati_torneo_classifica_idx
  on public.risultati_torneo (torneo_id, user_id);

alter table public.risultati_torneo enable row level security;

drop policy if exists "Risultati del torneo leggibili" on public.risultati_torneo;
create policy "Risultati del torneo leggibili" on public.risultati_torneo
  for select to authenticated using (true);

drop policy if exists "Ognuno scrive il proprio risultato di torneo" on public.risultati_torneo;
create policy "Ognuno scrive il proprio risultato di torneo" on public.risultati_torneo
  for insert to authenticated with check (user_id = auth.uid());

/**
 * Il torneo del periodo corrente, creandolo se non c'è.
 *
 * PERCHÉ LO CREA CHI ARRIVA PRIMO e non un lavoro pianificato: un cron in più
 * è una cosa in più che può non partire, e un torneo che non esiste perché il
 * cron è morto alle tre di notte è un guasto che nessuno vede fino al mattino.
 * Così il primo che apre la pagina lo fa nascere, e per tutti gli altri esiste
 * già.
 *
 * LE MANI SI SCELGONO CON UN ORDINE CASUALE ma vengono SCRITTE: da quel
 * momento sono quelle, per chiunque. Si escludono le mani già usate in altri
 * tornei — un torneo non deve ripetere una smazzata che qualcuno ha già visto
 * in classifica.
 */
create or replace function public.torneo_corrente(p_tipo text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_periodo int;
  v_apre timestamptz;
  v_chiude timestamptz;
  v_quante int;
  v_id uuid;
  v_oggi date := (now() AT TIME ZONE 'Europe/Rome')::date;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;

  IF p_tipo = 'giornaliero' THEN
    v_periodo := to_char(v_oggi, 'YYYYMMDD')::int;
    v_apre := v_oggi::timestamp AT TIME ZONE 'Europe/Rome';
    v_chiude := v_apre + interval '1 day';
    v_quante := 8;
  ELSIF p_tipo = 'settimanale' THEN
    -- Settimana ISO: comincia di lunedì, come il torneo di gioco.
    v_periodo := to_char(v_oggi, 'IYYYIW')::int;
    v_apre := (date_trunc('week', v_oggi::timestamp)) AT TIME ZONE 'Europe/Rome';
    v_chiude := v_apre + interval '7 days';
    v_quante := 24;
  ELSE
    RETURN NULL;
  END IF;

  SELECT id INTO v_id FROM public.tornei WHERE tipo = p_tipo AND periodo = v_periodo;

  IF v_id IS NULL THEN
    INSERT INTO public.tornei (tipo, periodo, apre_at, chiude_at)
    VALUES (p_tipo, v_periodo, v_apre, v_chiude)
    ON CONFLICT (tipo, periodo) DO NOTHING
    RETURNING id INTO v_id;

    -- Due persone possono arrivare nello stesso istante: chi perde la corsa
    -- rilegge quello che ha creato l'altro invece di crearne un secondo.
    IF v_id IS NULL THEN
      SELECT id INTO v_id FROM public.tornei WHERE tipo = p_tipo AND periodo = v_periodo;
    ELSE
      INSERT INTO public.torneo_mani (torneo_id, numero, mano_id)
      SELECT v_id, row_number() OVER (), m.id
      FROM (
        SELECT id FROM public.mani_generate
        WHERE distribuzioni IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.torneo_mani tm WHERE tm.mano_id = mani_generate.id)
        ORDER BY random()
        LIMIT v_quante
      ) m;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'id', v_id,
    'tipo', p_tipo,
    'periodo', v_periodo,
    'chiudeAt', v_chiude,
    'quante', (SELECT count(*) FROM public.torneo_mani WHERE torneo_id = v_id),
    'fatte', (
      SELECT count(*) FROM public.risultati_torneo r
      WHERE r.torneo_id = v_id AND r.user_id = auth.uid()
    )
  );
END $function$;

revoke execute on function public.torneo_corrente(text) from public;
revoke execute on function public.torneo_corrente(text) from anon;
grant execute on function public.torneo_corrente(text) to authenticated;

/**
 * La prossima mano da dichiarare in un torneo: una per volta, in ordine.
 *
 * UNA PER VOLTA a posta. Consegnarle tutte insieme vorrebbe dire mandare al
 * browser le quattro mani di otto smazzate: chiunque guardi la risposta di
 * rete vedrebbe le carte degli avversari di tutto il torneo.
 */
create or replace function public.torneo_mano(p_torneo uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE (
    SELECT to_jsonb(m) || jsonb_build_object('numero', tm.numero)
    FROM public.torneo_mani tm
    JOIN public.mani_generate m ON m.id = tm.mano_id
    WHERE tm.torneo_id = p_torneo
      AND NOT EXISTS (
        SELECT 1 FROM public.risultati_torneo r
        WHERE r.torneo_id = p_torneo AND r.mano_id = tm.mano_id AND r.user_id = auth.uid()
      )
      AND EXISTS (SELECT 1 FROM public.tornei t WHERE t.id = p_torneo AND now() < t.chiude_at)
    ORDER BY tm.numero
    LIMIT 1
  ) END;
$function$;

revoke execute on function public.torneo_mano(uuid) from public;
revoke execute on function public.torneo_mano(uuid) from anon;
grant execute on function public.torneo_mano(uuid) to authenticated;

/**
 * La classifica: stelle totali, e a parità chi ha finito prima.
 *
 * CHI HA GIOCATO MENO MANI STA SOTTO chi le ha giocate tutte, anche a parità di
 * media: un torneo si vince finendolo. Le mani non giocate valgono zero, il
 * che è severo ma è l'unica regola che non premia chi si ferma appena è in
 * vantaggio.
 */
create or replace function public.classifica_torneo(p_torneo uuid, p_quanti int default 50)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object(
    'totale', (SELECT count(DISTINCT user_id) FROM public.risultati_torneo WHERE torneo_id = p_torneo),
    'mia', (
      SELECT jsonb_build_object(
        'posizione', x.posizione, 'stelle', x.stelle, 'mani', x.mani)
      FROM (
        SELECT r.user_id,
               rank() OVER (ORDER BY sum(r.stelle) DESC, max(r.created_at)) AS posizione,
               sum(r.stelle) AS stelle, count(*) AS mani
        FROM public.risultati_torneo r WHERE r.torneo_id = p_torneo
        GROUP BY r.user_id
      ) x WHERE x.user_id = auth.uid()
    ),
    'righe', (
      SELECT coalesce(jsonb_agg(y ORDER BY (y->>'posizione')::int), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'posizione', rank() OVER (ORDER BY sum(r.stelle) DESC, max(r.created_at)),
          'nome', p.display_name,
          'asd', p.asd_name,
          'stelle', sum(r.stelle),
          'mani', count(*),
          'sonoIo', r.user_id = auth.uid()
        ) AS y
        FROM public.risultati_torneo r
        JOIN public.profiles p ON p.id = r.user_id
        WHERE r.torneo_id = p_torneo
        GROUP BY r.user_id, p.display_name, p.asd_name
        ORDER BY sum(r.stelle) DESC, max(r.created_at)
        LIMIT greatest(1, least(coalesce(p_quanti, 50), 200))
      ) t
    )
  ) END;
$function$;

revoke execute on function public.classifica_torneo(uuid, int) from public;
revoke execute on function public.classifica_torneo(uuid, int) from anon;
grant execute on function public.classifica_torneo(uuid, int) to authenticated;

/**
 * `mano_da_fare` non deve consegnare le mani impegnate in un torneo APERTO.
 *
 * Chi si allena molto le incontrerebbe prima, e arriverebbe al torneo con le
 * carte già viste: un vantaggio che rovina la classifica proprio a chi il
 * prodotto lo usa di più. A torneo chiuso tornano disponibili, che è anche il
 * modo di rivedersele con calma.
 */
create or replace function public.mano_da_fare(p_slug text default null)
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
  SELECT to_jsonb(m) || jsonb_build_object(
    'scenario', CASE WHEN s.id IS NULL THEN NULL ELSE to_jsonb(s) - 'vincoli' END)
  FROM public.mani_generate m
  LEFT JOIN public.scenari s ON s.id = m.scenario_id
  WHERE (p_slug IS NULL OR s.slug = p_slug)
    AND auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.risultati_mano r
      WHERE r.mano_id = m.id AND r.user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.torneo_mani tm
      JOIN public.tornei t ON t.id = tm.torneo_id
      WHERE tm.mano_id = m.id AND now() < t.chiude_at
    )
  ORDER BY random()
  LIMIT 1;
$function$;

revoke execute on function public.mano_da_fare(text) from public;
revoke execute on function public.mano_da_fare(text) from anon;
grant execute on function public.mano_da_fare(text) to authenticated;
