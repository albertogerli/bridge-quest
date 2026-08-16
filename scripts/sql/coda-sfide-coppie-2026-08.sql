-- ============================================================================
-- BridgeLab: la coda della sfida 2 contro 2 — ci si iscrive in due
-- ============================================================================
--
-- DIPENDE DA: scripts/sql/sfida-coppie-2026-08.sql (sfide_coppie, sfida_board,
-- sfida_coppie_crea). Va eseguito dopo quello.
--
-- IL PROBLEMA CHE RISOLVE
-- Per aprire una sfida bisognava indicare tutte e quattro le persone: il
-- compagno e i due avversari. Vuol dire sapere già chi, in quel momento, ha
-- voglia di giocare — e sono quattro persone da mettere d'accordo. Al circolo
-- funziona, a distanza no: chi ha un compagno ma non trova gli avversari
-- resta fuori, e la sfida più bella del prodotto non parte mai.
--
-- Qui ci si iscrive in DUE. La coppia entra in coda; la prima altra coppia che
-- si iscrive viene accoppiata e la sfida nasce da sola, con le stesse
-- smazzate per tutti e quattro.
--
-- CHI ARRIVA PRIMO ASPETTA, CHI ARRIVA DOPO APRE. L'accoppiamento lo fa la
-- coppia che si iscrive per seconda: è lei a chiamare `sfida_coppie_crea`, e
-- quindi risulta la coppia A. Non cambia niente per il gioco — le due coppie
-- vedono le stesse mani e si confrontano in IMP — ma evita di dover creare
-- sfide «per conto di» qualcun altro, che vorrebbe dire scavalcare i controlli
-- che quella funzione fa su chi la chiama.
--
-- IL COMPAGNO DEV'ESSERE UN AMICO, gli avversari no. È la stessa regola della
-- sfida diretta, e non è una restrizione tecnica: il compagno lo scegli, gli
-- avversari te li dà la coda. Il controllo vero sta dentro
-- `sfida_coppie_crea`, che qui viene riusata apposta invece di riscrivere la
-- creazione delle board — una copia sarebbe la solita seconda verità che
-- diverge al primo cambiamento.
--
-- UNA PERSONA, UNA CODA. Nessuno può essere in due coppie in attesa insieme:
-- lo impediscono due indici unici, non un controllo applicativo. Se il
-- compagno che scegli è già in coda con un altro, l'iscrizione viene rifiutata
-- e la pagina lo dice.
--
-- DUE COPPIE CHE SI ISCRIVONO NELLO STESSO ISTANTE non possono accoppiarsi a
-- vicenda due volte: la riga in attesa si prende con `for update skip locked`,
-- quindi una sola transazione se la aggiudica e l'altra prosegue mettendosi in
-- coda.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

-- ── La coda ─────────────────────────────────────────────────────────────────
create table if not exists public.coda_sfide_coppie (
  id uuid primary key default gen_random_uuid(),
  -- `a1` è chi ha fatto l'iscrizione, `a2` il compagno che ha indicato.
  a1 uuid not null references public.profiles(id) on delete cascade,
  a2 uuid not null references public.profiles(id) on delete cascade,
  -- Quante smazzate vuole giocare chi si iscrive: la sfida userà questo numero.
  quante int not null default 4 check (quante between 1 and 12),
  created_at timestamptz not null default now(),
  check (a1 <> a2)
);

-- Una persona sta in una coppia in attesa sola, che sia lei a iscriversi o che
-- venga indicata come compagno. Due indici perché il posto in cui compare non
-- deve fare differenza.
create unique index if not exists coda_sfide_coppie_a1_unico
  on public.coda_sfide_coppie (a1);
create unique index if not exists coda_sfide_coppie_a2_unico
  on public.coda_sfide_coppie (a2);
create index if not exists coda_sfide_coppie_attesa_idx
  on public.coda_sfide_coppie (created_at);

alter table public.coda_sfide_coppie enable row level security;

