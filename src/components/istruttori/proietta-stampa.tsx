"use client";

import { useRef, type ReactNode } from "react";
import { Maximize2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Una tabella da proiettare in aula o da stampare: la classifica, i risultati
 * di un test (Trevissoi, 03/11/2026: «la classifica si può stampare e/o
 * proiettare?»).
 *
 * «Proietta» mette a schermo intero solo il riquadro, a caratteri grandi;
 * «Stampa» apre una pagina con la sola tabella e chiede di stamparla. Una
 * pagina a parte e non la stampa della pagina intera: il menu, le schede e
 * gli altri riquadri su carta sono inchiostro buttato.
 */
export function ProiettaStampa({ titolo, children }: { titolo: string; children: ReactNode }) {
  const t = useT();
  const riquadro = useRef<HTMLDivElement>(null);

  function proietta() {
    void riquadro.current?.requestFullscreen?.().catch(() => {});
  }

  function stampa() {
    const el = riquadro.current?.querySelector("[data-da-stampare]");
    const w = window.open("", "_blank");
    if (!el || !w) return;
    const testo = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    w.document.write(
      `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${testo(titolo)}</title>` +
        `<style>body{font-family:system-ui,sans-serif;color:#0f1219;margin:24px}h1{font-size:20px;margin:0 0 12px}` +
        `table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left}` +
        `th{background:#f3f3f3}button{all:unset}svg{display:none}</style></head>` +
        `<body><h1>${testo(titolo)}</h1>${el.outerHTML}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div
      ref={riquadro}
      className="[&:fullscreen]:overflow-auto [&:fullscreen]:bg-background [&:fullscreen]:p-10 [&:fullscreen]:text-2xl [&:fullscreen_table]:text-2xl"
    >
      <div className="mb-2 flex flex-wrap justify-end gap-2 [:fullscreen_&]:hidden">
        <Button size="sm" variant="outline" onClick={proietta}>
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          {t("Proietta")}
        </Button>
        <Button size="sm" variant="outline" onClick={stampa}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          {t("Stampa")}
        </Button>
      </div>
      <p className="mb-6 hidden font-display text-4xl font-bold [:fullscreen_&]:block">{titolo}</p>
      {children}
    </div>
  );
}
