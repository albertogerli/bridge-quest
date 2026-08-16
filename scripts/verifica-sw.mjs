/**
 * Nel precache del service worker non devono finire i video.
 *
 *   node scripts/verifica-sw.mjs     (dopo `npm run build`)
 *
 * PERCHÉ ESISTE. Il manifest del precache si costruisce al build su tutto ciò
 * che sta in `public/`, e lì dentro ci sono le lezioni del maestro: 49 file,
 * 169 MB. Il service worker se li scaricava durante l'INSTALLAZIONE, cioè
 * mentre l'utente aspettava la prima pagina dopo il login — misurato in
 * produzione il 17/08/2026: primo contenuto dopo 256 secondi con il worker
 * attivo, 1,5 secondi senza. Quattro minuti di rotellina bianca, che chi arriva
 * legge come «il sito è rotto».
 *
 * La regola `NetworkOnly` dentro `src/app/sw.ts` NON basta e non è una svista
 * da correggere lì: quella governa il traffico a runtime, il precache è
 * un'altra lista. L'esclusione vera sta in `next.config.ts`.
 *
 * Questo controllo guarda il file generato, non la configurazione: è l'unico
 * modo di accorgersi se un aggiornamento di Serwist cambia il significato di
 * `exclude` e i video tornano dentro in silenzio.
 *
 * Esce con 1 se ne trova.
 */
import { readFileSync, existsSync } from "node:fs";

const FILE = new URL("../public/sw.js", import.meta.url);

if (!existsSync(FILE)) {
  console.log("public/sw.js non c'è: niente da controllare (build non eseguita).");
  process.exit(0);
}

const sw = readFileSync(FILE, "utf8");

/** Roba che non deve mai stare in un precache: pesa e non serve all'avvio. */
const VIETATI = [
  { nome: "video .mp4", regola: /\/videos\/[\w.-]+\.mp4/g },
  // `(?![\w])` perché senza, «.webm» pesca dentro «manifest.webmanifest» e il
  // controllo bocciava una build sana.
  { nome: "altri filmati", regola: /[\w/-]+\.(?:mov|webm)(?![\w])/g },
  { nome: "audio", regola: /[\w/-]+\.(?:mp3|wav)(?![\w])/g },
];

let trovati = 0;
for (const v of VIETATI) {
  const hit = [...new Set(sw.match(v.regola) ?? [])];
  if (hit.length) {
    trovati += hit.length;
    console.error(`\n${hit.length} ${v.nome} nel service worker:`);
    for (const h of hit.slice(0, 5)) console.error(`  ${h}`);
    if (hit.length > 5) console.error(`  … e altri ${hit.length - 5}`);
  }
}

if (trovati) {
  console.error(
    "\nQuesti file finiscono nel precache e vengono scaricati all'installazione,\n" +
      "mentre l'utente aspetta la prima pagina. Vanno esclusi in `next.config.ts`,\n" +
      "nell'opzione `exclude` di withSerwistInit — non basta la regola NetworkOnly\n" +
      "in `src/app/sw.ts`, che vale solo per il traffico a runtime."
  );
  process.exit(1);
}

console.log("service worker pulito: nessun video o audio nel precache.");
