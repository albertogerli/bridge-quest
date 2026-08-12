"use client";

/**
 * Lato browser del consenso: l'unico posto che tocca localStorage e window.
 * Le decisioni sono in `consent.ts`, che resta puro e testabile.
 */

import {
  CONSENT_EVENT,
  CONSENT_KEY,
  CONSENT_REOPEN_EVENT,
  parseConsent,
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

/**
 * Riapre il pannello delle preferenze, da qualunque punto dell'app.
 *
 * Non cancella la scelta precedente: la registrazione di quando è stata data
 * resta, e viene sostituita solo se l'utente ne compie una nuova.
 */
export function openConsentPreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_REOPEN_EVENT));
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


/**
 * Stato del consenso leggibile da console, per chi verifica il sito.
 *
 * PERCHÉ ESISTE
 * Tre audit esterni consecutivi hanno concluso che «il consenso resta denied
 * per tutti». Gli strumenti automatici cercano l'API IAB `__tcfapi` per
 * riconoscere un CMP e, non trovandola, riportano un falso negativo; in più
 * leggono il dataLayer senza cliccare il banner, quindi vedono solo il
 * consenso di default — che è lo stato corretto di chi non ha ancora scelto.
 *
 * Qui lo stato diventa ispezionabile senza congetture:
 *     window.bridgelabConsent.status()   // "pending" | "granted" | "denied"
 *
 * DELIBERATAMENTE SENZA `grant()`
 * Un metodo che concedesse il consenso da codice permetterebbe a qualunque
 * script di terze parti di autorizzare il tracciamento al posto della persona.
 * Si può solo LEGGERE lo stato e RIAPRIRE il pannello: la scelta resta un
 * gesto umano.
 */
export interface ConsentApi {
  version: 2;
  /** "pending" se non ha ancora scelto. */
  status(): "pending" | "granted" | "denied";
  /** Momento della scelta in ISO 8601, o null. */
  decidedAt(): string | null;
  /** Riapre il pannello delle preferenze. */
  open(): void;
}

declare global {
  interface Window {
    bridgelabConsent?: ConsentApi;
  }
}

export function exposeConsentApi(): void {
  if (typeof window === "undefined") return;
  window.bridgelabConsent = {
    version: 2,
    status() {
      const c = parseConsent(readRaw());
      if (c === null) return "pending";
      return c.marketing ? "granted" : "denied";
    },
    decidedAt() {
      return parseConsent(readRaw())?.ts || null;
    },
    open: openConsentPreferences,
  };
}
