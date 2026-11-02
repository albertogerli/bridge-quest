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
  /**
   * Solo l'ultima presa chiusa (e quella in corso), come al tavolo vero: la
   * presa girata si può rivedere finché non si gioca la carta successiva.
   * Nelle sfide a punteggio il registro completo sarebbe un aiuto che gli
   * avversari al tavolo non hanno (decisione del 02/11/2026).
   */
  soloUltima?: boolean;
}

export function PannelloMano({ prese, presaInCorso, licita, intestazione, soloUltima = false }: PannelloManoProps) {
  const t = useT();
  const [scheda, setScheda] = useState<"prese" | "licita">("prese");
  const nomi: Record<Position, string> = { north: t("Nord"), east: t("Est"), south: t("Sud"), west: t("Ovest") };
  const tutte = [
    ...prese.map((p, i) => ({ n: i + 1, plays: p.plays, winner: p.winner as Position | undefined })),
    ...(presaInCorso.length ? [{ n: prese.length + 1, plays: presaInCorso, winner: undefined }] : []),
  ];
  // Al tavolo la presa girata si rivede solo finché non si gioca la successiva.
  const righe = soloUltima ? tutte.slice(-1) : tutte;

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
        <p className="px-4 py-4 text-sm text-muted-foreground">
          {soloUltima
            ? t("Qui compare l'ultima presa, appena si comincia a giocare.")
            : t("Qui compaiono le prese, una riga per presa, appena si comincia a giocare.")}
        </p>
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
              {righe.map((r) => (
                <tr key={r.n} className="border-b border-border last:border-0">
                  <td className="px-3 py-1.5 text-muted-foreground">{r.n}</td>
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
          <p className="px-3 py-2 text-xs text-muted-foreground">
            {soloUltima
              ? t("Come al tavolo: si vede solo l'ultima presa. Sottolineata la carta d'attacco, in grassetto quella che ha vinto.")
              : t("Sottolineata la carta d'attacco, in grassetto quella che ha vinto la presa.")}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * La pillola del contratto sul telefono: tocca e si apre il pannello dal basso.
 * Sul computer il pannello è già a lato, e la pillola resta solo da leggere.
 *
 * `daSchermo` è la larghezza da cui il pannello sta a lato: `lg` di norma,
 * `2xl` nelle pagine che hanno anche la colonna destra del portale. Le classi
 * sono scritte per intero perché Tailwind le trovi.
 */
const CLASSI = {
  lg: { pillola: "lg:pointer-events-none lg:shadow-none", nascosto: "lg:hidden" },
  "2xl": { pillola: "2xl:pointer-events-none 2xl:shadow-none", nascosto: "2xl:hidden" },
} as const;

export function FoglioMano({
  etichetta,
  children,
  daSchermo = "lg",
}: {
  etichetta: ReactNode;
  children: ReactNode;
  daSchermo?: keyof typeof CLASSI;
}) {
  const c = CLASSI[daSchermo];
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
        className={`flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-semibold shadow-sm ${c.pillola}`}
      >
        {etichetta}
        <ChevronDown className={`h-4 w-4 text-muted-foreground ${c.nascosto}`} aria-hidden="true" />
      </button>
      {/* Sopra la barra di navigazione in basso (z-50) e al banner dei cookie (z-60). */}
      {aperto && (
        <div className={`fixed inset-0 z-[70] ${c.nascosto}`} role="dialog" aria-modal="true" aria-label={t("Prese e licita")}>
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t("Chiudi")} onClick={() => setAperto(false)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card pb-[env(safe-area-inset-bottom)] shadow-lg">
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
