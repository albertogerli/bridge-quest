import { describe, expect, it } from "vitest";
import { dealFromSeed, generateSeed } from "./hand-encoder";
import { calcTableAndPar, type TableStrain } from "./dds-table";
import { contrattoDallaMano } from "./contratto-sfida";

const VECCHI = ["1NT","2NT","3NT","1S","2S","3S","4S","1H","2H","3H","4H","2C","3C","5C","2D","3D","5D"];
const CHIAVE: Record<string, TableStrain> = { S: "spade", H: "heart", D: "diamond", C: "club", N: "notrump" };

/**
 * La prova sul campo, con il solver e mani vere.
 *
 * `contratto-sfida.test.ts` verifica la regola su tavole costruite a mano;
 * questo verifica che sulle mani che escono davvero i contratti siano
 * giocabili. Misurato il 19/08/2026, sostituendo il sorteggio dal seme:
 * prese mancanti in media da 2,8 a 0,1, contratti giù di tre o più da 13 su
 * 25 a zero.
 */
describe("sfida IMP: il contratto viene dalle carte", () => {
  it("su mani vere i contratti sono giocabili", async () => {
    let scartoVecchio = 0, scartoNuovo = 0, disastriVecchi = 0, disastriNuovi = 0;
    const N = 15;
    for (let i = 0; i < N; i++) {
      const seed = generateSeed();
      const d = dealFromSeed(seed);
      const { table } = await calcTableAndPar(
        { north: d.north, east: d.east, south: d.south, west: d.west },
        "north",
        "none"
      );
      const nuovo = contrattoDallaMano(table);

      const vecchio = VECCHI[seed.charCodeAt(0) % VECCHI.length];
      const k = CHIAVE[vecchio.slice(1)[0]];
      const preseVecchio = Math.max(table.tricks[k].north, table.tricks[k].south);

      const cadutaVecchia = Number(vecchio[0]) + 6 - preseVecchio;
      const cadutaNuova = Number(nuovo.contract[0]) + 6 - nuovo.prese;
      scartoVecchio += Math.max(0, cadutaVecchia);
      scartoNuovo += Math.max(0, cadutaNuova);
      if (cadutaVecchia >= 3) disastriVecchi++;
      if (cadutaNuova >= 3) disastriNuovi++;
    }
    console.log(`prese mancanti in media — prima ${(scartoVecchio / N).toFixed(1)}, ora ${(scartoNuovo / N).toFixed(1)}`);
    console.log(`contratti giù di 3 o più — prima ${disastriVecchi}/${N}, ora ${disastriNuovi}/${N}`);

    /**
     * Lo scarto non è zero per costruzione, e non deve esserlo: quando la
     * linea che gioca fa meno di sette prese nemmeno «1 al livello uno» si
     * mantiene. Quella è una mano difficile — che al tavolo capita — non una
     * mano assurda. Quello che non deve più succedere è il contratto scelto a
     * caso: in media meno di mezza presa di scarto, contro le quasi tre di
     * prima.
     */
    expect(scartoNuovo / N).toBeLessThan(0.5);
    expect(scartoNuovo).toBeLessThan(scartoVecchio / 4);
  }, 120_000);
});
