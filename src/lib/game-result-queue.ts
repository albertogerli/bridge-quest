import type { GameResult } from "@/hooks/use-game-results";
import type { Platform } from "@/lib/native-bridge";
import { eDiRete } from "@/lib/errore-di-rete";

export const RESULT_PREFIX = "bq_game_result_v2:";

/**
 * La sessione non c'è più, o non è di chi ha prodotto il risultato.
 *
 * NON È UN DIFETTO, ed è per questo che ha un tipo suo. Il risultato resta
 * dov'è — in memoria locale — e parte al prossimo accesso valido: è
 * esattamente il lavoro per cui la coda esiste. Segnalarlo come errore
 * riempiva Sentry di eventi su cui non c'era niente da fare, uno ogni trenta
 * secondi finché il provider di autenticazione non si accorgeva della scadenza.
 *
 * Distinguerlo serve a tenere il resto: un rifiuto del database — un permesso
 * mancante, una riga malformata — continua ad arrivare, e quello va guardato.
 */
export class SessioneNonValida extends Error {
  constructor() {
    super("Sessione non valida per il salvataggio del risultato");
    this.name = "SessioneNonValida";
  }
}

/**
 * La rete non c'è. Fratello di `SessioneNonValida`, e per lo stesso motivo.
 *
 * PERCHÉ NON BASTAVA IL FILTRO GENERALE. Qui l'errore di rete arriva
 * TRAVESTITO. `postgrest-js`, quando la fetch non parte, costruisce
 * `{ message: "TypeError: Failed to fetch", details: "", hint: "", code: "" }`
 * — e il punto di chiamata, per non far finire dati personali in Sentry,
 * butta via tutto e tiene il solo `code`. Che è vuoto. Il risultato era
 * «Salvataggio risultato rifiutato ()», con le parentesi vuote: un messaggio
 * che non dice né cosa è successo né che è stata la rete.
 *
 * Visto in produzione il 27/09/2026, iPad, applicazione nativa. E ogni
 * trenta secondi, perché la coda riprova: è lo stesso diluvio che
 * `SessioneNonValida` aveva già fermato una volta, da un'altra porta.
 *
 * La distinzione si fa DOVE L'INFORMAZIONE C'È ANCORA, cioè nel punto che
 * riceve l'errore vero, non a valle dove ne resta l'involucro.
 */
export class ReteNonRaggiungibile extends Error {
  constructor() {
    super("Rete non raggiungibile per il salvataggio del risultato");
    this.name = "ReteNonRaggiungibile";
  }
}

/**
 * `game_results.score` è una colonna INTERA: qui si arrotonda.
 *
 * IL CASO DEL 27/09/2026. Strumentando il gioco «Licita» ho passato come
 * punteggio le stelle, senza guardare che le stelle sono MEZZE: la scala in
 * `stelle-licita.ts` dà 2.5, 1.5, 0.5. Un totale come 9.5 arriva a Postgres
 * come «sintassi non valida per il tipo integer» — codice 22P02 — e la
 * partita non si salva. Chiunque finisse una licita lo prendeva.
 *
 * Si arrotonda QUI e non nei punti di chiamata perché è un vincolo della
 * colonna, non di chi gioca: chi aggiunge un gioco domani non deve andarselo
 * a ricordare. Il valore esatto non si perde — chi ne ha uno lo mette in
 * `details`, dove la colonna è `jsonb` e ci sta tutto.
 */
/**
 * I codici con cui PostgREST dice «il tuo gettone non va bene adesso».
 *
 * PGRST301 gettone non valido, PGRST302 accesso anonimo negato, PGRST303
 * gettone scaduto. Tutti e tre passano dopo un rinnovo, quindi la partita
 * NON si butta: si riprova.
 */
const SESSIONE = new Set(["PGRST301", "PGRST302", "PGRST303"]);

export function punteggioIntero(score: number): number {
  return Number.isFinite(score) ? Math.round(score) : 0;
}

/**
 * Un rifiuto che riprovare non risolve.
 *
 * PERCHÉ SERVE DISTINGUERLO. La coda riprova all'infinito, ed è giusto per
 * la rete e per la sessione scaduta. Per un rifiuto del DATABASE no: un
 * 22P02 sarà un 22P02 anche domani. E siccome la coda manda le voci in
 * ordine e si ferma alla prima che fallisce, UNA voce malformata blocca
 * tutti i risultati successivi di quella persona — per sempre, riprovando
 * ogni trenta secondi.
 *
 * È così che il difetto delle mezze stelle è diventato più grave di sé
 * stesso: non perdeva una partita di licita, perdeva tutto quello che veniva
 * dopo. La voce che non può passare si toglie e si segnala.
 */
