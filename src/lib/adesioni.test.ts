import { describe, expect, it } from "vitest";
import {
  candidatiPerAdesione, contattoNormalizzato, gruppiSimili, nomeNormalizzato,
  type Adesione,
} from "./adesioni";

const ad = (over: Partial<Adesione>): Adesione => ({
  id: crypto.randomUUID(), class_id: "c1", nome: "Maria Rossi", contatto: "3331234567",
  note: null, fonte: "locandina", user_id: null, creata_il: "2026-09-07", archiviata_il: null,
  ...over,
});

describe("lo stesso telefono scritto in cinque modi", () => {
  it("prefisso, zero e spazi non fanno due numeri diversi", () => {
    const forme = ["080 1234567", "+39 080 1234567", "0039 080 1234567", "080-123.4567", " 0801234567 "];
    const normalizzate = new Set(forme.map(contattoNormalizzato));
    expect(normalizzate.size).toBe(1);
  });

  it("le email si confrontano in minuscolo", () => {
    expect(contattoNormalizzato("Maria.Rossi@Gmail.com ")).toBe("maria.rossi@gmail.com");
  });

  it("due numeri diversi restano diversi", () => {
    expect(contattoNormalizzato("3331234567")).not.toBe(contattoNormalizzato("3339999999"));
  });
});

describe("lo stesso nome scritto in tre modi", () => {
  it("l'ordine delle parole non conta: si scrive anche cognome-nome", () => {
    expect(nomeNormalizzato("Maria Rossi")).toBe(nomeNormalizzato("Rossi Maria"));
    expect(nomeNormalizzato("maria  rossi")).toBe(nomeNormalizzato("Maria Rossi"));
  });

  it("gli accenti NON si tolgono, ed è deliberato", () => {
    // Toglierli farebbe somigliare cognomi diversi, e un falso allarme costa
    // più di un doppione non visto: l'insegnante impara a ignorare gli avvisi.
    expect(nomeNormalizzato("Nicolò")).not.toBe(nomeNormalizzato("Nicolo"));
  });

  it("due persone diverse non si somigliano", () => {
    expect(nomeNormalizzato("Maria Rossi")).not.toBe(nomeNormalizzato("Maria Bianchi"));
  });
});

describe("i doppioni che l'insegnante deve vedere", () => {
  it("la stessa persona che aderisce due volte", () => {
    const g = gruppiSimili([
      ad({ id: "1", nome: "Maria Rossi", contatto: "3331234567" }),
      ad({ id: "2", nome: "rossi maria", contatto: "333 123 4567" }),
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].motivo).toBe("stesso-nome");
    expect(g[0].adesioni.map((a) => a.id).sort()).toEqual(["1", "2"]);
  });

  it("LA MOGLIE CHE ISCRIVE ANCHE IL MARITO non è un errore, ma va vista", () => {
    // Due persone vere con lo stesso recapito: il portale non deve rifiutarle
    // — bloccare sullo stesso numero romperebbe il caso legittimo più comune —
    // ma l'insegnante deve poterle guardare e decidere.
    const g = gruppiSimili([
      ad({ id: "1", nome: "Maria Rossi", contatto: "3331234567" }),
      ad({ id: "2", nome: "Giuseppe Rossi", contatto: "3331234567" }),
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].motivo).toBe("stesso-recapito");
  });

  it("il motivo si distingue, perché cambia la decisione", () => {
    const g = gruppiSimili([
      ad({ id: "1", nome: "Maria Rossi", contatto: "3331234567" }),
      ad({ id: "2", nome: "Maria Rossi", contatto: "3339999999" }),
      ad({ id: "3", nome: "Anna Verdi", contatto: "0801111111" }),
      ad({ id: "4", nome: "Luca Verdi", contatto: "0801111111" }),
    ]);
    expect(g.find((x) => x.motivo === "stesso-nome")?.adesioni).toHaveLength(2);
    expect(g.find((x) => x.motivo === "stesso-recapito")?.adesioni).toHaveLength(2);
  });

  it("la stessa coppia non viene segnalata due volte", () => {
    // Due avvisi sulla stessa riga fanno sembrare due problemi dove ce n'è uno.
    const g = gruppiSimili([
      ad({ id: "1", nome: "Maria Rossi", contatto: "3331234567" }),
      ad({ id: "2", nome: "Maria Rossi", contatto: "3331234567" }),
    ]);
    expect(g).toHaveLength(1);
  });

  it("le archiviate non entrano nei doppioni", () => {
    // Una persona che ha già aderito l'anno scorso non è un doppione di
    // quest'anno, e segnalarla sarebbe rumore.
    const g = gruppiSimili([
      ad({ id: "1", nome: "Maria Rossi", archiviata_il: "2026-01-01" }),
      ad({ id: "2", nome: "Maria Rossi" }),
    ]);
    expect(g).toEqual([]);
  });

  it("una lista senza doppioni non produce avvisi", () => {
    expect(gruppiSimili([
      ad({ id: "1", nome: "Maria Rossi", contatto: "3331111111" }),
      ad({ id: "2", nome: "Anna Verdi", contatto: "3332222222" }),
    ])).toEqual([]);
  });

  it("una lista vuota non esplode", () => {
    expect(gruppiSimili([])).toEqual([]);
  });
});

describe("chi collegare a un'adesione: si suggerisce, non si decide", () => {
  const membri = [
    { student_id: "a", display_name: "Anna Verdi" },
    { student_id: "b", display_name: "Maria Rossi" },
    { student_id: "c", display_name: "Maria Rossi" },
    { student_id: "d", display_name: "Rossi Giuseppe" },
  ];

  it("il nome uguale viene per primo", () => {
    const c = candidatiPerAdesione({ nome: "Maria Rossi" }, membri, new Set());
    expect(c[0].display_name).toBe("Maria Rossi");
  });

  it("LE DUE MARIA ROSSI RESTANO ENTRAMBE: sceglie l'insegnante", () => {
    // È il caso per cui abbiamo scartato l'algoritmo. Se il portale ne
    // proponesse una sola, sbaglierebbe proprio dove serve una persona.
    const c = candidatiPerAdesione({ nome: "Maria Rossi" }, membri, new Set());
    expect(c.filter((m) => m.display_name === "Maria Rossi")).toHaveLength(2);
  });

  it("chi è già collegato a un'altra adesione non ricompare", () => {
    const c = candidatiPerAdesione({ nome: "Maria Rossi" }, membri, new Set(["b"]));
    expect(c.map((m) => m.student_id)).not.toContain("b");
  });

  it("un cognome in comune basta a farlo salire, ma non a sceglierlo", () => {
    const c = candidatiPerAdesione({ nome: "Giuseppe Rossi" }, membri, new Set());
    expect(c[0].student_id).toBe("d");
    expect(c).toHaveLength(4);
  });

  it("nessuna somiglianza: l'elenco resta completo, in ordine alfabetico", () => {
    const c = candidatiPerAdesione({ nome: "Carlo Neri" }, membri, new Set());
    expect(c).toHaveLength(4);
    expect(c[0].display_name).toBe("Anna Verdi");
  });
});
