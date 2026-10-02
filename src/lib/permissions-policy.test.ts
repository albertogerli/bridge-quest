import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Il video al tavolo chiede camera e microfono, «Trova circolo» la posizione:
// con `()` il browser le nega senza chiedere nulla all'utente.
describe("Permissions-Policy", () => {
  const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
  const riga = config.split("\n").find((l) => l.includes('key: "Permissions-Policy"')) ?? "";

  it.each(["camera", "microphone", "geolocation"])("consente %s al nostro sito", (nome) => {
    expect(riga).toContain(`${nome}=(self)`);
  });
});

// gtag.config('AW-…') scarica lo script di conversione da questi host: se la
// CSP non li ammette, ogni pagina ha una violazione in console e Google Ads
// non riceve le conversioni.
describe("Content-Security-Policy per Google Ads", () => {
  const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
  it.each(["https://googleads.g.doubleclick.net", "https://www.googleadservices.com"])("script-src ammette %s", (host) => {
    expect(config).toContain(`"${host}"`);
  });
});
