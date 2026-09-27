-- I cinque tipi di gioco aggiunti il 26/09 entrano anche nel database.
--
-- Dipendenze: game_results. Rollback: tipi-di-gioco-ammessi-2026-09-rollback.sql
-- (non simmetrico: vedi la nota lì dentro).
--
-- IL DIFETTO. Strumentando i giochi che non lasciavano traccia ho aggiunto
-- cinque valori all'unione `GameType` in TypeScript — cosa-apri,
-- quale-contratto, quiz-prese, licita, sfida-link — e mi sono fermato lì.
-- `game_results.game_type` ha un CHECK con l'elenco dei valori ammessi, e
-- quei cinque non c'erano. Ogni partita finita veniva rifiutata con 23514.
--
-- Quindi l'instrumentazione non ha mai salvato UNA riga: ho passato un
-- giorno a spiegare che «contare zero righe di una tabella in cui nessuno
-- scrive non dice che nessuno gioca», e poi ho fatto scrivere in una
-- tabella che rifiutava. Il tipo in TypeScript diceva che andava bene; il
-- vincolo nel database diceva di no; e i due non si parlano.
--
-- Da oggi si parlano: `tipi-di-gioco.test.ts` confronta l'unione TypeScript
-- con questo elenco e fallisce se divergono.

alter table public.game_results drop constraint if exists game_results_game_type_check;

alter table public.game_results add constraint game_results_game_type_check
  check (game_type = any (array[
    'compito', 'conta-veloce', 'cosa-apri', 'dichiara', 'impasse', 'licita',
    'mano-del-giorno', 'mano-guidata', 'memory', 'pratica-licita',
    'quale-contratto', 'quiz-lampo', 'quiz-prese', 'segnali', 'sfida',
    'sfida-link', 'sfida-settimanale', 'smazzata', 'torneo', 'trova-errore'
  ]::text[]));
