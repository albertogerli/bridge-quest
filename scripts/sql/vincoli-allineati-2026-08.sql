-- ============================================================================
-- BridgeLab: allineare i CHECK a quello che il codice scrive davvero
-- ============================================================================
--
-- IL MODO PEGGIORE DI SBAGLIARE: il database rifiuta e nessuno se ne accorge.
-- Due vincoli erano rimasti indietro rispetto al codice, e il risultato non è
-- un errore visibile ma un silenzio.
--
-- 1. `profiles.profile_type` ammetteva giovane/adulto/senior, mentre il codice
--    ha quattro profili da un pezzo: `src/hooks/use-profile.ts` dichiara
--    "junior" | "giovane" | "adulto" | "senior". Chi sceglie «junior» fa
--    fallire l'UPDATE che salva il profilo — e siccome quell'UPDATE porta con
--    sé anche XP, striscia e minuti giocati, un ragazzino che gioca non vede
--    salire NIENTE. Nessun messaggio, nessun errore in pagina: solo progressi
--    che non si muovono.
--
-- 2. `game_results.game_type` non conosceva «segnali» né «sfida-settimanale»,
--    che sono due giochi vivi. Le partite finivano in coda offline e da lì non
--    uscivano più: la coda riprova all'infinito righe che il database
--    rifiuterà sempre, e nel frattempo blocca quelle buone che stanno dietro.
--
-- COME SI EVITA CHE RISUCCEDA: i valori qui sotto vanno tenuti insieme
-- all'unione TypeScript che li produce. Se un giorno si aggiunge un gioco,
-- questo file va aggiornato nello stesso commit — e `npm run schema:check` lo
-- ricorda confrontando il baseline col database.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

alter table public.profiles drop constraint if exists profiles_profile_type_check;
alter table public.profiles
  add constraint profiles_profile_type_check
  check (profile_type = any (array['junior', 'giovane', 'adulto', 'senior']));

alter table public.game_results drop constraint if exists game_results_game_type_check;
alter table public.game_results
  add constraint game_results_game_type_check
  check (game_type = any (array[
    'compito', 'conta-veloce', 'dichiara', 'impasse', 'mano-del-giorno',
    'mano-guidata', 'memory', 'pratica-licita', 'quiz-lampo', 'segnali',
    'sfida', 'sfida-settimanale', 'smazzata', 'torneo', 'trova-errore'
  ]));

-- ── La scatola del ripasso dilazionato ──────────────────────────────────────
--
-- `review_items` non aveva la colonna `box`, mentre il metodo di Leitner —
-- che il codice usa da mesi (`src/lib/spaced-review.ts`) — è tutto lì dentro:
-- la scatola dice fra quanti giorni rivedere una domanda. Senza colonna, chi
-- cambiava dispositivo ritrovava ogni carta nella prima scatola e si rifaceva
-- da capo un ripasso già fatto. Cioè la funzione c'era ma non funzionava, e in
-- silenzio.
alter table public.review_items
  add column if not exists box smallint not null default 1
  check (box between 1 and 5);
