/**
 * Per ogni smazzata "non plausibile", classifica il tipo di errore:
 *
 *   FIX_DECLARER: cambiando solo il campo `declarer` (mantenendo mani e lead)
 *                 la smazzata diventa coerente. Il lead deve restare valido.
 *   FIX_PERM:     una sola permutazione delle 4 posizioni rende coerente.
 *   AMBIGUOUS:    più candidati. Servono commentary o source FIGB per scegliere.
 *   CORRUPT:      nessuna permutazione e nessun cambio declarer salva.
 *
 * Output:
 *   - tmp/buggy-smazzate-report.md  (report human-readable)
 *   - console summary
 */

import * as fs from "fs";
import * as path from "path";
import { allSmazzate, isPlausibleSmazzata, type Smazzata } from "../src/data/all-smazzate";
import type { Card, Position } from "../src/lib/bridge-engine";

const HCP: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };
const hcp = (h: Card[]) => h.reduce((s, c) => s + (HCP[c.rank] ?? 0), 0);

const POS: Position[] = ["north", "east", "south", "west"];
const leftOf = (p: Position): Position => POS[(POS.indexOf(p) + 1) % 4];

function minHcpForContract(contract: string): number {
  const normalized = contract
    .replace(/♠/g, "S").replace(/♥/g, "H").replace(/♦/g, "D").replace(/♣/g, "C")
    .replace(/[XR]+$/g, "");
  const m = normalized.match(/^(\d)(NT|S|H|D|C)$/i);
  if (!m) return 0;
  const lvl = parseInt(m[1], 10);
  const strain = m[2].toUpperCase();
  const isNT = strain === "NT";
  const isMaj = strain === "S" || strain === "H";
  if (lvl <= 2) return 12;
  if (lvl === 3 && !isNT) return 16;
  if (lvl === 3 && isNT) return 19;
  if (lvl === 4 && isMaj) return 18;
  if (lvl === 4 && !isMaj && !isNT) return 17;
  if (lvl === 5) return 21;
  if (lvl === 6) return 25;
  if (lvl === 7) return 27;
  return 0;
}

function isOK(declarerHcp: number, oppHcp: number, minNeeded: number): boolean {
  if (declarerHcp + 10 < oppHcp) return false;
  if (declarerHcp < minNeeded) return false;
  return true;
}

function* perms<T>(arr: T[]): Generator<T[]> {
  if (arr.length <= 1) { yield arr; return; }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const sub of perms(rest)) yield [arr[i], ...sub];
  }
}

function fmtHand(hand: Card[]): string {
  const order = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const bySuit: Record<string, string[]> = { spade: [], heart: [], diamond: [], club: [] };
  for (const c of hand) bySuit[c.suit]?.push(c.rank);
  for (const k of Object.keys(bySuit))
    bySuit[k].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const fmt = (s: string[]) => (s.length ? s.join("") : "—");
  return `♠${fmt(bySuit.spade)} ♥${fmt(bySuit.heart)} ♦${fmt(bySuit.diamond)} ♣${fmt(bySuit.club)}`;
}

const buggy = allSmazzate.filter((s) => !isPlausibleSmazzata(s));

interface Analysis {
  s: Smazzata;
  identityHcp: { N: number; E: number; S: number; W: number };
  declarerHcp: number;
  oppHcp: number;
  minNeeded: number;
  // Possible fixes:
  declarerFixes: { newDeclarer: Position; newDeclarerHcp: number; leadValid: boolean }[];
  permFixes: { mapping: Record<Position, Position>; newHcp: { N: number; E: number; S: number; W: number }; newDeclarerHcp: number }[];
  category: "FIX_DECLARER" | "FIX_PERM" | "AMBIGUOUS" | "CORRUPT";
}

