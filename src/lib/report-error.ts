import * as Sentry from "@sentry/nextjs";
import { SENTRY_ENABLED } from "@/lib/sentry-shared";

/**
 * Punto unico di segnalazione errori dell'app.
 *
 * Logga sempre in console e, quando Sentry è configurato
 * (NEXT_PUBLIC_SENTRY_DSN), invia l'eccezione taggata con lo scope.
 * Lo `scope` è una stringa stabile "area:operazione" (es. "profilo:salva")
 * che in Sentry permette di raggruppare e filtrare gli eventi.
 */
export function reportError(scope: string, error: unknown): void {
  console.error(`[${scope}]`, error);

  if (!SENTRY_ENABLED) return;

  Sentry.captureException(
    error instanceof Error ? error : new Error(String(error)),
    { tags: { scope } }
  );
}