-- Si vede solo la propria attesa. Quante coppie stiano aspettando lo dice
-- `sfida_coppie_coda_stato`, che restituisce un numero e non dei nomi: chi
-- aspetta non deve diventare un elenco consultabile.
drop policy if exists "La mia attesa" on public.coda_sfide_coppie;
create policy "La mia attesa" on public.coda_sfide_coppie
  for select to authenticated
  using (auth.uid() in (a1, a2));

-- Nessuna policy di scrittura: si passa dalle funzioni qui sotto.

-- ── Iscriversi ──────────────────────────────────────────────────────────────
/**
 * Mette in coda la coppia (chi chiama + il compagno), oppure la accoppia
 * subito con la coppia che aspetta da più tempo.
 *
 * Risponde sempre con un oggetto, perché «non è successo niente» e «non si
 * poteva fare» sono due cose diverse e la pagina deve poterle distinguere:
 *   { "stato": "accoppiata", "sfida": "<uuid>" }
 *   { "stato": "in_attesa" }
 *   { "stato": "errore", "motivo": "..." }
 */
create or replace function public.sfida_coppie_iscrivi(
  p_compagno uuid, p_quante int default 4
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_altra record;
  v_sfida uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'non autenticato');
  END IF;
  IF p_compagno IS NULL OR p_compagno = auth.uid() THEN
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'compagno non valido');
  END IF;

  -- L'amicizia la ricontrolla anche `sfida_coppie_crea`, ma qui serve dirlo
  -- SUBITO: senza, chi sceglie un non-amico resterebbe in coda per sempre e
  -- scoprirebbe il rifiuto solo al momento dell'accoppiamento.
  IF NOT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
      AND ((f.user_id = auth.uid() AND f.friend_id = p_compagno)
        OR (f.friend_id = auth.uid() AND f.user_id = p_compagno))
  ) THEN
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'il compagno dev''essere un amico');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.coda_sfide_coppie c
    WHERE auth.uid() IN (c.a1, c.a2) OR p_compagno IN (c.a1, c.a2)
  ) THEN
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'tu o il tuo compagno siete già in attesa');
  END IF;

  -- La coppia che aspetta da più tempo, senza nessuno in comune con la nostra.
  -- `skip locked`: se due coppie si iscrivono nello stesso istante, una sola
  -- prende questa riga e l'altra va in coda invece di accoppiarsi due volte.
  SELECT * INTO v_altra
  FROM public.coda_sfide_coppie c
  WHERE c.a1 <> auth.uid() AND c.a2 <> auth.uid()
    AND c.a1 <> p_compagno AND c.a2 <> p_compagno
  ORDER BY c.created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.coda_sfide_coppie (a1, a2, quante)
    VALUES (auth.uid(), p_compagno, greatest(1, least(coalesce(p_quante, 4), 12)));
    RETURN jsonb_build_object('stato', 'in_attesa');
  END IF;

  -- Chi aspettava ha scelto per primo quante smazzate: si rispetta la sua
  -- richiesta, perché è stata fatta prima ed è quella su cui ha aspettato.
  v_sfida := public.sfida_coppie_crea(p_compagno, v_altra.a1, v_altra.a2, v_altra.quante);

  IF v_sfida IS NULL THEN
    -- Niente mani in scorta, o un controllo non passato: la coppia che
    -- aspettava deve restare in coda. L'eccezione annulla anche la sua
    -- rimozione, che senza questo `raise` avverrebbe al `delete` qui sotto.
    RAISE EXCEPTION 'sfida non creata';
  END IF;

  DELETE FROM public.coda_sfide_coppie WHERE id = v_altra.id;
  RETURN jsonb_build_object('stato', 'accoppiata', 'sfida', v_sfida);
EXCEPTION
  WHEN unique_violation THEN
    -- Due iscrizioni della stessa persona arrivate insieme.
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'tu o il tuo compagno siete già in attesa');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('stato', 'errore', 'motivo', 'non è stato possibile aprire la sfida');
END $function$;

