"use client";

/**
 * Lato browser del consenso: l'unico posto che tocca localStorage e window.
 * Le decisioni sono in `consent.ts`, che resta puro e testabile.
 */

import {
  CONSENT_EVENT,
  CONSENT_KEY,
  consentModeSignals,
  hasMarketingConsent,
  serializeConsent,
  shouldAskConsent,
} from "./consent";

function readRaw(): string | null {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

/** Consenso pubblicitario corrente. In SSR è sempre `false`: non si traccia. */
export function marketingAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return hasMarketingConsent(readRaw());
}

/** Vero se il banner va mostrato. */
export function consentPending(): boolean {
  if (typeof window === "undefined") return false;
  return shouldAskConsent(readRaw());
}

/**
 * Registra la scelta e la propaga: Google Consent Mode, un evento per i
 * componenti in ascolto nella stessa scheda, e il caricamento del Meta Pixel
 * se e solo se è stato concesso.
 */
export function setMarketingConsent(marketing: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CONSENT_KEY,
      serializeConsent({ marketing, ts: new Date().toISOString() })
    );
  } catch {
    // Storage negato (Safari privato, quota): si prosegue comunque, così la
    // scelta vale almeno per questa sessione invece di essere ignorata.
  }

  window.gtag?.("consent", "update", consentModeSignals(marketing));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { marketing } }));
}

/** Si iscrive ai cambi di consenso. Restituisce la funzione di disiscrizione. */
export function onConsentChange(handler: (marketing: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    handler(Boolean((e as CustomEvent<{ marketing: boolean }>).detail?.marketing));
  };
  window.addEventListener(CONSENT_EVENT, listener);
  return () => window.removeEventListener(CONSENT_EVENT, listener);
}
