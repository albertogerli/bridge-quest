import { describe, it } from "vitest";
import type { Card, Suit } from "./bridge-engine";
import { aperturaConsigliata } from "./apertura";
import { generateDeals } from "./deal-generator";
import { handToPBN } from "./ben-format";

/**
 * BEN dichiara come insegna la FIGB?
 *
 * PERCHÉ LA DOMANDA NON È OZIOSA
 * La rete di BEN è addestrata su GIB/BBO, cioè lo standard americano. Nei
 * fondamentali coincide col Naturale dei corsi — quinta maggiore, 1SA 15-17 —
 * ma le convenzioni divergono, e un compagno che dichiara in un altro sistema
 * insegnerebbe la cosa sbagliata con l'autorevolezza di una rete neurale.
 *
 * Qui si misura invece di discutere: si generano mani, si chiede a BEN cosa
 * apre, e si confronta con `aperturaConsigliata`, che è la regola del Naturale
 * già scritta e testata. Si contano solo le mani su cui la nostra regola ha
 * una risposta sola: dove tace, due aperture sono entrambe difendibili e un
 * disaccordo non vorrebbe dire niente.
 *
 *   BEN_API_URL=https://…up.railway.app BEN_API_TOKEN=… \
 *   MISURA_SISTEMA=1 npx vitest run src/lib/ben-sistema.test.ts --disable-console-intercept
 *
 * Non gira con `npm test`: sono chiamate di rete.
 *
 * ESITO del 14/08/2026, 80 mani generate, 25 con un'apertura non ambigua:
 *
 *   24 su 25 identiche (96%).
 *
 * L'unico disaccordo, ed è istruttivo:
 *   ♠K3 ♥A1083 ♦AKJ92 ♣54  →  noi 1♦, BEN 1SA
 * Quindici punti, ma la distribuzione è 5-4-2-2: due doppie, quindi NON
 * bilanciata secondo la definizione dei corsi (4333, 4432, 5332). Aprire 1SA
 * lì è una libertà di stile che alcuni esperti americani si prendono; nel
 * Naturale insegnato si apre il minore e si rilancia a cuori.
 *
 * Sui fondamentali quindi i due sistemi coincidono, e il compagno artificiale
 * non insegna nulla di storto. Le differenze vere non stanno nelle aperture ma
 * nelle convenzioni delle risposte: per misurare quelle serve confrontare la
 * licita intera, non la prima dichiarazione.
 */

const QUANTE = Number(process.env.MISURA_SISTEMA_MANI ?? 60);
const URL = process.env.BEN_API_URL ?? "";
const TOKEN = process.env.BEN_API_TOKEN ?? "";

const SIMBOLO: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣", N: "SA", NT: "SA" };

function inItaliano(bid: string): string {
  const b = bid.trim().toUpperCase();
  if (b === "PASS" || b === "P") return "Passo";
  const m = b.match(/^([1-7])(NT|N|S|H|D|C)$/);
  return m ? `${m[1]}${SIMBOLO[m[2]]}` : b;
}

function mostra(hand: Card[]): string {
  const semi: Suit[] = ["spade", "heart", "diamond", "club"];
  const ordine = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
  return semi
    .map((s) => {
      const c = hand.filter((x) => x.suit === s)
        .sort((a, b) => ordine.indexOf(a.rank) - ordine.indexOf(b.rank))
        .map((x) => x.rank).join("");
      return `${SIMBOLO[{ spade: "S", heart: "H", diamond: "D", club: "C" }[s]]}${c || "—"}`;
    })
    .join(" ");
}

describe.skipIf(!(process.env.MISURA_SISTEMA && URL && TOKEN))(
  "BEN contro il Naturale dei corsi FIGB",
  () => {
    it("apre come insegniamo?", async () => {
      const { deals } = generateDeals({}, { count: QUANTE, seed: 31337 });
      let confrontate = 0, uguali = 0;
      const diverse: string[] = [];

      for (const deal of deals) {
        const hand = deal.south;
        const nostra = aperturaConsigliata(hand);
        // Dove la nostra regola tace, un disaccordo non direbbe niente.
        if (!nostra) continue;

        const params = new URLSearchParams({
          hand: handToPBN(hand), seat: "S", dealer: "S", vul: "None", ctx: "",
        });
        const res = await fetch(`${URL}/bid?${params}`, { headers: { "X-BEN-Token": TOKEN } });
        if (!res.ok) continue;
        const dati = (await res.json()) as { bid?: string };
        if (!dati.bid) continue;

        confrontate++;
        const sua = inItaliano(dati.bid);
        if (sua === nostra.bid) uguali++;
        else diverse.push(`  ${mostra(hand)}  →  noi ${nostra.bid}, BEN ${sua}`);
      }

      const perc = confrontate ? Math.round((uguali / confrontate) * 100) : 0;
      console.log(`\n  Confrontate ${confrontate} aperture: ${uguali} uguali (${perc}%)\n`);
      if (diverse.length) {
        console.log("  Dove non siamo d'accordo:");
        for (const d of diverse.slice(0, 20)) console.log(d);
      }
    }, 1_800_000);
  }
);
