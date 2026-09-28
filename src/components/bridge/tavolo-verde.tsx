"use client";

import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { PlayingCard } from "@/components/bridge/playing-card";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { handHcp } from "@/lib/deal-generator";
import { useMobile } from "@/hooks/use-mobile";
import { useT } from "@/contexts/traduzioni-provider";

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const ORDINE = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const POSTI: { p: Position; l: string; iniziale: string }[] = [
  { p: "north", l: "Nord", iniziale: "N" },
  { p: "east", l: "Est", iniziale: "E" },
  { p: "south", l: "Sud", iniziale: "S" },
  { p: "west", l: "Ovest", iniziale: "O" },
];
const chiave = (c: Card) => `${c.suit}-${c.rank}`;
const ordina = (carte: Card[]) =>
  [...carte].sort((a, b) => SEMI.indexOf(a.suit) - SEMI.indexOf(b.suit) || ORDINE.indexOf(a.rank) - ORDINE.indexOf(b.rank));

/**
 * Il tavolo verde dell'insegnante.
 *
 * Preso dal tavolo didattico di BridgeChamp (28/09/2026, «anche sto layout
 * bello»): panno verde, carte vere invece di righe di lettere, la presa in
 * corso al centro attorno alla bussola, e una barra sola che dice quali mani
 * vede la classe — invece di un pulsante sotto ogni mano.
 *
 * NORD E SUD IN RIGA, OVEST ED EST PER SEME. È la disposizione del tavolo
 * vero visto dall'alto: le mani ai lati, messe in riga, sarebbero più larghe
 * di tutto lo schermo. Sul telefono le carte si rimpiccioliscono, non si
 * nascondono.
 */
