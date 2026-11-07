/**
 * Gli esercizi della Commissione Insegnamento: dodici test a scelta multipla,
 * come Trevissoi li ha condivisi il 04/11/2026 (un Google Modulo per test, con
 * la risposta giusta di ogni domanda).
 *
 * QUI C'È SOLO L'ELENCO, NON LE DOMANDE. Le domande con le risposte stanno in
 * `src/data/commissione/test-commissione.json` e le leggono solo le rotte
 * `/api/istruttori/test-commissione*`, che le copiano fra le domande
 * dell'insegnante. Importarle in un componente le metterebbe nel JavaScript
 * che scarica chiunque, allievi compresi: il test si risolverebbe aprendo gli
 * strumenti del browser.
 *
 * `lezioni` sono le lezioni del programma di Primo Livello (`programma-corso.ts`)
 * sotto cui Trevissoi ha messo il modulo nella cartella condivisa. Il test 12
 * sta sotto la 20 apposta: l'argomento è quello della 19, ma due test insieme
 * non si assegnano, e agli allievi resta una settimana per ciascuno
 * (Trevissoi, 06/11/2026).
 *
 * LA NUMERAZIONE È QUELLA DELLE LEZIONI DEL CORSO, non il numero del test: il
 * numero del test veniva dal vecchio Corso Fiori, e a fine lezione faceva
 * cercare all'insegnante «quale test va con la lezione 15?» (Trevissoi,
 * 06/11/2026). Il numero resta solo come chiave interna dei dati.
 */
export interface TestCommissione {
  numero: number;
  titolo: string;
  lezioni: number[];
  /** Le domande che si caricano: tutte tranne quelle sospese. */
  domande: number;
}

/**
 * I titoli sono quelli delle lezioni del programma ufficiale, non quelli dei
 * moduli originali (Trevissoi, 06/11/2026: «i titoli delle lezioni e delle
 * esercitazioni devono essere coerenti con il programma ufficiale»). Il 12
 * sta sulla lezione 20 solo per non darne due insieme, ma l'argomento è
 * quello della 19, di cui porta il titolo. Cambiando un titolo cambia il
 * gruppo (`gruppoTest`): le copie già fatte vanno rinominate nel database,
 * come in `titoli-lezioni-programma-2026-11.sql`.
 */
export const TEST_COMMISSIONE: TestCommissione[] = [
  { numero: 1, titolo: "Vincenti, affrancabili e attacco – prima parte", lezioni: [1], domande: 16 },
  { numero: 2, titolo: "Vincenti, affrancabili e attacco – seconda parte", lezioni: [1], domande: 27 },
  { numero: 3, titolo: "Affrancamenti di forza, di lunga e di posizione", lezioni: [2], domande: 40 },
  { numero: 4, titolo: "Il piano di gioco", lezioni: [4], domande: 26 },
  { numero: 5, titolo: "Il gioco ad atout", lezioni: [6], domande: 23 },
  { numero: 6, titolo: "Smazzate libere con tutoraggio ad atout", lezioni: [7], domande: 12 },
  { numero: 7, titolo: "Aperture e sviluppi delle mani bilanciate: 1SA, 2SA e 2♣ seguito da SA", lezioni: [11], domande: 19 },
  { numero: 8, titolo: "Aperture e sviluppi delle altre mani bilanciate", lezioni: [14], domande: 10 },
  { numero: 9, titolo: "Aperture delle mani sbilanciate", lezioni: [15], domande: 27 },
  { numero: 10, titolo: "Sviluppo delle aperture di 1 a colore", lezioni: [17], domande: 12 },
  { numero: 11, titolo: "Interferenza e sviluppo (cenni) – prima parte", lezioni: [19], domande: 16 },
  { numero: 12, titolo: "Interferenza e sviluppo (cenni) – seconda parte", lezioni: [20], domande: 16 },
];

/**
 * Il numero con cui l'insegnante riconosce il test: quello della lezione.
 * Quando una lezione ne ha due (la 1) si distinguono con a e b.
 */
export function siglaTest(t: Pick<TestCommissione, "numero">): string {
  const test = TEST_COMMISSIONE.find((x) => x.numero === t.numero)!;
  const lezione = test.lezioni[0];
  const stessi = TEST_COMMISSIONE.filter((x) => x.lezioni[0] === lezione);
  return stessi.length > 1 ? `${lezione}${"abcdefgh"[stessi.indexOf(test)]}` : String(lezione);
}

/**
 * Il gruppo sotto cui le domande di un test finiscono fra quelle
 * dell'insegnante. È anche il modo di sapere se il test è già stato aggiunto:
 * una seconda copia raddoppierebbe ogni domanda in «Nuovo compito».
 */
export function gruppoTest(t: Pick<TestCommissione, "numero" | "titolo">): string {
  return `Esercizi lezione ${siglaTest(t)} · ${t.titolo}`;
}

/** «9.4» del modulo originale diventa «15.4»: la lezione, poi la domanda. */
export function titoloDomanda(t: Pick<TestCommissione, "numero">, numeroOriginale: string): string {
  const domanda = numeroOriginale.split(".")[1] ?? numeroOriginale;
  return `${siglaTest(t)}.${domanda}`;
}

export function testDellaLezione(lezione: number): TestCommissione[] {
  return TEST_COMMISSIONE.filter((t) => t.lezioni.includes(lezione));
}
