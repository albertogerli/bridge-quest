// Rende una pagina HTML dei materiali didattici in PDF (e, a richiesta, in
// un'immagine della prima pagina).
//
//   node scripts/materiali/rendi.mjs <file.html> <uscita-senza-estensione> [opzioni]
//
//   --formato a4      pagine A4 verticali (infografiche, dispense) — predefinito
//   --formato slide   pagine 1280×720 (presentazioni): ogni <section class="slide"> è una pagina
//   --jpg             anche <uscita>.jpg: tutta la pagina, per l'anteprima nel sito
//   --una-pagina      esce con errore se il contenuto non sta in una pagina sola
//
// Il PDF si ferma se `carte.js` trova una carta o una mano sbagliata: meglio
// nessun file che un file con un errore dentro.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { unlinkSync } from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const [file, uscita] = argv;
if (!file || !uscita) {
  console.error("uso: node scripts/materiali/rendi.mjs <file.html> <uscita> [--formato a4|slide] [--jpg] [--una-pagina]");
  process.exit(2);
}
const formato = argv.includes("--formato") ? argv[argv.indexOf("--formato") + 1] : "a4";
const [w, h] = formato === "slide" ? [1280, 720] : [794, 1123];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
const errori = [];
page.on("pageerror", (e) => errori.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errori.push(m.text()); });
await page.goto("file://" + path.resolve(file));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
if (errori.length) {
  console.error(`✗ ${file}:\n  ` + errori.join("\n  "));
  await browser.close();
  process.exit(1);
}

const altezza = await page.evaluate(() => document.body.scrollHeight);
if (argv.includes("--una-pagina") && altezza > h + 1) {
  console.error(`✗ ${file}: il contenuto è alto ${altezza}px, la pagina ${h}px`);
  await browser.close();
  process.exit(1);
}

await page.pdf({
  path: uscita + ".pdf",
  printBackground: true,
  preferCSSPageSize: true,
  ...(formato === "slide" ? { width: "1280px", height: "720px" } : { format: "A4" }),
});

if (argv.includes("--jpg")) {
  const png = uscita + ".tmp.png";
  await page.screenshot({ path: png, fullPage: true });
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", png, "--out", uscita + ".jpg"], { stdio: "ignore" });
  unlinkSync(png);
}
await browser.close();
const pagine = execFileSync("pdfinfo", [uscita + ".pdf"]).toString().match(/Pages:\s+(\d+)/)?.[1];
console.log(`✓ ${path.basename(uscita)}.pdf — ${pagine} pagine`);
