"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import type { Position, Trick, TrickPlay } from "@/lib/bridge-engine";
import type { BiddingData } from "@/lib/catalog";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Il pannello della mano: le prese giocate e la licita, accanto al tavolo.
 *
 * Direzione «Ibrido» (02/11/2026): il panno resta per le carte, le informazioni
 * da consultare stanno in un registro a parte. Sul computer il pannello è
 * sempre aperto a destra del tavolo; sul telefono lo apre la pillola del
 * contratto, come foglio dal basso, perché lo schermo è del tavolo.
 *
 * Il registro serve a chi comincia più che a chi gioca bene: «chi ha preso la
 * terza?», «è già uscito il Re di cuori?» sono le domande che oggi si fanno
 * in aula, e la risposta era solo nella memoria di chi gioca.
 */

const COLONNE: Position[] = ["west", "north", "east", "south"];
const SEMI: Record<string, { s: string; c: string }> = {
  spade: { s: "♠", c: "suit-spade" },
  heart: { s: "♥", c: "suit-heart" },
  diamond: { s: "♦", c: "suit-diamond" },
  club: { s: "♣", c: "suit-club" },
};

export interface PannelloManoProps {
  /** Le prese finite. */
  prese: Trick[];
  /** La presa in corso. */
  presaInCorso: TrickPlay[];
  /** La licita, quando c'è e quando l'allievo l'ha già vista spiegata. */
  licita?: BiddingData | null;
  /** In alto: contratto, obiettivo e prese, come li dice la pagina. */
  intestazione: ReactNode;
}

export function PannelloMano({ prese, presaInCorso, licita, intestazione }: PannelloManoProps) {
  const t = useT();
  const [scheda, setScheda] = useState<"prese" | "licita">("prese");
  const nomi: Record<Position, string> = { north: t("Nord"), east: t("Est"), south: t("Sud"), west: t("Ovest") };
  const righe = [
    ...prese.map((p) => ({ plays: p.plays, winner: p.winner })),
    ...(presaInCorso.length ? [{ plays: presaInCorso, winner: undefined }] : []),
  ];

  return (
    <div className="grid gap-0">
      <div className="px-4 pb-3 pt-4">{intestazione}</div>
      {licita && (
        <div className="flex gap-1 border-b border-border px-2" role="tablist" aria-label={t("Cosa vedere")}>
          {(["prese", "licita"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={scheda === k}
              onClick={() => setScheda(k)}
              className={`min-h-11 border-b-2 px-3 text-sm font-semibold ${
                scheda === k ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              {k === "prese" ? t("Prese") : t("Licita")}
            </button>
          ))}
        </div>
      )}
      {scheda === "licita" && licita ? (
        <div className="p-3">
          <BiddingPanel bidding={licita} />
        </div>
      ) : righe.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">{t("Qui compaiono le prese, una riga per presa, appena si comincia a giocare.")}</p>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto lg:max-h-[60vh]">
          <table className="w-full border-collapse text-sm tabular-nums">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left font-semibold">#</th>
                {COLONNE.map((p) => (
                  <th key={p} className="px-2 py-2 text-left font-semibold">{nomi[p]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {righe.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                  {COLONNE.map((p) => {
                    const g = r.plays.find((x) => x.position === p);
                    const primo = r.plays[0]?.position === p;
                    return (
                      <td key={p} className={`px-2 py-1.5 ${r.winner === p ? "font-bold" : ""}`}>
                        {g ? (
                          <span className={`${primo ? "underline decoration-muted-foreground/50 underline-offset-4" : ""}`}>
                            {g.card.rank}
                            <span className={SEMI[g.card.suit].c}>{SEMI[g.card.suit].s}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-xs text-muted-foreground">{t("Sottolineata la carta d'attacco, in grassetto quella che ha vinto la presa.")}</p>
        </div>
      )}
    </div>
  );
}

/**
 * La pillola del contratto sul telefono: tocca e si apre il pannello dal basso.
 * Sul computer il pannello è già a lato, e la pillola resta solo da leggere.
 */
export function FoglioMano({ etichetta, children }: { etichetta: ReactNode; children: ReactNode }) {
  const t = useT();
  const [aperto, setAperto] = useState(false);
  const chiudi = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aperto) return;
    chiudi.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAperto(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aperto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAperto(true)}
        aria-expanded={aperto}
        className="flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-semibold shadow-sm lg:pointer-events-none lg:shadow-none"
      >
        {etichetta}
        <ChevronDown className="h-4 w-4 text-muted-foreground lg:hidden" aria-hidden="true" />
      </button>
      {aperto && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("Prese e licita")}>
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t("Chiudi")} onClick={() => setAperto(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-card pb-[env(safe-area-inset-bottom)] shadow-lg">
            <button
              ref={chiudi}
              type="button"
              onClick={() => setAperto(false)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted"
              aria-label={t("Chiudi")}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