export class RifiutoPermanente extends Error {
  readonly causa: Error;
  constructor(causa: Error) {
    super(causa.message);
    this.name = "RifiutoPermanente";
    this.causa = causa;
  }
}

/**
 * Che cos'è andato storto scrivendo un risultato: il tipo, non il testo.
 *
 * Sta qui e non nel punto di chiamata perché è una REGOLA, e una regola
 * dentro una chiusura non si può provare. Le tre uscite sono tutte e tre
 * volute:
 *   · niente errore        → `null`, e la coda toglie la voce;
 *   · la rete              → `ReteNonRaggiungibile`, la voce resta e si
 *                            riprova, senza svegliare nessuno;
 *   · tutto il resto       → un errore con il codice del database dentro,
 *                            che è quello che va guardato.
 *
 * Del codice si tiene SOLO il codice: `details` e `hint` di PostgREST
 * possono contenere pezzi della riga rifiutata, e quella riga è di una
 * persona.
 */
export function erroreDiScrittura(
  errore: { code?: string | null; message?: string } | null | undefined,
): Error | null {
  if (!errore) return null;
  if (eDiRete(errore)) return new ReteNonRaggiungibile();
  // Il gettone è scaduto o non è più valido: non è un rifiuto permanente,
  // è la sessione. Riprovare DOPO il rinnovo funziona, quindi la voce deve
  // restare in coda. Visto il 27/09/2026 come «PGRST303; status 401»:
  // trattarlo da rifiuto l'avrebbe buttata via, e con essa la partita.
  if (SESSIONE.has(errore.code ?? "")) return new SessioneNonValida();
  // `||` e non `??`: `code` è la stringa VUOTA quando la fetch non parte, e
  // `??` la lascerebbe passare. È così che si è stampato «rifiutato ()».
  return new RifiutoPermanente(
    new Error("Salvataggio risultato rifiutato (" + (errore.code || "database") + ")"),
  );
}
export interface PendingGameResult extends GameResult {
  id: string;
  owner: string | null;
  timestamp: string;
  platform: Platform;
}

/** One key per event: concurrent tabs cannot overwrite a shared queue array. */
export function createResultQueue(storage: Storage, send: (entry: PendingGameResult) => Promise<void>) {
  const flights = new Map<string, Promise<void>>();
  function pending(owner: string | null): PendingGameResult[] {
    const entries: PendingGameResult[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(RESULT_PREFIX)) continue;
      try {
        const entry = JSON.parse(storage.getItem(key) ?? "null") as PendingGameResult | null;
        if (entry && entry.owner === owner && key === RESULT_PREFIX + entry.id
          && typeof entry.timestamp === "string" && Number.isFinite(Date.parse(entry.timestamp))
          && typeof entry.gameType === "string" && typeof entry.score === "number" && Number.isFinite(entry.score)) entries.push(entry);
      } catch { /* Malformed local data is preserved, never sent or deleted. */ }
    }
    return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  return {
    pending,
    enqueue(result: GameResult, owner: string | null, platform: Platform): PendingGameResult {
      const entry = { ...result, id: crypto.randomUUID(), owner, timestamp: new Date().toISOString(), platform };
      // Never silently discard old events to make room. The caller reports storage failure.
      storage.setItem(RESULT_PREFIX + entry.id, JSON.stringify(entry));
      return entry;
    },
    flush(owner: string): Promise<void> {
      const active = flights.get(owner);
      if (active) return active;
      const job = (async () => {
        while (true) {
          const entry = pending(owner)[0];
          if (!entry) break;
          try {
            // A lost response keeps exactly the same UUID for the next retry.
            await send(entry);
          } catch (errore) {
            // Rete o sessione: si riprova, la voce resta. Rifiuto del
            // database: riprovare non cambia niente e questa voce, restando
            // in testa, bloccherebbe tutte le altre. Si toglie e si segnala.
            if (!(errore instanceof RifiutoPermanente)) throw errore;
            storage.removeItem(RESULT_PREFIX + entry.id);
            throw errore;
          }
          storage.removeItem(RESULT_PREFIX + entry.id);
        }
      })().finally(() => flights.delete(owner));
      flights.set(owner, job);
      return job;
    },
  };
}
