import { describe, expect, it } from "vitest";
import { erroreUpstreamRitentabile } from "./ben-retry";

describe("erroreUpstreamRitentabile", () => {
  it("ritenta il 502 transitorio osservato sull'edge Railway", () => {
    expect(erroreUpstreamRitentabile(502, "upstream error", 5_767)).toBe(true);
    expect(erroreUpstreamRitentabile(502, "  UPSTREAM ERROR\n", 8_000)).toBe(true);
  });

  it("non ripete un errore lento o di natura diversa", () => {
    expect(erroreUpstreamRitentabile(502, "upstream error", 8_001)).toBe(false);
    expect(erroreUpstreamRitentabile(504, '{"error":"ben timeout"}', 22_025)).toBe(false);
    expect(erroreUpstreamRitentabile(502, '{"error":"ben unavailable"}', 500)).toBe(false);
    expect(erroreUpstreamRitentabile(200, "upstream error", 5_767)).toBe(false);
  });
});
