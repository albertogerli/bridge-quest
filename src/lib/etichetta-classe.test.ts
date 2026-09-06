import { describe, expect, it } from "vitest";
import { dettagliClasse, periodoDelCorso } from "./etichetta-classe";
import type { ClassRoom } from "@/lib/instructors";

const classe = (over: Partial<ClassRoom> = {}): ClassRoom => ({
  id: "c1", instructor_id: "i", asd_code: null, name: "Corso Fiori",
  description: null, invite_code: "AAA111", invite_active: true, stato: "aperta",
  approvazione_automatica: true, invite_expires_at: null, risultati_nominativi: false,
  link_video: null, livello: null, accesso_libero: "tutto-aperto", permessi: {},
  soluzioni_predefinite: "dopo-il-gioco", inizio_corso: null, fine_corso: null,
  created_at: "2026-01-01", ...over,
});

describe("due corsi uguali si devono poter distinguere", () => {
  it("stesso nome e stesso livello: li separa il periodo", () => {
    // «uno può fare più corsi dello stesso livello, che si sovrappongono
    // anche»: senza la data sono la stessa riga scritta due volte.
    const a = dettagliClasse(
      classe({ livello: "Primo livello", inizio_corso: "2026-03-02" }), { mostraAsd: false });
    const b = dettagliClasse(
      classe({ livello: "Primo livello", inizio_corso: "2026-10-05" }), { mostraAsd: false });
    expect(a).not.toEqual(b);
  });

  it("stesso livello e stesso periodo: li separa l'ASD", () => {
    const a = dettagliClasse(classe({ asd_code: "Bari", livello: "Primo livello" }), { mostraAsd: true });
    const b = dettagliClasse(classe({ asd_code: "Monopoli", livello: "Primo livello" }), { mostraAsd: true });
    expect(a).not.toEqual(b);
  });
});

describe("l'ASD si mostra solo quando distingue", () => {
  it("chi insegna in un circolo solo non se la vede ripetuta", () => {
    expect(dettagliClasse(classe({ asd_code: "Bari", livello: "Primo livello" }), { mostraAsd: false }))
      .toEqual(["Primo livello"]);
  });

  it("chi insegna in due circoli la vede, e per prima", () => {
    expect(dettagliClasse(classe({ asd_code: "Bari", livello: "Primo livello" }), { mostraAsd: true }))
      .toEqual(["Bari", "Primo livello"]);
  });
});

describe("il periodo si legge in due parole", () => {
  it("stesso anno: l'anno si scrive una volta sola", () => {
    expect(periodoDelCorso(classe({ inizio_corso: "2026-03-02", fine_corso: "2026-06-18" })))
      .toBe("marzo — giugno 2026");
  });

  it("a cavallo di due anni si scrivono entrambi", () => {
    expect(periodoDelCorso(classe({ inizio_corso: "2026-10-05", fine_corso: "2027-02-10" })))
      .toBe("ottobre 2026 — febbraio 2027");
  });

  it("solo l'inizio: «da»", () => {
    expect(periodoDelCorso(classe({ inizio_corso: "2026-03-02" }))).toBe("da marzo 2026");
  });

  it("nessuna data: niente, invece di un trattino vuoto", () => {
    expect(periodoDelCorso(classe())).toBeNull();
    expect(dettagliClasse(classe(), { mostraAsd: true })).toEqual([]);
  });
});
