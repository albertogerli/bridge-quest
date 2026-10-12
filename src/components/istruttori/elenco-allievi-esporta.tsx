"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";
import { elencoAllieviCsv, type RigaElenco } from "@/lib/riepiloghi-classe";

/**
 * Stampa ed esporta l'elenco allievi — di una classe o di tutte.
 *
 * Trevissoi, ottobre 2026: «deve essere possibile la visualizzazione e
 * l'esportazione dei dati», in forma singola o aggregata. Il CSV si apre in
 * Excel italiano nelle colonne giuste (punto e virgola, BOM); la stampa apre
 * una pagina con la sola tabella, senza menu né colonne laterali.
 */
export function ElencoAllieviEsporta({ righe, titolo }: { righe: RigaElenco[]; titolo: string }) {
  const t = useT();
  const intestazioni = [t("Nome"), t("Classe"), t("Stato"), t("Iscritto il"), t("Compiti svolti"), t("Compiti assegnati")];

  function esporta() {
    const csv = elencoAllieviCsv(righe, intestazioni);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titolo.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "allievi"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function stampa() {
    const finestra = window.open("", "_blank");
    if (!finestra) return;
    const esc = (s: string | number) =>
      String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const intestazione = intestazioni.map((h) => `<th>${esc(h)}</th>`).join("");
    const corpo = righe
      .map(
        (r) =>
          `<tr><td>${esc(r.nome)}</td><td>${esc(r.classe)}</td><td>${esc(r.stato)}</td><td>${esc(r.iscrittoIl)}</td><td class="n">${r.compitiSvolti}</td><td class="n">${r.compitiAssegnati}</td></tr>`,
      )
      .join("");
    finestra.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(titolo)}</title>
<style>body{font-family:system-ui,sans-serif;margin:24px;color:#1a1a2e}h1{font-size:20px;margin:0 0 12px}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
th{background:#f3f1ea}td.n{text-align:right}</style></head>
<body><h1>${esc(titolo)}</h1><table><thead><tr>${intestazione}</tr></thead><tbody>${corpo}</tbody></table></body></html>`);
    finestra.document.close();
    finestra.focus();
    finestra.print();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={esporta} disabled={righe.length === 0}>
        <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t("Esporta per Excel")}
      </Button>
      <Button size="sm" variant="outline" onClick={stampa} disabled={righe.length === 0}>
        <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t("Stampa l'elenco")}
      </Button>
    </div>
  );
}
