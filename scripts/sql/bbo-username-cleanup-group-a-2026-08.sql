-- ============================================================================
-- STATO: APPLICATO in produzione il 2026-08-10 (migrazione Supabase
--   `bbo_username_cleanup_group_a`). Verificato: 9 handle liberati, per
--   ciascuno resta esattamente 1 account, gli XP dei profili ripuliti sono
--   intatti. Duplicati residui: 9 (gruppi B e C, non toccati).
--
-- BridgeLab: pulizia dei nomi BBO duplicati — GRUPPO A
-- ============================================================================
--
-- CONTESTO
-- Segnalazione di un'utente: aveva cercato un'amica tramite il nome BBO e la
-- richiesta era arrivata a un'altra persona. Causa: due account BridgeLab
-- dichiaravano lo stesso nome BBO. Su BBO gli handle sono unici al mondo,
-- quindi ogni duplicato è per definizione un errore di inserimento (qualcuno
-- ha scritto il proprio nome di battesimo invece del proprio handle, o si è
-- iscritto due volte).
--
-- Ricognizione al 2026-08-10: 18 handle duplicati su 1.087 profili.
-- Divisi in tre gruppi:
--
--   A (9)  Un account attivo e uno abbandonato subito dopo l'iscrizione.
--          Es. CarmBi 39.600 XP contro 1.225; pppp4 31.730 contro 15.
--          -> risolti qui, azzerando l'handle sull'account con meno attività.
--
--   B (4)  pierlouis (3 account, 2 nello stesso circolo F0141), mrzvll, didi,
--          franca: stesso nome visualizzato su entrambi gli account, quasi
--          certamente la stessa persona iscritta due volte con progressi
--          divisi. -> non toccati: si scrive alle persone (bozze in
--          docs/email-bbo-duplicati-2026-08.md), la scelta di quale profilo
--          tenere è loro.
--
--   C (5)  anna, theprof197, esse52, giardine, miki: nomi visualizzati diversi
--          o circoli diversi (theprof197: F0675 e F0240) — probabilmente
--          persone DIVERSE che hanno inserito un nome proprio al posto
--          dell'handle. -> lasciati come sono per decisione esplicita: senza
--          conferma dell'interessato non si può stabilire chi ha diritto
--          all'handle. Il blocco applicativo impedisce comunque che il
--          problema si aggravi.
--
-- COSA FA QUESTA MIGRAZIONE
-- Azzera `bbo_username` sui 9 account "deboli" del gruppo A, dopo averne
-- salvato il valore in una tabella di backup. NON cancella account, NON tocca
-- XP, progressi, badge o circolo: la persona resta iscritta e può reinserire
-- il proprio handle dal profilo in qualsiasi momento.
--
-- REVERSIBILITÀ
-- `bbo_username_cleanup_2026_08` conserva (profile_id, old_bbo_username,
-- reason, cleared_at). RLS attiva e nessuna policy: la tabella è leggibile
-- solo dalla service role.
--
-- PERCHÉ NON UN INDICE UNICO (ancora)
-- L'indice unico parziale è il punto 2 del piano e resta bloccato finché
-- esistono i 9 duplicati dei gruppi B e C: crearlo ora fallirebbe. Vedi
-- bbo-username-unique-2026-08.sql per il blocco applicativo già attivo.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bbo_username_cleanup_2026_08 (
  profile_id        uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_bbo_username  text NOT NULL,
  reason            text NOT NULL,
  cleared_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bbo_username_cleanup_2026_08 ENABLE ROW LEVEL SECURITY;

WITH target_handles(h) AS (
  VALUES ('carmbi'),('pppp4'),('scsi69'),('laura'),('luigi'),
         ('scolarin'),('herdonia'),('silvia'),('lorella')
), ranked AS (
  -- Il "vincitore" è l'account con più XP; a parità, più mani giocate; a
  -- parità ancora, il più vecchio. Nei 9 casi il distacco è netto e nessun
  -- criterio di spareggio è stato realmente necessario.
  SELECT p.id, p.bbo_username,
         row_number() OVER (
           PARTITION BY lower(btrim(p.bbo_username))
           ORDER BY p.xp DESC, p.hands_played DESC, p.created_at ASC
         ) AS rank
  FROM public.profiles p
  JOIN target_handles t ON lower(btrim(p.bbo_username)) = t.h
), losers AS (
  SELECT id, bbo_username FROM ranked WHERE rank > 1
)
INSERT INTO public.bbo_username_cleanup_2026_08 (profile_id, old_bbo_username, reason)
SELECT id, bbo_username, 'gruppo A: handle duplicato, account con meno attività'
FROM losers
ON CONFLICT (profile_id) DO NOTHING;

UPDATE public.profiles p
SET bbo_username = NULL
FROM public.bbo_username_cleanup_2026_08 b
WHERE p.id = b.profile_id AND p.bbo_username IS NOT NULL;

-- ============================================================================
-- VERIFICA (eseguita, esito riportato in cima)
--
--   -- quanti handle sono ancora duplicati, e quali
--   SELECT lower(btrim(bbo_username)) AS handle, count(*)
--   FROM public.profiles
--   WHERE bbo_username IS NOT NULL AND btrim(bbo_username) <> ''
--   GROUP BY 1 HAVING count(*) > 1 ORDER BY 1;
--
--   -- per ogni handle liberato: resta 1 solo account, e gli XP del profilo
--   -- ripulito non sono stati toccati
--   SELECT b.old_bbo_username,
--          (SELECT count(*) FROM public.profiles p2
--           WHERE lower(btrim(p2.bbo_username)) = lower(btrim(b.old_bbo_username))) AS superstiti,
--          (SELECT p.xp FROM public.profiles p WHERE p.id = b.profile_id) AS xp_intatti
--   FROM public.bbo_username_cleanup_2026_08 b;
--   -- ATTENZIONE: confrontare lower(btrim(...)) su ENTRAMBI i lati.
--   -- old_bbo_username conserva la grafia originale ("CarmBi", "LUIGI"): un
--   -- confronto con il solo lower() a sinistra restituisce NULL e sembra,
--   -- a torto, che il superstite non esista.
--
-- RIPRISTINO (annulla tutto)
--   UPDATE public.profiles p SET bbo_username = b.old_bbo_username
--   FROM public.bbo_username_cleanup_2026_08 b WHERE p.id = b.profile_id;
-- ============================================================================
