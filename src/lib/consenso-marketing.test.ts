import { describe, expect, it } from "vitest";
import { chiediConsensoOra } from "./consenso-marketing";

const ADESSO = new Date("2026-11-15T12:00:00Z");

describe("chiediConsensoOra", () => {
  it("non il primo giorno", () => {
    expect(chiediConsensoOra("2026-11-15T09:00:00Z", ADESSO)).toBe(false);
    expect(chiediConsensoOra("2026-11-14T13:00:00Z", ADESSO)).toBe(false);
  });
  it("sì dopo due giorni", () => {
    expect(chiediConsensoOra("2026-11-13T12:00:00Z", ADESSO)).toBe(true);
    expect(chiediConsensoOra("2026-01-01T00:00:00Z", ADESSO)).toBe(true);
  });
  it("senza data non si chiede", () => {
    expect(chiediConsensoOra(null, ADESSO)).toBe(false);
    expect(chiediConsensoOra("boh", ADESSO)).toBe(false);
  });
});
