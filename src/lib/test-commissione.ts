/**
 * I dodici test di Barion della Commissione Insegnamento, come Trevissoi li ha
 * condivisi il 04/11/2026: un Google Modulo per test, con la risposta giusta di
 * ogni domanda.
 *
 * QUI C'È SOLO L'ELENCO, NON LE DOMANDE. Le domande con le risposte stanno in
 * `src/data/commissione/test-barion.json` e le legge solo la rotta
 * `/api/istruttori/test-commissione`, che le copia fra le domande
 * dell'insegnante. Importarle in un componente le metterebbe nel JavaScript
 * che scarica chiunque, allievi compresi: il test si risolverebbe aprendo gli
 * strumenti del browser.
 *
 * `lezioni` sono le lezioni del programma di Primo Livello (`programma-corso.ts`)
 * sotto cui Trevissoi ha messo il modulo nella cartella condivisa.
 */
export interface TestCommissione {
  numero: number;
  titolo: string;
  lezioni: number[];
  /** Le domande che si caricano: tutte tranne quelle sospese. */
  domande: number;
}

export const TEST_COMMISSIONE: TestCommissione[] = [
  { numero: 1, titolo: "Vincenti e affrancabili", lezioni: [1], domande: 16 },
  { numero: 2, titolo: "Il punto di vista dei difensori", lezioni: [1], domande: 27 },
  { numero: 3, titolo: "Affrancamenti", lezioni: [2], domande: 39 },
  { numero: 4, titolo: "Il piano di gioco a senz'atout", lezioni: [4], domande: 26 },
  { numero: 5, titolo: "Il gioco ad atout", lezioni: [6], domande: 23 },
  { numero: 6, titolo: "Il piano di gioco ad atout", lezioni: [7], domande: 12 },
  { numero: 7, titolo: "Le aperture di 1SA e 2SA", lezioni: [11], domande: 18 },
  { numero: 8, titolo: "Le dichiarazioni di apertura", lezioni: [14], domande: 10 },
  { numero: 9, titolo: "Risposte all'apertura di 1 a colore", lezioni: [15], domande: 27 },
  { numero: 10, titolo: "L'apertore si descrive", lezioni: [17], domande: 11 },
  { numero: 11, titolo: "L'intervento", lezioni: [19], domande: 16 },
  { numero: 12, titolo: "Sviluppi dopo gli interventi avversari", lezioni: [20], domande: 13 },
];

/**
 * Il gruppo sotto cui le domande di un test finiscono fra quelle
 * dell'insegnante. È anche il modo di sapere se il test è già stato aggiunto:
 * una seconda copia raddoppierebbe ogni domanda in «Nuovo compito».
 */
export function gruppoTest(t: Pick<TestCommissione, "numero" | "titolo">): string {
  return `Test ${t.numero} · ${t.titolo}`;
}

export function testDellaLezione(lezione: number): TestCommissione[] {
  return TEST_COMMISSIONE.filter((t) => t.lezioni.includes(lezione));
}
