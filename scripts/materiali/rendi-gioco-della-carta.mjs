// Rigenera tutti i materiali del modulo «Il gioco della carta».
//
//   node scripts/materiali/rendi-gioco-della-carta.mjs
//
// Infografiche (una pagina A4 per lezione, italiano e inglese) → dove le cerca
// il sito: public/infografiche/{,en/}fiori/lezione-0N-junior.{jpg,pdf}.
// Slide e dispense → public/materiali/gioco-della-carta/, per gli insegnanti.
//
// Le carte sono disegnate da carte.js a partire dai dati: se una mano ha più o
// meno di 13 carte, o una carta compare due volte, il render si ferma.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

const SRC = "scripts/materiali/gioco-della-carta";
const MAT = "public/materiali/gioco-della-carta";
const rendi = (...a) => execFileSync("node", ["scripts/materiali/rendi.mjs", ...a], { stdio: "inherit" });

// lezione BridgeLab 1–6 del corso Fiori
for (const n of ["01", "02", "03", "04", "05", "06"]) {
  rendi(`${SRC}/infografica-${n}.html`, `public/infografiche/fiori/lezione-${n}-junior`, "--jpg", "--una-pagina");
  rendi(`${SRC}/en/infografica-${n}.html`, `public/infografiche/en/fiori/lezione-${n}-junior`, "--jpg", "--una-pagina");
}
for (const f of readdirSync(SRC).filter((f) => f.startsWith("slide-") && f.endsWith(".html"))) {
  rendi(`${SRC}/${f}`, `${MAT}/${f.replace(/\.html$/, "")}`, "--formato", "slide");
}
for (const f of readdirSync(SRC).filter((f) => f.startsWith("dispensa-") && f.endsWith(".html"))) {
  rendi(`${SRC}/${f}`, `${MAT}/${f.replace(/\.html$/, "")}`);
}