revoke execute on function public.sfida_coppie_iscrivi(uuid, int) from public;
revoke execute on function public.sfida_coppie_iscrivi(uuid, int) from anon;
grant execute on function public.sfida_coppie_iscrivi(uuid, int) to authenticated;

-- ── Uscire dalla coda ───────────────────────────────────────────────────────
/**
 * Toglie dalla coda la propria coppia. Può farlo anche il compagno indicato:
 * si è in due, e chi non ha fatto l'iscrizione non deve restare prigioniero
 * di un'attesa che non ha scelto.
 */
create or replace function public.sfida_coppie_esci()
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_tolte int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  DELETE FROM public.coda_sfide_coppie c
  WHERE auth.uid() IN (c.a1, c.a2);
  GET DIAGNOSTICS v_tolte = ROW_COUNT;
  RETURN v_tolte > 0;
END $function$;

revoke execute on function public.sfida_coppie_esci() from public;
revoke execute on function public.sfida_coppie_esci() from anon;
grant execute on function public.sfida_coppie_esci() to authenticated;

-- ── Come va l'attesa ────────────────────────────────────────────────────────
/**
 * Lo stato della propria attesa, più quante coppie ci sono in coda.
 *
 * Il numero è un conteggio e basta: chi aspetta non deve diventare un elenco
 * di nomi consultabile da chiunque. Serve solo a far capire se ha senso
 * mettersi in fila adesso.
 */
create or replace function public.sfida_coppie_coda_stato()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_mia record;
  v_totale int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('in_attesa', false, 'coppie_in_attesa', 0); END IF;

  SELECT c.*, p.display_name AS nome_compagno INTO v_mia
  FROM public.coda_sfide_coppie c
  LEFT JOIN public.profiles p
    ON p.id = CASE WHEN c.a1 = auth.uid() THEN c.a2 ELSE c.a1 END
  WHERE auth.uid() IN (c.a1, c.a2)
  LIMIT 1;

  SELECT count(*) INTO v_totale FROM public.coda_sfide_coppie;

  IF NOT FOUND OR v_mia IS NULL THEN
    RETURN jsonb_build_object('in_attesa', false, 'coppie_in_attesa', coalesce(v_totale, 0));
  END IF;

  RETURN jsonb_build_object(
    'in_attesa', true,
    'compagno', v_mia.nome_compagno,
    'sono_io_a_essermi_iscritto', v_mia.a1 = auth.uid(),
    'dal', v_mia.created_at,
    'quante', v_mia.quante,
    'coppie_in_attesa', coalesce(v_totale, 0)
  );
END $function$;

revoke execute on function public.sfida_coppie_coda_stato() from public;
revoke execute on function public.sfida_coppie_coda_stato() from anon;
grant execute on function public.sfida_coppie_coda_stato() to authenticated;

-- ── Realtime ────────────────────────────────────────────────────────────────
-- Chi aspetta deve accorgersi da solo che la sfida è nata, senza ricaricare la
-- pagina: è il momento in cui l'attesa finisce, e chiedergli di premere
-- «aggiorna» per scoprirlo sarebbe il modo peggiore di dirglielo.
--
-- Servono TUTTE E DUE le tabelle, e nessuna delle due c'era (verificato sulla
-- publication il 16/08/2026): `sfide_coppie` per l'evento «la sfida è nata»,
-- `coda_sfide_coppie` per «non sei più in attesa». Con la sola coda si
-- vedrebbe sparire la fila senza sapere dove si è finiti.
do $$
declare
  t text;
begin
  foreach t in array array['coda_sfide_coppie', 'sfide_coppie'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Perché l'evento di DELETE porti con sé le colonne (e non solo la chiave), la
-- riga va replicata intera: senza, «non sei più in attesa» arriverebbe senza
-- dire a chi apparteneva quell'attesa. Stessa ragione documentata per le altre
-- tabelle in `replica_identity_full_realtime_delete`.
alter table public.coda_sfide_coppie replica identity full;
