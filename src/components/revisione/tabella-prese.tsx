"use client";

import { useEffect, useState } from "react";
import type { Card, Position } from "@/lib/bridge-engine";
import { calcTableAndPar, type DdsTable, type ParResult } from "@/lib/dds-table";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

const POSTI: { p: Position; l: string }[] = [
  { p: "north", l: "N" }, { p: "south", l: "S" }, { p: "east", l: "E" }, { p: "west", l: "O" },
];
const SEMI = ["spade", "heart", "diamond", "club"] as const;

/**
 * Le prese che ogni posto fa in ogni seme, a carte viste, e il par.
 *
 * «Con anche le prese che si fanno per sedia» (28/09/2026): è la tabellina
 * della revisione di BridgeChamp. Serve a rispondere alla domanda che viene
 * subito dopo la mano: in che contratto dovevamo stare?
 *
 * Il par dipende da chi dà le carte e dalla zona, che molti giochi non
 * salvano: senza, si calcola con Nord mazziere e nessuno in zona, e lo si dice.
 */
export function TabellaPrese({
  mani,
  compatta = false,
  onPronta,
  giaCalcolata,
}: {
  mani: Record<Position, Card[]>;
  compatta?: boolean;
  onPronta?: (dati: { table: DdsTable; par: ParResult }) => void;
  /**
   * Tabella e par già calcolati con mazziere e zona VERI della mano: si
   * mostrano quelli, senza risolvere di nuovo e senza la nota sul mazziere.
   */
  giaCalcolata?: { table: DdsTable; par: ParResult };
}) {
  const t = useT();
  const [calcolata, setDati] = useState<{ table: DdsTable; par: ParResult } | null>(null);
  const dati = giaCalcolata ?? calcolata;
  const [errore, setErrore] = useState(false);
  const firma = JSON.stringify(mani);

  useEffect(() => {
    if (giaCalcolata) return;
    let vivo = true;
    calcTableAndPar(mani, "north", "none")
      .then((d) => {
        if (!vivo) return;
        setDati(d);
        onPronta?.(d);
      })
      .catch((err) => {
        segnalaSalvoRete("revisione:tabella", err);
        if (vivo) setErrore(true);
      });
    return () => { vivo = false; };
    // `firma` al posto di `mani`: lo stesso contenuto non va ricalcolato.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dipende dal contenuto delle mani, non dall'identità dell'oggetto
  }, [firma, giaCalcolata]);

  if (errore) return <p className="text-sm text-muted-foreground">{t("Non riesco a calcolare le prese adesso.")}</p>;
  if (!dati) return <p className="text-sm text-muted-foreground">{t("Calcolo le prese…")}</p>;

  const cella = compatta ? "px-1.5 py-0.5" : "px-2.5 py-1";
  return (
    <div>
      <table className={`tabular-nums ${compatta ? "text-xs" : "text-sm"}`}>
        <thead>
          <tr>
            <th className={cella} />
            <th className={`${cella} font-semibold`}>{t("SA")}</th>
            {SEMI.map((s) => (
              <th key={s} className={cella}><SuitSymbol suit={s} size="xs" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {POSTI.map(({ p, l }) => (
            <tr key={p}>
              <th className={`${cella} text-left font-bold`}>{t(l)}</th>
              <td className={`${cella} text-center`}>{dati.table.tricks.notrump?.[p] ?? "–"}</td>
              {SEMI.map((s) => (
                <td key={s} className={`${cella} text-center`}>{dati.table.tricks[s]?.[p] ?? "–"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`mt-2 ${compatta ? "text-xs" : "text-sm"}`}>
        <b>{t("Par")}:</b> {dati.par.contracts.join(", ") || "–"} · <b>{t("Punteggio")}:</b> {dati.par.score}
        {!giaCalcolata && (
          <span className="block text-xs text-muted-foreground">{t("Calcolato con Nord mazziere e nessuno in zona.")}</span>
        )}
      </p>
    </div>
  );
}
