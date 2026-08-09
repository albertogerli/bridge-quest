import * as Sentry from "@sentry/nextjs";
import {
  IGNORE_ERRORS,
  SENTRY_DSN,
  SENTRY_ENABLED,
  TRACES_SAMPLE_RATE,
} from "@/lib/sentry-shared";

/**
 * Inizializzazione Sentry lato server ed edge (Next.js instrumentation hook).
 * No-op se NEXT_PUBLIC_SENTRY_DSN non è configurata.
 */
export async function register() {
  if (!SENTRY_ENABLED) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: TRACES_SAMPLE_RATE,
    ignoreErrors: IGNORE_ERRORS,
    sendDefaultPii: false,
  });
}

/** Cattura gli errori delle route/server component (Next.js >= 15). */
export const onRequestError = Sentry.captureRequestError;
