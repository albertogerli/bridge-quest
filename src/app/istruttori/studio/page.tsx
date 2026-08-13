"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, FlaskConical, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { createGame, getValidCards, parseContract, playCard, type GameState } from "@/lib/bridge-engine";
import { DEAL_TEMPLATES, generateDeals } from "@/lib/deal-generator";
import { calcTableAndPar, cardOptions, type OpzioneCarta } from "@/lib/dds-table";
import { parAssignmentFromContracts } from "@/lib/par-contract";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const SEATS: { key: Position; label: string }[] = [
  { key: "north", label: "Nord" },
  { key: "east", label: "Est" },
  { key: "south", label: "Sud" },
  { key: "west", label: "Ovest" },
];

const chiave = (c: Card) => `${c.suit}-${c.rank}`;

/**
 * Tavolo di studio: «e se giocassi quest'altra?»
 *
 * PERCHÉ NON BASTA IL REPLAY
 * Rivedere una mano dice cosa è successo. Qui si può cambiare una carta e
 * vedere cosa SAREBBE successo, e non per una variante alla volta: ogni carta
 * giocabile porta scritto quante prese fa: si vede in un colpo d'occhio dove
 * la scelta è indifferente e dove invece è il bivio della mano.
 *
 * A lezione la domanda non è «qual è la carta giusta», è QUANTO COSTANO LE
 * ALTRE. Un errore che regala una presa e uno che ne regala tre sono due
 * discorsi diversi, e messi accanto si distinguono senza spiegazioni.
 *
 * I NUMERI SI POSSONO SPEGNERE, ed è il punto.
 * Lasciati accesi diventano la risposta, e l'allievo smette di ragionare: si
 * mostrano dopo che la classe ha detto la sua. Per questo si parte con i
 * numeri COPERTI.
 */
export default function StudioPage() {
  const { user, loading } = useSharedAuth();

  const [modelloId, setModelloId] = useState(DEAL_TEMPLATES[0].id);
  const [seed, setSeed] = useState(2026);
  const [numeri, setNumeri] = useState(false);
  const [storia, setStoria] = useState<GameState[]>([]);
  const [stato, setStato] = useState<GameState | null>(null);
  const [contratto, setContratto] = useState<{ contract: string; declarer: Position } | null>(null);
  // Le valutazioni si conservano INSIEME alla posizione per cui valgono: così
  // «sto calcolando» è una deduzione, non un altro stato da tenere in sincronia
  // — e mostrare per un istante i numeri della posizione precedente sarebbe
  // peggio che non mostrarli affatto.
  const [valutazione, setValutazione] = useState<{ posizione: string; lista: OpzioneCarta[] } | null>(null);

  const modello = DEAL_TEMPLATES.find((t) => t.id === modelloId) ?? DEAL_TEMPLATES[0];
  const deal = useMemo(
    () => generateDeals(modello.constraints, { count: 1, seed }).deals[0],
    [modello, seed]
  );

  // Contratto: il par della mano, come nel resto della piattaforma — così lo
  // studio parte da una dichiarazione sensata invece che da una scelta a caso.
  useEffect(() => {
    let vivo = true;
    calcTableAndPar(deal, "north", "none")
      .then(({ table, par }) => {
        const a = parAssignmentFromContracts(par.contracts, table, deal);
        if (!vivo) return;
        const scelto = a ?? { contract: "3SA", declarer: "south" as Position };
        setContratto(scelto);
        setStato(createGame(deal, scelto.contract, scelto.declarer));
        setStoria([]);
      })
      .catch((err) => reportError("studio:par", err));
    return () => { vivo = false; };
  }, [deal]);

  const trump = contratto ? parseContract(contratto.contract).trumpSuit : null;

  // Le valutazioni si ricalcolano a ogni carta: è una chiamata al solver, e a
  // mano avanzata costa pochi millisecondi.
  const posizione = stato
    ? `${stato.tricks.length}-${stato.currentTrick.map((p) => chiave(p.card)).join(",")}`
    : "";

  useEffect(() => {
    if (!stato) return;
    let vivo = true;
    const leader = stato.currentTrick[0]?.position ?? stato.currentPlayer;
    cardOptions(stato.hands, trump, leader, stato.currentTrick.map((p) => p.card))
      .then((lista) => { if (vivo) setValutazione({ posizione, lista }); })
      .catch((err) => { reportError("studio:carte", err); });
    return () => { vivo = false; };
  }, [stato, trump, posizione]);

  const gioca = useCallback((carta: Card) => {
    if (!stato) return;
    setStoria((s) => [...s, stato]);
    setStato(playCard(stato, stato.currentPlayer, carta));
  }, [stato]);

  const indietro = () => {
    setStoria((s) => {
      if (s.length === 0) return s;
      setStato(s[s.length - 1]);
      return s.slice(0, -1);
    });
  };

  const ricomincia = () => {
    if (!contratto) return;
    setStato(createGame(deal, contratto.contract, contratto.declarer));
    setStoria([]);
  };

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Riservato agli insegnanti.{" "}
          <Link href="/login?redirect=/istruttori/studio" className="underline">Accedi</Link>.
        </p>
      </div>
    );
  }

  const opzioni = valutazione?.posizione === posizione ? valutazione.lista : null;
  const calcolo = opzioni === null;
  const perCarta = new Map((opzioni ?? []).map((o) => [chiave(o.card), o.tricks]));
  const migliore = opzioni && opzioni.length ? Math.max(...opzioni.map((o) => o.tricks)) : null;
  const tocca = stato?.currentPlayer;
  const legali = stato ? getValidCards(stato.hands[stato.currentPlayer], stato.currentTrick) : [];
  const legaliSet = new Set(legali.map(chiave));

  return (
    <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-figb" aria-hidden="true" />
          Tavolo di studio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gioca qualsiasi carta e torna indietro. Ogni carta porta scritto
          quante prese fa — quando decidi tu di mostrarlo.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-4 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="argomento" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            Argomento
          </label>
          <select
            id="argomento"
            value={modelloId}
            onChange={(e) => setModelloId(e.target.value)}
            className="h-11 px-3 rounded-xl border border-border bg-card text-sm"
          >
            {DEAL_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <Button variant="outline" onClick={() => setSeed((s) => s + 1)}>Altra mano</Button>
        <Button variant="outline" onClick={indietro} disabled={storia.length === 0}>
          <Undo2 className="w-4 h-4 mr-1" aria-hidden="true" />
          Indietro
        </Button>
        <Button variant="outline" onClick={ricomincia} disabled={storia.length === 0}>
          <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
          Ricomincia
        </Button>
        <Button onClick={() => setNumeri((n) => !n)}>
          {numeri ? <EyeOff className="w-4 h-4 mr-1" aria-hidden="true" /> : <Eye className="w-4 h-4 mr-1" aria-hidden="true" />}
          {numeri ? "Nascondi i numeri" : "Mostra i numeri"}
        </Button>
      </div>

      {contratto && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <Badge variant="secondary" className="text-base">
            {contratto.contract} — dichiara {SEATS.find((s) => s.key === contratto.declarer)?.label}
          </Badge>
          {tocca && (
            <span className="text-sm font-semibold">
              Gioca <strong>{SEATS.find((s) => s.key === tocca)?.label}</strong>
            </span>
          )}
          {calcolo && <span className="text-xs text-muted-foreground">calcolo…</span>}
        </div>
      )}

      {/* Il tavolo: Nord in alto, Sud in basso, Ovest ed Est ai lati. */}
      <div className="grid grid-cols-3 gap-2 items-start">
        <div />
        <Mano seat="north" {...{ stato, tocca, legaliSet, perCarta, migliore, numeri, gioca }} />
        <div />
        <Mano seat="west" {...{ stato, tocca, legaliSet, perCarta, migliore, numeri, gioca }} />
        <PresaCorrente stato={stato} />
        <Mano seat="east" {...{ stato, tocca, legaliSet, perCarta, migliore, numeri, gioca }} />
        <div />
        <Mano seat="south" {...{ stato, tocca, legaliSet, perCarta, migliore, numeri, gioca }} />
        <div />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-5">
        Il numero è quante prese fa ancora la linea di chi gioca, a carte
        scoperte. Al tavolo, senza vedere le mani avversarie, alcune di quelle
        prese non sarebbero trovabili: serve a capire dov&apos;era il bivio, non
        a dire che qualcuno ha sbagliato.
      </p>
    </div>
  );
}

