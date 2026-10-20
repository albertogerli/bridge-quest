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
  // «Permission denied» (42501) su una funzione concessa solo ad
  // `authenticated` vuol dire che la chiamata è partita da ANONIMO: la sessione
  // si è chiusa — logout, inattività, rinnovo fallito — mentre la richiesta era
  // in volo. Successo con `get_own_profile` il 19/10/2026 e con
  // `mie_richieste_in_attesa` il 20/10: ogni funzione riservata ha la stessa
  // finestra, quindi si decide qui e non chiamata per chiamata. Senza sessione
  // non è un difetto; con la sessione ancora aperta è un permesso sbagliato
  // davvero, e arriva a Sentry come prima.
  if (typeof window !== "undefined" && ePermessoNegato(error)) {
    void sessioneAperta().then((aperta) => {
      if (aperta) invia(scope, error);
      else console.warn(`[${scope}] permesso negato a sessione chiusa, non segnalato:`, error);
    });
    return;
  }
  invia(scope, error);
}

function ePermessoNegato(error: unknown): boolean {
  return !!error && typeof error === "object" && (error as { code?: unknown }).code === "42501";
}

/** C'è ancora una sessione? Nel dubbio sì: meglio un evento in più che uno perso. */
async function sessioneAperta(): Promise<boolean> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const { data } = await createClient().auth.getSession();
    return !!data.session;
  } catch {
    return true;
  }
}

function invia(scope: string, error: unknown): void {
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
