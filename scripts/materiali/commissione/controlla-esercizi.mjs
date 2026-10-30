/**
 * Controlla una scheda di esercizi della Commissione (src/data/esercizi-commissione/*.json):
 * struttura, numeri in ordine, carte valide, nessuna carta doppia in una figura,
 * nessuna mano oltre le 13 carte.
 *
 *   node scripts/materiali/commissione/controlla-esercizi.mjs <file.json>...
 */
import fs from "node:fs";

const RANGHI = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "x"];
const SEMI = ["S", "H", "D", "C", "X"];
const POSTI = ["nord", "ovest", "est", "sud"];
let errori = 0;
const male = (f, m) => { console.error(`✗ ${f}: ${m}`); errori++; };

function ranghi(t) {
  // «…2»: altre carte non mostrate, poi il 2. I puntini non sono carte.
  t = t.replace(/^(…|\.\.\.)/, "");
  const out = [];
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "1" && t[i + 1] === "0") { out.push("10"); i++; }
    else out.push(t[i] === "x" || t[i] === "X" ? "x" : t[i]);
  }
  return out;
}

for (const file of process.argv.slice(2)) {
  const s = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const k of ["slug", "titolo", "lezioni", "temi"]) if (!(k in s)) male(file, `manca ${k}`);
  for (const tema of s.temi ?? []) {
    let atteso = 1;
    for (const e of tema.esercizi ?? []) {
      const dove = `${file} ${tema.tema} es.${e.numero}`;
      if (e.numero !== atteso) male(dove, `numero ${e.numero}, atteso ${atteso}`);
      atteso = e.numero + 1;
      if (!e.consegna?.trim()) male(dove, "consegna vuota");
      if (!e.soluzione?.trim()) male(dove, "soluzione vuota");
      for (const [i, f] of (e.figure ?? []).entries()) {
        const viste = new Set();
        let posti = 0;
        // Un errore dell'originale, riportato com'è stampato e già segnalato agli autori.
        const segnalato = (m) => { if (f.errataOriginale) console.warn(`! ${dove}: ${m} (errore dell'originale: ${f.errataOriginale})`); else male(dove, m); };
        for (const p of Object.keys(f)) if (![...POSTI, "etichetta", "nota", "errataOriginale"].includes(p)) male(dove, `figura ${i + 1}: chiave sconosciuta ${p}`);
        for (const p of POSTI) {
          if (!f[p]) continue;
          posti++;
          let n = 0;
          for (const [seme, t] of Object.entries(f[p])) {
            if (!SEMI.includes(seme)) male(dove, `figura ${i + 1} ${p}: seme ${seme}`);
            if (typeof t !== "string") { male(dove, `figura ${i + 1} ${p}: ${seme} non è una stringa`); continue; }
            for (const r of ranghi(t)) {
              n++;
              if (!RANGHI.includes(r)) male(dove, `figura ${i + 1} ${p}: carta «${r}» in ${seme}`);
              if (r === "x") continue;
              if (viste.has(seme + r)) segnalato(`figura ${i + 1}: ${r} di ${seme} due volte`);
              viste.add(seme + r);
            }
          }
          if (n > 13) segnalato(`figura ${i + 1} ${p}: ${n} carte`);
        }
        if (posti === 0) male(dove, `figura ${i + 1} senza mani`);
      }
    }
  }
  console.log(`${file}: ${(s.temi ?? []).reduce((a, t) => a + t.esercizi.length, 0)} esercizi`);
}
process.exit(errori ? 1 : 0);
