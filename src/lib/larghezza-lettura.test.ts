import { describe, expect, it } from "vitest";
import { haLarghezzaLettura } from "./larghezza-lettura";

describe("haLarghezzaLettura", () => {
  it("vale per gli elenchi e le loro sottopagine", () => {
    expect(haLarghezzaLettura("/")).toBe(true);
    expect(haLarghezzaLettura("/gioca")).toBe(true);
    expect(haLarghezzaLettura("/classi/abc")).toBe(true);
    expect(haLarghezzaLettura("/profilo")).toBe(true);
  });
  it("non vale per il tavolo e le lezioni", () => {
    expect(haLarghezzaLettura("/gioca/smazzata")).toBe(false);
    expect(haLarghezzaLettura("/lezioni/1/2")).toBe(false);
    expect(haLarghezzaLettura("/classifiche")).toBe(false);
  });
});
