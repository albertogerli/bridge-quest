import qr from "qrcode-generator";

/**
 * Un QR come stringa SVG.
 *
 * PERCHÉ SVG E NON UN'IMMAGINE. La locandina si stampa, e un QR raster stampato
 * a due centimetri diventa illeggibile: l'SVG resta nitido a qualunque
 * dimensione, che è tutto quello che serve a un codice che deve essere
 * inquadrato da un telefono dall'altra parte della sala.
 *
 * PERCHÉ NON UN SERVIZIO ESTERNO. Ce ne sono di gratuiti che restituiscono
 * l'immagine da un indirizzo, e vorrebbe dire mandare a qualcun altro l'elenco
 * dei codici d'invito delle classi ogni volta che un insegnante apre la
 * locandina. Non vale i cinquanta kilobyte risparmiati.
 *
 * CORREZIONE D'ERRORE `M`, cioè circa il 15% recuperabile. Una locandina finisce
 * appesa in un circolo: si piega, si macchia, la si fotografa storta. `L`
 * sarebbe più piccolo e più fragile; `H` regge quasi tutto ma fa un codice più
 * fitto, quindi più difficile da inquadrare da lontano — che è il problema
 * vero in una sala.
 */
export function qrSvg(testo: string, opzioni?: { margine?: number }): string {
  const g = qr(0, "M");
  g.addData(testo);
  g.make();

  const n = g.getModuleCount();
  const margine = opzioni?.margine ?? 2;
  const lato = n + margine * 2;

  // Un solo `path` per tutti i moduli neri invece di un rettangolo ciascuno:
  // con 29 moduli per lato sarebbero ottocento elementi, e la stampa di una
  // pagina con dentro un albero così è lenta senza motivo.
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (g.isDark(r, c)) d += `M${c + margine} ${r + margine}h1v1h-1z`;
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lato} ${lato}" shape-rendering="crispEdges" role="img" aria-label="Codice QR">`,
    `<rect width="${lato}" height="${lato}" fill="#fff"/>`,
    `<path d="${d}" fill="#000"/>`,
    `</svg>`,
  ].join("");
}

/**
 * L'indirizzo che il QR deve portare: la pagina delle classi con il codice
 * già scritto.
 *
 * Non porta direttamente dentro la classe. L'iscrizione resta un gesto della
 * persona — inquadrare un codice appeso al muro non è un consenso a entrare da
 * qualche parte — e comunque serve un account: il codice precompilato toglie
 * l'unico passaggio che si può togliere, cioè copiare sei caratteri a mano.
 */
export function indirizzoIscrizione(codice: string, sito?: string): string {
  const base = (sito || process.env.NEXT_PUBLIC_SITE_URL || "https://bridgelab.it").replace(/\/$/, "");
  return `${base}/classi?codice=${encodeURIComponent(codice)}`;
}
