"use client";

/**
 * Meta Pixel — lato browser.
 *
 * Si carica SOLO se ricorrono entrambe le condizioni: l'ID è configurato
 * (`NEXT_PUBLIC_META_PIXEL_ID`) e l'utente ha dato il consenso pubblicitario.
 * Senza consenso lo script non viene nemmeno scaricato: non basta non chiamare
 * `fbq`, perché il solo caricamento imposta i cookie `_fbp`/`_fbc`.
 *
 * Ogni evento parte in coppia con la Conversions API lato server, con lo stesso
 * `eventId`. Vedi `meta-capi.ts` per il perché.
 */

import { reportError } from "./report-error";
import { marketingAllowed } from "./consent-client";
import type { CapiEvent } from "./meta-capi";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

/**
 * Coda `fbq`. Lo snippet ufficiale di Meta è minificato e non supera il lint:
 * qui è riscritto in TypeScript con lo stesso comportamento. Accumula le
 * chiamate finché `fbevents.js` non è pronto, poi le inoltra a `callMethod`,
 * che è ciò che lo script esterno installa quando si carica.
 */
interface Fbq {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let injected = false;

/**
 * Inietta lo snippet ufficiale e registra la PageView iniziale.
 * Idempotente: chiamarla più volte non duplica lo script né gli eventi.
 */
export function loadMetaPixel(): void {
  if (typeof window === "undefined") return;
  if (injected || !META_PIXEL_ID || !marketingAllowed()) return;
  injected = true;

  if (!window.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    }) as Fbq;
    fbq.queue = [];
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.onerror = () => {
    // Bloccato da un adblocker: caso normalissimo, non un errore da segnalare.
    injected = false;
  };
  document.head.appendChild(script);

  window.fbq?.("init", META_PIXEL_ID);
  window.fbq?.("track", "PageView");
}

/** Identificatore condiviso fra Pixel e Conversions API per la deduplica. */
export function newEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Ambienti senza randomUUID (WebView datate): serve solo l'unicità.
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Invia l'evento due volte, con lo stesso `eventId`: una dal browser e una dal
 * nostro server. La copia server è quella che sopravvive ad adblocker e
 * restrizioni iOS; Meta le riunisce e ne conta una sola.
 *
 * Non lancia mai: il tracciamento non deve poter rompere una registrazione.
 */
export function trackMetaEvent(event: CapiEvent): void {
  if (typeof window === "undefined" || !META_PIXEL_ID || !marketingAllowed()) return;

  const eventId = newEventId();
  window.fbq?.("track", event, {}, { eventID: eventId });

  // keepalive: la registrazione redirige subito dopo, e senza questo la
  // richiesta verrebbe annullata dalla navigazione.
  void fetch("/api/meta/conversion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, eventId, sourceUrl: window.location.href }),
    keepalive: true,
  }).catch((err) => reportError("meta-capi", err));
}
