import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import pbnParser from "pbn";
import { dealsToPbn } from "./pbn";
import { generateDeals } from "./deal-generator";
import type { Card, Position } from "./bridge-engine";

/**
 * Il nostro PBN letto da un parser DI QUALCUN ALTRO.
 *
 * PERCHÉ NON BASTA IL NOSTRO. `pbn.test.ts` verifica che quello che scriviamo
 * lo sappiamo rileggere, ed è una tautologia: se sbagliassimo la notazione allo
 * stesso modo in scrittura e in lettura, il test passerebbe e il file sarebbe
 * comunque illeggibile per il software del circolo. Il requisito dice
 * «verificati con un parser di terze parti, non solo con il nostro», e questo è
 * quel controllo.
 *
 * Il parser è `pbn` di Richard Schneider, che è anche quello che sa leggere i
 * formati delle duplicatrici (BRI, DGE, DUP): sta fra le dipendenze di
 * sviluppo, non finisce nel pacchetto dell'applicazione.
 */

const SEMI: Record<string, string> = { S: "spade", H: "heart", D: "diamond", C: "club" };
const POSTI: Record<string, Position> = { N: "north", E: "east", S: "south", W: "west" };

interface CartaPbn {
  seat: string;
  suit: string;
  rank: string;
}

async function leggiConParserEsterno(testo: string): Promise<Record<string, unknown>[]> {
  const eventi: Record<string, unknown>[] = [];
  await new Promise<void>((risolvi, rifiuta) => {
    const s = new Readable();
    s.push(testo);
    s.push(null);
    s.pipe(pbnParser())
      .on("data", (d: Record<string, unknown>) => eventi.push(d))
      .on("end", () => risolvi())
      .on("error", rifiuta);
  });
  return eventi;
}

describe("il nostro PBN, letto da un parser di terze parti", () => {
  it("le mani tornano identiche, carta per carta", async () => {
    const { deals } = generateDeals({}, { count: 3, seed: 2026 });
    const testo = dealsToPbn(deals, "BridgeLab - prova");
    const eventi = await leggiConParserEsterno(testo);

    const tagDeal = eventi.filter(
      (e) => e.type === "tag" && e.name === "Deal",
    ) as { cards?: CartaPbn[] }[];
    expect(tagDeal).toHaveLength(3);

    tagDeal.forEach((tag, i) => {
      // Il parser espande la notazione in 52 carte: se la nostra stringa fosse
      // storta ne troverebbe meno, o le metterebbe nel posto sbagliato.
      expect(tag.cards, `board ${i + 1}`).toHaveLength(52);

      const ricostruito: Record<Position, Set<string>> = {
        north: new Set(),
        east: new Set(),
        south: new Set(),
        west: new Set(),
      };
      for (const c of tag.cards ?? []) {
        ricostruito[POSTI[c.seat]].add(`${SEMI[c.suit]}-${c.rank === "T" ? "10" : c.rank}`);
      }

      for (const p of ["north", "east", "south", "west"] as Position[]) {
        const nostre = new Set(
          deals[i][p].map((c: Card) => `${c.suit}-${c.rank}`),
        );
        expect(ricostruito[p].size, `${p} board ${i + 1}`).toBe(13);
        expect([...ricostruito[p]].sort(), `${p} board ${i + 1}`).toEqual([...nostre].sort());
      }
    });
  });

  it("mazziere e zona arrivano leggibili", async () => {
    const { deals } = generateDeals({}, { count: 4, seed: 7 });
    const eventi = await leggiConParserEsterno(dealsToPbn(deals));
    const valori = (nome: string) =>
      eventi.filter((e) => e.type === "tag" && e.name === nome).map((e) => e.value);

    expect(valori("Dealer")).toEqual(["N", "E", "S", "W"]);
    expect(valori("Vulnerable")).toEqual(["None", "NS", "EW", "All"]);
    expect(valori("Board")).toEqual(["1", "2", "3", "4"]);
  });

  it("il parser non segnala errori sul nostro file", async () => {
    const { deals } = generateDeals({}, { count: 8, seed: 99 });
    // Se il file fosse malformato, lo stream emetterebbe `error` e la promessa
    // verrebbe rifiutata: qui il fatto che non lanci È la verifica.
    const eventi = await leggiConParserEsterno(dealsToPbn(deals));
    expect(eventi.filter((e) => e.type === "tag" && e.name === "Deal")).toHaveLength(8);
  });
});
