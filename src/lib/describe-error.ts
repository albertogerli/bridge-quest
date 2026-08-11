/**
 * Rende leggibile un errore di tipo sconosciuto.
 *
 * PERCHÉ ESISTE
 * `reportError` faceva `new Error(String(error))`. Gli errori di Supabase non
 * sono istanze di `Error` ma oggetti semplici (`{ message, code, details,
 * hint }`), e `String({...})` restituisce `"[object Object]"`. Il risultato:
 * l'11/08/2026 Sentry ha ricevuto un evento intitolato letteralmente
 * `Error: [object Object]` dallo scope `login:verifica-bbo`, senza una sola
 * informazione utile a capire cosa fosse successo.
 *
 * Il difetto era sistemico: valeva per ogni errore non-`Error` sollevato
 * ovunque nell'app, cioè per praticamente tutti gli errori di rete e di
 * database.
 *
 * Qui si estrae il messaggio migliore disponibile e si conservano i campi
 * diagnostici a parte, così arrivano a Sentry come contesto invece di andare
 * perduti.
 */

/** Numero massimo di caratteri per un messaggio serializzato. */
const MAX_MESSAGE = 300;

export interface DescribedError {
  message: string;
  /** Campi utili alla diagnosi, da allegare all'evento. Assente se non ce ne sono. */
  context?: Record<string, unknown>;
}

function truncate(value: string): string {
  return value.length > MAX_MESSAGE ? `${value.slice(0, MAX_MESSAGE)}…` : value;
}

/**
 * Campi diagnostici tipici di Supabase/PostgREST e di `fetch`.
 *
 * `name` è escluso di proposito: su un `Error` vale sempre almeno "Error", e
 * finirebbe come contesto in ogni singolo evento senza dire nulla — Sentry
 * registra già il tipo di eccezione per conto suo.
 */
const CONTEXT_KEYS = ["code", "details", "hint", "status", "statusCode"] as const;

function collectContext(source: Record<string, unknown>): Record<string, unknown> | undefined {
  const context: Record<string, unknown> = {};
  for (const key of CONTEXT_KEYS) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") context[key] = value;
  }
  return Object.keys(context).length > 0 ? context : undefined;
}

/**
 * Messaggio leggibile e contesto diagnostico per un valore qualsiasi.
 * Non lancia mai, nemmeno su oggetti circolari o con getter che esplodono.
 */
export function describeError(error: unknown): DescribedError {
  if (error instanceof Error) {
    return {
      message: truncate(error.message || error.name || "Errore senza messaggio"),
      context: collectContext(error as unknown as Record<string, unknown>),
    };
  }

  if (typeof error === "string") {
    return { message: truncate(error || "Errore senza messaggio") };
  }

  if (error === null || error === undefined) {
    return { message: "Errore sconosciuto (nessun dettaglio)" };
  }

  if (typeof error === "object") {
    const source = error as Record<string, unknown>;
    const context = collectContext(source);

    // Il caso che conta: gli errori Supabase hanno `message` ma non sono Error.
    if (typeof source.message === "string" && source.message) {
      return { message: truncate(source.message), context };
    }

    // Nessun messaggio: si serializza l'oggetto, che è comunque infinitamente
    // più utile di "[object Object]".
    try {
      const serialized = JSON.stringify(source);
      if (serialized && serialized !== "{}") {
        return { message: truncate(serialized), context };
      }
    } catch {
      // Riferimenti circolari: si ripiega sulle chiavi, che almeno dicono di
      // che genere di oggetto si tratta.
      const keys = Object.keys(source).slice(0, 10).join(", ");
      return { message: truncate(`Oggetto non serializzabile { ${keys} }`), context };
    }
    return { message: "Errore sconosciuto (oggetto vuoto)", context };
  }

  return { message: truncate(String(error)) };
}

/**
 * `Error` vero e proprio, pronto per `Sentry.captureException`.
 * Gli errori che lo sono già passano intatti, così si conserva lo stack
 * originale: ricrearlo qui punterebbe a questo file invece che al punto in cui
 * il problema è nato.
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(describeError(error).message);
}
