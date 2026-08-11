import * as Sentry from "@sentry/nextjs";
import { SENTRY_ENABLED } from "@/lib/sentry-shared";
import { describeError, toError } from "@/lib/describe-error";

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
  console.error(`[${scope}]`, error);

  if (!SENTRY_ENABLED) return;

  const { context } = describeError(error);
  Sentry.captureException(toError(error), {
    tags: { scope },
    ...(context ? { contexts: { errore: context } } : {}),
  });
}
