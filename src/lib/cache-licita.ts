/**
 * Le dichiarazioni già chieste a BEN, tenute da parte.
 *
 * PERCHÉ ESISTE, e non è (solo) velocità.
 *
 * Nel torneo di licita la smazzata è LA STESSA PER TUTTI: è il senso del
 * torneo. Quindi anche le aste si somigliano moltissimo — l'apertura del
 * mazziere, con asta vuota, è identica per ogni partecipante, e le prime
 * risposte lo sono quasi. Oggi ognuna di quelle dichiarazioni fa partire una
 * richiesta a BEN per conto suo, e quando BEN simula costa fino a nove
 * secondi: una richiesta lunga attraverso tutta la catena per ottenere una
 * risposta che avevamo già dato a qualcun altro cinque minuti prima.
 *
 * Meno richieste lunghe significa meno occasioni di rompersi: i 502 visti in
 * produzione arrivavano tutti su quelle.
 *
 * QUI C'ERA SCRITTA UNA COSA FALSA, e vale la pena lasciarne traccia. Il
 * commento diceva che BEN, simulando in Monte Carlo, può rispondere in modo
 * diverso a due persone sulla stessa asta, e che quindi la cache serviva anche
 * all'equità del torneo. Sembra ovvio — «Monte Carlo» suona casuale — ma non è
 * stato mai verificato.
 *
 * Misurato il 29/08/2026: cinque aste diverse, sei giri ciascuna, richieste
 * mescolate fra loro. Ogni asta ha dato SEMPRE la stessa dichiarazione, sia
 * quelle risolte dalla rete sia quelle simulate. BEN usa un seme fisso: è
 * deterministico. `scripts/misura-ben-licita.mjs --determinismo` lo riverifica.
 *
 * Quindi due concorrenti sulla stessa asta ricevono la stessa dichiarazione
 * ANCHE SENZA questa cache, e non serve renderla condivisa fra le istanze per
 * garantire la parità di trattamento. Resta il motivo vero, che basta e
 * avanza: togliere richieste lunghe dalla catena.
 *
 * Se un giorno il determinismo venisse meno — un aggiornamento di BEN, un seme
 * legato all'orologio — allora l'equità tornerebbe a dipendere dalla cache, e
 * una cache per istanza NON basterebbe: servirebbe una risposta canonica nel
 * database. È il momento in cui vale la pena costruirla, non prima.
 *
 * VIVE IN MEMORIA, e va bene così. Sta nel processo della funzione: se
 * l'istanza muore la cache sparisce e si torna a chiedere a BEN. Nessuna
 * tabella da creare, nessuno stato da migrare, nessun rischio di servire una
 * risposta vecchia dopo un aggiornamento del motore — al primo riavvio è già
 * pulita. In cambio la resa è parziale: le istanze sono tante e ognuna ha la
 * sua. Va benissimo, perché le chiavi che contano — l'apertura della mano del
 * giorno — sono poche e ricorrono di continuo.
 *
 * NON si mette in cache un fallimento: un errore ricordato diventerebbe un
 * guasto che non passa più.
 */

/** Quante risposte tenere. Oltre, si butta la più vecchia. */
const CAPIENZA = 500;

const memoria = new Map<string, string>();

/** La dichiarazione già nota per questa richiesta, se c'è. */
export function dichiarazioneNota(chiave: string): string | undefined {
  const trovata = memoria.get(chiave);
  if (trovata === undefined) return undefined;
  // Riletta = più recente: la si rimette in fondo, così a essere buttate sono
  // le chiavi che nessuno chiede più e non quelle che servono di continuo.
  memoria.delete(chiave);
  memoria.set(chiave, trovata);
  return trovata;
}

/** Ricorda una dichiarazione riuscita. */
export function ricordaDichiarazione(chiave: string, bid: string): void {
  if (!chiave || !bid) return;
  if (memoria.has(chiave)) memoria.delete(chiave);
  memoria.set(chiave, bid);
  while (memoria.size > CAPIENZA) {
    // `Map` conserva l'ordine di inserimento: la prima è la meno recente.
    const piuVecchia = memoria.keys().next();
    if (piuVecchia.done) break;
    memoria.delete(piuVecchia.value);
  }
}

/** Solo per i test: svuota. */
export function svuotaCacheLicita(): void {
  memoria.clear();
}

/** Solo per i test e la diagnostica: quante ne sono in memoria. */
export function quanteInCache(): number {
  return memoria.size;
}
