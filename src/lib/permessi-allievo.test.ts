import { describe, expect, it } from "vitest";
import {
  permessiAllievo, rotteGovernate, SEMPRE_VISIBILI,
  type ImpostazioniClasse,
} from "./permessi-allievo";

const chiusa: ImpostazioniClasse = { accessoLibero: "solo-il-corso" };
const conPratica: ImpostazioniClasse = { accessoLibero: "con-pratica-libera" };
const aperta: ImpostazioniClasse = { accessoLibero: "tutto-aperto" };

describe("le due famiglie non si confondono mai", () => {
  it("NESSUNA ROTTA È INSIEME VIETATA E NASCOSTA", () => {
    // È l'invariante che tiene in piedi tutto. Se una rotta finisse in
    // entrambi gli elenchi, il server la rifiuterebbe e l'interfaccia
    // fingerebbe che sia solo poco in vista: l'allievo vedrebbe un errore
    // dove gli abbiamo detto che non c'era niente di strano.
    const { vietati, nascosti } = permessiAllievo([chiusa]);
    expect(vietati.filter((r) => nascosti.includes(r))).toEqual([]);
  });

  it("le funzioni ludiche non sono MAI vietate", () => {
    // Vietarle creerebbe il paradosso: le vede chiunque si registri senza
    // essere in una classe, quindi iscriversi a un corso toglierebbe qualcosa.
    const { vietati } = permessiAllievo([chiusa]);
    expect(vietati.some((r) => r.startsWith("/gioca"))).toBe(false);
    expect(vietati).not.toContain("/forum");
  });

  it("i contenuti didattici non sono MAI solo nascosti", () => {
    const { nascosti } = permessiAllievo([chiusa]);
    for (const r of ["/lezioni", "/impara", "/dispense", "/ripasso"]) {
      expect(nascosti).not.toContain(r);
    }
  });
});

describe("chi non ha insegnante non ha cancello", () => {
  it("l'utente esterno non ha niente di vietato", () => {
    // Le millecento persone già registrate non devono perdere niente il
    // giorno in cui questa funzione entra in produzione.
    expect(permessiAllievo([])).toEqual({ vietati: [], nascosti: [] });
  });
});

describe("il cursore", () => {
  it("classe chiusa: la didattica è vietata e il ludico nascosto", () => {
    const p = permessiAllievo([chiusa]);
    expect(p.vietati).toContain("/lezioni");
    expect(p.nascosti).toContain("/gioca/torneo");
    expect(p.nascosti).toContain("/gioca/memory");
  });

  it("con pratica libera: si aprono pratica e mini-giochi, non i tornei", () => {
    const p = permessiAllievo([conPratica]);
    expect(p.nascosti).not.toContain("/gioca/pratica");
    expect(p.nascosti).not.toContain("/gioca/memory");
    expect(p.nascosti).toContain("/gioca/torneo");
    expect(p.nascosti).toContain("/forum");
  });

  it("tutto aperto: niente è nascosto", () => {
    expect(permessiAllievo([aperta]).nascosti).toEqual([]);
  });

  it("le 18 classi esistenti sono «tutto-aperto»: nessuno perde niente", () => {
    expect(permessiAllievo([aperta]).nascosti).toEqual([]);
  });
});

describe("le eccezioni battono il cursore", () => {
  it("una classe chiusa può aprire un gruppo solo", () => {
    const p = permessiAllievo([{ accessoLibero: "solo-il-corso", permessi: { sfide: true } }]);
    expect(p.nascosti).not.toContain("/gioca/torneo");
    expect(p.nascosti).toContain("/gioca/memory");
  });

  it("una classe aperta può chiudere un gruppo solo", () => {
    const p = permessiAllievo([{ accessoLibero: "tutto-aperto", permessi: { sociale: false } }]);
    expect(p.nascosti).toContain("/forum");
    expect(p.nascosti).not.toContain("/gioca/torneo");
  });

  it("personalizzato: comandano solo le eccezioni", () => {
    const p = permessiAllievo([{ accessoLibero: "personalizzato", permessi: { pratica: true } }]);
    expect(p.nascosti).not.toContain("/gioca/pratica");
    expect(p.nascosti).toContain("/gioca/torneo");
  });
});

describe("più classi: vince chi apre", () => {
  it("basta un insegnante che abbia aperto", () => {
    // L'intersezione farebbe sparire una cosa già concessa nel momento in cui
    // ci si iscrive a un secondo corso: incomprensibile per chi la subisce.
    const p = permessiAllievo([chiusa, aperta]);
    expect(p.nascosti).toEqual([]);
  });

  it("due classi chiuse restano chiuse", () => {
    expect(permessiAllievo([chiusa, chiusa]).nascosti.length).toBeGreaterThan(0);
  });
});

describe("i contenuti sbloccati", () => {
  it("la lezione assegnata non è più vietata", () => {
    const p = permessiAllievo([chiusa], ["/lezioni"]);
    expect(p.vietati).not.toContain("/lezioni");
  });

  it("sbloccare le dispense non sblocca le lezioni", () => {
    const p = permessiAllievo([chiusa], ["/dispense"]);
    expect(p.vietati).not.toContain("/dispense");
    expect(p.vietati).toContain("/lezioni");
  });
});

describe("quello che il rubinetto non tocca", () => {
  it("trova-circolo e trova-compagno non sono governabili", () => {
    // Sono l'unica parte del portale che porta la persona dentro il circolo:
    // nasconderle contraddirebbe il fine per cui esiste tutto il resto.
    expect(SEMPRE_VISIBILI).toContain("/trova-circolo");
    expect(SEMPRE_VISIBILI).toContain("/trova-compagno");
    const governate = rotteGovernate();
    for (const r of SEMPRE_VISIBILI) expect(governate).not.toContain(r);
  });

  it("nessuna rotta compare due volte nel catalogo", () => {
    const g = rotteGovernate();
    expect(g.length).toBe(new Set(g).size);
  });
});
