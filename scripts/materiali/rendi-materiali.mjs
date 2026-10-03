// Rigenera i materiali didattici disegnati da HTML.
//
//   node scripts/materiali/rendi-materiali.mjs
//
// 1. Infografiche del corso Fiori (una pagina A4 per lezione, italiano e
//    inglese) → dove le cerca il sito, `getInfographicForLesson`:
//    public/infografiche/{,en/}fiori/lezione-NN-junior[-rev2022].{jpg,pdf}
// 2. Il PDF del corso intero, cucito dalle pagine delle lezioni: se ne manca
//    una si ferma, invece di stampare un corso con un buco.
// 3. Slide e dispense del modulo «Il gioco della carta» →
//    public/materiali/gioco-della-carta/, per gli insegnanti.
//
// Le carte sono disegnate da carte.js a partire dai dati: se una mano ha più o
// meno di 13 carte, o una carta compare due volte, il render si ferma.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

const rendi = (...a) => execFileSync("node", ["scripts/materiali/rendi.mjs", ...a], { stdio: "inherit" });

// Le lezioni 7 e 8 si servono col suffisso della revisione 2022: vedi
// `getInfographicForLesson` in src/components/maestro-video.ts.
const nome = (n) => `lezione-${n}-junior${["07", "08"].includes(n) ? "-rev2022" : ""}`;

const FIORI = "scripts/materiali/fiori";
const lezioni = readdirSync(FIORI).filter((f) => /^infografica-\d\d\.html$/.test(f)).map((f) => f.slice(12, 14)).sort();
for (const lingua of ["", "en/"]) {
  for (const n of lezioni) {
    rendi(`${FIORI}/${lingua}infografica-${n}.html`, `public/infografiche/${lingua}fiori/${nome(n)}`, "--jpg", "--una-pagina");
  }
  const pagine = Array.from({ length: 13 }, (_, i) => `public/infografiche/${lingua}fiori/${nome(String(i).padStart(2, "0"))}.pdf`);
  const mancanti = pagine.filter((p) => !existsSync(p));
  if (mancanti.length) throw new Error("corso Fiori incompleto, mancano: " + mancanti.join(", "));
  const corso = `public/infografiche/${lingua}fiori/corso-fiori-junior-rev2022.pdf`;
  execFileSync("qpdf", ["--empty", "--pages", ...pagine, "--", corso]);
  console.log(`✓ ${corso} — 13 pagine`);
}

const SRC = "scripts/materiali/gioco-della-carta";
const MAT = "public/materiali/gioco-della-carta";
for (const f of readdirSync(SRC).filter((f) => /^(slide|dispensa)-.*\.html$/.test(f))) {
  rendi(`${SRC}/${f}`, `${MAT}/${f.replace(/\.html$/, "")}`, ...(f.startsWith("slide-") ? ["--formato", "slide"] : []));
}
