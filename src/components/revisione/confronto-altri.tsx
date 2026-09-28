"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Come è andata agli altri sulla stessa mano.
 *
 * Nella revisione di BridgeChamp c'è la tabella di chi ha giocato la stessa
 * smazzata. Qui il contratto è fissato dalla mano, quindi quello che distingue
 * un giocatore dall'altro è il risultato: quanti l'hanno fatto, quanti sono
 * andati sotto, e dove sta chi guarda.
 *
 * SOLO CONTEGGI, NESSUN NOME: li restituisce `risultati_stessa_mano`, che
 * conta la prima partita di ognuno. Un confronto con i nomi diventerebbe una
 * classifica di chi ha sbagliato, e non è quello che serve dopo una mano.
 */
export function ConfrontoAltri({
  tipo,
  chiave,
  contratto,
  mio,
}: {
  tipo: string;
  chiave: string;
  contratto: string;
  /** Il risultato di chi guarda: +1, 0, −2… */
  mio: number;
}) {
  const t = useT();
  const [righe, setRighe] = useState<{ risultato: number; quanti: number }[] | null>(null);

  useEffect(() => {
    let vivo = true;
    createClient()
      .rpc("risultati_stessa_mano", { p_tipo: tipo, p_chiave: chiave })
      .then(({ data, error }) => {
        if (error) segnalaSalvoRete("revisione:confronto", error);
        if (vivo) setRighe(((data as { risultato: number; quanti: number }[] | null) ?? []).map((r) => ({ risultato: r.risultato, quanti: Number(r.quanti) })));
      });
    return () => { vivo = false; };
  }, [tipo, chiave]);

  if (!righe || righe.length === 0) return null;
  const totale = righe.reduce((s, r) => s + r.quanti, 0);
  // Da solo non c'è niente da confrontare: il riquadro direbbe «tu, cento per cento».
  if (totale < 2) return null;
  const massimo = Math.max(...righe.map((r) => r.quanti));
  const fatti = righe.filter((r) => r.risultato >= 0).reduce((s, r) => s + r.quanti, 0);
  const etichetta = (r: number) => (r === 0 ? `${contratto} =` : r > 0 ? `${contratto} +${r}` : `${contratto} −${-r}`);

  return (
    <div className="card-clean p-4">
      <h2 className="font-display text-lg font-bold">{t("Come è andata agli altri")}</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {t("{n} persone hanno giocato questa mano; {f} l'hanno mantenuta. Conta la prima partita di ognuno.", { n: totale, f: fatti })}
      </p>
      <ul className="space-y-1.5">
        {righe.map((r) => {
          const tu = r.risultato === mio;
          return (
            <li key={r.risultato} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2 text-sm">
              <span className={`font-mono ${tu ? "font-bold" : ""}`}>{etichetta(r.risultato)}</span>
              <span className="h-3 overflow-hidden rounded-full bg-muted">
                <span
                  className={`block h-full rounded-full ${r.risultato >= 0 ? "bg-emerald-600" : "bg-red-500"} ${tu ? "ring-2 ring-figb ring-offset-1" : ""}`}
                  style={{ width: `${Math.max(4, (r.quanti / massimo) * 100)}%` }}
                />
              </span>
              <span className="text-right tabular-nums text-muted-foreground">
                {r.quanti}{tu ? ` · ${t("tu")}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
