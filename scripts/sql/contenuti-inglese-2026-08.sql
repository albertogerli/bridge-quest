-- ============================================================================
-- BridgeLab: i contenuti didattici anche in inglese
-- ============================================================================
--
-- Fase 4 di `docs/i18n-inglese.md`. Aggiunge accanto a ogni campo testuale la
-- sua versione inglese, con il suffisso `_en`.
--
-- PERCHÉ COLONNE E NON UNA TABELLA DI TRADUZIONI. Le lingue sono due e il
-- catalogo si legge a ogni avvio dell'applicazione: una tabella `traduzioni`
-- vorrebbe dire un join in più su ogni lettura, proprio nel punto che già
-- pesa. Con due lingue la tabella è complessità pagata in anticipo per
-- un'ipotesi; se un giorno servissero francese e tedesco si migra, e sarà una
-- migrazione meccanica.
--
-- NULL VUOL DIRE «NON ANCORA TRADOTTO», e il codice ripiega sull'italiano. È
-- ciò che permette di tradurre un corso alla volta con il sito vivo: una
-- lezione senza inglese si legge in italiano invece di mostrare un buco. Non
-- si mettono default: una stringa vuota sarebbe indistinguibile da una
-- traduzione fatta male, e nessuno saprebbe più cosa manca.
--
-- QUANTO C'È DA TRADURRE, misurato il 18/08/2026: 596.000 caratteri, circa
-- 90.000 parole, di cui 281.000 nei moduli delle lezioni e 179.000 nei commenti
-- alle smazzate.
--
-- IDEMPOTENTE: si può rieseguire.
-- ============================================================================

-- ── Il percorso: corsi, mondi, lezioni, moduli ──────────────────────────────
alter table public.courses
  add column if not exists name_en text,
  add column if not exists subtitle_en text;

alter table public.course_worlds
  add column if not exists name_en text,
  add column if not exists subtitle_en text;

alter table public.lessons
  add column if not exists title_en text,
  add column if not exists subtitle_en text;

-- `content` è un array di blocchi tipizzati (text, quiz, heading, rule,
-- example, true-false): la versione inglese ha la STESSA struttura con i soli
-- campi di testo tradotti. Tenerla come jsonb, e non come testo piatto,
-- significa che il codice la può usare senza sapere in che lingua è.
alter table public.lesson_modules
  add column if not exists title_en text,
  add column if not exists content_en jsonb;

-- ── Le smazzate commentate ──────────────────────────────────────────────────
-- Il commento è la parte che insegna: senza, la mano è solo tredici carte.
alter table public.smazzate
  add column if not exists title_en text,
  add column if not exists commentary_en text;

-- ── Glossario, eserciziario, trova-errore, carte ────────────────────────────
alter table public.glossary
  add column if not exists term_en text,
  add column if not exists definition_en text,
  add column if not exists example_en text;

-- `content` qui è jsonb come nei moduli: domande e spiegazioni stanno dentro.
alter table public.eserciziario_exercises
  add column if not exists title_en text,
  add column if not exists content_en jsonb;

alter table public.trova_errore_scenarios
  add column if not exists situation_en text,
  add column if not exists error_description_en text,
  add column if not exists explanation_en text;

alter table public.collectible_cards
  add column if not exists name_en text,
  add column if not exists description_en text;

-- ── Quando è stata tradotta, e da quale versione italiana ───────────────────
--
-- SERVE PER SAPERE COSA È INVECCHIATO. Ogni correzione al testo italiano — e
-- ne facciamo di continuo — lascia indietro l'inglese, in silenzio. Con
-- l'impronta del testo italiano al momento della traduzione si può chiedere al
-- database «quali righe sono cambiate da allora», invece di scoprirlo da un
-- lettore. È lo stesso problema della deriva dello schema, e si risolve allo
-- stesso modo: registrando da cosa si è partiti.
create table if not exists public.traduzioni_stato (
  tabella text not null,
  riga_id text not null,
  campo text not null,
  -- md5 del testo italiano da cui è nata la traduzione.
  impronta_it text not null,
  tradotto_il timestamptz not null default now(),
  primary key (tabella, riga_id, campo)
);

alter table public.traduzioni_stato enable row level security;

-- Sola lettura per chi è autenticato: è informazione di servizio, non c'è
-- niente di personale, e serve agli strumenti di manutenzione.
drop policy if exists "Stato traduzioni visibile" on public.traduzioni_stato;
create policy "Stato traduzioni visibile" on public.traduzioni_stato
  for select to authenticated using (true);

-- Scrive solo il service role, cioè gli script: nessuna policy di scrittura.

comment on table public.traduzioni_stato is
  'Da quale versione del testo italiano nasce ogni traduzione: serve a trovare le traduzioni invecchiate dopo una correzione ai contenuti.';

-- ── La lingua della persona, per le email ───────────────────────────────────
--
-- Il sito la lingua ce l'ha nell'indirizzo, ma un'email parte quando nessuno
-- sta navigando: senza questo campo l'unica scelta possibile sarebbe
-- l'italiano per tutti, e chi legge in inglese riceverebbe promemoria che non
-- capisce.
--
-- Default 'it' perché gli iscritti di oggi sono italiani: un default diverso
-- cambierebbe la lingua a chi non ha chiesto niente.
alter table public.profiles
  add column if not exists lingua text not null default 'it'
  check (lingua in ('it', 'en'));

comment on column public.profiles.lingua is
  'Lingua scelta dall''utente, usata per le email. Il sito usa il prefisso nell''indirizzo.';