function analyze(s: Smazzata): Analysis {
  const original = s.hands;
  const minNeeded = minHcpForContract(s.contract);
  const isNS = s.declarer === "north" || s.declarer === "south";
  const identityHcp = {
    N: hcp(original.north), E: hcp(original.east),
    S: hcp(original.south), W: hcp(original.west),
  };
  const declarerHcp = isNS ? identityHcp.N + identityHcp.S : identityHcp.E + identityHcp.W;
  const oppHcp = 40 - declarerHcp;

  // 1) Try changing only declarer
  const declarerFixes: Analysis["declarerFixes"] = [];
  for (const newDecl of POS) {
    if (newDecl === s.declarer) continue;
    const isNS2 = newDecl === "north" || newDecl === "south";
    const newDeclHcp = isNS2 ? identityHcp.N + identityHcp.S : identityHcp.E + identityHcp.W;
    const newOpp = 40 - newDeclHcp;
    if (!isOK(newDeclHcp, newOpp, minNeeded)) continue;
    const leader = leftOf(newDecl);
    const leaderHand = original[leader];
    const leadValid = leaderHand.some(
      (c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank
    );
    declarerFixes.push({ newDeclarer: newDecl, newDeclarerHcp: newDeclHcp, leadValid });
  }

  // 2) Try all 24 perms (with original lead+declarer)
  const permFixes: Analysis["permFixes"] = [];
  const leader = leftOf(s.declarer);
  for (const perm of perms(POS)) {
    const mapping: Record<Position, Position> = {
      north: perm[0], east: perm[1], south: perm[2], west: perm[3],
    };
    // Skip identity (already known buggy)
    if (mapping.north === "north" && mapping.east === "east" &&
        mapping.south === "south" && mapping.west === "west") continue;
    const newHcp = {
      N: hcp(original[mapping.north]), E: hcp(original[mapping.east]),
      S: hcp(original[mapping.south]), W: hcp(original[mapping.west]),
    };
    const newDeclHcp = isNS ? newHcp.N + newHcp.S : newHcp.E + newHcp.W;
    const newOpp = 40 - newDeclHcp;
    if (!isOK(newDeclHcp, newOpp, minNeeded)) continue;
    const leaderHand = original[mapping[leader]];
    const leadValid = leaderHand.some(
      (c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank
    );
    if (!leadValid) continue;
    permFixes.push({ mapping, newHcp, newDeclarerHcp: newDeclHcp });
  }

  let category: Analysis["category"];
  const validDeclFixes = declarerFixes.filter((d) => d.leadValid);
  if (validDeclFixes.length === 1 && permFixes.length === 0) category = "FIX_DECLARER";
  else if (permFixes.length === 1 && validDeclFixes.length === 0) category = "FIX_PERM";
  else if (validDeclFixes.length + permFixes.length === 0) category = "CORRUPT";
  else category = "AMBIGUOUS";

  return {
    s, identityHcp, declarerHcp, oppHcp, minNeeded,
    declarerFixes, permFixes, category,
  };
}

const analyses = buggy.map(analyze);

// ── Report markdown ─────────────────────────────────────────────────────────
function fmtMapping(m: Record<Position, Position>): string {
  const parts: string[] = [];
  for (const dest of POS)
    if (m[dest] !== dest) parts.push(`${dest[0].toUpperCase()}←${m[dest][0].toUpperCase()}`);
  return parts.length === 0 ? "(identity)" : parts.join(" ");
}

const lines: string[] = [];
lines.push("# Report smazzate con HCP/contratto incoerente\n");
lines.push(`**Pool totale:** ${allSmazzate.length}  |  **Buggate:** ${buggy.length}  |  **Pool valido (sfide):** ${allSmazzate.length - buggy.length}\n`);

const byCat = {
  FIX_DECLARER: analyses.filter((a) => a.category === "FIX_DECLARER"),
  FIX_PERM: analyses.filter((a) => a.category === "FIX_PERM"),
  AMBIGUOUS: analyses.filter((a) => a.category === "AMBIGUOUS"),
  CORRUPT: analyses.filter((a) => a.category === "CORRUPT"),
};
lines.push(`## Riepilogo per categoria\n`);
lines.push(`- **Fix declarer** (cambiare solo \`declarer\`): ${byCat.FIX_DECLARER.length}`);
lines.push(`- **Fix perm** (permutare le mani, unica opzione): ${byCat.FIX_PERM.length}`);
lines.push(`- **Ambigue** (più fix candidati, serve source FIGB): ${byCat.AMBIGUOUS.length}`);
lines.push(`- **Corrotte** (nessun fix automatico salva): ${byCat.CORRUPT.length}\n`);

for (const cat of ["FIX_DECLARER", "FIX_PERM", "AMBIGUOUS", "CORRUPT"] as const) {
  const items = byCat[cat];
  if (items.length === 0) continue;
  lines.push(`## ${cat}\n`);
  for (const a of items) {
    const { s } = a;
    const declSide = s.declarer === "north" || s.declarer === "south" ? "NS" : "EW";
    lines.push(`### ${s.id} — L${s.lesson} B${s.board} — "${s.title}"`);
    lines.push(`- Contratto: \`${s.contract}\` da ${s.declarer.toUpperCase()} (${declSide})`);
    lines.push(`- Lead: ${s.openingLead.rank}${s.openingLead.suit}`);
    lines.push(`- HCP: N=${a.identityHcp.N} E=${a.identityHcp.E} S=${a.identityHcp.S} W=${a.identityHcp.W}  →  ${declSide}=${a.declarerHcp} vs avv=${a.oppHcp} (min richiesto ${a.minNeeded})`);
    lines.push(`- N: \`${fmtHand(s.hands.north)}\``);
    lines.push(`- E: \`${fmtHand(s.hands.east)}\``);
    lines.push(`- S: \`${fmtHand(s.hands.south)}\``);
    lines.push(`- W: \`${fmtHand(s.hands.west)}\``);
    if (s.bidding) lines.push(`- Bidding: dealer=${s.bidding.dealer} → \`${s.bidding.bids.join(" ")}\``);

    if (a.declarerFixes.filter((d) => d.leadValid).length > 0) {
      lines.push(`- **Fix declarer candidati:**`);
      for (const d of a.declarerFixes.filter((x) => x.leadValid)) {
        lines.push(`  - \`declarer = "${d.newDeclarer}"\` → linea dichiarante = ${d.newDeclarerHcp} HCP`);
      }
    }
    if (a.permFixes.length > 0) {
      lines.push(`- **Fix permutazione candidati:**`);
      for (const p of a.permFixes.slice(0, 4)) {
        lines.push(`  - ${fmtMapping(p.mapping)} → linea dichiarante = ${p.newDeclarerHcp} HCP  (N=${p.newHcp.N} E=${p.newHcp.E} S=${p.newHcp.S} W=${p.newHcp.W})`);
      }
      if (a.permFixes.length > 4) lines.push(`  - ...e altri ${a.permFixes.length - 4} candidati`);
    }
    if (a.category === "CORRUPT") {
      lines.push(`- ❌ Nessun fix automatico ricostruibile (probabile errore in più campi: mani + bidding + lead + declarer).`);
    }
    if (s.commentary) {
      lines.push(`- *Commentary:* ${s.commentary.slice(0, 280)}${s.commentary.length > 280 ? "…" : ""}`);
    }
    lines.push("");
  }
}

const outDir = path.join(__dirname, "..", "tmp");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "buggy-smazzate-report.md");
fs.writeFileSync(outFile, lines.join("\n"));

console.log(`Smazzate buggate: ${buggy.length}`);
console.log(`  FIX_DECLARER: ${byCat.FIX_DECLARER.length}`);
console.log(`  FIX_PERM:     ${byCat.FIX_PERM.length}`);
console.log(`  AMBIGUOUS:    ${byCat.AMBIGUOUS.length}`);
console.log(`  CORRUPT:      ${byCat.CORRUPT.length}`);
console.log(`\nReport: ${outFile}`);
