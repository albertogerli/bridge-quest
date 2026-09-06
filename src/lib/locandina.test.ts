import { describe, expect, it } from "vitest";
import { CAMPI, CAMPI_FACOLTATIVI, campiMancanti, testiPredefiniti, type TestiLocandina } from "./locandina";
import type { ClassRoom } from "@/lib/instructors";

const classe = (over: Partial<ClassRoom> = {}): ClassRoom => ({
  id: "c1", instructor_id: "i", asd_code: "ASD Bridge Bari", name: "Corso Fiori",
  description: null, invite_code: "AAA111", invite_active: true, stato: "aperta",
  approvazione_automatica: true, invite_expires_at: null, risultati_nominativi: false,
  link_video: null, livello: "Primo livello", accesso_libero: "tutto-aperto", permessi: {},
  soluzioni_predefinite: "dopo-il-gioco", inizio_corso: null, fine_corso: null,
  created_at: "2026-01-01", ...over,
});

const pieni = (over: Partial<TestiLocandina> = {}): TestiLocandina => ({
  ...testiPredefiniti(classe(), "Giuseppe Trevissoi"),
  quando: "Giovedì 8 ottobre 2026, ore 21:00",
  dove: "Via Capruzzi 212, Bari",
  ...over,
});

describe("i predefiniti non promettono niente di configurabile", () => {
  it("il sottotitolo non dice di iscriversi online", () => {
    // L'ASD che spegne il QR prende le iscrizioni al telefono: «iscriviti
    // online» le mentirebbe addosso. È lo stesso errore del messaggio WhatsApp
    // che prometteva soluzioni che non si aprivano.
    const t = testiPredefiniti(classe(), "x");
    for (const parola of ["online", "sito", "QR", "inquadra", "scansiona"]) {
      expect(t.sottotitolo.toLowerCase()).not.toContain(parola.toLowerCase());
      expect(t.titolo.toLowerCase()).not.toContain(parola.toLowerCase());
    }
  });

  it("quello che si sa dalla classe è già scritto", () => {
    const t = testiPredefiniti(classe(), "Giuseppe Trevissoi");
    expect(t.corso).toBe("Primo livello");
    expect(t.associazione).toBe("ASD Bridge Bari");
    expect(t.insegnante).toBe("Giuseppe Trevissoi");
  });

  it("una classe senza livello né ASD non inventa niente", () => {
    const t = testiPredefiniti(classe({ livello: null, asd_code: null }), "x");
    expect(t.corso).toBe("");
    expect(t.associazione).toBe("");
  });

  it("titolo e sottotitolo ci sono comunque: la maggioranza non se li inventa", () => {
    const t = testiPredefiniti(null, "");
    expect(t.titolo.length).toBeGreaterThan(10);
    expect(t.sottotitolo.length).toBeGreaterThan(30);
  });
});

describe("quello che manca si dice prima di generare", () => {
  it("senza data e indirizzo non si genera", () => {
    // Una locandina appesa senza indirizzo è carta sprecata, e chi la scarica
    // non ricontrolla: la guarda, la stampa e la appende.
    const mancanti = campiMancanti(testiPredefiniti(classe(), "x"));
    expect(mancanti).toContain("Data e ora");
    expect(mancanti).toContain("Indirizzo completo");
  });

  it("con tutto pieno non manca niente", () => {
    expect(campiMancanti(pieni())).toEqual([]);
  });

  it("gli spazi non contano come contenuto", () => {
    expect(campiMancanti(pieni({ dove: "   " }))).toEqual(["Indirizzo completo"]);
  });

  it("i facoltativi non compaiono mai fra i mancanti", () => {
    const mancanti = campiMancanti(pieni({ note: "", contatti: "" }));
    expect(mancanti).toEqual([]);
  });

  it("il nome del campo mancante è quello che l'ASD legge nel modulo", () => {
    // «dove» non vuol dire niente per chi guarda il modulo.
    for (const nome of campiMancanti(testiPredefiniti(null, ""))) {
      expect([...CAMPI, ...CAMPI_FACOLTATIVI].some((c) => c.etichetta === nome)).toBe(true);
    }
  });
});

describe("l'elenco dei campi è un dato, non una pagina", () => {
  it("ogni campo ha un'etichetta leggibile e una chiave unica", () => {
    const tutti = [...CAMPI, ...CAMPI_FACOLTATIVI];
    expect(new Set(tutti.map((c) => c.chiave)).size).toBe(tutti.length);
    for (const c of tutti) expect(c.etichetta.length).toBeGreaterThan(2);
  });
});
