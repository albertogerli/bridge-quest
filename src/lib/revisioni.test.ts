import { describe, expect, it } from "vitest";
import { riepilogoRevisioni, frasePerLInsegnante, aspettaLInsegnante } from "./revisioni";
import type { Assignment, StatoCompito } from "@/lib/instructors";

const compito = (over: Partial<Assignment> = {}): Assignment => ({
  id: "a1", class_id: "c1", title: "Lezione 4", instructor_note: null,
  smazzata_ids: ["1-1"], due_date: null, mode: "homework", unlock_mode: "free",
  soluzioni: "quando-l-insegnante-decide", minibridge: false, esercizio_ids: [],
  lesson_id: 4, link_video: null, live_active_index: null,
  created_at: "2026-09-01T00:00:00Z", ...over,
});

const stato = (id: string, finiti: number, allievi: number): StatoCompito => ({
  assignment_id: id, lesson_id: 4, title: "x", n_mani: 1,
  n_allievi: allievi, n_completi: finiti,
});

const ADESSO = new Date("2026-09-10T00:00:00Z");

describe("solo le revisioni che aspettano un gesto", () => {
  it("gli altri valori non compaiono", () => {
    expect(aspettaLInsegnante(compito({ soluzioni: "dopo-il-gioco" }))).toBe(false);
    expect(aspettaLInsegnante(compito({ soluzioni: "subito" }))).toBe(false);
    expect(aspettaLInsegnante(compito())).toBe(true);

    const r = riepilogoRevisioni(
      [compito({ id: "aperto", soluzioni: "dopo-il-gioco" }), compito({ id: "chiuso" })],
      [], ADESSO,
    );
    expect(r.inAttesa.map((x) => x.assignment.id)).toEqual(["chiuso"]);
  });
});

describe("l'ordine è la gravità, non la data", () => {
  it("quella finita da tutti viene prima, anche se più recente", () => {
    // Una revisione chiusa su un compito che nessuno ha finito non fa danno:
    // non è in ritardo, è in anticipo. Quella su cui hanno finito tutti ha
    // dodici persone che aspettano.
    const r = riepilogoRevisioni(
      [
        compito({ id: "vecchia", created_at: "2026-08-20T00:00:00Z" }),
        compito({ id: "finita-da-tutti", created_at: "2026-09-09T00:00:00Z" }),
      ],
      [stato("vecchia", 0, 12), stato("finita-da-tutti", 12, 12)],
      ADESSO,
    );
    expect(r.inAttesa[0].assignment.id).toBe("finita-da-tutti");
    expect(r.finiteDaTutti).toBe(1);
  });

  it("a parità, la più vecchia prima", () => {
    const r = riepilogoRevisioni(
      [
        compito({ id: "recente", created_at: "2026-09-09T00:00:00Z" }),
        compito({ id: "vecchia", created_at: "2026-08-20T00:00:00Z" }),
      ],
      [stato("recente", 0, 5), stato("vecchia", 0, 5)],
      ADESSO,
    );
    expect(r.inAttesa.map((x) => x.assignment.id)).toEqual(["vecchia", "recente"]);
  });

  it("una classe senza allievi non conta come «finita da tutti»", () => {
    // Zero su zero è vero per vacuità: senza questa condizione ogni compito di
    // una classe vuota sembrerebbe urgente.
    const r = riepilogoRevisioni([compito()], [stato("a1", 0, 0)], ADESSO);
    expect(r.finiteDaTutti).toBe(0);
  });
});

describe("la frase dice quanto è grave, non solo quante sono", () => {
  it("niente da aprire: nessuna frase, così chi la usa non deve decidere", () => {
    expect(frasePerLInsegnante(riepilogoRevisioni([], [], ADESSO))).toBeNull();
  });

  it("con una finita da tutti lo dice", () => {
    const r = riepilogoRevisioni(
      [compito({ id: "a" }), compito({ id: "b" }), compito({ id: "c" })],
      [stato("a", 12, 12), stato("b", 1, 12), stato("c", 0, 12)],
      ADESSO,
    );
    expect(frasePerLInsegnante(r)).toBe("3 revisioni da aprire, una l'hanno finita tutti");
  });

  it("senza urgenze ma vecchie, dice da quanto", () => {
    const r = riepilogoRevisioni(
      [compito({ id: "a", created_at: "2026-09-01T00:00:00Z" })],
      [stato("a", 0, 12)], ADESSO,
    );
    expect(frasePerLInsegnante(r)).toBe("1 revisione da aprire, la più vecchia da 9 giorni");
  });

  it("recente e senza urgenze: solo il numero, senza allarmare", () => {
    const r = riepilogoRevisioni(
      [compito({ id: "a", created_at: "2026-09-09T00:00:00Z" })],
      [stato("a", 0, 12)], ADESSO,
    );
    expect(frasePerLInsegnante(r)).toBe("1 revisione da aprire");
  });

  it("il singolare è singolare", () => {
    const r = riepilogoRevisioni([compito({ id: "a" })], [stato("a", 3, 3)], ADESSO);
    expect(frasePerLInsegnante(r)).toBe("1 revisione da aprire, una l'hanno finita tutti");
  });
});
