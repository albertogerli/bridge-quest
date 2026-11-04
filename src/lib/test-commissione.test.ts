import { describe, expect, it } from "vitest";
import dati from "@/data/commissione/test-barion.json";
import { leggiFigura } from "./figura-domanda";
import { problemiDomanda } from "./domande-scelta";
import { gruppoTest, testDellaLezione, TEST_COMMISSIONE } from "./test-commissione";

interface Domanda {
  numero: string;
  testo: string;
  figura: unknown;
  opzioni: string[];
  giusta: number;
  nota?: string;
  sospesa?: boolean;
}
const test = dati as { numero: number; domande: Domanda[] }[];
const carte = (m: Record<string, string>) => Object.values(m).join("").length;

describe("i test della Commissione", () => {
  it("sono dodici, e l'elenco conta le domande che si caricano davvero", () => {
    expect(test.map((t) => t.numero)).toEqual(TEST_COMMISSIONE.map((t) => t.numero));
    for (const t of TEST_COMMISSIONE) {
      expect(test.find((x) => x.numero === t.numero)!.domande.filter((d) => !d.sospesa)).toHaveLength(t.domande);
    }
  });

  it("ogni domanda caricabile ha la sua risposta giusta fra le opzioni", () => {
    for (const t of test) for (const d of t.domande.filter((x) => !x.sospesa)) {
      const giusta = d.opzioni[d.giusta];
      expect(giusta, d.numero).toBeTruthy();
      expect(problemiDomanda({ titolo: d.numero, gruppo: "", domanda: d.testo, opzioni: d.opzioni, giuste: [giusta], soluzione: "" }), d.numero).toEqual([]);
    }
  });

  it("ogni figura si legge, e una mano sola ha tredici carte", () => {
    for (const t of test) for (const d of t.domande.filter((x) => !x.sospesa && x.figura)) {
      const f = leggiFigura(d.figura);
      expect(f, d.numero).not.toBeNull();
      if (f?.tipo === "mano") expect(carte(f.mano), d.numero).toBe(13);
      if (f?.tipo === "confronto") expect([carte(f.A), carte(f.B)], d.numero).toEqual([13, 13]);
    }
  });

  it("le domande sospese hanno scritto perché", () => {
    const sospese = test.flatMap((t) => t.domande).filter((d) => d.sospesa);
    expect(sospese.map((d) => d.numero)).toEqual(["3.33", "7.2", "10.5", "12.9", "12.11", "12.12"]);
    for (const d of sospese) expect(d.nota, d.numero).toBeTruthy();
  });

  it("ogni test sta sotto una lezione del programma, il gruppo ha il suo nome", () => {
    expect(testDellaLezione(1).map((t) => t.numero)).toEqual([1, 2]);
    expect(testDellaLezione(11).map((t) => t.numero)).toEqual([7]);
    expect(testDellaLezione(3)).toEqual([]);
    expect(gruppoTest(TEST_COMMISSIONE[6])).toBe("Test 7 · Le aperture di 1SA e 2SA");
  });
});
