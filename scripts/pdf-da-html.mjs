/**
 * Da un documento HTML a un PDF stampabile.
 *
 *   node scripts/pdf-da-html.mjs docs/qualcosa.html Qualcosa.pdf
 *
 * PERCHÉ ESISTE. I documenti che escono dal progetto — la risposta al feedback
 * degli insegnanti, e quelli che verranno — vanno consegnati come PDF, ma
 * scriverli in PDF non si può: si scrivono in HTML, si tengono sotto controllo
 * di versione come tutto il resto, e si rigenerano. Un PDF committato senza il
 * sorgente diventa un file che nessuno sa più come rifare.
 *
 * Usa il Chromium che Playwright ha già installato per i test: nessuna
 * dipendenza in più, e la resa è quella di una stampa da browser.
 *
 * Il piè di pagina con il numero di pagina lo mette Chromium: nel CSS del
 * documento non serve occuparsene.
 */

import { chromium } from "playwright";
import { resolve } from "path";

const [sorgente, destinazione] = process.argv.slice(2);
if (!sorgente || !destinazione) {
  console.error("Uso: node scripts/pdf-da-html.mjs <sorgente.html> <destinazione.pdf>");
  process.exit(2);
}

const titolo = process.env.TITOLO_PIE ?? "Bridge LAB";

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  // `networkidle`: se il documento carica qualcosa (un tipo di carattere, una
  // immagine) va aspettato, altrimenti finisce nel PDF a metà.
  await page.goto(`file://${resolve(sorgente)}`, { waitUntil: "networkidle" });
  await page.pdf({
    path: resolve(destinazione),
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      '<div style="width:100%;font-size:7pt;color:#8a93a2;padding:0 16mm;' +
      'text-align:right;font-family:Helvetica,Arial">' +
      `${titolo} · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
    margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" },
  });
  console.log(`scritto ${destinazione}`);
} finally {
  await browser.close();
}
