-- ============================================================================
-- BridgeLab: scenari, mani generate condivise, risultati (piano Cuebids, fase 1)
-- ============================================================================
--
-- LA DECISIONE CHE STA SOTTO A TUTTO: LE MANI SI RIUSANO.
-- Il piano lo elenca fra i rischi; è invece un requisito, e va preso adesso
-- perché cambia lo schema. Se ogni utente ricevesse mani sempre nuove:
--   * la percentuale di campo non esisterebbe — non c'è nessuno con cui
--     confrontarsi sulla stessa smazzata;
--   * il «Compare» e il filtro «la mia classe» — che è dove battiamo Cuebids —
--     non avrebbero dati;
--   * ogni mano costerebbe una generazione con vincoli più una ventina di
--     risoluzioni double dummy, pagate una volta per persona invece che una
--     volta per mano.
-- Le mani vivono quindi in `mani_generate`, sono di tutti, e i risultati si
-- appoggiano a loro.
--
-- LO STOCK. Generare con vincoli stretti è caro, e il double dummy di più:
-- `mani_generate` è una scorta riempita in anticipo, non un servizio a
-- richiesta. `par_score`, la tabella delle prese e il valore atteso si
-- calcolano una volta sola e restano lì.
--
-- COSA È PUBBLICO E COSA NO
-- Le mani sono leggibili da chiunque sia autenticato: sono esercizi, non
-- segreti — e servono a tutti per il confronto. I RISULTATI invece sono
-- personali in scrittura: si può scrivere solo il proprio. In lettura sono
-- aperti agli autenticati, perché è esattamente ciò che rende possibile dire
-- «il 58% ha dichiarato come te»; escono solo contratto e punteggio, mai
-- l'identità di chi non è tuo amico o compagno di classe — quel filtro sta
-- nelle funzioni di lettura, non qui.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

-- ── Scenari: i vincoli, non le mani ─────────────────────────────────────────
create table if not exists public.scenari (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  descrizione text check (char_length(descrizione) <= 1000),
  -- Il DSL di `DealConstraints`, come lo scrive il generatore.
  vincoli jsonb not null,
  autore_id uuid references public.profiles(id) on delete set null,
  -- Gli scenari ufficiali sono quelli mappati sui moduli dei corsi.
  ufficiale boolean not null default false,
  pubblico boolean not null default false,
  /** Modulo del corso a cui appartiene, quando è uno scenario ufficiale. */
  modulo text,
  created_at timestamptz not null default now()
);

-- Gli scenari ufficiali hanno un nome stabile, così il seed si può rieseguire
-- senza duplicarli e le mani già generate restano attaccate al loro scenario.
-- Indice NON parziale a posta: `on conflict (slug)` non sa dedurre un indice
-- con predicato, e il seed degli scenari ufficiali passa da lì. I NULL restano
-- comunque distinti fra loro, quindi gli scenari degli insegnanti — che lo
-- slug non ce l'hanno — non si pestano i piedi.
alter table public.scenari add column if not exists slug text;
create unique index if not exists scenari_slug_key on public.scenari (slug);

create index if not exists scenari_pubblici_idx
  on public.scenari (pubblico, ufficiale, created_at desc);

alter table public.scenari enable row level security;

drop policy if exists "Scenari leggibili" on public.scenari;
create policy "Scenari leggibili" on public.scenari
  for select to authenticated
  using (pubblico or ufficiale or autore_id = auth.uid());

-- Li crea chi insegna: uno scenario mal costruito diventa un esercizio che
-- insegna una cosa sbagliata, e va firmato da qualcuno.
drop policy if exists "Istruttori creano scenari" on public.scenari;
create policy "Istruttori creano scenari" on public.scenari
  for insert to authenticated
  with check (
    autore_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('instructor', 'admin')
    )
  );

drop policy if exists "Autore modifica i propri scenari" on public.scenari;
create policy "Autore modifica i propri scenari" on public.scenari
  for update to authenticated
  using (autore_id = auth.uid()) with check (autore_id = auth.uid());

