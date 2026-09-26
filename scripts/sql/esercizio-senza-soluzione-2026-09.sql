-- L'esercizio arriva all'allievo senza la risposta dentro.
--
-- Dipendenze: esercizi_posizione, assignments, is_member_of_class(),
--   is_instructor_of_class() — tutte presenti dalla baseline.
-- Rollback: esercizio-senza-soluzione-2026-09-rollback.sql.
-- Eseguire quando in `esercizi_posizione` non ci sono righe (al 26/09/2026 ce
-- ne sono zero: la funzione esiste ma nessun insegnante l'ha ancora usata).
-- Con righe già scritte serve prima il riempimento di `risposte_norm`.
--
-- IL DIFETTO. La pagina dell'allievo leggeva `select("*")`: nel browser
-- arrivavano `risposte`, `soluzione` e TUTTE E QUATTRO le mani, prima che
-- l'allievo rispondesse. Il commento in cima alla pagina dice «LA SOLUZIONE
-- ARRIVA DOPO AVER RISPOSTO, mai prima»: era vero di quello che si vedeva,
-- falso di quello che si riceveva. E la promessa dell'esercizio — «si decide
-- con le informazioni che si avrebbero al tavolo» — era smentita dalle altre
-- tre mani, che stavano lì nella scheda di rete.
--
-- È lo stesso sguardo dell'errore già registrato in CLAUDE.md: la pagina la
-- guardiamo da dentro, dove il nascondere è una scelta di disegno, e non da
-- fuori, dove è una scelta di dati.
--
-- COME SI CHIUDE. Privilegi di colonna, come già su `profiles` e `smazzate`:
-- le colonne segrete non sono più leggibili da `authenticated`, punto. Non
-- basta una policy, perché la policy filtra le righe e qui il problema sono
-- le colonne di una riga che l'allievo ha tutto il diritto di vedere.
--
-- Le tre funzioni che seguono sono l'unico modo di rientrarci:
--   esercizio_per_allievo  — l'esercizio senza soluzione, con le sole mani
--                            che si vedrebbero al tavolo;
--   verifica_esercizio     — il responso, e SOLO allora la soluzione;
--   esercizio_dell_autore  — la riga intera, a chi l'ha scritto o insegna.
--
-- LA NORMALIZZAZIONE RESTA IN TYPESCRIPT, UNA SOLA. Riscriverla in SQL
-- vorrebbe dire due implementazioni che devono restare d'accordo per sempre
-- su «1NT» = «1SA» = «1 sa»: il giorno che divergono, un allievo si vede dare
-- sbagliata una risposta giusta e nessuno capisce perché. Quindi le risposte
-- attese si salvano GIÀ normalizzate in `risposte_norm`, dalla stessa
-- funzione TypeScript che normalizza quello che l'allievo scrive, e il
-- database si limita a confrontare.

alter table public.esercizi_posizione
  add column if not exists risposte_norm text[] not null default '{}';

comment on column public.esercizi_posizione.risposte_norm is
  'Le risposte attese passate da normalizzaRisposta() in TypeScript. Il confronto lo fa verifica_esercizio(); qui non si normalizza niente, apposta.';

-- ── I privilegi di colonna ────────────────────────────────────────────────
-- `hands` sparisce insieme alle risposte perché le altre tre mani sono la
-- soluzione quanto la soluzione: con quelle davanti l'esercizio non è più
-- l'esercizio.
--
-- SI TOGLIE IL PERMESSO LARGO E SI CONCEDE COLONNA PER COLONNA. Un
-- `revoke select (colonna)` non serve a niente finché resta il
-- `grant select` sull'INTERA tabella: il permesso largo vince, e la revoca
-- passa senza errori lasciando tutto come prima. È esattamente com'era già
-- fatto `smazzate`, e l'ho scoperto solo perché la prova con un allievo vero
-- leggeva ancora la soluzione dopo la revoca.
revoke select on public.esercizi_posizione from authenticated, anon;

grant select (
  id, autore_id, titolo, consegna, domanda, dealer, vulnerability,
  bids, played, posizione, contract, declarer, gruppo, class_id, created_at
) on public.esercizi_posizione to authenticated;

-- ── Chi può vedere cosa ───────────────────────────────────────────────────
create or replace function public.puo_vedere_esercizio(p_id uuid)
returns boolean language sql stable security definer set search_path to '' as $function$
  select exists (
    select 1 from public.esercizi_posizione e
    where e.id = p_id and (
      e.autore_id = (select auth.uid())
      or (e.class_id is not null and (public.is_member_of_class(e.class_id)
                                      or public.is_instructor_of_class(e.class_id)))
      or exists (select 1 from public.assignments a
                 where e.id = any (a.esercizio_ids)
                   and (public.is_member_of_class(a.class_id)
                        or public.is_instructor_of_class(a.class_id)))
    )
  );
$function$;

-- Chi insegna l'esercizio vede la soluzione senza doverla indovinare. Gli
-- allievi della classe no: è la sola riga che separa i due casi.
create or replace function public.insegna_esercizio(p_id uuid)
returns boolean language sql stable security definer set search_path to '' as $function$
  select exists (
    select 1 from public.esercizi_posizione e
    where e.id = p_id and (
      e.autore_id = (select auth.uid())
      or (e.class_id is not null and public.is_instructor_of_class(e.class_id))
      or exists (select 1 from public.assignments a
                 where e.id = any (a.esercizio_ids)
                   and public.is_instructor_of_class(a.class_id))
    )
  );
$function$;

-- ── L'esercizio come lo vede l'allievo ────────────────────────────────────
-- LE MANI CHE SI VEDREBBERO AL TAVOLO, e nessun'altra: la propria, e il morto
-- soltanto se il gioco è cominciato e il morto non sei tu. È la stessa regola
-- che la pagina applicava a schermo; ora la applica il database, che è il solo
-- posto in cui applicarla significhi qualcosa.
create or replace function public.esercizio_per_allievo(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path to '' as $function$
declare
  e public.esercizi_posizione%rowtype;
  v_morto text;
  v_mani jsonb := '{}'::jsonb;
begin
  if not public.puo_vedere_esercizio(p_id) then return null; end if;
  select * into e from public.esercizi_posizione where id = p_id;

  v_mani := jsonb_build_object(e.posizione, e.hands -> e.posizione);

  if jsonb_array_length(e.played) > 0 and e.declarer is not null then
    v_morto := case e.declarer
      when 'north' then 'south' when 'south' then 'north'
      when 'east'  then 'west'  when 'west'  then 'east' end;
    if v_morto is not null and v_morto <> e.posizione then
      v_mani := v_mani || jsonb_build_object(v_morto, e.hands -> v_morto);
    end if;
  end if;

  return jsonb_build_object(
    'id', e.id, 'autore_id', e.autore_id, 'titolo', e.titolo,
    'consegna', e.consegna, 'domanda', e.domanda, 'hands', v_mani,
    'dealer', e.dealer, 'vulnerability', e.vulnerability,
    'bids', to_jsonb(e.bids), 'played', e.played, 'posizione', e.posizione,
    'contract', e.contract, 'declarer', e.declarer,
    'gruppo', e.gruppo, 'class_id', e.class_id, 'created_at', e.created_at,
    -- Serve alla pagina per sapere se c'è una risposta attesa o se è una
    -- domanda aperta, senza sapere QUALE sia la risposta.
    'quante_risposte', coalesce(array_length(e.risposte, 1), 0)
  );
end $function$;

-- ── Il responso ───────────────────────────────────────────────────────────
-- Restituisce la soluzione, ma solo in cambio di una risposta data. Che poi
-- l'allievo possa sbagliare apposta per farsela dire è vero, ed è voluto:
-- l'esercizio chiede di impegnarsi, non di non poter barare. La differenza
-- con prima è che adesso impegnarsi è necessario.
--
-- `p_risposta_norm` arriva GIÀ normalizzata dal client, dalla stessa funzione
-- che ha normalizzato le attese quando l'insegnante le ha scritte. Qui si
-- confronta e basta.
create or replace function public.verifica_esercizio(p_id uuid, p_risposta_norm text)
returns jsonb language plpgsql stable security definer set search_path to '' as $function$
declare
  e public.esercizi_posizione%rowtype;
  v_giusta boolean;
begin
  if not public.puo_vedere_esercizio(p_id) then return null; end if;
  select * into e from public.esercizi_posizione where id = p_id;

  -- Nessuna risposta attesa: è una domanda aperta, e si dà per buona.
  v_giusta := coalesce(array_length(e.risposte_norm, 1), 0) = 0
              or p_risposta_norm = any (e.risposte_norm);

  return jsonb_build_object(
    'giusta', v_giusta,
    'risposte', to_jsonb(e.risposte),
    'soluzione', e.soluzione
  );
end $function$;

-- ── La riga intera, a chi l'ha scritta ────────────────────────────────────
create or replace function public.esercizio_dell_autore(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path to '' as $function$
declare e public.esercizi_posizione%rowtype;
begin
  if not public.insegna_esercizio(p_id) then return null; end if;
  select * into e from public.esercizi_posizione where id = p_id;
  return to_jsonb(e);
end $function$;

create or replace function public.i_miei_esercizi()
returns jsonb language sql stable security definer set search_path to '' as $function$
  select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc), '[]'::jsonb)
  from (
    select * from public.esercizi_posizione
    where autore_id = (select auth.uid())
    order by created_at desc limit 200
  ) e;
$function$;

revoke all on function public.puo_vedere_esercizio(uuid) from public, anon, authenticated, service_role;
revoke all on function public.insegna_esercizio(uuid) from public, anon, authenticated, service_role;
revoke all on function public.esercizio_per_allievo(uuid) from public, anon, authenticated, service_role;
revoke all on function public.verifica_esercizio(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.esercizio_dell_autore(uuid) from public, anon, authenticated, service_role;
revoke all on function public.i_miei_esercizi() from public, anon, authenticated, service_role;

grant execute on function public.puo_vedere_esercizio(uuid) to authenticated, service_role;
grant execute on function public.insegna_esercizio(uuid) to authenticated, service_role;
grant execute on function public.esercizio_per_allievo(uuid) to authenticated, service_role;
grant execute on function public.verifica_esercizio(uuid, text) to authenticated, service_role;
grant execute on function public.esercizio_dell_autore(uuid) to authenticated, service_role;
grant execute on function public.i_miei_esercizi() to authenticated, service_role;
