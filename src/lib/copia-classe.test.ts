import { describe, expect, it } from "vitest";
import {
  chiaveCompito,
  chiaveMateriale,
  impostazioniDaCopiare,
  pubblicazioneCopia,
  rigaCopiaCompito,
  riscriviLink,
  scadenzaProposta,
} from "./copia-classe";
import type { Assignment } from "./instructors";

const ADESSO = new Date("2026-11-14T12:00:00Z");

function compito(p: Partial<Assignment> = {}): Assignment {
  return {
    id: "a1",
    class_id: "c-vecchia",
    title: "Lezione 3",
    instructor_note: "Attenti all'attacco",
    smazzata_ids: ["s1", "s2"],
    due_date: null,
    mode: "homework",
    unlock_mode: "free",
    soluzioni: "dopo-il-gioco",
    minibridge: false,
    esercizio_ids: ["e1"],
    lesson_id: 3,
    link_video: "https://meet.example/stanza-pomeriggio",
    live_active_index: 2,
    created_at: "2026-10-01T10:00:00Z",
    ...p,
  };
}

describe("scadenzaProposta", () => {
  it("tiene una scadenza futura", () => {
    expect(scadenzaProposta("2026-11-20T18:00:00Z", ADESSO)).toBe("2026-11-20T18:00:00Z");
  });
  it("toglie una scadenza passata: il compito copiato non nasce scaduto", () => {
    expect(scadenzaProposta("2025-11-20T18:00:00Z", ADESSO)).toBeNull();
  });
  it("nessuna scadenza resta nessuna, e una data illeggibile diventa nessuna", () => {
    expect(scadenzaProposta(null, ADESSO)).toBeNull();
    expect(scadenzaProposta("domani", ADESSO)).toBeNull();
  });
});

describe("rigaCopiaCompito", () => {
  it("porta il lavoro dell'insegnante nella classe nuova, senza stanza video né mano dal vivo", () => {
    const r = rigaCopiaCompito(compito(), "c-nuova", null);
    expect(r).toEqual({
      class_id: "c-nuova",
      title: "Lezione 3",
      instructor_note: "Attenti all'attacco",
      smazzata_ids: ["s1", "s2"],
      due_date: null,
      mode: "homework",
      unlock_mode: "free",
      soluzioni: "dopo-il-gioco",
      minibridge: false,
      esercizio_ids: ["e1"],
      lesson_id: 3,
    });
    expect(r).not.toHaveProperty("id");
    expect(r).not.toHaveProperty("link_video");
    expect(r).not.toHaveProperty("live_active_index");
  });

  it("le colonne facoltative viaggiano solo se l'originale le usa", () => {
    const r = rigaCopiaCompito(
      compito({ licita: true, licita_gioca: false, stelle_insegnante: true, solo_obiettivo: false, custom_hands: [{ id: "pbn-1" } as never] }),
      "c-nuova",
      "2026-11-20T18:00:00Z",
    );
    expect(r.licita).toBe(true);
    expect(r.licita_gioca).toBe(false);
    expect(r.stelle_insegnante).toBe(true);
    expect(r.solo_obiettivo).toBe(false);
    expect(r.custom_hands).toEqual([{ id: "pbn-1" }]);
    expect(r.due_date).toBe("2026-11-20T18:00:00Z");

    const semplice = rigaCopiaCompito(compito({ solo_obiettivo: null, custom_hands: [] }), "c-nuova", null);
    for (const k of ["licita", "licita_gioca", "stelle_insegnante", "solo_obiettivo", "custom_hands"]) {
      expect(semplice).not.toHaveProperty(k);
    }
  });

  it("non condivide gli array con l'originale", () => {
    const a = compito();
    const r = rigaCopiaCompito(a, "c-nuova", null);
    (r.smazzata_ids as string[]).push("s3");
    expect(a.smazzata_ids).toEqual(["s1", "s2"]);
  });
});

