import { describe, expect, it } from "vitest";
import {
  evDelContratto,
  migliorContrattoDi,
  riferimento,
  riferimentoUnico,
  type ManoCondivisa,
} from "./mani-condivise";
import { valutaLicita } from "./stelle-licita";

/** Solo la parte pura: il resto è database, e si prova con `prova-campo.mjs`. */
function mano(parziale: Partial<ManoCondivisa>): ManoCondivisa {
  return {
    id: "m",
    hands: {} as ManoCondivisa["hands"],
    dealer: "south",
    vulnerability: "none",
    par_contracts: null,
    par_score: null,
    dd_table: null,
    valore_atteso: null,
    distribuzioni: null,
    scenario: null,
    ...parziale,
  };
}

const contratto = (ev: number) =>
  ({ level: 4, strain: "spade", declarer: "south", ev, mantenuto: 15 }) as const;

/**
 * Distribuzioni finte ma complete: il metro «atteso» vale solo se la mano le
 * porta, perché senza non si potrebbe valutare il contratto raggiunto con lo
 * stesso metro del riferimento.
 */
function distribuzioniFinte() {
  const sempre = (n: number) => {
    const d = new Array(14).fill(0);
    d[n] = 20;
    return d;
  };
  // Nell'istogramma di una linea compaiono solo i suoi due posti, come li
  // scrive il generatore: dieci prese per chi ha le carte, tre per gli altri.
  const nostri = { north: sempre(10), south: sempre(10) };
  const loro = { east: sempre(10), west: sempre(10) };
  const perLato = (p: Record<string, number[]>) => ({
    spade: p, heart: p, diamond: p, club: p, notrump: p,
  });
  return { ns: perLato(nostri), ew: perLato(loro), prove: 20 };
}

describe("riferimento", () => {
  it("usa il valore atteso quando c'è, rimisurato sull'istogramma", () => {
    // Le distribuzioni finte dicono dieci prese sempre: 4♠ vale 420, ed è
    // quello il riferimento anche se alla generazione era stato scritto 620.
    const r = riferimento(
      mano({
        par_score: 100,
        valore_atteso: { ns: contratto(620), ew: contratto(-50), prove: 20 },
        distribuzioni: distribuzioniFinte(),
      }),
      "ns"
    );
    expect(r).toEqual({ punteggio: 420, metro: "atteso" });
  });

  it("quando la mano è degli avversari il metro torna il par", () => {
    // Col valore atteso qualunque tua dichiarazione «perde meno» della loro
    // manche e prenderebbe tre stelle, perché quel conto presuppone che il tuo
    // contratto lo giochi indisturbato — e se la mano è loro non è vero.
    const r = riferimento(
      mano({
        par_score: -620,
        valore_atteso: { ns: contratto(80), ew: contratto(620), prove: 20 },
        distribuzioni: distribuzioniFinte(),
      }),
      "ns"
    );
    expect(r).toEqual({ punteggio: -620, metro: "esatto" });
  });

  it("è simmetrico: lo stesso conto visto da Est-Ovest", () => {
    const m = mano({
      par_score: -620,
      valore_atteso: {
        ns: contratto(80),
        ew: { level: 4, strain: "spade", declarer: "west", ev: 620, mantenuto: 15 },
        prove: 20,
      },
      distribuzioni: distribuzioniFinte(),
    });
    // Per Est-Ovest la mano è loro: valore atteso, girato dal loro punto di
    // vista. Le distribuzioni finte danno dieci prese a Ovest, quindi 4♠ di
    // Ovest vale 420 per loro.
    expect(riferimento(m, "ew")).toEqual({ punteggio: 420, metro: "atteso" });
    // Per Nord-Sud non lo è: par, girato dal loro punto di vista.
    expect(riferimento(m, "ns")).toEqual({ punteggio: -620, metro: "esatto" });
  });

  it("ripiega sul par, e lo dichiara", () => {
    const m = mano({ par_score: -430 });
    expect(riferimento(m, "ns")).toEqual({ punteggio: -430, metro: "esatto" });
    // Il par è scritto dal punto di vista di Nord-Sud: per gli altri va girato.
    expect(riferimento(m, "ew")).toEqual({ punteggio: 430, metro: "esatto" });
  });

  it("senza par e senza valore atteso non inventa un riferimento alto", () => {
    expect(riferimento(mano({}), "ns").punteggio).toBe(0);
  });
});

describe("evDelContratto", () => {
  const conDistribuzioni = mano({
    vulnerability: "none",
    par_score: 420,
    valore_atteso: { ns: contratto(420), ew: contratto(-50), prove: 20 },
    distribuzioni: distribuzioniFinte(),
  });

  it("dà il valore atteso del contratto, non il risultato di questa smazzata", () => {
    // Le distribuzioni finte dicono dieci prese sempre: 4♠ vale 420.
    expect(evDelContratto(conDistribuzioni, { level: 4, strain: "spade", declarer: "south" }))
      .toBe(420);
    // 5♠ con dieci prese cade: -50.
    expect(evDelContratto(conDistribuzioni, { level: 5, strain: "spade", declarer: "south" }))
      .toBe(-50);
  });

  it("un contratto avversario conta col segno meno", () => {
    // Est fa dieci prese: 1♠ di Est vale 170 per loro, cioè -170 per noi.
    expect(evDelContratto(conDistribuzioni, { level: 1, strain: "spade", declarer: "east" }))
      .toBe(-170);
  });

  it("la zona entra nel conto", () => {
    const inZona = mano({
      vulnerability: "ns",
      valore_atteso: { ns: contratto(620), ew: contratto(-50), prove: 20 },
      distribuzioni: distribuzioniFinte(),
    });
    expect(evDelContratto(inZona, { level: 4, strain: "spade", declarer: "south" })).toBe(620);
  });

  it("senza distribuzioni non inventa un numero", () => {
    expect(evDelContratto(mano({ par_score: 420 }), { level: 4, strain: "spade", declarer: "south" }))
      .toBeNull();
  });
});

