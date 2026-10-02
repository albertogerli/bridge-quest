import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guardiano: i collegamenti interni NON si importano da `next/link` né da
 * `useRouter` di `next/navigation`.
 *
 * Sotto `/en` un `href="/gioca"` porta al sito italiano: il primo tocco su una
 * voce di menu faceva perdere la lingua, senza errori e senza che nessuna prova
 * se ne accorgesse. Si usano `@/components/link` e `@/hooks/use-router-lingua`,
 * che mettono il prefisso. Fanno eccezione i due selettori di lingua, il cui
 * `href` è già l'indirizzo di arrivo.
 */
const SRC = join(process.cwd(), "src");
const CONSENTITI_LINK = new Set([
  "components/link.tsx",
  "components/selettore-lingua.tsx",
  "components/proposta-lingua.tsx",
]);
const CONSENTITI_ROUTER = new Set(["hooks/use-router-lingua.ts"]);

function file(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) file(p, out);
    else if (/\.(ts|tsx)$/.test(nome) && !/\.test\./.test(nome)) out.push(p);
  }
  return out;
}

describe("collegamenti che conservano la lingua", () => {
  const tutti = file(SRC).map((p) => ({ rel: p.slice(SRC.length + 1), testo: readFileSync(p, "utf8") }));

  it("nessun file importa next/link, tranne le eccezioni", () => {
    const fuori = tutti.filter((f) => /from "next\/link"/.test(f.testo) && !CONSENTITI_LINK.has(f.rel)).map((f) => f.rel);
    expect(fuori).toEqual([]);
  });

  it("nessun file importa useRouter da next/navigation, tranne il wrapper", () => {
    const fuori = tutti
      .filter((f) => /import\s*\{[^}]*\buseRouter\b[^}]*\}\s*from "next\/navigation"/.test(f.testo) && !CONSENTITI_ROUTER.has(f.rel))
      .map((f) => f.rel);
    expect(fuori).toEqual([]);
  });
});