describe("riscriviLink", () => {
  const vecchia = "11111111-1111-4111-8111-111111111111";
  const nuova = "22222222-2222-4222-8222-222222222222";
  const compitoVecchio = "33333333-3333-4333-8333-333333333333";
  const compitoNuovo = "44444444-4444-4444-8444-444444444444";
  const mappa = new Map([
    [vecchia, nuova],
    [compitoVecchio, compitoNuovo],
  ]);

  it("gira sulla classe nuova un link interno alla classe vecchia", () => {
    expect(riscriviLink(`/classi/${vecchia}/compito/${compitoVecchio}`, mappa)).toBe(`/classi/${nuova}/compito/${compitoNuovo}`);
  });
  it("non tocca i link esterni né gli id che non conosce", () => {
    expect(riscriviLink(`https://bridgelab.it/classi/${vecchia}`, mappa)).toBe(`https://bridgelab.it/classi/${vecchia}`);
    expect(riscriviLink("/dispense/lezione-3", mappa)).toBe("/dispense/lezione-3");
    const altro = "55555555-5555-4555-8555-555555555555";
    expect(riscriviLink(`/classi/${altro}`, mappa)).toBe(`/classi/${altro}`);
  });
  it("riconosce l'id anche scritto in maiuscolo", () => {
    expect(riscriviLink(`/classi/${vecchia.toUpperCase()}`, mappa)).toBe(`/classi/${nuova}`);
  });
});

describe("pubblicazioneCopia", () => {
  it("nascosto resta nascosto, programmato resta programmato", () => {
    expect(pubblicazioneCopia(null, "pubblicati", ADESSO)).toBeNull();
    expect(pubblicazioneCopia("2026-12-01T18:00:00Z", "nascosti", ADESSO)).toBe("2026-12-01T18:00:00Z");
  });
  it("già uscito: resta uscito per le classi che vanno di pari passo, torna da pubblicare per un corso che ricomincia", () => {
    expect(pubblicazioneCopia("2026-10-01T18:00:00Z", "pubblicati", ADESSO)).toBe("2026-10-01T18:00:00Z");
    expect(pubblicazioneCopia("2026-10-01T18:00:00Z", "nascosti", ADESSO)).toBeNull();
  });
});

describe("chiaveMateriale", () => {
  it("riconosce lo stesso materiale a meno di maiuscole e spazi", () => {
    expect(chiaveMateriale({ lezione: "Lezione 1 ", tipo: "video", url: "https://x.org/v " })).toBe(
      chiaveMateriale({ lezione: "lezione 1", tipo: "video", url: "https://x.org/v" }),
    );
    expect(chiaveMateriale({ lezione: "Lezione 1", tipo: "video", url: "https://x.org/v" })).not.toBe(
      chiaveMateriale({ lezione: "Lezione 1", tipo: "dispensa", url: "https://x.org/v" }),
    );
  });
});

describe("impostazioniDaCopiare", () => {
  it("prende le scelte didattiche e lascia codice, date, locandina e stato", () => {
    const campi = impostazioniDaCopiare({
      id: "c",
      name: "Fiori pomeriggio",
      invite_code: "ABC123",
      invite_expires_at: "2026-12-01",
      stato: "aperta",
      inizio_corso: "2026-10-01",
      locandina: { orario: "18:00" },
      approvazione_automatica: false,
      risultati_nominativi: true,
      posti_liberi: false,
      livello: "Primo livello",
      soluzioni_predefinite: "subito",
      accesso_libero: "chiuso",
      permessi: { gioco: true },
      video_tavolo: true,
    });
    expect(campi).toEqual({
      approvazione_automatica: false,
      risultati_nominativi: true,
      posti_liberi: false,
      livello: "Primo livello",
      soluzioni_predefinite: "subito",
      accesso_libero: "chiuso",
      permessi: { gioco: true },
      video_tavolo: true,
    });
  });
});

describe("chiaveCompito", () => {
  it("riconosce lo stesso compito su misura, non uno con le mani diverse", () => {
    const a = { title: "Ripasso ", smazzata_ids: ["s1", "s2"], esercizio_ids: [] };
    expect(chiaveCompito(a)).toBe(chiaveCompito({ ...a, title: "ripasso" }));
    expect(chiaveCompito(a)).not.toBe(chiaveCompito({ ...a, smazzata_ids: ["s1"] }));
  });
});
