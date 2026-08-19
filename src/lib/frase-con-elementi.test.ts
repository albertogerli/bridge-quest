import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FraseConElementi } from "@/components/frase-con-elementi";

/**
 * Senza JSX di proposito: la configurazione di vitest raccoglie solo `.test.ts`,
 * e cambiarla per un file solo vorrebbe dire toccare il modo in cui girano
 * milleduecento prove per comodità di scriverne quattro.
 */
const html = (testo: string, elementi: Record<string, React.ReactNode>) =>
  renderToStaticMarkup(h(FraseConElementi, { testo, elementi }));

describe("una frase tradotta con dentro degli elementi", () => {
  it("inserisce l'elemento al posto del segnaposto", () => {
    const s = html("Vedi il {sito} per i dettagli.", {
      sito: h("a", { href: "/x" }, "bridgelab.it"),
    });
    expect(s).toContain("Vedi il ");
    expect(s).toContain("bridgelab.it");
    expect(s).toContain(" per i dettagli.");
  });

  /**
   * IL MOTIVO PER CUI ESISTE: in un'altra lingua l'ordine cambia. La stessa
   * frase con i segnaposto invertiti deve produrre gli elementi invertiti,
   * senza che il codice sappia niente della lingua.
   */
  it("segue l'ordine della frase, non quello del codice", () => {
    const el = { a: h("b", null, "PRIMO"), b: h("i", null, "SECONDO") };
    const dritto = html("{a} poi {b}", el);
    const rovescio = html("{b} poi {a}", el);
    expect(dritto.indexOf("PRIMO")).toBeLessThan(dritto.indexOf("SECONDO"));
    expect(rovescio.indexOf("SECONDO")).toBeLessThan(rovescio.indexOf("PRIMO"));
  });

  it("un segnaposto senza elemento resta visibile invece di sparire", () => {
    // Sparire in silenzio farebbe uscire una frase monca senza che nessuno se
    // ne accorga: meglio vedere il segnaposto e correggerlo.
    expect(html("Manca {questo} qui", {})).toContain("{questo}");
  });

  it("una frase senza segnaposto passa intera", () => {
    expect(html("Solo testo.", {})).toContain("Solo testo.");
  });
});
