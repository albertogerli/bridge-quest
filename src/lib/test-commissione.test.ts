import { describe, expect, it } from "vitest";
import dati from "@/data/commissione/test-commissione.json";
import { leggiFigura } from "./figura-domanda";
import { problemiDomanda } from "./domande-scelta";
import { gruppoTest, siglaTest, testDellaLezione, titoloDomanda, TEST_COMMISSIONE } from "./test-commissione";

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

  it("le sei domande sospese fino al 06/11 sono tutte caricate, con la mano corretta", () => {
    const tutte = test.flatMap((t) => t.domande);
    expect(tutte.filter((d) => d.sospesa)).toEqual([]);
    expect(tutte).toHaveLength(244);
  });

  it("ogni test sta sotto una lezione del programma e si chiama come la lezione", () => {
    expect(testDellaLezione(1).map((t) => t.numero)).toEqual([1, 2]);
    expect(testDellaLezione(11).map((t) => t.numero)).toEqual([7]);
    expect(testDellaLezione(20).map((t) => t.numero)).toEqual([12]);
    expect(testDellaLezione(3)).toEqual([]);
    expect(TEST_COMMISSIONE.map(siglaTest)).toEqual(["1a", "1b", "2", "4", "6", "7", "11", "14", "15", "17", "19", "20"]);
    expect(gruppoTest(TEST_COMMISSIONE[6])).toBe("Esercizi lezione 11 · Le aperture di 1SA e 2SA");
    expect(titoloDomanda(TEST_COMMISSIONE[8], "9.4")).toBe("15.4");
    expect(titoloDomanda(TEST_COMMISSIONE[0], "1.12")).toBe("1a.12");
  });

  it("nessun testo parla di Barion, che è un'associazione e non l'autore", () => {
    expect(JSON.stringify(test)).not.toMatch(/barion/i);
    expect(TEST_COMMISSIONE.map((t) => t.titolo).join()).not.toMatch(/barion/i);
  });
});
