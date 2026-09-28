import * as Sentry from "@sentry/nextjs";
import { SENTRY_ENABLED } from "@/lib/sentry-shared";
import { describeError, toError } from "@/lib/describe-error";
import { eDiRete, eSessioneScaduta } from "@/lib/errore-di-rete";

/**
 * Punto unico di segnalazione errori dell'app.
 *
 * Logga sempre in console e, quando Sentry è configurato
 * (NEXT_PUBLIC_SENTRY_DSN), invia l'eccezione taggata con lo scope.
 * Lo `scope` è una stringa stabile "area:operazione" (es. "profilo:salva")
 * che in Sentry permette di raggruppare e filtrare gli eventi.
 *
 * Prima faceva `new Error(String(error))`: gli errori di Supabase sono oggetti
 * semplici e non istanze di `Error`, quindi finivano in Sentry come
 * `Error: [object Object]`, privi di qualsiasi informazione utile. Ora il
 * messaggio viene estratto e i campi diagnostici (`code`, `details`, `hint`,
 * `status`) sono allegati come contesto. Vedi `describe-error.ts`.
 *
 * Nota sui dati personali: il contesto contiene solo codici e descrizioni
 * tecniche dell'errore. Non passare mai qui oggetti che contengano dati
 * dell'utente.
 */
export function reportError(scope: string, error: unknown): void {
  // NEL BROWSER la rete caduta e la sessione scaduta non vanno a Sentry, da
  // qualunque punto arrivino. Il guardiano `rete-non-si-segnala.test.ts`
  // controlla solo le chiamate vicine a Supabase, e il 28/09/2026 è passato
  // dal buco che non poteva vedere: un componente che chiama una funzione di
  // libreria (`getClassDetail`), che chiama Supabase. Di quei punti ce ne sono
  // decine. Filtrare qui li chiude tutti, compresi quelli che nasceranno.
  //
  // Solo nel browser: sul server una fetch fallita verso il database è il
  // NOSTRO backend che non lo raggiunge, e deve svegliare qualcuno.
  if (typeof window !== "undefined" && (eSessioneScaduta(error) || eDiRete(error))) {
    console.warn(`[${scope}] rete o sessione, non segnalato:`, error);
    return;
  }
  console.error(`[${scope}]`, error);

  if (!SENTRY_ENABLED) return;

  const { context } = describeError(error);
  Sentry.captureException(toError(error), {
    tags: { scope },
    ...(context ? { contexts: { errore: context } } : {}),
  });
}

/**
 * Come `reportError`, ma la rete caduta non sveglia nessuno.
 *
 * PERCHÉ ESISTE. Il 26/09/2026 sono arrivate quattro segnalazioni Sentry in
 * un giorno — /admin, /gioca/sfida-imp, /login, e prima ancora
 * licita-amico e commenti-smazzate — tutte con lo stesso contenuto: «Load
 * failed», «Failed to fetch», «AuthRetryableFetchError». Nessuna era un
 * difetto. Erano telefoni in galleria e portatili che cambiano rete.
 *
 * Il rimedio applicato fin lì era scrivere `if (!eDiRete(e))` davanti a ogni
 * `reportError`. Funziona, e non regge: una scansione ne ha trovati
 * CENTOVENTI di punti senza. Una regola che va ricordata centoventi volte
 * non è una regola, è una probabilità.
 *
 * COSA NON FA. Non tace: la riga in console c'è sempre, con lo stesso scope,
 * e chi apre la console durante una lezione vede esattamente cosa non è
 * arrivato. E non filtra gli errori del database — permesso negato, vincolo
 * violato, colonna che non esiste passano di qui e arrivano a Sentry come
 * prima. La distinzione è in `eDiRete`, che ha i suoi test.
 *
 * IL PREZZO, detto chiaro: se Supabase cadesse del tutto, Sentry starebbe
 * zitto. Lo si vedrebbe altrove — dal cruscotto Supabase, da Vercel, e dagli
 * utenti, che un messaggio d'errore in faccia ce l'hanno comunque. Sentry
 * serve a trovare i difetti nostri, e la rete degli altri non lo è.
 */
export function segnalaSalvoRete(scope: string, error: unknown): void {
  // Il nome dice «rete», ma dal 28/09/2026 copre anche la sessione scaduta:
  // tutte e due sono cose che succedono a chi usa il sito, non difetti del
  // sito, e tutte e due si rimettono da sole al giro dopo.
  if (eSessioneScaduta(error)) {
    console.warn(`[${scope}] sessione scaduta:`, error);
    return;
  }
  if (eDiRete(error)) {
    console.warn(`[${scope}] rete non raggiungibile:`, error);
    return;
  }
  reportError(scope, error);
}
