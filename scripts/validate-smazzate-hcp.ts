/**
 * Validator: per ogni smazzata controlla che la linea dichiarante abbia HCP
 * ragionevoli per il contratto. Stampa solo le anomalie.
 */

import { allSmazzate } from "../src/data/all-smazzate";
import type { Card } from "../src/lib/bridge-engine";

const HCP: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };
const hcp = (h: Card[]) => h.reduce((s, c) => s + (HCP[c.rank] ?? 0), 0);

// Soglia minima HCP per la linea dichiarante per ogni livello+strain.
// Conservativa: lascia margine per distribuzioni e fit.
function minHcpForContract(contract: string): number {
  // Strip doubling/redoubling
  const base = contract.replace(/[XR]+$/g, "");
  const m = base.match(/^(\d)(NT|S|H|D|C)$/i);
  if (!m) return 0;
  const lvl = parseInt(m[1], 10);
  const strain = m[2].toUpperCase();
  const isNT = strain === "NT";
  const isMaj = strain === "S" || strain === "H";
  // const isMin = strain === "D" || strain === "C";

  // Tabella prudente:
  if (lvl <= 2) return 18; // parziale: bassa soglia
  if (lvl === 3 && !isNT) return 20; // 3 di colore: parziale
  if (lvl === 3 && isNT) return 24; // game 3NT
  if (lvl === 4 && isMaj) return 24; // game maggiore
  if (lvl === 4 && !isMaj && !isNT) return 22; // 4 di minore: parziale forte
  if (lvl === 5) return 27; // game minore
  if (lvl === 6) return 30; // slam
  if (lvl === 7) return 34; // slam grande
  return 0;
}

let issues = 0;
for (const s of allSmazzate) {
  const hN = hcp(s.hands.north), hS = hcp(s.hands.south);
  const hE = hcp(s.hands.east), hW = hcp(s.hands.west);
  const isNS = s.declarer === "north" || s.declarer === "south";
  const declarerSide = isNS ? "NS" : "EW";
  const declarerHcp = isNS ? hN + hS : hE + hW;
  const oppHcp = 40 - declarerHcp;
  const minNeeded = minHcpForContract(s.contract);

  if (declarerHcp < minNeeded) {
    issues++;
    console.log(
      `❌ ${s.id} L${s.lesson} B${s.board} | ${s.contract} by ${s.declarer.toUpperCase()} | ` +
      `${declarerSide}=${declarerHcp} vs avv=${oppHcp} (min richiesto=${minNeeded})`
    );
    console.log(`   N=${hN} S=${hS} E=${hE} W=${hW} | "${s.title}"`);
  }
}

console.log(`\nTotale smazzate: ${allSmazzate.length}`);
console.log(`Anomalie HCP linea dichiarante: ${issues}`);
