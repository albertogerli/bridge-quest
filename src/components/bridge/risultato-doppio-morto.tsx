"use client";

import { useEffect, useState } from "react";
import type { Card, Position } from "@/lib/bridge-engine";
import { calcTableAndPar, type DdsTable, type ParResult } from "@/lib/dds-table";
import { esitoAsta } from "@/lib/licita-mano";
import type { Vulnerability } from "@/lib/catalog";
import { TabellaPrese } from "@/components/revisione/tabella-prese";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

const INIZIALE: Record<Position, string> = { north: "N", east: "E", south: "S", west: "O" };

/**
 * «Risultato doppio morto»: a licita finita, quanto faceva il contratto
 * raggiunto, cosa si poteva fare con ogni seme da ogni posto, e il par.
 *
 * Preso dalla modalità «solo licita» di BridgeChamp (29/09/2026): chi si
 * allena sulla licita non gioca la mano, e questa è la risposta alla domanda
 * che resta — «il nostro contratto stava in piedi? e dove dovevamo arrivare?».
 *
 * Il calcolo usa il mazziere e la zona VERI della mano: il par dipende da tutti
 * e due, e un par calcolato «con Nord mazziere» sarebbe un altro numero.
 */
export function RisultatoDoppioMorto({
  mani,
  dealer,
  vulnerability,
  bids,
}: {
  mani: Record<Position, Card[]>;
  dealer: Position;
  vulnerability: Vulnerability;
  /** L'asta chiusa, nella notazione di `Asta`. */
  bids: readonly string[];
}) {
  const t = useT();
  const [dati, setDati] = useState<{ table: DdsTable; par: ParResult } | null>(null);
  const firma = JSON.stringify(mani) + dealer + vulnerability;

  useEffect(() => {
    let vivo = true;
    calcTableAndPar(mani, dealer, vulnerability)
      .then((d) => { if (vivo) setDati(d); })
      .catch((err) => segnalaSalvoRete("licita:doppio-morto", err));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dipende dal contenuto della mano, non dall'identità degli oggetti
  }, [firma]);

  if (!dati) return <p className="text-sm text-muted-foreground">{t("Calcolo le prese…")}</p>;

  const e = esitoAsta(bids, dealer, dati.table, vulnerability);
  let riga: string;
  if (!e) {
    riga = t("Passo generale");
  } else {
    const scarto = e.prese - (e.level + 6);
    const segno = scarto === 0 ? "=" : scarto > 0 ? `+${scarto}` : `−${-scarto}`;
    riga = `${e.contratto} ${segno} [${t(INIZIALE[e.declarer])}] · ${e.punteggio > 0 ? "+" : ""}${e.punteggio}`;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-center text-sm font-semibold text-muted-foreground">{t("Risultato a doppio morto")}</p>
      <p className="mb-3 text-center font-display text-2xl font-bold tabular-nums">{riga}</p>
      <div className="flex justify-center">
        <TabellaPrese mani={mani} giaCalcolata={dati} />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {t("Il punteggio è dal punto di vista di Nord-Sud, come il par.")}
      </p>
    </div>
  );
}
