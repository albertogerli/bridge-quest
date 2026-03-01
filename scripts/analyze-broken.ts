/**
 * Categorize broken smazzate into fixable vs needs-PDF-reextraction
 */
import { smazzate as smazzate1to4 } from "../src/data/smazzate";
import { smazzate5to8 } from "../src/data/smazzate-5-8";
import { smazzate9to12 } from "../src/data/smazzate-9-12";
import { quadriSmazzate } from "../src/data/quadri-smazzate";
import { cuoriGiocoSmazzate } from "../src/data/cuori-gioco-smazzate";
import type { Smazzata } from "../src/data/smazzate";
import type { Position, Card } from "../src/lib/bridge-engine";

const POSITIONS: Position[] = ["north", "south", "east", "west"];

function nextPos(p: Position): Position {
  const order: Position[] = ["north", "east", "south", "west"];
  return order[(order.indexOf(p) + 1) % 4];
}

function prevPos(p: Position): Position {
  const order: Position[] = ["north", "east", "south", "west"];
  return order[(order.indexOf(p) + 3) % 4];
}

function cardStr(c: Card): string {
  const suits: Record<string, string> = { spade: "♠", heart: "♥", diamond: "♦", club: "♣" };
  return `${c.rank}${suits[c.suit]}`;
}

interface Issue {
  id: string;
  source: string;
  problems: string[];
  fixable: boolean;
  fix?: string;
  correctDeclarer?: Position;
}

function analyzeSmazzate(hands: Smazzata[], source: string): Issue[] {
  const issues: Issue[] = [];

  for (const s of hands) {
    const problems: string[] = [];

    // Check hand sizes
    let handSizeOk = true;
    for (const pos of POSITIONS) {
      if (s.hands[pos].length !== 13) {
        problems.push(`${pos}: ${s.hands[pos].length} cards`);
        handSizeOk = false;
      }
    }

    // Check duplicates
    let noDuplicates = true;
    const seen = new Set<string>();
    for (const pos of POSITIONS) {
      for (const c of s.hands[pos]) {
        const key = `${c.suit}-${c.rank}`;
        if (seen.has(key)) {
          problems.push(`duplicate ${cardStr(c)} in ${pos}`);
          noDuplicates = false;
        }
        seen.add(key);
      }
    }

    // Check opening lead
    const leader = nextPos(s.declarer);
    const hasLead = s.hands[leader].some(
      (c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank
    );

    let correctDeclarer: Position | undefined;
    if (!hasLead) {
      // Find who actually has the card
      for (const pos of POSITIONS) {
        if (s.hands[pos].some((c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank)) {
          correctDeclarer = prevPos(pos); // declarer is to the right of the leader
          problems.push(`opening lead ${cardStr(s.openingLead)} in ${pos}, not ${leader} → declarer should be ${correctDeclarer}`);
          break;
        }
      }
    }

    if (problems.length > 0) {
      // Fixable if: hands are correct (13 cards, no dupes), only declarer is wrong
      const fixable = handSizeOk && noDuplicates && !hasLead && correctDeclarer !== undefined;
      issues.push({
        id: s.id,
        source,
        problems,
        fixable,
        fix: fixable ? `change declarer from "${s.declarer}" to "${correctDeclarer}"` : undefined,
        correctDeclarer: fixable ? correctDeclarer : undefined,
      });
    }
  }

  return issues;
}

const fiori = [...smazzate1to4, ...smazzate5to8.map(h => h as unknown as Smazzata), ...smazzate9to12.map(h => h as unknown as Smazzata)];
const allIssues = [
  ...analyzeSmazzate(fiori, "fiori"),
  ...analyzeSmazzate(quadriSmazzate, "quadri"),
  ...analyzeSmazzate(cuoriGiocoSmazzate, "cuori-gioco"),
];

const fixable = allIssues.filter(i => i.fixable);
const needsPdf = allIssues.filter(i => !i.fixable);

console.log("=== AUTO-FIXABLE (only wrong declarer) ===");
for (const i of fixable) {
  console.log(`  ${i.id} [${i.source}]: ${i.fix}`);
}

console.log(`\n=== NEEDS PDF RE-EXTRACTION (${needsPdf.length} hands) ===`);
for (const i of needsPdf) {
  console.log(`  ${i.id} [${i.source}]: ${i.problems.join("; ")}`);
}

console.log(`\nSummary: ${fixable.length} auto-fixable, ${needsPdf.length} need PDF re-extraction`);

// Output fixable IDs for scripting
console.log("\n=== FIXABLE MAP (id → correctDeclarer) ===");
const fixMap: Record<string, string> = {};
for (const i of fixable) {
  fixMap[i.id] = i.correctDeclarer!;
}
console.log(JSON.stringify(fixMap, null, 2));
