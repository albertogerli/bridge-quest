import * as Sentry from "@sentry/nextjs";
import {
  DENY_URLS,
  IGNORE_ERRORS,
  SENTRY_DSN,
  SENTRY_ENABLED,
  TRACES_SAMPLE_RATE,
} from "@/lib/sentry-shared";

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: TRACES_SAMPLE_RATE,
    ignoreErrors: IGNORE_ERRORS,
    denyUrls: DENY_URLS,
    // Nessun Session Replay: registrerebbe le schermate degli utenti
    // (dati personali) e non serve per la diagnosi degli errori.
    sendDefaultPii: false,
    beforeSend(event) {
      // Difesa in profondità: nessuna email/IP nell'evento.
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
      }
      return event;
    },
  });
}

// Strumenta le navigazioni App Router (richiesto da @sentry/nextjs).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
