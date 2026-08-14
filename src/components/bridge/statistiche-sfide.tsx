"use client";

import { useEffect, useState } from "react";
import { reportError } from "@/lib/report-error";
import { statisticheSfide, type RigaAvversario, type StatisticheSfide } from "@/lib/sfide-coppie-db";

/**
 * Con chi si vince e contro chi si perde.
 *
 * È la cosa che fa tornare più del punteggio della singola sfida: «ho vinto»
 * dura un pomeriggio, «con Marco vinciamo sette volte su dieci» è una notizia.
 *
 * GLI IMP NETTI, NON SOLO LE VITTORIE. Vincere quattro incontri di un punto e
 * perderne uno di quaranta non è una buona stagione, e il conto delle sole
 * vittorie direbbe di sì.
 */
export function StatisticheSfidePannello() {
  const [dati, setDati] = useState<StatisticheSfide | null | "carico">("carico");

  useEffect(() => {
    statisticheSfide()
      .then((s) => setDati(s))
      .catch((err) => { reportError("statistiche-sfide", err); setDati(null); });
  }, []);

  if (dati === "carico") return <p className="text-sm text-muted-foreground">Carico…</p>;
  if (!dati || dati.incontri === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nessun incontro finito. Le statistiche compaiono quando entrambe le
        coppie hanno dichiarato tutte le smazzate.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6">
        <Numero titolo="Incontri" valore={dati.incontri} />
        <Numero titolo="Vinti" valore={dati.vinti} />
        <Numero titolo="Persi" valore={dati.persi} />
        {dati.pari > 0 && <Numero titolo="Pari" valore={dati.pari} />}
        <Numero
          titolo="IMP netti"
          valore={`${dati.impFatti - dati.impSubiti > 0 ? "+" : ""}${dati.impFatti - dati.impSubiti}`}
        />
      </div>

      <Tabella titolo="Con chi giochi" righe={dati.perCompagno} />
      <Tabella titolo="Contro chi giochi" righe={dati.perAvversario} />
    </div>
  );
}

function Numero({ titolo, valore }: { titolo: string; valore: number | string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{titolo}</p>
      <p className="text-2xl font-bold">{valore}</p>
    </div>
  );
}

function Tabella({ titolo, righe }: { titolo: string; righe: RigaAvversario[] }) {
  if (!righe?.length) return null;
  return (
    <section>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {titolo}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="font-normal py-1">Chi</th>
              <th className="font-normal py-1 text-right">Incontri</th>
              <th className="font-normal py-1 text-right">V–P</th>
              <th className="font-normal py-1 text-right">IMP</th>
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-2">{r.nome ?? "Un giocatore"}</td>
                <td className="py-2 text-right">{r.incontri}</td>
                <td className="py-2 text-right">{r.vinti}–{r.persi}</td>
                <td className="py-2 text-right font-mono">
                  {r.impNetti > 0 ? "+" : ""}{r.impNetti}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
