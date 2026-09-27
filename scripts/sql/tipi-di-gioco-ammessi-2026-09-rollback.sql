-- Rollback di tipi-di-gioco-ammessi-2026-09.sql.
--
-- NON È SIMMETRICO. Rimette i quindici valori di prima, ma se nel frattempo
-- sono state salvate partite dei cinque tipi nuovi il vincolo non si può
-- aggiungere: Postgres lo verifica sulle righe esistenti e fallisce.
-- In quel caso vanno prima cancellate quelle righe — cioè partite vere di
-- persone vere. Da qui si torna indietro solo entro poche ore.

alter table public.game_results drop constraint if exists game_results_game_type_check;

alter table public.game_results add constraint game_results_game_type_check
  check (game_type = any (array[
    'compito', 'conta-veloce', 'dichiara', 'impasse', 'mano-del-giorno',
    'mano-guidata', 'memory', 'pratica-licita', 'quiz-lampo', 'segnali',
    'sfida', 'sfida-settimanale', 'smazzata', 'torneo', 'trova-errore'
  ]::text[]));
