"use client";

import { useMemo, useState } from "react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { divisioniAlTavolo, etichettaDivisione } from "@/lib/divisioni";
import { useT } from "@/contexts/traduzioni-provider";

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];

/**
 * Le probabilità di divisione del colore scelto, nella posizione corrente.
 *
 * PENSATO PER ESSERE PROIETTATO: barre e percentuali grandi, niente testo
 * piccolo, nessun comando oltre alla scelta del colore. In una sala si legge
 * dall'ultima fila o non serve a niente.
 *
 * Il conto non viene da una tabella: sta in `src/lib/divisioni.ts` e usa le
 * carte che mancano davvero e i posti liberi rimasti. È il motivo per cui vale
 * la pena mostrarlo mentre si gioca invece che ricopiare il manuale — dopo tre
 * prese i numeri sono altri, e vederli cambiare è la lezione.
 */
export function PannelloDivisioni({
  noti,
  giocate,
  avversari,
  coloreIniziale,
  grande = false,
}: {
  noti: Partial<Record<Position, Card[]>>;
  giocate?: { seat: Position; card: Card }[];
  avversari: [Position, Position];
  coloreIniziale?: Suit;
  /** Formato proiezione: caratteri più grandi, più contrasto. */
  grande?: boolean;
}) {
  const t = useT();
  const [colore, setColore] = useState<Suit>(coloreIniziale ?? "spade");

  const esito = useMemo(
    () => divisioniAlTavolo({ colore, noti, giocate, avversari }),
    [colore, noti, giocate, avversari],
  );

  const etichettaLato = (p: Position) =>
    ({ north: "Nord", east: "Est", south: "Sud", west: "Ovest" })[p];

  return (
    <div className={`rounded-xl border border-border bg-card ${grande ? "p-6" : "p-4"}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {SEMI.map((s) => (
          <button
            key={s}
            onClick={() => setColore(s)}
            aria-pressed={colore === s}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              colore === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            <SuitSymbol suit={s} size={grande ? "lg" : "md"} />
          </button>
        ))}
        <span className={`ml-auto text-muted-foreground ${grande ? "text-lg" : "text-sm"}`}>
          {esito.mancanti === 0
            ? "nessuna carta in giro"
            : `${esito.mancanti} carte agli avversari`}
        </span>
      </div>

      {esito.divisioni.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("Niente da dividere in questo colore.")}</p>
      ) : (
        <ul className="space-y-1.5">
          {esito.divisioni.map((d) => {
            const percento = d.probabilita * 100;
            return (
              <li key={`${d.sinistra}-${d.destra}`} className="flex items-center gap-3">
                <span
                  className={`w-14 shrink-0 font-mono font-bold tabular-nums ${
                    grande ? "text-2xl" : "text-base"
                  }`}
                >
                  {etichettaDivisione(d)}
                </span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(1, percento)}%` }}
                  />
                </span>
                <span
                  className={`w-16 shrink-0 text-right font-semibold tabular-nums ${
                    grande ? "text-2xl" : "text-base"
                  }`}
                >
                  {percento >= 10 ? percento.toFixed(0) : percento.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/*
        I posti liberi si mostrano solo quando sono diversi: a mani pari non
        aggiungono niente, e una riga in più su un proiettore è una riga di
        troppo. Quando invece sono diversi spiegano perché i numeri non sono
        quelli del manuale — senza, sembrerebbero sbagliati.
      */}
      {esito.postiSinistra !== esito.postiDestra && (
        <p className={`mt-3 text-muted-foreground ${grande ? "text-base" : "text-xs"}`}>
          {etichettaLato(avversari[0])} ha {esito.postiSinistra} carte,{" "}
          {etichettaLato(avversari[1])} ne ha {esito.postiDestra}: le due parti non sono più
          equivalenti.
        </p>
      )}
    </div>
  );
}
