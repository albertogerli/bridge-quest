-- ============================================================================
-- STATO: APPLICATO in produzione il 2026-08-09 (migrazioni Supabase
--   `pii_access_functions` e `pii_columns_revoke`). Verificato con
--   `npm run test:rls`. Conservato come documentazione della decisione.
--   NB: `last_login` e' di tipo `date`, non timestamptz: le firme applicate
--   differiscono da quelle abbozzate qui sotto.
-- BridgeLab: isolamento delle colonne personali di `profiles`
-- (rilievo perizie 2026-08, misurato con `npm run test:rls`)
--
-- PROBLEMA
-- Dopo security-fixes-2026-08.sql un visitatore anonimo non legge più nulla,
-- ma QUALSIASI utente autenticato può ancora leggere sugli ALTRI iscritti:
--   marketing_consent, marketing_consent_date, last_login, platform, total_minutes
-- (più streak, hands_played, profile_type, created_at, username, preferenze).
-- Sono dati personali che l'app non mostra mai fra utenti: servono solo al
-- proprietario del profilo e all'amministratore.
--
-- SOLUZIONE
-- Privilegi a livello di COLONNA: l'utente autenticato può leggere solo le
-- colonne che l'app mostra davvero fra utenti (classifica, amici, forum,
-- sfide, portale istruttori). Il resto passa da due funzioni SECURITY DEFINER:
--   - get_own_profile()   -> il proprio profilo per intero
--   - admin_list_users()  -> elenco completo, solo per is_admin()
--
-- ORDINE DI ESECUZIONE (importante)
--   1. Esegui la PARTE A adesso: aggiunge solo le due funzioni, non toglie
--      nulla. Nessun impatto sull'app in produzione.
--   2. Attendi il deploy dell'app che usa le funzioni (il codice ha comunque
--      un fallback, quindi funziona sia prima sia dopo).
--   3. Esegui la PARTE B: è quella che revoca le colonne.
--   4. Verifica con `npm run test:rls` (deve chiudersi con 0 fallimenti).
-- In caso di problemi, la PARTE C ripristina lo stato precedente.
-- ============================================================================


-- ============================================================================
-- PARTE A — Funzioni di accesso (eseguibile subito, non toglie privilegi)
-- ============================================================================

-- Il proprio profilo per intero. Serve perché, dopo la PARTE B, un
-- `SELECT *` su profiles fallirebbe anche sulla propria riga: i privilegi di
-- colonna in PostgreSQL valgono per ruolo, non per riga.
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_own_profile() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;


-- Elenco utenti per il pannello admin. Guardato da is_admin(): un utente
-- normale riceve un errore, non una lista vuota (così il bug è evidente).
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  display_name text,
  bbo_username text,
  profile_type text,
  xp integer,
  streak integer,
  hands_played integer,
  asd_code text,
  asd_name text,
  marketing_consent boolean,
  total_minutes numeric,
  created_at timestamptz,
  last_login timestamptz,
  platform text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Accesso negato: richiesti privilegi di amministratore';
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.display_name, p.bbo_username, p.profile_type::text, p.xp, p.streak,
    p.hands_played, p.asd_code, p.asd_name, p.marketing_consent,
    p.total_minutes::numeric, p.created_at, p.last_login, p.platform, p.role::text
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;


-- ============================================================================
-- PARTE B — Revoca delle colonne personali
-- Eseguire SOLO dopo il deploy dell'app che usa get_own_profile().
--
-- Colonne che restano leggibili fra utenti e perché:
--   id, display_name, avatar_url ...... classifica, amici, forum, sfide
--   bbo_username ...................... ricerca amici per nome BBO
--   asd_code, asd_name ................ classifica per circolo
--   xp ................................ classifica e schede amico
--   updated_at ........................ "ultima attività" in classifica
--   role .............................. gate portale istruttori e admin
-- Tutto il resto diventa accessibile solo al proprietario (via funzione)
-- o all'amministratore (via admin_list_users).
-- ============================================================================

REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id,
  display_name,
  avatar_url,
  bbo_username,
  asd_code,
  asd_name,
  xp,
  updated_at,
  role
) ON public.profiles TO authenticated;

-- La scrittura resta invariata: l'app aggiorna solo la propria riga (RLS) e
-- le UPDATE non richiedono il privilegio SELECT sulle colonne modificate,
-- purché non usino RETURNING (il client Supabase non lo fa senza .select()).


-- ============================================================================
-- VERIFICA (dopo la PARTE B)
--
--   npm run test:rls     -> deve chiudersi con "Tutte le verifiche RLS sono passate"
--
-- Controllo manuale dei privilegi rimasti:
--   SELECT column_name, privilege_type
--   FROM information_schema.column_privileges
--   WHERE table_name = 'profiles' AND grantee = 'authenticated'
--   ORDER BY column_name;
--
-- Controlli funzionali consigliati in app: classifica, elenco amici,
-- ricerca amico per nome BBO, forum (nomi autori), pannello admin.
-- ============================================================================


-- ============================================================================
-- PARTE C — Ripristino (solo in caso di problemi)
--
--   GRANT SELECT ON public.profiles TO authenticated;
--
-- Ripristina la lettura di tutte le colonne agli utenti autenticati,
-- annullando la PARTE B. Le funzioni della PARTE A possono restare.
-- ============================================================================
