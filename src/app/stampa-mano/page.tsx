"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { leggiManoDaStampare, type ManoDaStampare } from "@/lib/stampa-mano";
import { puntiOnori } from "@/lib/giornale-mano";
import { TabellaPrese } from "@/components/revisione/tabella-prese";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const ORDINE = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const COLONNE: { p: Position; l: string }[] = [
  { p: "west", l: "Ovest" }, { p: "north", l: "Nord" }, { p: "east", l: "Est" }, { p: "south", l: "Sud" },
];

/**
 * Il foglio di una mano, da stampare o salvare in PDF.
 *
 * Come la stampa di BridgeChamp: diagramma, contratto e risultato, punti
 * onori a rosa, prese per posto a carte viste con il par, e il gioco presa per
 * presa con la carta vincente evidenziata. È il foglio che l'insegnante
 * manda alla classe dopo la lezione.
 *
 * FUORI DALLA STRUTTURA DEL SITO (`FULL_SCREEN_ROUTES`): su carta la barra di
 * navigazione è inchiostro buttato. Colori pieni e nessuno sfondo scuro, anche
 * se il sito è in modalità scura: si stampa su bianco.
 */
export default function StampaManoPage() {
  const t = useT();
  const [mano, setMano] = useState<(ManoDaStampare & { quando?: string }) | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la mano sta nel localStorage, leggibile solo dopo il montaggio
    setMano(leggiManoDaStampare());
  }, []);

  if (mano === undefined) return null;
  if (mano === null) {
    return (
      <p className="p-10 text-center text-sm text-muted-foreground">
        {t("Non trovo la mano da stampare. Torna alla mano e premi di nuovo «Stampa / PDF».")}
      </p>
    );
  }

  const mano_ = (p: Position, l: string) => (
    <div>
      <p className="mb-1 inline-block rounded bg-[#003DA5] px-2 py-0.5 text-xs font-bold text-white">{t(l)}</p>
      {SEMI.map((s) => (
        <div key={s} className="flex items-center gap-1 font-mono text-[15px] leading-6">
          <SuitSymbol suit={s} size="xs" />
          {mano.mani[p]
            .filter((c: Card) => c.suit === s)
            .sort((a: Card, b: Card) => ORDINE.indexOf(a.rank) - ORDINE.indexOf(b.rank))
            .map((c: Card) => c.rank)
            .join(" ") || "—"}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#0f1219] print:min-h-0">
      <div className="mx-auto max-w-[800px] p-8 print:p-0">
        <div className="mb-6 flex justify-end print:hidden">
          <Button onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" aria-hidden="true" />
            {t("Stampa o salva in PDF")}
          </Button>
        </div>

        <header className="mb-6 flex items-baseline justify-between border-b border-[#d9d4c8] pb-2 text-xs text-[#5b6478]">
          <span>{mano.quando ? new Date(mano.quando).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : ""}</span>
          <span className="font-display text-base font-bold text-[#0f1219]">{mano.titolo || t("La mano")}</span>
          <span>bridgelab.it</span>
        </header>

        <div className="grid grid-cols-[1fr_1fr] gap-8">
          <div>
            <div className="grid grid-cols-3 items-center gap-3">
              <div className="text-sm">
                <p className="text-xs text-[#5b6478]">{t("Contratto")}</p>
                <p className="font-display text-xl font-bold">{mano.contratto}</p>
                <p className="text-xs">{t("dichiara")} {t(COLONNE.find((c) => c.p === mano.dichiarante)?.l ?? "")}</p>
                {mano.risultato && <p className="mt-1 text-sm font-semibold">{mano.risultato}</p>}
              </div>
              {mano_("north", "Nord")}
              <div />
              {mano_("west", "Ovest")}
              {/* Punti onori a rosa: si legge a colpo d'occhio chi ha la forza. */}
              <div className="grid grid-cols-3 grid-rows-3 place-items-center text-sm text-[#5b6478]">
                <span className="col-start-2 row-start-1 font-bold">{puntiOnori(mano.mani.north)}</span>
                <span className="col-start-1 row-start-2 font-bold">{puntiOnori(mano.mani.west)}</span>
                <span className="col-start-2 row-start-2 text-xs uppercase">{t("PO")}</span>
                <span className="col-start-3 row-start-2 font-bold">{puntiOnori(mano.mani.east)}</span>
                <span className="col-start-2 row-start-3 font-bold">{puntiOnori(mano.mani.south)}</span>
              </div>
              {mano_("east", "Est")}
              <div />
              {mano_("south", "Sud")}
              <div />
            </div>
            <div className="mt-6">
              <TabellaPrese mani={mano.mani} compatta />
            </div>
          </div>

          {mano.prese.length > 0 && (
            <div className="rounded-lg border border-[#d9d4c8]">
              <p className="border-b border-[#d9d4c8] bg-[#F7F5F0] py-1.5 text-center text-sm font-semibold">{t("Il gioco")}</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[#5b6478]">
                    <th />
                    {COLONNE.map((c) => <th key={c.p} className="py-1 font-semibold">{t(c.l)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {mano.prese.map((presa, n) => (
                    <tr key={n}>
                      <td className="px-1 text-right text-xs text-[#5b6478]">{n + 1}</td>
                      {COLONNE.map(({ p }) => {
                        const g = presa.giocate.find((x) => x.seat === p);
                        return (
                          <td key={p} className="p-0.5">
                            {g && (
                              <span className={`flex items-center justify-center gap-0.5 rounded border py-0.5 font-mono ${
                                presa.vincitore === p ? "border-[#003DA5] bg-[#e6eefb] font-bold" : "border-[#e6e2d9]"
                              }`}>
                                <span className={`suit-${g.card.suit}`}>{g.card.rank}</span>
                                <SuitSymbol suit={g.card.suit} size="xs" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