export function TavoloVerde({
  mani,
  visibili,
  turno,
  giocabili,
  giocate,
  attivo,
  onGioca,
  onVisibilita,
  sopra,
}: {
  mani: Partial<Record<Position, Card[]>>;
  /** Le mani che la classe vede in questo momento. */
  visibili: Position[];
  turno?: Position;
  giocabili: Set<string>;
  /** Tutte le carte giocate, in ordine: le ultime (fino a 3) sono la presa in corso. */
  giocate: { seat: Position; card: Card }[];
  attivo: boolean;
  onGioca: (seat: Position, c: Card) => void;
  onVisibilita: (seat: Position) => void;
  /**
   * Quello che sta sul panno sopra le mani: i riquadri della telecamera.
   * Nel tavolo didattico di BridgeChamp i volti sono SUL tavolo, non in una
   * finestra a parte — si parla guardando le persone e le carte insieme.
   */
  sopra?: ReactNode;
}) {
  const t = useT();
  const piccolo = useMobile(768);
  const inCorso = giocate.length % 4 === 0 ? [] : giocate.slice(giocate.length - (giocate.length % 4));

  const targhetta = (p: Position) => {
    const info = POSTI.find((x) => x.p === p)!;
    const vista = visibili.includes(p);
    const tocca = turno === p;
    return (
      <div className={`mb-2 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold shadow-sm ${
        tocca ? "bg-[#c8a44e] text-[#1a1406]" : "bg-white/90 text-[#0f1219]"
      }`}>
        <span className="flex h-6 w-6 items-center justify-center rounded bg-[#003DA5] text-xs font-bold text-white">{info.iniziale}</span>
        <span className={piccolo ? "sr-only" : ""}>{t(info.l)}</span>
        <span className="text-xs font-normal opacity-70">{handHcp(mani[p] ?? [])}{piccolo ? "" : " PO"}</span>
        {vista && <Eye className="h-3.5 w-3.5 text-emerald-700" aria-label={t("La classe la vede")} />}
      </div>
    );
  };

  const carta = (p: Position, c: Card, dimensione: "xs" | "sm") => {
    const giocabile = attivo && turno === p && giocabili.has(chiave(c));
    if (!giocabile) {
      // Piena e leggibile, solo non toccabile: `disabled` la sbiadirebbe, e una
      // mano mezza trasparente sul panno non si legge dall'ultima fila.
      return (
        <div key={chiave(c)} className="pointer-events-none">
          <PlayingCard card={c} size={dimensione} noHover />
        </div>
      );
    }
    return (
      <PlayingCard key={chiave(c)} card={c} size={dimensione} highlighted onClick={() => onGioca(p, c)} />
    );
  };

  /**
   * Sul telefono le carte sovrapposte nascondono il valore: la mano diventa un
   * cartoncino con un seme per riga. Stesso panno, stesse regole, si legge.
   */
  const compatta = (p: Position) => (
    <div className="flex flex-col items-center">
      {targhetta(p)}
      <div className="rounded-lg bg-white/95 px-2 py-1 font-mono text-sm text-[#0f1219] shadow">
        {SEMI.map((s) => (
          <div key={s} className="flex min-h-6 items-center gap-0.5">
            <SuitSymbol suit={s} size="xs" />
            {ordina((mani[p] ?? []).filter((c) => c.suit === s)).map((c) => {
              const giocabile = attivo && turno === p && giocabili.has(chiave(c));
              return giocabile ? (
                <button
                  key={chiave(c)}
                  onClick={() => onGioca(p, c)}
                  className={`suit-${c.suit} min-h-8 min-w-6 rounded bg-[#c8a44e]/30 px-0.5 font-bold ring-1 ring-[#c8a44e]`}
                >
                  {c.rank}
                </button>
              ) : (
                <span key={chiave(c)} className={`suit-${c.suit}`}>{c.rank}</span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  /** Nord e Sud: una riga sola, le carte sovrapposte come in mano. */
  const inRiga = (p: Position) => piccolo ? compatta(p) : (
    <div className="flex flex-col items-center">
      {targhetta(p)}
      <div className={`flex ${piccolo ? "[&>*:not(:first-child)]:-ml-5" : "[&>*:not(:first-child)]:-ml-3"}`}>
        {ordina(mani[p] ?? []).map((c) => carta(p, c, piccolo ? "xs" : "sm"))}
      </div>
    </div>
  );

  /** Ovest ed Est: un seme per riga. */
  const perSeme = (p: Position) => piccolo ? compatta(p) : (
    <div className="flex flex-col items-center">
      {targhetta(p)}
      <div className="space-y-1">
        {SEMI.map((s) => {
          const delSeme = ordina((mani[p] ?? []).filter((c) => c.suit === s));
          return (
            <div key={s} className={`flex min-h-6 ${piccolo ? "[&>*:not(:first-child)]:-ml-5" : "[&>*:not(:first-child)]:-ml-4"}`}>
              {delSeme.length ? delSeme.map((c) => carta(p, c, piccolo ? "xs" : "sm")) : <span className="text-white/50">—</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const alCentro = (p: Position) => inCorso.find((g) => g.seat === p);

  return (
    <div className="space-y-3">
      {attivo && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
          <span className="font-semibold">{t("La classe vede")}:</span>
          {POSTI.map(({ p, l, iniziale }) => {
            const vista = visibili.includes(p);
            return (
              <button
                key={p}
                onClick={() => onVisibilita(p)}
                aria-pressed={vista}
                aria-label={t(l)}
                className={`flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                  vista ? "bg-emerald-600 text-white" : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {iniziale}
              </button>
            );
          })}
        </div>
      )}

      <div className="felt-bg rounded-3xl px-1.5 py-3 shadow-lg sm:p-6">
        {sopra && <div className="mb-4 rounded-2xl bg-black/20 p-2 sm:p-3">{sopra}</div>}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 sm:gap-4">
          <div />
          {inRiga("north")}
          <div />

          {perSeme("west")}
          {/* La bussola, con la presa in corso attorno. */}
          <div className="relative mx-auto h-28 w-24 sm:h-52 sm:w-52">
            <div className="absolute inset-6 flex items-center justify-center rounded-2xl border-2 border-white/30 bg-[#0f3d22]/60 sm:inset-12">
              {POSTI.filter(({ p }) => !piccolo || turno === p).map(({ p, iniziale }) => (
                <span
                  key={p}
                  className={`absolute text-sm font-bold ${turno === p ? "text-[#f5d27a]" : "text-white/70"} ${
                    p === "north" ? "top-1" : p === "south" ? "bottom-1" : p === "west" ? "left-2" : "right-2"
                  }`}
                >
                  {iniziale}
                </span>
              ))}
            </div>
            {POSTI.map(({ p }) => {
              const g = alCentro(p);
              if (!g) return null;
              const posto =
                p === "north" ? "left-1/2 top-0 -translate-x-1/2"
                : p === "south" ? "left-1/2 bottom-0 -translate-x-1/2"
                : p === "west" ? "left-0 top-1/2 -translate-y-1/2"
                : "right-0 top-1/2 -translate-y-1/2";
              return (
                <div key={p} className={`pointer-events-none absolute ${posto}`}>
                  <PlayingCard card={g.card} size={piccolo ? "xs" : "sm"} noHover />
                </div>
              );
            })}
          </div>
          {perSeme("east")}

          <div />
          {inRiga("south")}
          <div />
        </div>
      </div>
    </div>
  );
}
