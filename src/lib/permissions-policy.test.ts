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
