import { describe, expect, it } from "vitest";
import { classificaCompito, elencoAllieviCsv, ordinaElenco } from "./riepiloghi-classe";

describe("classificaCompito", () => {
  const allievi = [
    { student_id: "a", display_name: "Anna" },
    { student_id: "b", display_name: "Bruno" },
    { student_id: "c", display_name: null },
  ];
  const esiti: Record<string, number> = { "a|m1": 0, "a|m2": -2, "b|m1": 1, "b|m2": 0 };

  it("ordina per mantenute, poi giocate, poi saldo; chi non ha giocato va in fondo", () => {
    const righe = classificaCompito(allievi, ["m1", "m2"], (s, m) =>
      `${s}|${m}` in esiti ? { score: esiti[`${s}|${m}`] } : null,
    );
    expect(righe.map((r) => r.studentId)).toEqual(["b", "a", "c"]);
    expect(righe[0]).toMatchObject({ giocate: 2, mantenute: 2, saldo: 1 });
    expect(righe[1]).toMatchObject({ giocate: 2, mantenute: 1, saldo: -2 });
    expect(righe[2]).toMatchObject({ nome: "Allievo", giocate: 0 });
  });
});

describe("elencoAllieviCsv", () => {
  it("usa il punto e virgola, il BOM, e protegge i campi con separatori o virgolette", () => {
    const csv = elencoAllieviCsv(
      [{ nome: 'Rossi; "Mario"', classe: "Corso 1", stato: "iscritto", iscrittoIl: "07/10/2026", compitiSvolti: 1, compitiAssegnati: 3 }],
      ["Nome", "Classe", "Stato", "Iscritto il", "Compiti svolti", "Compiti assegnati"],
    );
    expect(csv.startsWith("﻿Nome;Classe;")).toBe(true);
    expect(csv).toContain('"Rossi; ""Mario""";Corso 1;iscritto;07/10/2026;1;3');
  });
});

describe("ordinaElenco", () => {
  it("per classe, poi cognome, poi nome", () => {
    const righe = [
      { nome: "Mario Verdi", classe: "Classe 2" },
      { nome: "Luca Rossi", classe: "Classe 1" },
      { nome: "Anna Bianchi", classe: "Classe 1" },
      { nome: "Giorgio Rossi", classe: "Classe 1" },
    ];
    expect(ordinaElenco(righe).map((r) => r.nome)).toEqual(["Anna Bianchi", "Giorgio Rossi", "Luca Rossi", "Mario Verdi"]);
  });
});
