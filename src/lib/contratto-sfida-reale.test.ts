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
 * questo la verifica sulle mani che escono davvero, passando dal solver.
 *
 * NON SI ASSERISCE SU UNA MEDIA. La prima versione di questo test misurava lo
 * scarto medio su un campione di mani casuali e chiedeva che stesse sotto mezza
 * presa. Ha funzionato in locale e si è rotta al primo giro di CI (0,53), non
 * perché il codice fosse cambiato ma perché le mani erano altre: un test che
 * campiona a caso e giudica con una soglia statistica prima o poi fallisce da
 * solo, e insegna a ignorarlo. Qui si asserisce l'unica cosa che vale su OGNI
 * mano — l'uguaglianza qui sotto — e il campione casuale diventa un pregio,
 * perché ogni giro di CI prova mani nuove.
 *
 * La misura del guadagno resta come registrazione storica: sostituendo il
 * sorteggio dal seme, su venticinque mani, le prese mancanti in media sono
 * passate da 2,8 a 0,1 e i contratti giù di tre o più da tredici a zero. I due
 * conteggi qui sotto la ricalcolano a ogni esecuzione e la stampano.
 */
describe("sfida IMP: il contratto viene dalle carte", () => {
  it("il contratto chiede esattamente le prese che ci sono", async () => {
    let scartoVecchio = 0, scartoNuovo = 0, disastriVecchi = 0, minime = 0;
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
      const cadutaNuova = Number(nuovo.contract[0]) + 6 - nuovo.prese;

      /**
       * L'INVARIANTE, e vale su qualunque mano.
       *
       * Con sette prese o più il livello è `prese - 6`, quindi il contratto
       * chiede esattamente le prese disponibili e lo scarto è zero. Sotto le
       * sette il livello uno è il pavimento — non esiste un contratto più
       * basso — e lo scarto è quello che manca ad arrivarci: né una presa di
       * più, né una di meno. Qualsiasi altro valore vuol dire che il livello
       * non viene più dalle carte.
       */
      expect(cadutaNuova).toBe(Math.max(0, 7 - nuovo.prese));
      if (nuovo.prese < 7) minime++;

      const vecchio = VECCHI[seed.charCodeAt(0) % VECCHI.length];
      const k = CHIAVE[vecchio.slice(1)[0]];
      const preseVecchio = Math.max(table.tricks[k].north, table.tricks[k].south);
      const cadutaVecchia = Number(vecchio[0]) + 6 - preseVecchio;
      scartoVecchio += Math.max(0, cadutaVecchia);
      scartoNuovo += Math.max(0, cadutaNuova);
      if (cadutaVecchia >= 3) disastriVecchi++;
    }
    console.log(`prese mancanti in media — sorteggio ${(scartoVecchio / N).toFixed(1)}, carte ${(scartoNuovo / N).toFixed(1)}`);
    console.log(`contratti giù di 3 o più col sorteggio — ${disastriVecchi}/${N}`);
    console.log(`mani in cui la linea non arriva a 7 prese — ${minime}/${N}`);
  }, 120_000);
});
