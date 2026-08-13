-- ============================================================================
-- BridgeLab: accessi leggibili dall'amministratore (admin_login_history)
-- ============================================================================
--
-- IL DIFETTO
-- Il pannello admin mostrava «utenti attivi per giorno» così:
--   31/07 → 5, poi 5, 6, 9, 2, 6, 3, 7, 8, 11, 11, 13, 26, 53
-- una scala che cresce sempre verso oggi. I valori veri erano
--   64, 64, 71, 67, 67, 59, 57, 69, 63, 61, 72, 66, 66, 49.
--
-- `login_history` ha una sola policy di lettura, `user_id = auth.uid()`:
-- nessuna eccezione per gli amministratori. La query del pannello riportava
-- quindi le sole righe dell'amministratore stesso, e il grafico veniva
-- disegnato dal ripiego su `profiles.last_login` — che colloca ogni utente in
-- UN SOLO giorno, l'ultimo in cui è entrato. Chi era venuto tutti i giorni
-- compariva una volta sola, e la curva decrescente verso il passato sembrava
-- un andamento reale invece che un artefatto.
-- La prova: 53 profili hanno `last_login` di oggi, 25 di ieri, 12 l'altro
-- ieri — la sequenza del grafico meno una riga al giorno, che era quella
-- dell'amministratore.
--
-- PERCHÉ UNA FUNZIONE E NON UNA POLICY IN PIÙ
-- Aprire `login_history` in SELECT agli admin funzionerebbe, ma allargherebbe
-- una tabella di dati personali a chiunque prenda quel ruolo, per sempre e
-- per qualunque uso. Qui si concede lo stretto necessario: una finestra di
-- giorni, tre colonne, e nessuna email — l'anagrafica resta in
-- `admin_list_users()`, dove è già protetta.
--
-- SICUREZZA
-- `security definer` per scavalcare la policy, ma la PRIMA istruzione è il
-- controllo `is_admin()`: senza, questa funzione sarebbe il modo più comodo
-- per leggere gli accessi di 1.090 persone. Come per le altre funzioni del
-- progetto, l'EXECUTE va tolto a PUBLIC e non ad `anon`: Postgres concede a
-- PUBLIC ogni funzione nuova e `anon` eredita da lì.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

create or replace function public.admin_login_history(p_days integer default 30)
returns table (
  user_id uuid,
  logged_in_at timestamptz,
  platform text
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT h.user_id, h.logged_in_at, h.platform
  FROM login_history h
  -- Finestra imbrigliata: un client che chiedesse diecimila giorni non deve
  -- poter trasformare una schermata in una scansione dell'intera tabella.
  WHERE h.logged_in_at >= now() - (least(greatest(coalesce(p_days, 30), 1), 365) || ' days')::interval
  ORDER BY h.logged_in_at DESC;
END
$function$;

comment on function public.admin_login_history(integer) is
  'Accessi degli ultimi N giorni per il pannello admin. Solo is_admin(); nessuna email.';

-- Servono ENTRAMBE le revoche: PUBLIC riceve EXECUTE da Postgres su ogni
-- funzione nuova, e i default privileges di Supabase concedono ESPLICITAMENTE
-- ad `anon`. Con la sola revoca a PUBLIC questa funzione è rimasta eseguibile
-- da anonimo — innocua perché il controllo `is_admin()` la ferma comunque, ma
-- una porta aperta che non ha motivo di esserlo. Si verifica in
-- `pg_proc.proacl`: una voce `anon=X/postgres` è esplicita.
revoke execute on function public.admin_login_history(integer) from public;
revoke execute on function public.admin_login_history(integer) from anon;
grant execute on function public.admin_login_history(integer) to authenticated;
