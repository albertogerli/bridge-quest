/**
 * Central error logger. Use in place of a silent `catch {}` whenever the failed
 * operation is meaningful (network / DB / data integrity) so the error becomes
 * visible instead of vanishing. Benign failures (e.g. localStorage in private
 * mode) should stay silent — don't wrap those.
 *
 * Single choke point so we can later route to a monitoring service (Sentry,
 * Logtail, …) without touching call sites.
 */
export function logError(context: string, err: unknown, extra?: Record<string, unknown>): void {
  if (extra) {
    console.error(`[${context}]`, err, extra);
  } else {
    console.error(`[${context}]`, err);
  }
}
