-- ============================================================================
-- Il registro degli script applicati
--
-- ESEGUIRE A MANO su Supabase → SQL Editor.
-- Rollback: `registro-script-2026-10-rollback.sql`
-- DOPO: `node scripts/dump-schema.mjs` e committare il baseline.
--
-- ----------------------------------------------------------------------------
-- PERCHÉ
--
-- Gli script di `scripts/sql/` si eseguono a mano, e finora l'unico modo di
-- sapere se uno era già passato era ricordarselo. Dimenticarne uno non dà
-- errori: produzione e repository divergono in silenzio finché qualcosa non
-- chiede una colonna che non c'è.
--
-- Da qui in avanti ogni script termina registrandosi in questa tabella (la
-- riga `insert into public.script_applicati …` in fondo), e
-- `node scripts/sql-stato.mjs` elenca quelli presenti nel repository e non
-- ancora applicati. Non è una catena di migrazioni automatica: è il modo più
-- piccolo di rendere visibile l'unico errore che oggi non si vede.
--
-- GLI SCRIPT PRECEDENTI si registrano qui come «retroattivi»: erano tutti nel
-- repository il 2 ottobre 2026 e lo schema di produzione di quel giorno è
-- quello di `000-schema-baseline.sql`. È un atto di fiducia, dichiarato come
-- tale nella colonna `retroattivo`.
--
-- Gli script `test-*.sql` non sono modifiche dello schema ma prove da eseguire
-- su un database di prova: restano fuori dal registro.
--
-- Solo il ruolo di servizio la legge e la scrive: RLS attiva, nessuna policy.
-- ============================================================================

begin;

create table if not exists public.script_applicati (
  nome text primary key,
  applicato_il timestamptz not null default now(),
  retroattivo boolean not null default false
);

alter table public.script_applicati enable row level security;
revoke all on public.script_applicati from anon, authenticated;

insert into public.script_applicati (nome, retroattivo) values
  ('001-supabase-substrate.sql', true),
  ('account-deletion-gap-2026-08.sql', true),
  ('add-platform-tracking.sql', true),
  ('adesioni-lezione-zero-2026-09.sql', true),
  ('admin-email-2026-08.sql', true),
  ('admin-login-history-2026-08.sql', true),
  ('admin_classes.sql', true),
  ('admin_game_stats.sql', true),
  ('admin_school_stats.sql', true),
  ('archivio-cartelle-2026-09.sql', true),
  ('archivio-mani-2026-08.sql', true),
  ('asd-code-migration.sql', true),
  ('asd-name-riallineamento-2026-08.sql', true),
  ('assegna-lezione-2026-08.sql', true),
  ('aste-torneo-2026-09.sql', true),
  ('aula-multi-tavolo-2026-08.sql', true),
  ('bacheca-circolo-2026-08.sql', true),
  ('bbo-username-cleanup-group-a-2026-08.sql', true),
  ('bbo-username-unique-2026-08.sql', true),
  ('class_chat.sql', true),
  ('class_leaderboard.sql', true),
  ('classifica-anonima-2026-09.sql', true),
  ('classifica-settimanale-2026-09.sql', true),
  ('coda-sfide-coppie-2026-08.sql', true),
  ('codice-amico-2026-08.sql', true),
  ('confronto-filtrato-2026-08.sql', true),
  ('contenuti-inglese-2026-08.sql', true),
  ('daily_field_stats.sql', true),
  ('definer-hardening-2026-08.sql', true),
  ('dump-schema-2026-08.sql', true),
  ('elenco-allievi-2026-08.sql', true),
  ('email-automation.sql', true),
  ('email-compiti-2026-08.sql', true),
  ('engagement-targets-leak-2026-08.sql', true),
  ('esercizi-posizione-2026-08.sql', true),
  ('esercizio-senza-soluzione-2026-09.sql', true),
  ('evento-pubblico-2026-09.sql', true),
  ('first_attempt_results.sql', true),
  ('forum-polls.sql', true),
  ('forum_comments_threading.sql', true),
  ('friends-challenges.sql', true),
  ('game-leaderboard-rpc.sql', true),
  ('game_results.sql', true),
  ('glossary-quiz-en-2026-09.sql', true),
  ('ingresso-ospite-2026-08.sql', true),
  ('instructor_portal.sql', true),
  ('instructor_request_message.sql', true),
  ('instructor_requests.sql', true),
  ('iscrizioni-e-ciclo-classe-2026-08.sql', true),
  ('libreria-2026-08.sql', true),
  ('licita-a-due-2026-08.sql', true),
  ('licita-amico-serie-2026-10.sql', true),
  ('login-history.sql', true),
  ('mani-compito-senza-corsa-2026-09.sql', true),
  ('mani-della-lezione-2026-08.sql', true),
  ('minibridge-compiti-2026-08.sql', true),
  ('modelli-mani-2026-08.sql', true),
  ('note-smazzate-2026-08.sql', true),
  ('partner-matching-2026-08.sql', true),
  ('pbn_import.sql', true),
  ('pii-columns-2026-08.sql', true),
  ('posti-aula-2026-09.sql', true),
  ('presenze-e-date-2026-09.sql', true),
  ('product-features.sql', true),
  ('realtime-publication-2026-08.sql', true),
  ('replay-e-confronto-2026-08.sql', true),
  ('replica-identity-2026-08.sql', true),
  ('respinto-non-si-riammette-2026-09.sql', true),
  ('review-sync-2026-09.sql', true),
  ('revisione-quando-decide-2026-09.sql', true),
  ('risultati-stessa-mano-2026-09.sql', true),
  ('rubinetto-e-livello-2026-09.sql', true),
  ('scenari-e-mani-2026-08.sql', true),
  ('schema-reconstruction-2026-09.sql', true),
  ('schema-reconstruction-identity-2026-09.sql', true),
  ('security-fixes-2026-08.sql', true),
  ('segnalazioni-2026-08.sql', true),
  ('sfida-coppie-2026-08.sql', true),
  ('soluzioni-dopo-il-gioco-2026-08.sql', true),
  ('sondaggi-2026-08.sql', true),
  ('statistiche-sfide-2026-08.sql', true),
  ('tavolo-condiviso-2026-08.sql', true),
  ('tavolo-giocabile-2026-08.sql', true),
  ('tipi-di-gioco-ammessi-2026-09.sql', true),
  ('tocca-a-te-2026-08.sql', true),
  ('tornei-licita-2026-08.sql', true),
  ('tournament-history-2026-08.sql', true),
  ('turno-in-attesa-2026-09.sql', true),
  ('upgrade-session-18.sql', true),
  ('video-tavolo-2026-09.sql', true),
  ('videoconferenza-2026-08.sql', true),
  ('vincoli-allineati-2026-08.sql', true)
on conflict (nome) do nothing;

insert into public.script_applicati (nome) values ('registro-script-2026-10.sql')
on conflict (nome) do nothing;

commit;
