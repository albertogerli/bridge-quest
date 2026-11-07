-- Rollback di `titoli-lezioni-programma-2026-11.sql`: i titoli di prima.

begin;

update public.lessons as l set title = v.title, title_en = v.title_en
from (values
  (1,  'Vincenti e affrancabili', 'Winners and Establishable Cards'),
  (2,  'Il punto di vista dei difensori', 'The Defenders'' Perspective'),
  (3,  'Affrancamenti di lunga e di posizione', 'Establishing Long and Positional Cards'),
  (4,  'Il piano di gioco a senz''atout', 'The No Trump Play Plan'),
  (5,  'Il gioco con l''atout', 'Playing with Trumps'),
  (6,  'Il piano di gioco con l''atout', 'The Play Plan with Trumps'),
  (7,  'La valutazione della mano', 'Hand Evaluation'),
  (8,  'L''apertura e la risposta', 'Opening and Response'),
  (9,  'Aperture di 1 a colore. Le risposte', 'Opening bids of 1 in a suit. The responses'),
  (10, 'L''apertore descrive', 'The opener describes'),
  (11, 'L''intervento', 'The Overcall'),
  (12, 'Sviluppi dopo l''intervento avversario', 'Developments after the opponent''s intervention')
) as v(id, title, title_en)
where l.id = v.id;

update public.modelli_mani as m set nome = l.title
from public.lessons as l
where m.ufficiale and m.lesson_id = l.id and l.id between 1 and 12;

-- Gli esercizi della Commissione già copiati dagli insegnanti: il gruppo
-- porta il titolo, ed è anche ciò che dice «già aggiunto» (`gruppoTest`).
update public.esercizi_posizione as e set gruppo = v.nuovo
from (values
  ('Esercizi lezione 1a · Vincenti, affrancabili e attacco – prima parte', 'Esercizi lezione 1a · Vincenti e affrancabili'),
  ('Esercizi lezione 1b · Vincenti, affrancabili e attacco – seconda parte', 'Esercizi lezione 1b · Il punto di vista dei difensori'),
  ('Esercizi lezione 2 · Affrancamenti di forza, di lunga e di posizione', 'Esercizi lezione 2 · Affrancamenti'),
  ('Esercizi lezione 4 · Il piano di gioco', 'Esercizi lezione 4 · Il piano di gioco a senz''atout'),
  ('Esercizi lezione 7 · Smazzate libere con tutoraggio ad atout', 'Esercizi lezione 7 · Il piano di gioco ad atout'),
  ('Esercizi lezione 11 · Aperture e sviluppi delle mani bilanciate: 1SA, 2SA e 2♣ seguito da SA', 'Esercizi lezione 11 · Le aperture di 1SA e 2SA'),
  ('Esercizi lezione 14 · Aperture e sviluppi delle altre mani bilanciate', 'Esercizi lezione 14 · Le dichiarazioni di apertura'),
  ('Esercizi lezione 15 · Aperture delle mani sbilanciate', 'Esercizi lezione 15 · Risposte all''apertura di 1 a colore'),
  ('Esercizi lezione 17 · Sviluppo delle aperture di 1 a colore', 'Esercizi lezione 17 · L''apertore si descrive'),
  ('Esercizi lezione 19 · Interferenza e sviluppo (cenni) – prima parte', 'Esercizi lezione 19 · L''intervento'),
  ('Esercizi lezione 20 · Interferenza e sviluppo (cenni) – seconda parte', 'Esercizi lezione 20 · Sviluppi dopo gli interventi avversari')
) as v(vecchio, nuovo)
where e.gruppo = v.vecchio;

delete from public.script_applicati where nome = 'titoli-lezioni-programma-2026-11.sql';

commit;
