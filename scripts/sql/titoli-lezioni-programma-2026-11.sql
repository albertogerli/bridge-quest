-- ============================================================================
-- Le lezioni del sito prendono il titolo del programma ufficiale
--
-- ESEGUIRE A MANO su Supabase → SQL Editor. Nessuna dipendenza.
-- Rollback: `titoli-lezioni-programma-2026-11-rollback.sql` (i titoli di prima).
--
-- Trevissoi (06/11/2026): «i titoli delle lezioni e delle esercitazioni devono
-- essere coerenti con il programma ufficiale», quello della Commissione da cui
-- nasce il materiale ufficiale. Il numero lo cambia il codice
-- (`getLessonDisplayNumber`); qui solo il titolo. Gli id restano, e con loro
-- progressi, compiti e smazzate.
--
-- Due lezioni del sito che coprono la stessa lezione del programma ne sono la
-- prima e la seconda parte. Lo stesso testo lo calcola `titoloLezioneSito`
-- in `src/lib/programma-corso.ts`: se si cambia uno, si cambia l'altro.
-- ============================================================================

begin;

update public.lessons as l set title = v.title, title_en = v.title_en
from (values
  (1,  'Vincenti, affrancabili e attacco – prima parte', 'Winners, establishable cards and the opening lead – part one'),
  (2,  'Vincenti, affrancabili e attacco – seconda parte', 'Winners, establishable cards and the opening lead – part two'),
  (3,  'Affrancamenti di forza, di lunga e di posizione', 'Establishing tricks by force, by length and by position'),
  (4,  'Il piano di gioco', 'The play plan'),
  (5,  'Il gioco ad atout – prima parte', 'Playing with trumps – part one'),
  (6,  'Il gioco ad atout – seconda parte', 'Playing with trumps – part two'),
  (7,  'Fasi del gioco e valutazione della mano', 'Phases of the game and hand evaluation'),
  (8,  'Aperture e sviluppi delle mani bilanciate: 1SA, 2SA e 2♣ seguito da SA', 'Opening and developing balanced hands: 1NT, 2NT and 2♣ followed by NT'),
  (9,  'Aperture delle mani sbilanciate', 'Opening unbalanced hands'),
  (10, 'Sviluppo delle aperture di 1 a colore', 'Developing one-of-a-suit openings'),
  (11, 'Interferenza e sviluppo (cenni) – prima parte', 'Interference and continuations (outline) – part one'),
  (12, 'Interferenza e sviluppo (cenni) – seconda parte', 'Interference and continuations (outline) – part two')
) as v(id, title, title_en)
where l.id = v.id;

-- I modelli ufficiali del generatore di mani portano il nome della lezione.
update public.modelli_mani as m set nome = l.title
from public.lessons as l
where m.ufficiale and m.lesson_id = l.id and l.id between 1 and 12;

-- Gli esercizi della Commissione già copiati dagli insegnanti: il gruppo
-- porta il titolo, ed è anche ciò che dice «già aggiunto» (`gruppoTest`).
update public.esercizi_posizione as e set gruppo = v.nuovo
from (values
  ('Esercizi lezione 1a · Vincenti e affrancabili', 'Esercizi lezione 1a · Vincenti, affrancabili e attacco – prima parte'),
  ('Esercizi lezione 1b · Il punto di vista dei difensori', 'Esercizi lezione 1b · Vincenti, affrancabili e attacco – seconda parte'),
  ('Esercizi lezione 2 · Affrancamenti', 'Esercizi lezione 2 · Affrancamenti di forza, di lunga e di posizione'),
  ('Esercizi lezione 4 · Il piano di gioco a senz''atout', 'Esercizi lezione 4 · Il piano di gioco'),
  ('Esercizi lezione 7 · Il piano di gioco ad atout', 'Esercizi lezione 7 · Smazzate libere con tutoraggio ad atout'),
  ('Esercizi lezione 11 · Le aperture di 1SA e 2SA', 'Esercizi lezione 11 · Aperture e sviluppi delle mani bilanciate: 1SA, 2SA e 2♣ seguito da SA'),
  ('Esercizi lezione 14 · Le dichiarazioni di apertura', 'Esercizi lezione 14 · Aperture e sviluppi delle altre mani bilanciate'),
  ('Esercizi lezione 15 · Risposte all''apertura di 1 a colore', 'Esercizi lezione 15 · Aperture delle mani sbilanciate'),
  ('Esercizi lezione 17 · L''apertore si descrive', 'Esercizi lezione 17 · Sviluppo delle aperture di 1 a colore'),
  ('Esercizi lezione 19 · L''intervento', 'Esercizi lezione 19 · Interferenza e sviluppo (cenni) – prima parte'),
  ('Esercizi lezione 20 · Sviluppi dopo gli interventi avversari', 'Esercizi lezione 20 · Interferenza e sviluppo (cenni) – seconda parte')
) as v(vecchio, nuovo)
where e.gruppo = v.vecchio;

insert into public.script_applicati (nome) values ('titoli-lezioni-programma-2026-11.sql')
on conflict (nome) do nothing;

commit;
