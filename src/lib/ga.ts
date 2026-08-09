/**
 * Google Analytics 4.
 * Il tag base (gtag.js) è caricato una sola volta in src/app/layout.tsx,
 * insieme al tag Google Ads (vedi src/lib/gads.ts): gtag.js si carica con un
 * solo ID e poi si configurano le destinazioni con `gtag('config', ...)`.
 *
 * L'ID di misurazione è pubblico (finisce comunque nel sorgente della pagina),
 * quindi è hardcoded come fallback: così il tracciamento è attivo in produzione
 * senza dover configurare env su Vercel. Override possibile via
 * NEXT_PUBLIC_GA_ID (utile per una property di staging).
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-38HB5NQGG1";
