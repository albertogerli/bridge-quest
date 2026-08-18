"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import type {
  GameState,
  Trick,
  TrickPlay,
  Position,
  Suit,
  Card,
} from "@/lib/bridge-engine";
import {
  cardToString, partnershipOf, suitSymbol, sortHand, toDisplayPosition,
} from "@/lib/bridge-engine";
import { cardAriaLabel, handAriaLabel, suitAriaLabel } from "@/lib/card-labels";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useT } from "@/contexts/traduzioni-provider";

// ── helpers ──────────────────────────────────────────────────────

const SUIT_COLORS: Record<Suit, string> = {
  spade: "text-[#1B2631] dark:text-slate-200",
  heart: "text-[#D32F2F] dark:text-red-400",
  diamond: "text-[#FF6F00] dark:text-orange-400",
  club: "text-[#2E7D32] dark:text-emerald-400",
};

const POSITION_LABELS: Record<Position, string> = {
  north: "Nord",
  south: "Sud",
  east: "Est",
  west: "Ovest",
};

function displayLabel(gamePos: Position, declarer: Position): string {
  const dPos = toDisplayPosition(gamePos, declarer);
  return POSITION_LABELS[dPos];
}

/** Reconstruct all 4 original hands by collecting every card played + cards
 *  still remaining in the finished game state's hands. */
function reconstructOriginalHands(
  state: GameState
): Record<Position, Card[]> {
  const hands: Record<Position, Card[]> = {
    north: [...state.hands.north],
    south: [...state.hands.south],
    east: [...state.hands.east],
    west: [...state.hands.west],
  };

  // Add back every card that was played during the game
  for (const trick of state.tricks) {
    for (const play of trick.plays) {
      hands[play.position].push(play.card);
    }
  }

  // Sort each hand
  return {
    north: sortHand(hands.north),
    south: sortHand(hands.south),
    east: sortHand(hands.east),
    west: sortHand(hands.west),
  };
}

/** Build the set of cards played up to (and including) a given trick index. */
function cardsPlayedUpTo(
  tricks: Trick[],
  trickIndex: number
): Set<string> {
  const s = new Set<string>();
  for (let t = 0; t <= trickIndex && t < tricks.length; t++) {
    for (const play of tricks[t].plays) {
      s.add(`${play.card.rank}-${play.card.suit}`);
    }
  }
  return s;
}

/** Remaining hand for a position after N tricks have been played. */
function remainingHand(
  original: Card[],
  played: Set<string>
): Card[] {
  return original.filter(
    (c) => !played.has(`${c.rank}-${c.suit}`)
  );
}

// ── card chip (inline text card) ────────────────────────────────

function CardChip({
  card,
  highlight = false,
}: {
  card: Card;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-sm font-bold leading-none
        ${highlight ? "bg-amber-100 dark:bg-amber-950/40 ring-1 ring-amber-300" : "bg-muted"}
        ${SUIT_COLORS[card.suit]}`}
      role="img"
      aria-label={
        highlight
          ? `${cardAriaLabel(card)} (vince la presa)`
          : cardAriaLabel(card)
      }
    >
      <span aria-hidden="true">
        {suitSymbol(card.suit)}
        {card.rank}
      </span>
    </span>
  );
}

// ── mini hand display (single position, horizontal) ─────────────

function MiniHand({
  cards,
  playedCard,
  dimmed,
}: {
  cards: Card[];
  playedCard?: Card;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap gap-0.5 ${dimmed ? "opacity-40" : ""}`}
      role="img"
      aria-label={handAriaLabel(cards)}
    >
      {cards.map((c, i) => {
        const isPlayed =
          playedCard &&
          c.rank === playedCard.rank &&
          c.suit === playedCard.suit;
        return (
          <span
            key={`${c.rank}-${c.suit}-${i}`}
            aria-hidden="true"
            className={`text-xs font-bold leading-none
              ${isPlayed ? "underline decoration-2 decoration-amber-400" : ""}
              ${SUIT_COLORS[c.suit]}`}
          >
            {suitSymbol(c.suit)}{c.rank}
          </span>
        );
      })}
    </div>
  );
}

// ── trick table (2x2 compass layout) ────────────────────────────

