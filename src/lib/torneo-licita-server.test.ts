import { describe, expect, it } from "vitest";
import { generateDeals } from "./deal-generator";
import { calcTableAndPar } from "./dds-table";
import { valutaLicita } from "./stelle-licita";
import { riferimento } from "./mani-condivise";
import { esitoAsta } from "./licita-mano";
import { dichiarazioneDiSudAmmessa, vistaAperta, votoMano, type ManoTorneo } from "./torneo-licita-server";
import { leggiRisposta, manoParziale } from "./torneo-licita-client";

async function manoVera(): Promise<ManoTorneo> {
  const { deals } = generateDeals({}, { count: 1, seed: 1234 });
  const { table, par } = await calcTableAndPar(deals[0], "north", "none");
  return {
    id: "mano-1",
    numero: 3,
    hands: deals[0],
    dealer: "north",
    vulnerability: "none",
    par_contracts: par.contracts,
    par_score: par.score,
    dd_table: table.tricks as ManoTorneo["dd_table"],
    valore_atteso: null,
    distribuzioni: null,
    scenario: null,
  };
}

describe("dichiarazioneDiSudAmmessa", () => {
  it("Sud parla solo al proprio turno", () => {
    // Mazziere Nord: prima Nord, poi Est, poi Sud.
    expect(dichiarazioneDiSudAmmessa("north", [], "1♠")).toBe(false);
    expect(dichiarazioneDiSudAmmessa("north", ["P"], "1♠")).toBe(false);
    expect(dichiarazioneDiSudAmmessa("north", ["P", "P"], "1♠")).toBe(true);
  });

  it("rifiuta dichiarazioni insufficienti e contri non ammessi", () => {
    expect(dichiarazioneDiSudAmmessa("north", ["1♥", "P"], "1♦")).toBe(false);
    expect(dichiarazioneDiSudAmmessa("north", ["1♥", "P"], "X")).toBe(false); // il contratto è del compagno
    expect(dichiarazioneDiSudAmmessa("north", ["1♥", "1♠"], "X")).toBe(true);
    expect(dichiarazioneDiSudAmmessa("north", ["1♥", "P"], "2♥")).toBe(true);
    expect(dichiarazioneDiSudAmmessa("north", ["1♥", "P"], "8♥")).toBe(false);
  });

  it("ad asta chiusa non si dichiara più", () => {
    expect(dichiarazioneDiSudAmmessa("south", ["P", "P", "P", "P"], "1♣")).toBe(false);
  });
});

describe("vistaAperta", () => {
  it("al browser arriva solo la mano di Sud: niente altre carte, niente tabella", async () => {
    const m = await manoVera();
    const v = vistaAperta(m, ["P"]);
    expect(v.sud).toEqual(m.hands.south);
    expect(v.turno).toBe("east");
    const json = JSON.stringify(v);
    for (const chi of ["north", "east", "west"] as const) {
      for (const c of m.hands[chi]) {
        // Ogni carta delle altre mani deve mancare dalla vista: si cerca la
        // coppia rango+seme come la serializza JSON.
        expect(json).not.toContain(JSON.stringify(c));
      }
    }
    expect(json).not.toMatch(/dd_table|distribuzioni|valore_atteso|par_/);
  });
});

describe("votoMano", () => {
  it("dà le stesse stelle del calcolo che faceva la pagina", async () => {
    const m = await manoVera();
    const bids = ["1♣", "P", "1SA", "P", "3SA", "P", "P", "P"];
    const v = votoMano(m, bids)!;
    const e = esitoAsta(bids, m.dealer, { tricks: m.dd_table } as never, m.vulnerability);
    const rif = riferimento(m, "ns");
    expect(rif.metro).toBe("esatto");
    expect(v.voto.stelle).toBe(valutaLicita(e?.punteggio ?? 0, rif.punteggio, rif.metro, e?.punteggio).stelle);
    expect(v.esito?.contratto).toBe(e?.contratto);
  });

  it("senza tabella non vota", () => {
    expect(votoMano(manoParziale({ chiusa: false, manoId: "x", numero: 1, dealer: "north", vulnerability: "none", sud: [], bids: [], turno: "north" }), ["P", "P", "P", "P"])).toBeNull();
  });
});

describe("leggiRisposta", () => {
  it("riconosce il torneo finito e la sessione scaduta", () => {
    expect(leggiRisposta(200, { finito: true })).toEqual({ tipo: "finito" });
    expect(leggiRisposta(401, { error: "Non autenticato" })).toEqual({ tipo: "errore", registrazione: "sessione-scaduta" });
    expect(leggiRisposta(500, { error: "x" })).toEqual({ tipo: "errore", registrazione: "errore" });
  });

  it("il compagno muto porta il motivo, per dire se riprovare serve", () => {
    const r = leggiRisposta(200, {
      chiusa: false, manoId: "m", numero: 1, dealer: "north", vulnerability: "none",
      sud: [], bids: [], turno: "north", compagnoMuto: true, benStatus: 429, benErrore: "Troppe richieste",
    });
    expect(r.tipo === "aperta" && r.compagnoMuto).toBe("limite");
  });

  it("a asta chiusa distingue salvato da già presente", () => {
    const base = { chiusa: true, mano: { id: "m" }, bids: ["P", "P", "P", "P"] };
    expect(leggiRisposta(200, { ...base, registrazione: "salvato" })).toMatchObject({ tipo: "chiusa", registrazione: "salvato" });
    expect(leggiRisposta(200, { ...base, registrazione: "gia-presente" })).toMatchObject({ registrazione: "gia-presente" });
  });
});
