-- Esercizi della Commissione numerati come le lezioni del corso (06/11/2026).
--
-- Solo dati, nessuno schema: le domande già copiate fra quelle di un
-- insegnante portavano il gruppo «Test N · titolo» e i titoli «N.x» del
-- vecchio Corso Fiori. Il sito ora le chiama «Esercizi lezione L · titolo» e
-- «L.x» (vedi src/lib/test-commissione.ts): senza rinominarle, «Assegna» non
-- le riconoscerebbe e le copierebbe una seconda volta. Idempotente: una
-- seconda esecuzione non trova più gruppi «Test N».
-- Dipende da: esercizi-figura-2026-11.sql.

update public.esercizi_posizione e
set gruppo = 'Esercizi lezione ' || m.sigla || ' · ' || m.titolo,
    titolo = m.sigla || '.' || split_part(e.titolo, '.', 2)
from (values
  (1, '1a', 'Vincenti e affrancabili'),
  (2, '1b', 'Il punto di vista dei difensori'),
  (3, '2', 'Affrancamenti'),
  (4, '4', 'Il piano di gioco a senz''atout'),
  (5, '6', 'Il gioco ad atout'),
  (6, '7', 'Il piano di gioco ad atout'),
  (7, '11', 'Le aperture di 1SA e 2SA'),
  (8, '14', 'Le dichiarazioni di apertura'),
  (9, '15', 'Risposte all''apertura di 1 a colore'),
  (10, '17', 'L''apertore si descrive'),
  (11, '19', 'L''intervento'),
  (12, '20', 'Sviluppi dopo gli interventi avversari')
) as m(numero, sigla, titolo)
where e.gruppo = 'Test ' || m.numero || ' · ' || m.titolo;

insert into public.script_applicati (nome) values ('esercizi-commissione-lezioni-2026-11.sql')
on conflict (nome) do nothing;
