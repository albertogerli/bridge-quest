/**
 * Stato di salute dei canali Realtime, e cosa farne.
 *
 * PERCHÉ ESISTE
 * Il 12/08/2026 Sentry ha ricevuto «canale in stato CHANNEL_ERROR» da un
 * telefono Android su Samsung Internet. Non era un difetto: su rete mobile un
 * WebSocket che cade è ordinaria amministrazione — cambio di cella, passaggio
 * wifi/dati, proxy che non instrada i WebSocket. Segnalarlo come errore
 * riempie Sentry di rumore e nasconde i problemi veri.
 *
 * Ma nemmeno tacere va bene: se Realtime fosse davvero rotto per tutti — una
 * publication rimossa, una policy sbagliata — nessuno se ne accorgerebbe,
 * perché la rete di sicurezza a 5 minuti maschera il guasto senza che niente
 * appaia rotto.
 *
 * La regola qui distingue i due casi: un calo passeggero degrada il
 * ripiegamento e non segnala nulla; un canale che fallisce ripetutamente
 * viene segnalato UNA volta.
 *
 * Il vero rimedio per l'utente non è la segnalazione ma il ripiegamento:
 * quando il canale non va, si interroga il server più spesso. Le notifiche
 * arrivano con qualche decina di secondi di ritardo invece che in tempo reale,
 * e nessuno vede niente di rotto.
 */

/** Intervallo di sicurezza quando il canale è attivo: serve solo da rete. */
export const POLL_HEALTHY_MS = 300_000; // 5 minuti

/**
 * Intervallo quando il canale è caduto. Non troppo breve: con migliaia di
 * utenti disconnessi diventerebbe un carico inutile sul database, e la sfida
 * di un amico non è un dato che vale una richiesta ogni cinque secondi.
 */
export const POLL_DEGRADED_MS = 45_000; // 45 secondi

/**
 * Fallimenti consecutivi oltre i quali si smette di considerarlo passeggero.
 * Tre di fila non sono più un tunnel: o il dispositivo è offline (e allora
 * l'evento non parte comunque) o il canale è configurato male.
 */
export const FAILURES_BEFORE_REPORT = 3;

/** Stati restituiti da `channel.subscribe()` di supabase-js. */
export type ChannelStatus = "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED" | string;

export function isHealthy(status: ChannelStatus): boolean {
  return status === "SUBSCRIBED";
}

/**
 * Quello che il contatore dei fallimenti da solo non sa.
 *
 * Tre CHANNEL_ERROR di fila non bastano a dire «è rotto»: il 16/08/2026 sono
 * arrivati da un Chrome Mobile su Android, cioè da un telefono in una zona con
 * poca rete. Un guasto vero — publication rimossa, policy sbagliata, chiave
 * scaduta — ha due impronte che la rete instabile non ha: capita a canali che
 * non si sono MAI stabiliti, e capita mentre il dispositivo è connesso.
 */
export interface ChannelContext {
  /** Il canale si è stabilito almeno una volta da quando la pagina è aperta. */
  everConnected: boolean;
  /** Il browser dichiara di avere una rete. */
  online: boolean;
}

/** `navigator.onLine` dove esiste; altrove si presume connesso. */
export function currentlyOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export interface HealthDecision {
  /** Il canale sta consegnando eventi. */
  healthy: boolean;
  /** Fallimenti consecutivi dopo questo stato. */
  failures: number;
  /** Intervallo di interrogazione da usare adesso. */
  pollMs: number;
  /** Vero solo al superamento della soglia, e una sola volta. */
  shouldReport: boolean;
}

/**
 * Decide cosa fare dato lo stato ricevuto e quanti fallimenti c'erano prima.
 *
 * Funzione pura: il conteggio dei fallimenti lo tiene il chiamante, così
 * questa resta verificabile senza simulare un canale.
 */
export function evaluateChannel(
  status: ChannelStatus,
  previousFailures: number,
  context?: Partial<ChannelContext>
): HealthDecision {
  if (isHealthy(status)) {
    // Una riconnessione riuscita azzera il conteggio: un guasto risolto non
    // deve contribuire alla soglia del prossimo.
    return { healthy: true, failures: 0, pollMs: POLL_HEALTHY_MS, shouldReport: false };
  }

  const everConnected = context?.everConnected ?? false;
  const online = context?.online ?? currentlyOnline();

  // Due casi in cui il silenzio è la risposta giusta, per quanti fallimenti ci
  // siano stati:
  //
  //   - il dispositivo è offline. Non c'è niente da riparare da questa parte, e
  //     l'utente lo sa già meglio di noi;
  //   - il canale si era stabilito e poi è caduto. Se la sottoscrizione è
  //     passata una volta, publication, policy e chiave sono a posto: quello
  //     che è cambiato è la rete. È il caso dei telefoni, ed era il grosso di
  //     quello che arrivava a Sentry.
  //
  // Resta segnalato ciò per cui la soglia era stata scritta: un canale che non
  // si stabilisce MAI, con il dispositivo connesso.
  const colpaDellaRete = !online || everConnected;

  const failures = previousFailures + 1;
  return {
    healthy: false,
    failures,
    pollMs: POLL_DEGRADED_MS,
    // Esattamente alla soglia, non oltre: senza il confronto di uguaglianza
    // ogni tentativo successivo genererebbe un nuovo evento identico.
    shouldReport: failures === FAILURES_BEFORE_REPORT && !colpaDellaRete,
  };
}

/** Messaggio della segnalazione, quando si supera la soglia. */
export function persistentFailureMessage(scope: string, status: ChannelStatus, failures: number): string {
  return `${scope}: canale Realtime non stabilito dopo ${failures} tentativi (ultimo stato: ${status}). ` +
    `L'app continua a funzionare con interrogazioni ogni ${POLL_DEGRADED_MS / 1000}s.`;
}
