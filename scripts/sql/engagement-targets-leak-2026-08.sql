-- ============================================================================
-- STATO: APPLICATO in produzione l'11/08/2026 (migrazione Supabase
--   `fix_engagement_targets_pii_leak`). Verificato con `npm run test:rls`:
--   "get_engagement_targets(): negata a un utente qualunque".
--
-- BridgeLab: falla PII — le email degli iscritti erano leggibili da chiunque
--            avesse un account
-- ============================================================================
--
-- COSA SUCCEDEVA
-- `get_engagement_targets(p_limit integer DEFAULT 300)` restituisce
-- `TABLE(user_id uuid, email text, display_name text, ...)` e serve al cron
-- delle email di riattivazione. Era eseguibile dal ruolo `authenticated`
-- senza alcun controllo sul chiamante.
--
-- Verificato in produzione, non dedotto: creato un account nuovo di zecca e
-- chiamato /rest/v1/rpc/get_engagement_targets, sono tornate righe con
-- indirizzi email reali di altri iscritti. Il limite predefinito è 300.
--
-- Chiunque potesse registrarsi — cioè chiunque — poteva estrarre l'anagrafica
-- email della piattaforma.
--
-- CAUSA
-- In PostgreSQL le funzioni nascono eseguibili da PUBLIC, e `anon` e
-- `authenticated` ereditano da lì. È esattamente la causa del caso
-- `search_users` del 2026-08-09 (vedi security-fixes-2026-08.sql): allora si
-- era imparato che REVOKE dai singoli ruoli non basta, serve anche da PUBLIC.
-- Questa funzione era sfuggita alla revisione di allora.
--
-- COME È EMERSA
-- Dal linter di Supabase (`get_advisors`), incrociando l'avviso
-- "Signed-In Users Can Execute SECURITY DEFINER Function" con il tipo di
-- ritorno delle funzioni segnalate: la maggior parte degli avvisi è innocua
-- perché il controllo sta dentro il corpo, ma questa restituiva `email` e non
-- controllava nulla. Vale la pena rifare quell'incrocio a ogni funzione nuova.
--
-- IMPATTO
-- Nessuna prova di sfruttamento: non esistono log applicativi delle chiamate
-- RPC per il periodo, quindi non è possibile affermare né che sia avvenuto né
-- che non lo sia. I dati esposti erano email, nome visualizzato e tipo di
-- profilo — nessuna password, nessun dato di pagamento.
-- ============================================================================

REVOKE ALL ON FUNCTION public.get_engagement_targets(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_engagement_targets(integer) TO service_role;

-- Funzioni che accettano un user_id senza verificare chi chiama: non
-- contengono email, ma non c'è motivo che siano interrogabili su terzi da un
-- anonimo. La UI le usa sempre sull'utente corrente.
REVOKE ALL ON FUNCTION public.get_challenge_history(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_challenge_history(uuid, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_challenge_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_challenge_stats(uuid) TO authenticated, service_role;

-- Le ultime due funzioni con search_path modificabile (rilievo del linter).
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_invite_code() SET search_path = public;

-- ============================================================================
-- VERIFICA
--   npm run test:rls
--     -> "get_engagement_targets(): negata a un utente qualunque"
--
--   -- il cron deve continuare a funzionare (service role)
--   SELECT count(*) FROM get_engagement_targets(5);   -- atteso: > 0
--
--   SELECT proname, array_to_string(proacl,' | ') AS permessi
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND proname = 'get_engagement_targets';
--   -- atteso: solo postgres e service_role
--
-- RIPRISTINO — sconsigliato, riaprirebbe la falla.
-- ============================================================================
