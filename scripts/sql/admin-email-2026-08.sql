-- ============================================================================
-- STATO: APPLICATO in produzione il 2026-08-10 (migrazione Supabase
--   `admin_list_users_with_email`). Verificato con `npm run test:rls`, che ora
--   contiene il caso "admin_list_users(): negata a un utente non
--   amministratore".
--
-- BridgeLab: email degli utenti nel pannello di amministrazione
-- ============================================================================
--
-- PERCHÉ
-- Senza email, ogni contatto con un utente che segnala un problema passa da
-- una query manuale sul database. È successo con i nomi BBO duplicati: per
-- scrivere a quattro persone si è dovuto interrogare `auth.users` a mano.
--
-- DOVE VIVE L'EMAIL
-- In `auth.users`, non in `profiles`. Nessuna policy RLS del progetto la
-- espone: l'unica via è una funzione SECURITY DEFINER, che gira con i
-- privilegi del proprietario e può quindi leggere lo schema `auth`.
--
-- PERCHÉ È SICURO AGGIUNGERLA QUI
-- `admin_list_users()` è eseguibile dal ruolo `authenticated` — cioè da
-- chiunque abbia fatto accesso — ma la PRIMA istruzione del corpo è:
--
--     IF NOT is_admin() THEN RAISE EXCEPTION ...
--
-- Il permesso di esecuzione è quindi innocuo: chi non è amministratore riceve
-- un errore, non una riga. Questa è l'unica cosa che separa un utente
-- qualunque dall'anagrafica completa degli iscritti, e per questo la verifica
-- corrispondente in `scripts/test-rls.mjs` non va mai rimossa.
--
-- SCELTE DELIBERATE
--   * LEFT JOIN e non JOIN: un profilo senza riga in `auth.users` resta in
--     elenco con email nulla, invece di sparire silenziosamente dal pannello.
--   * L'email NON è stata aggiunta all'export CSV (`buildUsersCsv`). Consultare
--     un indirizzo a schermo e scaricare un file con centinaia di indirizzi
--     nella cartella Download di un portatile sono due esposizioni diverse.
--     Un test in `src/lib/admin-stats.test.ts` fissa la scelta, così non
--     cambia per distrazione.
--   * Serve DROP + CREATE, non CREATE OR REPLACE: cambia il tipo di ritorno.
-- ============================================================================

DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid, display_name text, bbo_username text, profile_type text,
  xp integer, streak integer, hands_played integer, asd_code text,
  asd_name text, marketing_consent boolean, total_minutes integer,
  created_at timestamptz, last_login date, platform text, role text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Accesso negato: richiesti privilegi di amministratore';
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.display_name, p.bbo_username, p.profile_type, p.xp, p.streak,
    p.hands_played, p.asd_code, p.asd_name, p.marketing_consent,
    p.total_minutes, p.created_at, p.last_login, p.platform, p.role,
    u.email::text
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, service_role;

-- ============================================================================
-- VERIFICA
--   npm run test:rls
--     -> "admin_list_users(): negata a un utente non amministratore"
--
--   -- il controllo deve essere nel corpo, non solo nei permessi
--   SELECT prosrc LIKE '%IF NOT is_admin()%' AS gate_presente
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname = 'admin_list_users';
--
-- RIPRISTINO (torna alla versione senza email)
--   Rieseguire questo script togliendo `email text` dalla RETURNS TABLE e
--   `u.email::text` con il LEFT JOIN dalla SELECT. Ricordarsi di rimuovere
--   anche il campo da UserRow in src/app/admin/_types.ts.
-- ============================================================================
