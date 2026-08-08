-- ============================================================================
-- BridgeLab: correzioni di sicurezza emerse dalle perizie tecniche (2026-08)
-- Eseguire su Supabase Dashboard -> SQL Editor.
--
-- Contenuto:
--   1. profiles: PII non più leggibile in forma anonima (solo utenti autenticati)
--   2. profiles: INSERT vincolato al proprio id (era WITH CHECK true)
--   3. login_history: ogni utente legge SOLO il proprio storico (era USING true)
--   4. tournament_results: tabella mancante ma usata dal codice (classifica
--      del torneo settimanale) — creazione con RLS
--
-- Nota operativa (impostazioni dashboard, non SQL):
--   - Auth -> Providers -> Email: alzare la password minima a 8+ caratteri
--     e attivare "Leaked password protection".
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1+2. profiles: rimuove le policy SELECT/INSERT esistenti (una SELECT
-- permetteva la lettura anonima dell'intera tabella: 1.083 nominativi,
-- handle BBO e affiliazioni ASD scaricabili con la sola anon key) e le
-- ricrea ristrette. La lettura resta aperta a TUTTI gli utenti autenticati
-- perché classifica, amici, forum e admin mostrano i display_name altrui.
-- ----------------------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd IN ('SELECT', 'INSERT')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', p.policyname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. login_history: la policy si chiamava "Users can read own login history"
-- ma aveva USING (true) — ogni autenticato leggeva lo storico di tutti.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own login history" ON public.login_history;

CREATE POLICY "Users can read own login history"
  ON public.login_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. tournament_results: il codice (src/app/gioca/torneo/page.tsx) fa upsert
-- e legge la classifica da questa tabella, che però non esiste in produzione:
-- il salvataggio fallisce in silenzio e la classifica del torneo è vuota.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_num integer NOT NULL,
  total_tricks integer NOT NULL DEFAULT 0,
  total_needed integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_num)
);

CREATE INDEX IF NOT EXISTS idx_tournament_results_week
  ON public.tournament_results (week_num, total_tricks DESC);

ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- La classifica è visibile a tutti gli utenti loggati.
CREATE POLICY "Authenticated can read tournament results"
  ON public.tournament_results
  FOR SELECT
  TO authenticated
  USING (true);

-- Ognuno scrive/aggiorna solo il proprio risultato (upsert = INSERT + UPDATE).
CREATE POLICY "Users can insert own tournament result"
  ON public.tournament_results
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tournament result"
  ON public.tournament_results
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Verifiche post-esecuzione (facoltative):
--   SELECT tablename, policyname, cmd, roles, qual
--   FROM pg_policies WHERE tablename IN ('profiles','login_history','tournament_results');
-- Test con anon key (deve restituire 0 righe):
--   curl "$SUPABASE_URL/rest/v1/profiles?select=display_name&limit=5" \
--     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
-- ============================================================================
