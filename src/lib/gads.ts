/**
 * Google Ads conversion tracking.
 * Tag base caricato in src/app/layout.tsx (gtag.js, una volta sola).
 *
 * CONSENSO — perché qui non c'è un controllo esplicito e nel Meta Pixel sì
 * gtag è governato da Google Consent Mode v2, impostato in layout.tsx con
 * TUTTI i segnali su "denied" per impostazione predefinita. Con il consenso
 * negato gtag non scrive cookie e non invia identificatori: manda un ping
 * senza dati personali, che è il meccanismo previsto e accettato in UE. Un
 * ulteriore blocco qui perderebbe le conversioni modellate senza aggiungere
 * tutela.
 *
 * Meta non ha un equivalente: il suo Pixel imposta i cookie `_fbp`/`_fbc` non
 * appena viene caricato. Per questo lì il consenso è una condizione per
 * scaricare lo script (vedi src/lib/meta-pixel.ts), non per inviare eventi.
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