drop policy if exists "Autore cancella i propri scenari" on public.scenari;
create policy "Autore cancella i propri scenari" on public.scenari
  for delete to authenticated
  using (autore_id = auth.uid() or is_admin());

-- ── Le mani: generate una volta, usate da tutti ─────────────────────────────
create table if not exists public.mani_generate (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references public.scenari(id) on delete cascade,
  -- Le quattro mani.
  hands jsonb not null,
  dealer text not null default 'south'
    check (dealer in ('north','east','south','west')),
  vulnerability text not null default 'none',
  -- Precalcolati in fase di generazione: il costo si paga una volta.
  par_contracts jsonb,
  par_score integer,
  /** Prese per denominazione e dichiarante: 20 valori. */
  dd_table jsonb,
  /**
   * Il miglior contratto per valore atteso, per linea — `{ ns: {...}, ew: {...} }`,
   * come lo produce `migliorContrattoAtteso`. È il metro con cui si danno le
   * stelle: il par secco premia chi ha indovinato la disposizione avversaria,
   * il valore atteso premia chi ha dichiarato bene. Costa una ventina di
   * risoluzioni double dummy per mano, e per questo si calcola QUI, una volta
   * sola, invece che addosso al giocatore.
   */
  valore_atteso jsonb,
  /**
   * Le distribuzioni delle prese sulle rimescolate: per denominazione e
   * dichiarante, quante volte sono uscite n prese.
   *
   * PERCHÉ SERVE, E PERCHÉ NON BASTAVA `valore_atteso`.
   * La prima versione teneva solo il contratto migliore, e le stelle
   * confrontavano il punteggio REALE del contratto raggiunto con il valore
   * ATTESO del migliore: due metri diversi. Sulle smazzate dove le carte
   * stanno bene pioveva tre stelle su tutto, su quelle storte puniva per il
   * mescolamento. Con l'istogramma il valore atteso di QUALUNQUE contratto si
   * ricava con una somma, e il confronto torna fra numeri della stessa specie.
   */
  distribuzioni jsonb,
  /** Punti onori combinati di Nord-Sud: si filtra e si verifica la media. */
  ns_hcp smallint,
  created_at timestamptz not null default now()
);

alter table public.mani_generate
  add column if not exists valore_atteso jsonb,
  add column if not exists distribuzioni jsonb,
  add column if not exists ns_hcp smallint;

create index if not exists mani_generate_ns_hcp_idx on public.mani_generate (ns_hcp);

create index if not exists mani_generate_scenario_idx
  on public.mani_generate (scenario_id, created_at desc);

alter table public.mani_generate enable row level security;

-- Leggibili da chiunque sia autenticato: sono esercizi, e il confronto
-- richiede che due persone possano avere la stessa mano.
drop policy if exists "Mani leggibili" on public.mani_generate;
create policy "Mani leggibili" on public.mani_generate
  for select to authenticated using (true);

drop policy if exists "Istruttori generano mani" on public.mani_generate;
create policy "Istruttori generano mani" on public.mani_generate
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('instructor', 'admin')
    )
  );