function TrickTable({
  trick,
  declarer,
  trumpSuit,
}: {
  trick: Trick;
  declarer: Position;
  trumpSuit: Suit | null;
}) {
  const t = useT();
  // Map each play to a display position
  const playByDisplay: Partial<Record<Position, TrickPlay>> = {};
  for (const play of trick.plays) {
    const dp = toDisplayPosition(play.position, declarer);
    playByDisplay[dp] = play;
  }

  const winner = trick.winner;

  // Funzione di render (non componente): evita di creare un tipo di componente nuovo a ogni render
  function renderCell(pos: Position) {
    const play = playByDisplay[pos];
    if (!play) return <div />;
    const isWinner = play.position === winner;
    return (
      <div
        className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-center transition-colors
          ${isWinner ? "bg-emerald-100 dark:bg-emerald-950/40 ring-1 ring-emerald-300" : "bg-card"}`}
      >
        <CardChip card={play.card} highlight={isWinner} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-48 mx-auto">
      {/* Row 1: North */}
      <div />
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[12px] font-bold text-muted-foreground uppercase">
          <span aria-hidden="true">N</span>
          <span className="sr-only">{t("Nord")}</span>
        </span>
        {renderCell("north")}
      </div>
      <div />

      {/* Row 2: West - center - East */}
      <div className="flex flex-col items-center gap-0.5 justify-center">
        <span className="text-[12px] font-bold text-muted-foreground uppercase">
          <span aria-hidden="true">O</span>
          <span className="sr-only">{t("Ovest")}</span>
        </span>
        {renderCell("west")}
      </div>
      <div className="flex items-center justify-center">
        <span
          className="text-[12px] font-bold text-muted-foreground"
          role="img"
          aria-label={trumpSuit ? `Atout: ${suitAriaLabel(trumpSuit)}` : "Senza atout"}
        >
          <span aria-hidden="true">{trumpSuit ? suitSymbol(trumpSuit) : "SA"}</span>
        </span>
      </div>
      <div className="flex flex-col items-center gap-0.5 justify-center">
        <span className="text-[12px] font-bold text-muted-foreground uppercase">
          <span aria-hidden="true">E</span>
          <span className="sr-only">Est</span>
        </span>
        {renderCell("east")}
      </div>

      {/* Row 3: South */}
      <div />
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[12px] font-bold text-muted-foreground uppercase">
          <span aria-hidden="true">S</span>
          <span className="sr-only">Sud</span>
        </span>
        {renderCell("south")}
      </div>
      <div />
    </div>
  );
}

// ── commentary generator ────────────────────────────────────────

function trickCommentary(trick: Trick, declarer: Position): string {
  if (!trick.winner) return "";
  const winnerLabel = displayLabel(trick.winner, declarer);
  const winnerPlay = trick.plays.find((p) => p.position === trick.winner);
  if (!winnerPlay) return `${winnerLabel} vince la presa`;
  return `${winnerLabel} vince con ${cardToString(winnerPlay.card)}`;
}

// ── main component ──────────────────────────────────────────────

export function HandReplay({
  gameState,
  inBasso,
  onClose,
}: {
  gameState: GameState;
  /**
   * Il posto mostrato in basso. Assente = il dichiarante, che è giusto quasi
   * sempre; ma quando si è appena giocato in DIFESA in basso c'era il
   * difensore, e riaprire il replay dall'altro lato del tavolo costringe a
   * ricostruire tutto a mente proprio nel momento del ripasso.
   */
  inBasso?: Position;
  onClose: () => void;
}) {
  const t = useT();
  const ancora = inBasso ?? gameState.declarer;
  const [currentTrickIdx, setCurrentTrickIdx] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, { onEscape: onClose });
  const tricks = gameState.tricks;
  const totalTricks = tricks.length;
  const trick = tricks[currentTrickIdx];

  const originalHands = useMemo(
    () => reconstructOriginalHands(gameState),
    [gameState]
  );

  // Cards played up to previous trick (so current trick cards are still "in hand")
  const playedBefore = useMemo(
    () =>
      currentTrickIdx > 0
        ? cardsPlayedUpTo(tricks, currentTrickIdx - 1)
        : new Set<string>(),
    [tricks, currentTrickIdx]
  );

  /**
   * Le prese fin qui, contate come DICHIARANTE contro DIFESA.
   *
   * Prima erano «N-S» ed «E-O» in coordinate assolute, dentro una finestra in
   * cui tutti i nomi dei posti sono ruotati: col dichiarante a Est, la
   * finestra mostrava Est in basso chiamandolo «Sud» e accanto un punteggio
   * «N-S» che parlava dei veri Nord-Sud, cioè di quelli che nella finestra si
   * chiamano Est-Ovest. Due sistemi di riferimento nello stesso riquadro.
   *
   * Dichiarante e difesa non hanno questo problema: non dipendono da come è
   * girato il tavolo, ed è anche come si ragiona giocando.
   */
  const runningScore = useMemo(() => {
    const score = { dichiarante: 0, difesa: 0 };
    const latoDichiarante = partnershipOf(gameState.declarer);
    for (let t = 0; t <= currentTrickIdx && t < totalTricks; t++) {
      // `winner` è opzionale nel tipo: una presa senza vincitore non esiste in
      // una mano finita, ma contarla come difesa sarebbe una bugia comoda.
      const v = tricks[t].winner;
      if (!v) continue;
      if (partnershipOf(v) === latoDichiarante) score.dichiarante++;
      else score.difesa++;
    }
    return score;
  }, [tricks, currentTrickIdx, totalTricks, gameState.declarer]);

  // Find the card each position played in the current trick
  const playedInTrick = useMemo(() => {
    const map: Partial<Record<Position, Card>> = {};
    if (trick) {
      for (const play of trick.plays) {
        map[play.position] = play.card;
      }
    }
    return map;
  }, [trick]);

  if (!trick) return null;

  const positions: Position[] = ["north", "east", "south", "west"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      /* z-[70]: la barra di navigazione inferiore è z-50 e, essendo
         disegnata dopo nel DOM, con lo stesso livello finirebbe SOPRA il
         riquadro — è quanto accadeva, coprendo la mano di Sud. */
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hand-replay-title"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        /* max-h + colonna flessibile: prima il riquadro cresceva oltre lo
           schermo e `overflow-hidden` tagliava via il fondo — la mano di Sud
           era irraggiungibile perché non c'era nulla da scorrere.
           `dvh` e non `vh`: su mobile la barra del browser compare e sparisce,
           e `vh` resta ancorato all'altezza massima, lasciando il fondo
           nascosto proprio quando la barra è visibile. */
        className="relative w-full max-w-md max-h-[90dvh] flex flex-col rounded-2xl bg-card shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 id="hand-replay-title" className="text-lg font-semibold text-foreground">
              {t("Rivedi la mano")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {gameState.contract} &middot; Dich.{" "}
              {displayLabel(gameState.declarer, ancora)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
            aria-label="Chiudi"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Corpo scorrevole: l'intestazione resta visibile mentre si scorre. */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

        {/* Trick number + score bar */}
        <div className="px-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-7 min-w-[28px] rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {currentTrickIdx + 1}/{totalTricks}
            </span>
            <span className="text-xs font-bold text-muted-foreground">{t("Presa")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-muted-foreground">{t("Dichiarante")}</span>
            <span className="text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 rounded-md px-1.5 py-0.5">
              {runningScore.dichiarante}
            </span>
            <span className="text-muted-foreground/40">-</span>
            <span className="text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40 rounded-md px-1.5 py-0.5">
              {runningScore.difesa}
            </span>
            <span className="text-muted-foreground">{t("Difesa")}</span>
          </div>
        </div>

        {/* Trick compass display */}
        <div className="px-5 py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTrickIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TrickTable
                trick={trick}
                declarer={ancora}
                trumpSuit={gameState.trumpSuit}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Commentary */}
        <div className="px-5 pb-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTrickIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl bg-muted px-4 py-2.5 text-center"
            >
              <p className="text-sm font-semibold text-foreground/80">
                {trickCommentary(trick, ancora)}
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Attacco: {displayLabel(trick.leader, ancora)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hands at this point */}
        <div className="px-5 pb-4">
          <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {t("Carte in mano (prima della presa)")}
          </p>
          {/* Cross layout: Nord top, Ovest/Est sides, Sud bottom — like the table. */}
          <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
            {(["north", "west", "east", "south"] as Position[]).map((slot) => {
              const pos = positions.find(
                (p) => toDisplayPosition(p, ancora) === slot
              )!;
              const hand = remainingHand(originalHands[pos], playedBefore);
              const cellClass =
                slot === "north"
                  ? "col-start-2 row-start-1"
                  : slot === "west"
                    ? "col-start-1 row-start-2"
                    : slot === "east"
                      ? "col-start-3 row-start-2"
                      : "col-start-2 row-start-3";
              return (
                <div key={slot} className={`rounded-lg bg-muted px-2.5 py-1.5 ${cellClass}`}>
                  <span className="text-[12px] font-bold text-muted-foreground uppercase">
                    {POSITION_LABELS[slot]}
                  </span>
                  <MiniHand cards={hand} playedCard={playedInTrick[pos]} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentTrickIdx === 0}
            onClick={() => setCurrentTrickIdx((i) => Math.max(0, i - 1))}
            className="rounded-xl text-xs font-bold h-9 px-4"
          >
            <svg className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            {t("Precedente")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold h-9 px-4 text-muted-foreground"
          >
            {t("Chiudi")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={currentTrickIdx === totalTricks - 1}
            onClick={() =>
              setCurrentTrickIdx((i) => Math.min(totalTricks - 1, i + 1))
            }
            className="rounded-xl text-xs font-bold h-9 px-4"
          >
            {t("Successiva")}
            <svg className="h-3.5 w-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <polyline points="9,6 15,12 9,18" />
            </svg>
          </Button>
        </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
