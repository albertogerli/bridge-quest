-- ============================================================================
-- STATO: APPLICATO in produzione il 2026-08-11 (migrazione Supabase
--   `partner_matching`). Verificato con `npm run test:rls`, blocco [5]:
--   10 controlli, fra cui "chi non si è iscritto non compare nell'elenco".
--
-- BridgeLab: "Trova un compagno" (partner matching)
-- ============================================================================
--
-- PERCHÉ
-- Richiesto dall'offerta Adiacent alla gara FIGB: «una delle barriere più
-- citate nella ricerca preliminare è "non ho nessuno con cui giocare"».
-- I dati interni lo confermano: nei tre mesi al 2026-08-10 la sfida a un amico
-- ha avuto 144 visitatori contro i 4.400 della sfida al computer — trenta
-- volte meno. La ricerca amici esistente funziona solo se sai già chi cercare.
--
-- PRINCIPIO: nessuno compare nell'elenco senza averlo chiesto.
-- La tabella nasce vuota e si popola solo su azione esplicita dell'utente.
-- Pubblicare provincia e livello di 1.087 persone che non l'hanno chiesto
-- avrebbe trasformato una funzione utile in una violazione.
--
-- DATI RACCOLTI: il minimo che serve a far incontrare due persone.
--   * livello DICHIARATO, non dedotto dall'XP: si possono avere molti punti e
--     sentirsi comunque principianti al tavolo;
--   * provincia (sigla) — non la città, non l'indirizzo, non le coordinate;
--   * fasce di disponibilità grossolane (mattina/pomeriggio/sera/weekend).
--     Un calendario preciso invecchierebbe subito e direbbe a estranei quando
--     non si è in casa.
--
-- DATI DELIBERATAMENTE NON RACCOLTI
--   * età esatta: si sarebbe potuta usare `profile_type`, ma non serve al
--     matching e aggiunge una categoria sensibile;
--   * campo note libero: sarebbe diventato il posto in cui le persone
--     scrivono il proprio numero di telefono in chiaro, visibile a tutti gli
--     iscritti. Il contatto passa dalle richieste di amicizia, dove l'email
--     non è mai esposta e il destinatario può rifiutare.
--
-- USCITA: si spegne `looking`, non si cancella la riga, così chi rientra
-- ritrova le proprie impostazioni. La propria scheda resta sempre leggibile a
-- sé stessi anche da ritirati (altrimenti non si potrebbero rivedere).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partner_profiles (
  user_id      uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  looking      boolean NOT NULL DEFAULT true,
  level        text NOT NULL CHECK (level IN ('principiante','intermedio','avanzato')),
  province     text CHECK (province IS NULL OR province ~ '^[A-Z]{2}$'),
  availability text[] NOT NULL DEFAULT '{}'
                 CHECK (availability <@ ARRAY['mattina','pomeriggio','sera','weekend']::text[]),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- I vincoli CHECK non sono una ridondanza della UI: senza, un client
-- qualsiasi può scrivere un livello o una fascia inventati, che finirebbero
-- poi nell'interfaccia di tutti gli altri.

CREATE INDEX IF NOT EXISTS partner_profiles_looking_idx
  ON public.partner_profiles (looking, province) WHERE looking;

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partner_profiles_select ON public.partner_profiles;
DROP POLICY IF EXISTS partner_profiles_insert ON public.partner_profiles;
DROP POLICY IF EXISTS partner_profiles_update ON public.partner_profiles;
DROP POLICY IF EXISTS partner_profiles_delete ON public.partner_profiles;

CREATE POLICY partner_profiles_select ON public.partner_profiles
  FOR SELECT TO authenticated
  USING (looking OR user_id = auth.uid());

CREATE POLICY partner_profiles_insert ON public.partner_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY partner_profiles_update ON public.partner_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY partner_profiles_delete ON public.partner_profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Elenco dei candidati.
--
-- Una funzione e non una SELECT con embed PostgREST: così le colonne
-- restituite sono un elenco chiuso deciso qui, e nessuna colonna aggiunta un
-- domani a `profiles` può finire nell'elenco per errore.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_partner_candidates(
  p_level        text     DEFAULT NULL,
  p_province     text     DEFAULT NULL,
  p_availability text[]   DEFAULT NULL,
  p_limit        integer  DEFAULT 60
)
RETURNS TABLE (
  user_id uuid, display_name text, avatar_url text, asd_name text,
  level text, province text, availability text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pp.user_id, p.display_name, p.avatar_url, p.asd_name,
         pp.level, pp.province, pp.availability
  FROM public.partner_profiles pp
  JOIN public.profiles p ON p.id = pp.user_id
  WHERE auth.uid() IS NOT NULL
    AND pp.looking
    AND pp.user_id <> auth.uid()
    AND (p_level    IS NULL OR pp.level = p_level)
    AND (p_province IS NULL OR pp.province = p_province)
    AND (p_availability IS NULL OR pp.availability && p_availability)
    AND NOT EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = pp.user_id)
         OR (f.friend_id = auth.uid() AND f.user_id = pp.user_id)
    )
  ORDER BY
    (pp.province IS NOT DISTINCT FROM (
      SELECT province FROM public.partner_profiles WHERE user_id = auth.uid()
    )) DESC,
    p.last_login DESC NULLS LAST
  LIMIT least(greatest(coalesce(p_limit, 60), 1), 100);
$$;

REVOKE ALL ON FUNCTION public.list_partner_candidates(text, text, text[], integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_partner_candidates(text, text, text[], integer) TO authenticated, service_role;

-- ============================================================================
-- VERIFICA
--   npm run test:rls   -> blocco [5], 10 controlli, tutti OK
--
--   -- quante persone si sono messe in cerca
--   SELECT count(*) FILTER (WHERE looking) AS in_cerca, count(*) AS schede_totali
--   FROM public.partner_profiles;
--
-- RIPRISTINO
--   DROP FUNCTION IF EXISTS public.list_partner_candidates(text, text, text[], integer);
--   DROP TABLE IF EXISTS public.partner_profiles;
--   (togliere anche "partner_profiles" da PRIVATE_TABLES in scripts/test-rls.mjs
--    e il blocco [5], altrimenti la verifica fallisce)
-- ============================================================================
