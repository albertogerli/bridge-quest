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
  cardToString, partnershipOf, suitSymbol, sortHand, toDisplayPosition, toGamePosition,
} from "@/lib/bridge-engine";
import { cardAriaLabel, handAriaLabel, suitAriaLabel } from "@/lib/card-labels";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useT } from "@/contexts/traduzioni-provider";
import { contrattoLeggibile } from "@/lib/contratto-leggibile";

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

/**
 * Il nome del posto VERO. La disposizione resta ruotata (chi gioca in basso),
 * ma i nomi no: il tavolo di gioco mostra i posti veri dal 28/09/2026, e il
 * replay nella stessa pagina non può chiamare «Sud» quello che il tavolo
 * chiama «Est» — né far leggere un commento del maestro sulla mano sbagliata.
 */
function nomeVero(pos: Position): string {
  return POSITION_LABELS[pos];
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
      className={`inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm font-bold leading-none
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
  // Una riga per seme, come in ogni diagramma: prima le carte andavano a capo
  // dove finiva lo spazio, e ♥ e ♦ si mescolavano sulla stessa riga.
  const semi: Suit[] = ["spade", "heart", "diamond", "club"];
  return (
    <div
      className={`space-y-0.5 ${dimmed ? "opacity-40" : ""}`}
      role="img"
      aria-label={handAriaLabel(cards)}
    >
      {semi.map((seme) => {
        const delSeme = cards.filter((c) => c.suit === seme);
        return (
          <div key={seme} aria-hidden="true" className={`flex flex-wrap gap-x-1 text-xs font-bold leading-tight ${SUIT_COLORS[seme]}`}>
            <span className="w-3 shrink-0">{suitSymbol(seme)}</span>
            {delSeme.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              delSeme.map((c) => {
                const isPlayed = playedCard && c.rank === playedCard.rank && c.suit === playedCard.suit;
                return (
                  <span key={c.rank} className={isPlayed ? "underline decoration-2 decoration-amber-400" : ""}>
                    {c.rank}
                  </span>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── la presa al centro del tavolo ───────────────────────────────

/**
 * Le quattro carte della presa, ognuna dal lato di chi l'ha giocata, dentro la
 * croce delle mani.
 *
 * PERCHÉ AL CENTRO. Fino al 20/11/2026 la presa stava in un tavolino sopra e
 * le mani in un secondo schema sotto: sul telefono non entravano insieme, e
 * per seguire la mano carta per carta si scorreva su e giù perdendo il filo
 * (Trevisaoi). Al centro della croce si vede chi ha giocato cosa e cosa gli
 * resta in mano, senza muoversi.
 *
 * Niente lettere dei posti qui: i nomi sono già sulle mani attorno.
 */
function PresaAlCentro({
  trick,
  ancora,
  trumpSuit,
}: {
  trick: Trick;
  ancora: Position;
  trumpSuit: Suit | null;
}) {
  const t = useT();
  const perLato: Partial<Record<Position, TrickPlay>> = {};
  for (const play of trick.plays) perLato[toDisplayPosition(play.position, ancora)] = play;

  function casella(lato: Position, dove: string) {
    const play = perLato[lato];
    return (
      <div className={`flex items-center justify-center ${dove}`}>
        {play && <CardChip card={play.card} highlight={play.position === trick.winner} />}
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-[7.5rem] grid-cols-3 grid-rows-3 rounded-xl bg-emerald-50/60 p-1 dark:bg-emerald-950/20">
      {casella("north", "col-start-2 row-start-1")}
      {casella("west", "col-start-1 row-start-2")}
      <div className="col-start-2 row-start-2 flex items-center justify-center">
        <span
          className="text-xs font-bold text-muted-foreground"
          role="img"
          aria-label={trumpSuit ? `${t("Atout")}: ${suitAriaLabel(trumpSuit)}` : t("Senza atout")}
        >
          <span aria-hidden="true">{trumpSuit ? suitSymbol(trumpSuit) : t("SA")}</span>
        </span>
      </div>
      {casella("east", "col-start-3 row-start-2")}
      {casella("south", "col-start-2 row-start-3")}
    </div>
  );
}

// ── commentary generator ────────────────────────────────────────

function trickCommentary(trick: Trick, t: ReturnType<typeof useT>): string {
  if (!trick.winner) return "";
  const winnerLabel = t(nomeVero(trick.winner));
  const winnerPlay = trick.plays.find((p) => p.position === trick.winner);
  if (!winnerPlay) return t("{posto} vince la presa", { posto: winnerLabel });
  return t("{posto} vince con {carta}", { posto: winnerLabel, carta: cardToString(winnerPlay.card) });
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
              {contrattoLeggibile(gameState.contract)} &middot; {t("Dich.")}{" "}
              {t(nomeVero(gameState.declarer))}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
            aria-label={t("Chiudi")}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Corpo scorrevole: l'intestazione e i pulsanti restano fermi. */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-3 sm:px-5">

        {/* Trick number + score bar */}
        <div className="pb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-7 min-w-[28px] rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2 text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
              {currentTrickIdx + 1}/{totalTricks}
            </span>
            <span className="text-xs font-bold text-muted-foreground">{t("Presa")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-muted-foreground">{t("Dichiarante")}</span>
            <span className="text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 rounded-md px-1.5 py-0.5 tabular-nums">
              {runningScore.dichiarante}
            </span>
            <span className="text-muted-foreground/40">-</span>
            <span className="text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40 rounded-md px-1.5 py-0.5 tabular-nums">
              {runningScore.difesa}
            </span>
            <span className="text-muted-foreground">{t("Difesa")}</span>
          </div>
        </div>

        {/*
         * Il tavolo: le mani come erano PRIMA della presa (la carta giocata è
         * sottolineata) e la presa al centro. Un solo schema, che sul telefono
         * sta tutto nello schermo.
         */}
        <div className="grid grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)] grid-rows-[auto_auto_auto] gap-1.5">
          {(["north", "west", "east", "south"] as Position[]).map((slot) => {
            const pos = toGamePosition(slot, ancora);
            const hand = remainingHand(originalHands[pos], playedBefore);
            const cellClass =
              slot === "north"
                ? "col-start-2 row-start-1"
                : slot === "west"
                  ? "col-start-1 row-start-2 self-center"
                  : slot === "east"
                    ? "col-start-3 row-start-2 self-center"
                    : "col-start-2 row-start-3";
            return (
              <div key={slot} className={`min-w-0 rounded-lg bg-muted px-1.5 py-1.5 sm:px-2 ${cellClass}`}>
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  {t(POSITION_LABELS[pos])}
                </span>
                <MiniHand cards={hand} playedCard={playedInTrick[pos]} />
              </div>
            );
          })}
          <div className="col-start-2 row-start-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTrickIdx}
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <PresaAlCentro trick={trick} ancora={ancora} trumpSuit={gameState.trumpSuit} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Chi ha vinto la presa, sotto il tavolo. */}
        <p className="mt-3 rounded-xl bg-muted px-4 py-2 text-center text-sm font-semibold text-foreground/80" aria-live="polite">
          {trickCommentary(trick, t)}
          <span className="block text-xs font-normal text-muted-foreground">
            {t("Attacco: {posto}", { posto: t(nomeVero(trick.leader)) })}
          </span>
        </p>
        </div>

        {/*
         * I pulsanti FUORI dalla parte che scorre: prima stavano in fondo allo
         * scorrimento e sul telefono bisognava scendere per passare alla presa
         * dopo, e poi risalire per vederla.
         */}
        <div className="shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border px-4 py-3 sm:px-5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentTrickIdx === 0}
            onClick={() => setCurrentTrickIdx((i) => Math.max(0, i - 1))}
            className="rounded-xl text-xs font-bold h-11 px-3 justify-self-start"
          >
            <svg className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            {t("Precedente")}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold h-11 px-3 text-muted-foreground"
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
            className="rounded-xl text-xs font-bold h-11 px-3 justify-self-end"
          >
            {t("Successiva")}
            <svg className="h-3.5 w-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <polyline points="9,6 15,12 9,18" />
            </svg>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
