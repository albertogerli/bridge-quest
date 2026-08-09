-- ============================================================================
-- BridgeLab: abilitare Supabase Realtime su amicizie e sfide
--
-- PERCHÉ
-- L'app oggi scopre le nuove richieste di amicizia e le nuove sfide con un
-- polling ogni 30 secondi (`use-friends`, `use-challenges`,
-- `pending-challenges-banner`). Sono ~120 richieste/ora per utente attivo,
-- e la notifica arriva con mezzo minuto di ritardo.
--
-- VERIFICATO IL 2026-08-09: una subscription `postgres_changes` su
-- `friendships` viene accettata dal server ma **non riceve alcun evento**,
-- perché la tabella non fa parte della publication `supabase_realtime`.
-- (La chat di classe funziona perché `class_messages` vi è già inclusa.)
-- Senza questo script, qualunque codice Realtime sarebbe silenziosamente
-- inerte: è la ragione per cui il client non è ancora stato modificato.
--
-- SICUREZZA
-- Realtime rispetta le RLS: ogni utente riceve solo gli eventi delle righe
-- che potrebbe comunque leggere con una SELECT. Non serve altro.
-- ============================================================================

-- Idempotente: non fallisce se la tabella è già nella publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'challenges'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
  END IF;
END $$;

-- ============================================================================
-- VERIFICA
--   SELECT tablename FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
--   ORDER BY tablename;
--
-- Dopo l'esecuzione, avvisare chi sviluppa: il client può passare da polling
-- a Realtime (mantenendo un poll lento di sicurezza) e la modifica diventa
-- finalmente testabile.
--
-- RIPRISTINO
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.friendships;
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.challenges;
-- ============================================================================
