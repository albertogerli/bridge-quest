/**
 * Google Ads conversion tracking.
 * Tag base caricato in src/app/layout.tsx (gtag.js, una volta sola).
 */

export const GADS_ID = "AW-482620196";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Conversione "registrazione utente completata".
 * Da chiamare SOLO nel callback di successo della registrazione.
 * No-op se: SSR, gtag non caricato (adblock), o label non configurata.
 */
export function trackRegistration() {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  const label = process.env.NEXT_PUBLIC_GADS_SIGNUP_LABEL;
  if (!label) return;

  window.gtag("event", "conversion", {
    send_to: `${GADS_ID}/${label}`,
    value: 10.0,
    currency: "EUR",
    // il signup redirige subito dopo: beacon sopravvive alla navigazione
    transport_type: "beacon",
  });
}
