import { describe, expect, it } from "vitest";
import {
  dataNonPassata, inizioVisibile, linkWhatsapp, orariLeggibili, ordinaCorsi, posizioneDaCitta, schemaCorso,
} from "./corsi";

const base = {
  tipo: "bridge-5", asdCode: "F0024", livello: "principianti", maestro: "Mario Rossi",
  primaLezione: "2027-01-12", orari: [{ giorno: "lunedì", dalle: "18:00", alle: "20:00" }],
  telefono: "+39 333 1234567", consenso: true,
};

describe("schemaCorso", () => {
  it("accetta un corso completo e svuota i facoltativi", () => {
    const r = schemaCorso.parse({ ...base, costo: "  ", programma: "" });
    expect(r.costo).toBeNull();
    expect(r.programma).toBeNull();
    expect(r.email).toBeNull();
    expect(r.whatsapp).toBe(false);
  });
  it("senza consenso non passa", () => {
    expect(schemaCorso.safeParse({ ...base, consenso: false }).success).toBe(false);
  });
  it("un orario che finisce prima di iniziare non passa", () => {
    expect(schemaCorso.safeParse({ ...base, orari: [{ giorno: "lunedì", dalle: "20:00", alle: "18:00" }] }).success).toBe(false);
  });
  it("un file fuori dalla cartella di chi carica non passa", () => {
    expect(schemaCorso.safeParse({ ...base, locandinaPath: "../altro/x.pdf" }).success).toBe(false);
    expect(schemaCorso.safeParse({ ...base, locandinaPath: "3f2504e0-4f89-41d3-9a0c-0305e82c3301/locandina-1.pdf" }).success).toBe(true);
  });
  it("il telefono vuole numeri", () => {
    expect(schemaCorso.safeParse({ ...base, telefono: "chiamami" }).success).toBe(false);
  });
});

describe("date", () => {
  const oggi = new Date("2026-11-24T10:00:00Z");
  it("oggi e domani vanno bene, ieri no", () => {
    expect(dataNonPassata("2026-11-24", oggi)).toBe(true);
    expect(dataNonPassata("2026-11-23", oggi)).toBe(false);
  });
  it("in pagina fino a 30 giorni dopo l'inizio", () => {
    expect(inizioVisibile(oggi)).toBe("2026-10-25");
  });
});

describe("ordinaCorsi", () => {
  const milano = { lat: 45.46, lng: 9.19 };
  const corsi = [
    { id: "roma", primaLezione: "2027-01-01", lat: 41.9, lng: 12.5 },
    { id: "monza", primaLezione: "2027-02-01", lat: 45.58, lng: 9.27 },
    { id: "senza", primaLezione: "2026-12-01", lat: 0, lng: 0 },
    { id: "milano", primaLezione: "2027-03-01", lat: 45.47, lng: 9.18 },
  ];
  it("i più vicini per primi, senza coordinate in fondo", () => {
    expect(ordinaCorsi(corsi, milano).map((c) => c.id)).toEqual(["milano", "monza", "roma", "senza"]);
  });
  it("senza posizione, per data d'inizio", () => {
    expect(ordinaCorsi(corsi, null).map((c) => c.id)).toEqual(["senza", "roma", "monza", "milano"]);
  });
});

describe("posizioneDaCitta", () => {
  const circoli = [
    { city: "Bari", cap: "70121", province: "BA", lat: 41.12, lng: 16.87 },
    { city: "Bari", cap: "70124", province: "BA", lat: 41.1, lng: 16.89 },
    { city: "Forlì", cap: "47121", province: "FC", lat: 44.22, lng: 12.04 },
    { city: "Nowhere", cap: "00000", province: "", lat: 0, lng: 0 },
  ];
  it("città senza accenti e maiuscole", () => {
    expect(posizioneDaCitta("forli", circoli)).toEqual({ lat: 44.22, lng: 12.04 });
    expect(posizioneDaCitta("BARI", circoli)?.lat).toBeCloseTo(41.11);
  });
  it("CAP esatto o della stessa zona", () => {
    expect(posizioneDaCitta("47121", circoli)?.lng).toBe(12.04);
    expect(posizioneDaCitta("70100", circoli)?.lat).toBeCloseTo(41.11);
  });
  it("niente coordinate finte", () => {
    expect(posizioneDaCitta("Nowhere", circoli)).toBeNull();
  });
});

describe("testi", () => {
  it("raggruppa i giorni con lo stesso orario", () => {
    expect(orariLeggibili([
      { giorno: "lunedì", dalle: "18:00", alle: "20:00" },
      { giorno: "giovedì", dalle: "18:00", alle: "20:00" },
      { giorno: "sabato", dalle: "10:00", alle: "12:00" },
    ])).toBe("Lunedì e giovedì 18:00–20:00 · Sabato 10:00–12:00");
  });
  it("WhatsApp con prefisso", () => {
    expect(linkWhatsapp("333 123 4567")).toBe("https://wa.me/393331234567");
    expect(linkWhatsapp("+41 79 123 45 67")).toBe("https://wa.me/41791234567");
  });
});
