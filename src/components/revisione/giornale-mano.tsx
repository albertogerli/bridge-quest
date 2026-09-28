"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { cardOptions } from "@/lib/dds-table";
import {
  posizioneAl,
  sequenza,
  valutaGiocate,
  type PresaGiocata,
  type ValutazioneGiocata,
} from "@/lib/giornale-mano";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { Button } from "@/components/ui/button";
import { TabellaPrese } from "@/components/revisione/tabella-prese";
import { apriStampaMano } from "@/lib/stampa-mano";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

const COLONNE: { p: Position; l: string }[] = [
  { p: "west", l: "Ovest" }, { p: "north", l: "Nord" }, { p: "east", l: "Est" }, { p: "south", l: "Sud" },
];
const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const ORDINE = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ROSSO = (s: Suit) => `suit-${s}`;
const chiave = (c: Card) => `${c.suit}-${c.rank}`;

/**
 * La revisione della mano: il giornale delle prese e la mano in quel momento.
 *
 * Presa dalla revisione di BridgeChamp. A sinistra ogni presa su una riga,
 * con la carta vincente evidenziata; si tocca una carta e il diagramma si
 * porta a quel momento, con le carte già giocate in grigio al loro posto.
 *
 * L'ANALISI SI ACCENDE, non parte da sola: sono una cinquantina di
 * risoluzioni, e il numero accanto a ogni carta è la risposta — come nel
 * tavolo di studio, prima si ragiona e poi si guarda. Il numero è quante prese
 * fa la linea del dichiarante dopo quella carta, a carte viste; il «−1» rosso
 * è la carta che ne ha regalata una. Non «l'errore»: a carte coperte poteva
 * essere la scelta giusta (vedi `dds-replay.ts`).
 */
