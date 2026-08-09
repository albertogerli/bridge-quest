/**
 * Punto unico di segnalazione errori dell'app.
 *
 * Oggi logga solo in console; in futuro questo è l'unico posto dove
 * agganciare Sentry (o altro error tracker): basta aggiungere qui
 * `Sentry.captureException(error, { tags: { scope } })`.
 */
export function reportError(scope: string, error: unknown): void {
  console.error(`[${scope}]`, error);
}