/** Le carte giocate finora in questa presa. */
function PresaCorrente({ stato }: { stato: GameState | null }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border min-h-[7rem] p-2 flex flex-wrap items-center justify-center gap-2">
      {(stato?.currentTrick ?? []).map((p, i) => (
        <span key={i} className="text-lg font-mono flex items-center gap-1">
          <SuitSymbol suit={p.card.suit} size="xs" />
          {p.card.rank}
        </span>
      ))}
      {stato?.currentTrick.length === 0 && (
        <span className="text-xs text-muted-foreground">
          {stato.tricks.length > 0 ? `${stato.tricks.length} prese giocate` : "inizio mano"}
        </span>
      )}
    </div>
  );
}

function Mano({
  seat, stato, tocca, legaliSet, perCarta, migliore, numeri, gioca,
}: {
  seat: Position;
  stato: GameState | null;
  tocca: Position | undefined;
  legaliSet: Set<string>;
  perCarta: Map<string, number>;
  migliore: number | null;
  numeri: boolean;
  gioca: (c: Card) => void;
}) {
  const etichetta = SEATS.find((s) => s.key === seat)!.label;
  const cards = stato?.hands[seat] ?? [];
  const suoTurno = tocca === seat;

  return (
    <div className={`rounded-2xl border-2 p-3 ${suoTurno ? "border-figb bg-figb/5" : "border-border bg-card"}`}>
      <p className="font-bold text-sm mb-1">
        {etichetta}
        {suoTurno && <span className="ml-2 text-xs font-semibold text-figb">tocca a lui</span>}
      </p>
      {SUITS.map((suit) => {
        const delSeme = cards
          .filter((c) => c.suit === suit)
          .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank));
        if (delSeme.length === 0) return null;
        return (
          <div key={suit} className="flex items-center gap-1.5 flex-wrap mb-1">
            <SuitSymbol suit={suit} size="xs" />
            {delSeme.map((c) => {
              const giocabile = suoTurno && legaliSet.has(chiave(c));
              const prese = perCarta.get(chiave(c));
              // Il costo rispetto alla carta migliore: è il numero che conta,
              // più del totale assoluto.
              const costo = giocabile && migliore !== null && prese !== undefined ? migliore - prese : null;
              return (
                <button
                  key={chiave(c)}
                  disabled={!giocabile}
                  onClick={() => gioca(c)}
                  className={`px-1.5 py-0.5 rounded-md font-mono text-base ${
                    giocabile
                      ? costo === 0 && numeri
                        ? "bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200"
                        : "hover:bg-muted border border-border"
                      : "opacity-60"
                  }`}
                >
                  {c.rank}
                  {numeri && giocabile && costo !== null && (
                    <span
                      className={`ml-1 text-xs font-bold ${
                        costo === 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {costo === 0 ? "=" : `−${costo}`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
