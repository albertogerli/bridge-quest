import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MATERIALI_CORSO, dispensaDellaLezione, eserciziDellaLezione } from "./materiali-corso";
import { parsePbn } from "./pbn";

const pubblico = (file: string) => path.join(process.cwd(), "public", file);

describe("materiali del corso", () => {
  const moduli = MATERIALI_CORSO;

  it("ogni file elencato esiste in public/", () => {
    const file = moduli.flatMap((m) => [
      ...m.slide.map((x) => x.file),
      ...m.dispense.map((x) => x.file),
      ...m.esercizi.flatMap((x) => [x.file, x.soluzioni]),
      ...m.mani.map((x) => x.file),
    ]);
    for (const f of file) expect(fs.existsSync(pubblico(f)), f).toBe(true);
  });

  it("le mani della Commissione si leggono tutte, con il contratto", () => {
    for (const m of moduli.flatMap((x) => x.mani)) {
      const { deals, errors } = parsePbn(fs.readFileSync(pubblico(m.file), "utf8"));
      expect(errors, m.file).toEqual([]);
      expect(deals, m.file).toHaveLength(m.smazzate);
      for (const d of deals) expect(d.title).toBe(m.titolo);
    }
  });

  it("trova dispensa ed esercizi di una lezione", () => {
    expect(dispensaDellaLezione(1)?.titolo).toBe("Vincenti e affrancabili");
    expect(eserciziDellaLezione(6)?.titolo).toBe("Il gioco ad atout");
    expect(eserciziDellaLezione(9)).toBeNull();
  });
});
