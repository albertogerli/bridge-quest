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
 *
 * VALORE: volutamente NON inviato. L'iscrizione è gratuita, quindi qualsiasi
 * importo scritto qui sarebbe inventato — e un valore gonfiato farebbe tarare
 * le offerte automatiche di Google su un ritorno inesistente. Omettendolo,
 * Ads applica il valore configurato sull'azione di conversione: un solo posto
 * da cambiare, senza deploy, senza due numeri che possono divergere.
 */
export function trackRegistration() {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  const label = process.env.NEXT_PUBLIC_GADS_SIGNUP_LABEL;
  if (!label) return;

  window.gtag("event", "conversion", {
    send_to: `${GADS_ID}/${label}`,
    // il signup redirige subito dopo: beacon sopravvive alla navigazione
    transport_type: "beacon",
  });
}
