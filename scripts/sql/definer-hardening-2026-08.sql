-- ============================================================================
-- STATO: APPLICATO in produzione il 2026-08-09 (migrazioni Supabase
--   `harden_security_definer_functions` e
--   `harden_security_definer_revoke_public`). Verificato con
--   `npm run test:rls`, che ora contiene il controllo di non-regressione.
--
-- BridgeLab: irrobustimento delle funzioni SECURITY DEFINER
-- ============================================================================
--
-- PROBLEMA 1 — esecuzione da anonimo (fuga di dati reale, misurata)
-- Le funzioni SECURITY DEFINER scavalcano SIA le RLS SIA i privilegi di
-- colonna introdotti su `profiles`: sono una porta laterale che vanifica
-- quelle protezioni. Con la sola anon key, prima di questa migrazione:
--     search_users(...)        -> 20 profili completi (nome, handle BBO, circolo)
--     get_challenge_stats(...) -> statistiche di un utente arbitrario
--     get_game_leaderboard()   -> classifica con i nomi
--     is_admin()               -> eseguibile
-- Cioè esattamente la fuga chiusa con `security-fixes-2026-08.sql`, rientrata
-- da un'altra porta.
--
-- Perché è sicuro revocare agli anonimi: nessuna pagina raggiungibile senza
-- login usa RPC. Le rotte pubbliche sono /, /login, /registrati, /auth,
-- /privacy, /termini, /accessibilita, /glossario (vedi PUBLIC_ROUTES in
-- src/components/layout-shell.tsx) e nessuna di esse chiama queste funzioni.
--
-- TRAPPOLA — il primo tentativo NON ha funzionato:
--   REVOKE EXECUTE ... FROM anon;      -- inefficace!
-- In PostgreSQL le funzioni nascono eseguibili da PUBLIC e `anon` eredita da
-- lì: finché il privilegio resta a PUBLIC, revocarlo al singolo ruolo non
-- toglie nulla. Serve revocare a PUBLIC e concedere esplicitamente.
--
-- PROBLEMA 2 — search_path mutabile
-- Su una funzione SECURITY DEFINER un search_path non fissato consente di
-- dirottare i nomi non qualificati verso oggetti creati da altri.
-- ============================================================================

DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.proname,
           pg_get_function_identity_arguments(p.oid) AS args,
           p.proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    IF f.proconfig IS NULL
       OR NOT EXISTS (SELECT 1 FROM unnest(f.proconfig) c WHERE c LIKE 'search_path=%') THEN
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', f.proname, f.args);
    END IF;

    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon', f.proname, f.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role', f.proname, f.args);
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICA
--   npm run test:rls      -> il blocco [1b] controlla proprio questo
--
--   SELECT p.proname,
--          has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth,
--          p.proconfig
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.prosecdef
--   ORDER BY 2 DESC, 1;
--   -- atteso: anon = false ovunque, search_path=public ovunque.
--
-- NOTA per il futuro: ogni NUOVA funzione SECURITY DEFINER nasce eseguibile da
-- PUBLIC. Va sempre chiusa alla creazione:
--   REVOKE ALL ON FUNCTION public.nome(args) FROM PUBLIC, anon;
--   GRANT EXECUTE ON FUNCTION public.nome(args) TO authenticated;
-- ============================================================================