-- ── I risultati: cosa ha dichiarato ognuno su quella mano ───────────────────
create table if not exists public.risultati_mano (
  id uuid primary key default gen_random_uuid(),
  mano_id uuid not null references public.mani_generate(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  /** Il compagno, quando la mano è stata dichiarata in due. */
  partner_id uuid references public.profiles(id) on delete set null,
  contratto text,
  dichiarante text,
  punteggio integer not null,
  stelle smallint not null check (stelle between 0 and 3),
  created_at timestamptz not null default now(),
  -- Una mano si dichiara una volta sola: il secondo tentativo falserebbe il
  -- confronto col campo.
  unique (mano_id, user_id)
);

create index if not exists risultati_mano_idx
  on public.risultati_mano (mano_id);
create index if not exists risultati_utente_idx
  on public.risultati_mano (user_id, created_at desc);

alter table public.risultati_mano enable row level security;

drop policy if exists "Risultati leggibili" on public.risultati_mano;
create policy "Risultati leggibili" on public.risultati_mano
  for select to authenticated using (true);

drop policy if exists "Ognuno scrive il proprio risultato" on public.risultati_mano;
create policy "Ognuno scrive il proprio risultato" on public.risultati_mano
  for insert to authenticated
  with check (user_id = auth.uid());

/**
 * Una mano dalla scorta che chi chiede non ha ancora dichiarato.
 *
 * Serve una funzione perché la scelta dipende da cosa hai già fatto, e quel
 * filtro in un `select` dal client sarebbe una lettura di tutta la tabella dei
 * risultati per poi scartarne il 99%.
 *
 * SI RIPESCA IN ORDINE CASUALE fra quelle mai fatte. Se sono finite torna
 * null: meglio dire «per oggi basta» che rimandare la stessa mano, dove il
 * confronto col campo sarebbe falsato dal fatto che le carte le conosci già.
 *
 * SECURITY INVOKER a posta: le regole di lettura sono già quelle giuste, e una
 * funzione definer qui aggiungerebbe solo un modo per sbagliare.
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
  -- LEFT, non INNER: la maggior parte della scorta non appartiene a nessuno
  -- scenario — sono mani da partita, generate sui punti della linea e basta.
  -- Con il JOIN interno non uscivano mai, e la pagina ripiegava in silenzio
  -- sulla generazione locale: niente confronto col campo, e le stelle date col
  -- par invece che sul valore atteso. Un difetto che non dava errori.
  LEFT JOIN public.scenari s ON s.id = m.scenario_id
  WHERE (p_slug IS NULL OR s.slug = p_slug)
    AND auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.risultati_mano r
      WHERE r.mano_id = m.id AND r.user_id = auth.uid()
    )
  ORDER BY random()
  LIMIT 1;
$function$;

revoke execute on function public.mano_da_fare(text) from public;
revoke execute on function public.mano_da_fare(text) from anon;
grant execute on function public.mano_da_fare(text) to authenticated;

/**
 * Il confronto col campo su una mano.
 *
 * Restituisce la distribuzione dei contratti raggiunti e la percentuale di chi
 * ha fatto peggio di te — il numero che rende il voto comprensibile: «tre
 * stelle» dice poco, «meglio del 74%» dice tutto.
 *
 * NON RESTITUISCE NOMI. Sapere che il 74% ha fatto peggio è utile; sapere CHI
 * ha sbagliato non lo è, e trasformerebbe un esercizio in una classifica di
 * bravura pubblica. I filtri per amici e per classe arriveranno come funzioni
 * separate, dove il diritto a vedere il nome esiste già.
 */
create or replace function public.confronto_campo(p_mano_id uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object(
    'totale', (SELECT count(*) FROM public.risultati_mano r WHERE r.mano_id = p_mano_id),
    'mio', (
      SELECT jsonb_build_object('contratto', r.contratto, 'punteggio', r.punteggio, 'stelle', r.stelle)
      FROM public.risultati_mano r
      WHERE r.mano_id = p_mano_id AND r.user_id = auth.uid()
    ),
    'percentile', (
      SELECT CASE WHEN count(*) = 0 THEN NULL ELSE
        round(100.0 * count(*) FILTER (
          WHERE r.punteggio < (SELECT m.punteggio FROM public.risultati_mano m
                               WHERE m.mano_id = p_mano_id AND m.user_id = auth.uid())
        ) / count(*))
      END
      FROM public.risultati_mano r
      WHERE r.mano_id = p_mano_id AND r.user_id <> auth.uid()
    ),
    'contratti', (
      SELECT coalesce(jsonb_agg(x ORDER BY x->>'quanti' DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'contratto', coalesce(r.contratto, 'passo'),
          'quanti', count(*),
          'punteggioMedio', round(avg(r.punteggio)),
          'stelleMedie', round(avg(r.stelle), 1)
        ) AS x
        FROM public.risultati_mano r
        WHERE r.mano_id = p_mano_id
        GROUP BY coalesce(r.contratto, 'passo')
      ) t
    )
  ) END;
$function$;

revoke execute on function public.confronto_campo(uuid) from public;
revoke execute on function public.confronto_campo(uuid) from anon;
grant execute on function public.confronto_campo(uuid) to authenticated;
