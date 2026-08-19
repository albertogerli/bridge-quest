"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import {
  createGame,
  getValidCards,
  parseContract,
  playCard,
  type Card,
  type GameState,
  type Position,
} from "@/lib/bridge-engine";
import { useT } from "@/contexts/traduzioni-provider";

const NOME: Record<Position, string> = { north: "Nord", east: "Est", south: "Sud", west: "Ovest" };
const ORDINE = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

/**
 * «Rigioca da qui»: la mano riparte da una presa qualsiasi, quante volte si vuole.
 *
 * NON TOCCA IL RISULTATO REGISTRATO, e questo è il punto — non un dettaglio di
 * implementazione. Un allievo che sa di poter riprovare senza conseguenze prova
 * davvero; uno che teme di rovinare il voto guarda la soluzione e chiude. Qui
 * non si scrive niente da nessuna parte: tutto lo stato vive in questo
 * componente e muore quando si chiude.
 *
 * SI GIOCA A CARTE SCOPERTE, tutte e quattro le mani. Non è una svista: questa
 * non è una seconda partita, è uno strumento per capire cosa sarebbe successo
 * giocando diversamente, e nasconderne tre renderebbe la prova un tirare a
 * indovinare. La partita vera è già stata giocata e registrata.
 */
export function ProvaDaQui({
  hands,
  contract,
  declarer,
  /** Le carte da rigiocare prima di fermarsi: la posizione di partenza. */
  finoA = [],
  onChiudi,
}: {
  hands: Record<Position, Card[]>;
  contract: string;
  declarer: Position;
  finoA?: { seat: Position; card: Card }[];
  onChiudi?: () => void;
}) {
  const t = useT();
  /** La posizione di partenza, ricostruita giocando le carte fino al punto scelto. */
  const partenza = useMemo(() => {
    let s = createGame(hands, contract, declarer);
    for (const g of finoA) {
      try {
        s = playCard(s, g.seat, g.card);
      } catch {
        // Una carta che il motore rifiuta interrompe la ricostruzione: meglio
        // ripartire da dove si è arrivati che non partire affatto.
        break;
      }
    }
    return s;
  }, [hands, contract, declarer, finoA]);

  const [stato, setStato] = useState<GameState>(partenza);
  const [storia, setStoria] = useState<GameState[]>([]);

  const gioca = (seat: Position, carta: Card) => {
    try {
      const dopo = playCard(stato, seat, carta);
      setStoria((h) => [...h, stato]);
      setStato(dopo);
    } catch {
      // Carta non giocabile: il motore lo sa meglio di questo componente.
    }
  };

  const indietro = () => {
    setStoria((h) => {
      if (h.length === 0) return h;
      setStato(h[h.length - 1]);
      return h.slice(0, -1);
    });
  };

  const { tricksNeeded } = parseContract(contract);
  const giocabili = new Set(
    getValidCards(stato.hands[stato.currentPlayer] ?? [], stato.currentTrick).map(
      (c) => `${c.suit}-${c.rank}`,
    ),
  );

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">Prova da qui — {contract} di {NOME[declarer]}</span>
        <span className="text-xs text-muted-foreground">
          {stato.trickCount.ns + stato.trickCount.ew} prese giocate · servono {tricksNeeded}
        </span>
        <span className="ml-auto flex gap-1.5">
          <Button size="sm" variant="outline" onClick={indietro} disabled={storia.length === 0}>
            <Undo2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {t("Indietro")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setStato(partenza);
              setStoria([]);
            }}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {t("Da capo")}
          </Button>
          {onChiudi && (
            <Button size="sm" variant="ghost" onClick={onChiudi}>
              {t("Chiudi")}
            </Button>
          )}
        </span>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Qui non si registra niente: è pratica. Il risultato del compito resta quello del primo
        tentativo.
      </p>

      <p className="mb-2 text-sm">
        {t("Tocca a")} <strong>{NOME[stato.currentPlayer]}</strong> ·{" "}
        <span className="text-muted-foreground">
          NS {stato.trickCount.ns} — EO {stato.trickCount.ew}
        </span>
      </p>

      <div className="space-y-2">
        {(["north", "east", "south", "west"] as Position[]).map((p) => {
          const carte = stato.hands[p] ?? [];
          const tocca = stato.currentPlayer === p;
          return (
            <div
              key={p}
              className={`rounded-lg border p-2 ${tocca ? "border-primary bg-card" : "border-border"}`}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {NOME[p]}
                {tocca && <span className="ml-2 text-primary">tocca a lui</span>}
              </p>
              <div className="flex flex-wrap gap-1">
                {[...carte]
                  .sort(
                    (a, b) =>
                      ["spade", "heart", "diamond", "club"].indexOf(a.suit) -
                        ["spade", "heart", "diamond", "club"].indexOf(b.suit) ||
                      ORDINE.indexOf(a.rank) - ORDINE.indexOf(b.rank),
                  )
                  .map((c) => {
                    const ok = tocca && giocabili.has(`${c.suit}-${c.rank}`);
                    return (
                      <button
                        key={`${c.suit}-${c.rank}`}
                        disabled={!ok}
                        onClick={() => gioca(p, c)}
                        className={`flex items-center gap-0.5 rounded border px-1.5 py-1 text-sm font-bold ${
                          ok
                            ? "border-primary bg-background hover:bg-primary/10"
                            : "border-border bg-muted/40 opacity-60"
                        }`}
                      >
                        <SuitSymbol suit={c.suit} size="xs" />
                        {c.rank}
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {stato.phase === "finished" && (
        <p className="mt-3 rounded-lg bg-card p-3 text-sm font-semibold">
          Finita: {stato.trickCount.ns} prese per Nord-Sud.{" "}
          {(declarer === "north" || declarer === "south"
            ? stato.trickCount.ns
            : stato.trickCount.ew) >= tricksNeeded
            ? "Il contratto si mantiene."
            : "Il contratto cade."}
        </p>
      )}
    </div>
  );
}
