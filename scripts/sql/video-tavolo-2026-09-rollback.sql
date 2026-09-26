-- ROLLBACK di `video-tavolo-2026-09.sql`
--
-- Simmetrico: una colonna, nessun dato da conservare. Si perde solo quali
-- classi avevano acceso la telecamera — una scelta che l'insegnante rifà in un
-- tocco. Nessun contenuto è mai stato salvato, perché il video non passa da
-- qui.
--
-- Prima di eseguire: togliere dal codice il componente del video, che
-- altrimenti legge una colonna inesistente e la pagina del tavolo non si apre.

begin;
alter table public.classes drop column if exists video_tavolo;
commit;

-- Poi: node scripts/dump-schema.mjs e committare il baseline.
