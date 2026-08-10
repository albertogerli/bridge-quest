-- ============================================================================
-- STATO: APPLICATO in produzione il 2026-08-10 (migrazione Supabase
--   `bbo_username_taken_check`). Verificato con `npm run test:rls`, che ora
--   contiene il blocco [4] dedicato.
--   Questo file copre SOLO il punto 1 della proposta (blocco applicativo).
--   Il punto 2 — indice unico parziale su lower(btrim(bbo_username)) — NON è
--   ancora applicato: vedi "LIMITE NOTO" in fondo.
--
-- BridgeLab: due account non devono dichiarare lo stesso nome BBO
-- ============================================================================
--
-- PROBLEMA
-- `profiles.bbo_username` è l'identità dell'iscritto su BridgeBase Online e
-- l'app la usa per riconoscerlo (risultati, sfide, ricerca amici). Finora
-- nulla impediva a due account di dichiarare lo stesso handle: al 2026-08-10
-- risultano 18 handle condivisi da più account.
--
-- VINCOLI DEL CASO REALE
--   * Il campo è FACOLTATIVO e deve restarlo: su 1085 profili, 410 (38%) non
--     hanno un handle BBO, ed è legittimo — chi non gioca su BBO non ce l'ha.
--     Un valore vuoto non è mai "occupato".
--   * I 18 duplicati storici NON vengono toccati da questo intervento e gli
--     utenti coinvolti non devono essere bloccati sul resto del profilo: il
--     controllo scatta solo quando l'handle viene effettivamente modificato.
--   * Confronto senza distinzione fra maiuscole/minuscole e ignorando gli
--     spazi ai bordi: lower(btrim(...)).
--
-- SOLUZIONE (punto 1)
-- Una funzione che risponde con UN SOLO BIT alla domanda "questo handle è già
-- di un altro account?". Non c'è alternativa dal client: su `profiles` i
-- privilegi di colonna e le RLS impediscono di leggere `bbo_username` altrui
-- (vedi pii-columns-2026-08.sql) e in registrazione il chiamante è ancora
-- anonimo.
--
-- PERCHÉ È SICURO CONCEDERLA AD `anon`
-- È l'unica funzione SECURITY DEFINER del progetto eseguibile da anonimo, in
-- deroga consapevole a definer-hardening-2026-08.sql, perché:
--   1. il tipo di ritorno è `boolean`: non può veicolare righe, nomi, id o
--      qualunque altro dato personale, nemmeno per errore o per regressione;
--   2. NON accetta un id da escludere. L'esclusione del proprio profilo usa
--      `auth.uid()`, preso dal JWT e non falsificabile dal chiamante. Con un
--      parametro `p_exclude_user_id` un attaccante avrebbe potuto usarla come
--      oracolo per collegare un id utente a un handle ("è ancora occupato se
--      escludo Tizio?"); così no. Da anonimo `auth.uid()` è NULL e non esclude
--      nulla, che è esattamente il comportamento voluto in registrazione;
--   3. risponde solo su un valore che il chiamante ha già in mano. Resta
--      possibile sondare handle uno per uno per sapere se sono usati: è
--      inerente alla domanda "questo nome è libero?" (la stessa che si può
--      fare su BBO), e non rivela a CHI appartengano.
--
-- TRAPPOLA (già incontrata in definer-hardening-2026-08.sql)
-- Le funzioni nascono eseguibili da PUBLIC e `anon` eredita da lì: un
-- `REVOKE ... FROM anon` da solo è inefficace. Va revocato a PUBLIC e concesso
-- esplicitamente ai ruoli che servono — qui incluso `anon`.
-- ATTENZIONE per il futuro: il blocco DO di definer-hardening-2026-08.sql, se
-- rieseguito, revoca `anon` su TUTTE le funzioni SECURITY DEFINER e quindi
-- romperebbe il controllo in registrazione. Dopo averlo rieseguito, ridare la
-- GRANT qui sotto.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_bbo_username_taken(p_bbo_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN coalesce(btrim(p_bbo_username), '') = '' THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.bbo_username IS NOT NULL
        AND lower(btrim(p.bbo_username)) = lower(btrim(p_bbo_username))
        AND p.id IS DISTINCT FROM auth.uid()
    )
  END;
$$;

COMMENT ON FUNCTION public.is_bbo_username_taken(text) IS
  'true se un ALTRO account ha già questo nome BBO (confronto lower(btrim)). Esclude auth.uid(). Vuoto => false. Restituisce solo un booleano: nessun dato personale, per questo è eseguibile anche da anon (registrazione pre-login). Vedi scripts/sql/bbo-username-unique-2026-08.sql';

REVOKE ALL ON FUNCTION public.is_bbo_username_taken(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_bbo_username_taken(text)
  TO anon, authenticated, service_role;

-- ============================================================================
-- VERIFICA
--   npm run test:rls      -> il blocco [4] copre, contro il database reale:
--                            handle libero, handle occupato, il proprio handle
--                            non occupato per sé stesso, e il fatto che la
--                            funzione restituisca solo un booleano.
--   npm test              -> src/lib/bbo-username.test.ts (normalizzazione)
--
--   -- privilegi e search_path
--   SELECT p.proname,
--          has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth,
--          p.proconfig
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname = 'is_bbo_username_taken';
--   -- atteso: anon = true, auth = true, proconfig = {search_path=public}
--
--   -- comportamento
--   SELECT public.is_bbo_username_taken('')                AS vuoto;      -- false
--   SELECT public.is_bbo_username_taken('   ')             AS spazi;      -- false
--   SELECT public.is_bbo_username_taken(NULL)              AS nullo;      -- false
--   SELECT public.is_bbo_username_taken('  UnHandleEsistente ');          -- true
--
--   -- i duplicati storici, che questo intervento NON tocca
--   SELECT lower(btrim(bbo_username)) AS h, count(*)
--   FROM public.profiles
--   WHERE coalesce(btrim(bbo_username), '') <> ''
--   GROUP BY 1 HAVING count(*) > 1 ORDER BY 2 DESC;
--
-- RIPRISTINO (se il controllo va rimosso)
--   DROP FUNCTION IF EXISTS public.is_bbo_username_taken(text);
--   -- e togliere le chiamate in src/lib/bbo-username.ts. Nessun dato viene
--   -- modificato da questo script: non c'è nulla da ripristinare sulle righe.
--
-- LIMITE NOTO — la corsa
-- Fra il controllo e la scrittura c'è una finestra: due registrazioni
-- simultanee con lo stesso handle possono passare entrambe il controllo e
-- inserire entrambe. Il blocco applicativo copre il caso reale (una persona
-- che digita un handle già usato), non la concorrenza. La garanzia forte
-- arriverà con il punto 2 della proposta, non ancora applicato:
--
--   CREATE UNIQUE INDEX CONCURRENTLY profiles_bbo_username_unique_idx
--     ON public.profiles (lower(btrim(bbo_username)))
--     WHERE coalesce(btrim(bbo_username), '') <> '';
--
-- Non è applicabile finché esistono i 18 duplicati storici: vanno risolti
-- prima, caso per caso. Stessa espressione di confronto usata qui, in modo che
-- il vincolo e il controllo applicativo non possano divergere.
-- ============================================================================