describe("il riferimento e la tabella parlano dello stesso campione", () => {
  it("il contratto migliore prende tre stelle, non due", () => {
    // Il numero memorizzato alla generazione viene da metà delle rimescolate;
    // la tabella di fine mano dall'istogramma completo. Confrontarli così
    // com'erano faceva sì che nella tabella NESSUN contratto arrivasse a tre
    // stelle, nemmeno quello indicato come migliore.
    const m = mano({
      vulnerability: "none",
      par_score: 420,
      // Il valore memorizzato (500) è più alto di quello che l'istogramma dà
      // per lo stesso contratto (420): è la differenza fra i due campioni.
      valore_atteso: {
        ns: { level: 4, strain: "spade", declarer: "south", ev: 500, mantenuto: 8 },
        ew: contratto(-50),
        prove: 20,
      },
      distribuzioni: distribuzioniFinte(),
    });
    const r = riferimento(m, "ns");
    expect(r.metro).toBe("atteso");
    expect(r.punteggio).toBe(420);
    // E infatti coincide con quello che la tabella mostrerà per 4♠.
    expect(evDelContratto(m, { level: 4, strain: "spade", declarer: "south" })).toBe(420);
  });
});

describe("migliorContrattoDi — il metro dei contratti avversari", () => {
  /** Una mano chiaramente di Nord-Sud: loro non hanno niente. */
  const manoNostra = () =>
    mano({
      par_score: 620,
      distribuzioni: distribuzioniFinte(),
      valore_atteso: {
        ns: contratto(566),
        ew: { level: 1, strain: "club", declarer: "east", ev: -104, mantenuto: 9 },
      } as ManoCondivisa["valore_atteso"],
    });

  it("per gli avversari NON usa il par, che li premierebbe sempre", () => {
    // `riferimento(mano, "ew")` passa al par appena la mano non è loro: girato
    // vale -620, e `valutaLicita` dà tre stelle a tutto ciò che sta sopra. Ogni
    // loro contratto ci sta sopra, anche uno che cade.
    const perLoro = migliorContrattoDi(manoNostra(), "ew");
    const vecchio = riferimento(manoNostra(), "ew");

    expect(vecchio.punteggio).toBe(-620); // il par girato: il difetto
    expect(perLoro.punteggio).toBeGreaterThan(vecchio.punteggio);
    expect(perLoro.metro).toBe("atteso");
  });

  it("un loro contratto che cade resta sotto il loro meglio", () => {
    // È la garanzia che serve: sotto il riferimento le stelle scendono.
    const perLoro = migliorContrattoDi(manoNostra(), "ew").punteggio;
    const contrattoCheCade = -100; // dal loro punto di vista
    expect(contrattoCheCade).toBeLessThan(perLoro);
  });

  it("per la propria linea dà lo stesso metro di sempre", () => {
    const m = manoNostra();
    expect(migliorContrattoDi(m, "ns").punteggio).toBe(riferimento(m, "ns").punteggio);
  });

  it("senza distribuzioni torna al par di quel lato, con punteggi reali", () => {
    const senza = mano({ par_score: 620 });
    expect(migliorContrattoDi(senza, "ew")).toEqual({ punteggio: -620, metro: "esatto" });
    expect(migliorContrattoDi(senza, "ns")).toEqual({ punteggio: 620, metro: "esatto" });
  });
});

describe("riferimentoUnico — un metro solo per tutta la tabella", () => {
  const manoNostra = () =>
    mano({
      par_score: 620,
      distribuzioni: distribuzioniFinte(),
      valore_atteso: {
        ns: contratto(566),
        ew: { level: 1, strain: "club", declarer: "east", ev: -104, mantenuto: 9 },
      } as ManoCondivisa["valore_atteso"],
    });

  it("prende il migliore fra le due linee, non quello di ciascuna", () => {
    const m = manoNostra();
    const unico = riferimentoUnico(m);
    expect(unico.punteggio).toBe(migliorContrattoDi(m, "ns").punteggio);
    expect(unico.punteggio).toBeGreaterThan(migliorContrattoDi(m, "ew").punteggio);
  });

  it("con quel metro un contratto avversario che cade non prende il pieno", () => {
    // È il difetto dello screenshot: `1♥ di Est` cadeva di due e mostrava tre
    // stelle piene, perché era il migliore della sua linea.
    const rif = riferimentoUnico(manoNostra()).punteggio;
    const loroCheCade = -100; // dal punto di vista di chi lo dichiara
    expect(valutaLicita(loroCheCade, rif, "atteso").stelle).toBeLessThan(2);
  });

  it("se la mano è LORO il metro si sposta, e le stelle si girano", () => {
    const manoLoro = mano({
      par_score: -620,
      distribuzioni: distribuzioniFinte(),
      valore_atteso: {
        ns: { level: 1, strain: "club", declarer: "south", ev: -90, mantenuto: 8 },
        ew: { level: 4, strain: "heart", declarer: "east", ev: -600, mantenuto: 10 },
      } as ManoCondivisa["valore_atteso"],
    });
    // `ew.ev` è scritto dal punto di vista di Nord-Sud, come il par: -600 per
    // noi vuol dire +600 per loro, ed è quello il migliore della smazzata.
    expect(riferimentoUnico(manoLoro).punteggio).toBe(migliorContrattoDi(manoLoro, "ew").punteggio);
  });
});