export function GiornaleMano({
  mani,
  prese,
  trump,
  dichiarante,
  contratto,
  titolo,
  risultato,
  onPresa,
}: {
  mani: Record<Position, Card[]>;
  prese: PresaGiocata[];
  trump: Suit | null;
  dichiarante: Position;
  /** Come si scrive a schermo: «4♠», «3SA». */
  contratto: string;
  titolo?: string;
  risultato?: string;
  /** La presa su cui si è fermi (da 0), per chi mostra accanto un commento. */
  onPresa?: (n: number) => void;
}) {
  const t = useT();
  const tutte = useMemo(() => sequenza(prese), [prese]);
  /** Dove comincia ogni presa nella sequenza delle carte: serve al clic. */
  const inizi = useMemo(() => {
    const out: number[] = [];
    let n = 0;
    for (const p of prese) { out.push(n); n += p.giocate.length; }
    return out;
  }, [prese]);
  const [passo, setPasso] = useState(tutte.length);
  const [analisi, setAnalisi] = useState(false);
  const [valutazioni, setValutazioni] = useState<(ValutazioneGiocata | null)[] | null>(null);
  const [mostraGiocate, setMostraGiocate] = useState(true);

  /**
   * Il calcolo parte una volta sola. NON dipende da `valutazioni`: ogni
   * risultato parziale la aggiorna, e un effetto che la guardasse si
   * annullerebbe da solo alla prima carta — è quello che succedeva.
   */
  const completata = useRef(false);
  useEffect(() => {
    if (!analisi || completata.current) return;
    let annullato = false;
    valutaGiocate(mani, prese, trump, dichiarante, cardOptions, (p) => { if (!annullato) setValutazioni(p); }, () => annullato)
      .then(() => { if (!annullato) completata.current = true; })
      .catch((err) => segnalaSalvoRete("revisione:analisi", err));
    return () => { annullato = true; };
  }, [analisi, mani, prese, trump, dichiarante]);

  useEffect(() => {
    onPresa?.(Math.max(0, Math.floor((passo - 1) / 4)));
  }, [passo, onPresa]);

  const attacco = tutte[0]?.seat ?? "west";
  const pos = posizioneAl(mani, prese, passo, attacco);
  const inMano = (p: Position) => new Set(pos.mani[p].map(chiave));

  const mano_ = (p: Position, etichetta: string) => {
    const restano = inMano(p);
    const carte = mostraGiocate ? mani[p] : pos.mani[p];
    return (
      <div className="rounded-xl border border-border bg-card p-2.5">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t(etichetta)}</p>
        {SEMI.map((s) => (
          <div key={s} className="flex items-center gap-1 font-mono text-base leading-6">
            <SuitSymbol suit={s} size="xs" />
            {carte
              .filter((c) => c.suit === s)
              .sort((a, b) => ORDINE.indexOf(a.rank) - ORDINE.indexOf(b.rank))
              .map((c) => (
                <span key={chiave(c)} className={restano.has(chiave(c)) ? "" : "text-muted-foreground/40"}>
                  {c.rank}
                </span>
              ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={analisi ? "default" : "outline"} onClick={() => setAnalisi((v) => !v)}>
          {analisi ? t("Nascondi l'analisi") : t("Mostra l'analisi")}
        </Button>
        <Button variant={mostraGiocate ? "default" : "outline"} onClick={() => setMostraGiocate((v) => !v)}>
          {t("Carte giocate")}
        </Button>
        <Button
          variant="outline"
          onClick={() => apriStampaMano({ titolo, mani, prese, contratto, dichiarante, risultato })}
        >
          <Printer className="mr-1 h-4 w-4" aria-hidden="true" />
          {t("Stampa / PDF")}
        </Button>
        {analisi && valutazioni && valutazioni.some((v) => v === null) && (
          <span className="text-xs text-muted-foreground">{t("Analizzo carta per carta…")}</span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
        {/* Il giornale */}
        <div className="overflow-x-auto rounded-xl border border-border bg-card p-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="w-6" />
                {COLONNE.map((c) => <th key={c.p} className="pb-1 font-semibold">{t(c.l)}</th>)}
              </tr>
            </thead>
            <tbody>
              {prese.map((presa, n) => (
                <tr key={n}>
                  <td className="pr-1 text-right text-xs text-muted-foreground">{n + 1}</td>
                  {COLONNE.map(({ p }) => {
                    const g = presa.giocate.find((x) => x.seat === p);
                    if (!g) return <td key={p} />;
                    const i = presa.giocate.indexOf(g) + inizi[n];
                    const v = valutazioni?.[i];
                    const vince = presa.vincitore === p;
                    const qui = passo === i + 1;
                    return (
                      <td key={p} className="p-0.5">
                        <button
                          onClick={() => setPasso(i + 1)}
                          aria-pressed={qui}
                          className={`flex w-full items-center justify-center gap-0.5 rounded-md border px-1 py-1 font-mono ${
                            qui ? "border-figb ring-2 ring-figb/40" : "border-border"
                          } ${vince ? "bg-figb/10 font-bold" : "bg-background"}`}
                        >
                          <span className={ROSSO(g.card.suit)}>{g.card.rank}</span>
                          <SuitSymbol suit={g.card.suit} size="xs" />
                          {analisi && v && (
                            <span className={`ml-0.5 text-[10px] ${v.costo > 0 ? "font-bold text-destructive" : "text-muted-foreground"}`}>
                              {v.costo > 0 ? `−${v.costo}` : v.preseDichiarante}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* La mano in quel momento */}
        <div>
          <div className="grid grid-cols-3 items-center gap-2">
            <div />
            {mano_("north", "Nord")}
            <div className="text-right text-sm">
              <p className="font-display text-xl font-bold">{contratto}</p>
              <p className="text-xs text-muted-foreground">{t("dichiara")} {t(COLONNE.find((c) => c.p === dichiarante)?.l ?? "")}</p>
              {risultato && <p className="text-xs font-semibold">{risultato}</p>}
            </div>
            {mano_("west", "Ovest")}
            <div className="flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-2">
              {pos.presaCorrente.map((g) => (
                <span key={chiave(g.card)} className="flex items-center gap-0.5 font-mono text-lg">
                  <span className="text-xs text-muted-foreground">{t(COLONNE.find((c) => c.p === g.seat)!.l).charAt(0)}</span>
                  <span className={ROSSO(g.card.suit)}>{g.card.rank}</span>
                  <SuitSymbol suit={g.card.suit} size="xs" />
                </span>
              ))}
              {pos.presaCorrente.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  {t("Prese")} NS {pos.preseNS} · EO {pos.preseEO}
                </span>
              )}
            </div>
            {mano_("east", "Est")}
            <div />
            {mano_("south", "Sud")}
            <div />
          </div>

          <div className="mt-3 flex items-center justify-center gap-1">
            <Button variant="outline" size="sm" aria-label={t("Inizio")} onClick={() => setPasso(0)}><ChevronFirst className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" aria-label={t("Carta precedente")} onClick={() => setPasso((p) => Math.max(0, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="min-w-20 text-center text-xs text-muted-foreground tabular-nums">{passo}/{tutte.length}</span>
            <Button variant="outline" size="sm" aria-label={t("Carta successiva")} onClick={() => setPasso((p) => Math.min(tutte.length, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" aria-label={t("Fine")} onClick={() => setPasso(tutte.length)}><ChevronLast className="h-4 w-4" /></Button>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card p-3">
            <p className="mb-2 text-sm font-semibold">{t("Prese per posto, a carte viste")}</p>
            <TabellaPrese mani={mani} />
          </div>
        </div>
      </div>
    </div>
  );
}
