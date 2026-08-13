"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { ReferenceCardsButton } from "@/components/bridge/reference-cards";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { WBF_DEALS, type WbfDeal } from "@/data/wbf-deals";
import {
  analyzeDeal,
  suggestStrain,
  strainChoices,
  buildContract,
  STRAIN_LABEL,
  type Strain,
  type DealAnalysis,
} from "@/lib/minibridge";
import { scoreContract } from "@/lib/scoring";
import {
  parseContract,
  toDisplayPosition,
  toGamePosition,
  getDummy,
  partnershipOf,
  rankValue,
  type Position,
  type Card,
} from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { useMobile } from "@/hooks/use-mobile";
import { useSound } from "@/hooks/use-sound";
import { awardPracticeXp } from "@/lib/xp-utils";
import { useGameResults } from "@/hooks/use-game-results";
import { ArrowLeft, Play, Trophy } from "lucide-react";

type Role = "declare" | "defend";
type Step = "reveal" | "decide" | "play";

const POS_LABEL: Record<Position, string> = {
  north: "Nord", south: "Sud (tu)", east: "Est", west: "Ovest",
};
const DISPLAY_LETTER: Record<Position, string> = { north: "N", south: "S", east: "E", west: "W" };
const SUIT_SYMBOL: Record<string, string> = { spade: "♠", heart: "♥", diamond: "♦", club: "♣" };
const SUIT_COLOR: Record<string, string> = {
  spade: "text-[#1a1a2e]", heart: "text-[#B91C1C]", diamond: "text-[#B91C1C]", club: "text-[#1a1a2e]",
};
const SUIT_ORDER: Card["suit"][] = ["spade", "heart", "diamond", "club"];

interface Prepared {
  deal: WbfDeal;
  analysis: DealAnalysis;
  role: Role;       // determined by the deal: does South's side have the majority?
  declarer: Position; // South when declaring; the AI's higher hand when defending
}

/** The human always sits South. The role follows the deal. */
function prepare(deal: WbfDeal): Prepared {
  const analysis = analyzeDeal(deal.hands);
  // analyzeDeal: declaringSide "ns" means South's side. South is always the human.
  const role: Role = analysis.declaringSide === "ns" ? "declare" : "defend";
  // When the human's side declares, the human (South) declares (keeps them active).
  // When defending, the declarer is the AI's higher hand (analysis.declarer in EW).
  const declarer: Position = role === "declare" ? "south" : analysis.declarer;
  return { deal, analysis, role, declarer };
}

export default function MiniBridgePage() {
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [step, setStep] = useState<Step>("reveal");
  const [chosenContract, setChosenContract] = useState<string | null>(null);
  const [chosenStrain, setChosenStrain] = useState<Strain | null>(null);
  const [round, setRound] = useState(0);

  function newDeal() {
    const deal = WBF_DEALS[Math.floor(Math.random() * WBF_DEALS.length)];
    setPrepared(prepare(deal));
    setChosenContract(null);
    setChosenStrain(null);
    setStep("reveal");
    setRound((r) => r + 1);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la smazzata iniziale usa Math.random: deve essere generata solo sul client dopo il mount (SSR-safe)
    newDeal();

  }, []);

  if (!prepared) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  const { analysis, role, deal } = prepared;

  function startAsDefender() {
    const strain = suggestStrain(analysis.fits);
    setChosenStrain(strain);
    setChosenContract(buildContract(analysis.expectedTricks, strain));
    setStep("play");
  }
  function chooseStrain(strain: Strain) {
    setChosenStrain(strain);
    setChosenContract(buildContract(analysis.expectedTricks, strain));
    setStep("play");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/gioca" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4" /> Gioca
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline">MiniBridge</Badge>
          <ReferenceCardsButton />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "reveal" && (
          <motion.div key={`reveal-${round}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <RevealStep analysis={analysis} southHand={deal.hands.south} onNext={() => setStep("decide")} />
          </motion.div>
        )}
        {step === "decide" && (
          <motion.div key={`decide-${round}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <DecideStep analysis={analysis} role={role} southHand={deal.hands.south} onDeclare={chooseStrain} onDefend={startAsDefender} />
          </motion.div>
        )}
        {step === "play" && chosenContract && chosenStrain && (
          <motion.div key={`play-${round}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PlayStep prepared={prepared} contract={chosenContract} strain={chosenStrain} review={deal.review} onNext={newDeal} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── A static, read-only hand grouped by suit (rows) ────────────────────────

function HandBySuit({ hand }: { hand: Card[] }) {
  return (
    <div className="mx-auto inline-block rounded-xl border border-border bg-card px-4 py-3 text-left">
      {SUIT_ORDER.map((suit) => {
        const cards = hand
          .filter((c) => c.suit === suit)
          .sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
        return (
          <div key={suit} className="flex items-center gap-2 py-0.5">
            <span className={`w-4 text-base ${SUIT_COLOR[suit]}`}>{SUIT_SYMBOL[suit]}</span>
            <span className="font-mono text-base font-semibold tracking-wide">
              {cards.length ? cards.map((c) => c.rank).join(" ") : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: reveal the points (and show your hand) ─────────────────────────

function RevealStep({ analysis, southHand, onNext }: { analysis: DealAnalysis; southHand: Card[]; onNext: () => void }) {
  const seats: Position[] = ["north", "east", "south", "west"];
  return (
    <div className="mx-auto max-w-6xl text-center">
      <h1 className="font-display text-2xl font-bold">Conta i punti</h1>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Ogni giocatore annuncia i suoi punti onori (A=4, K=3, Q=2, J=1).
      </p>

      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">La tua mano</p>
      <HandBySuit hand={southHand} />

      <div className="mt-5 grid grid-cols-2 gap-3">
        {seats.map((pos, i) => (
          <motion.div
            key={pos}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.2 }}
            className={`rounded-xl border p-3 ${pos === "south" ? "border-primary bg-primary/5" : "border-border bg-card"}`}
          >
            <p className="text-xs text-muted-foreground">{POS_LABEL[pos]}</p>
            <p className="font-display text-3xl font-bold">{analysis.hcp[pos]}</p>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        <Button className="mt-6" onClick={onNext}>Continua →</Button>
      </motion.div>
    </div>
  );
}

// ─── Step 2: who declares + (if declaring) choose the contract ──────────────

function DecideStep({
  analysis, role, southHand, onDeclare, onDefend,
}: {
  analysis: DealAnalysis; role: Role; southHand: Card[];
  onDeclare: (s: Strain) => void; onDefend: () => void;
}) {
  const youDeclare = role === "declare";
  const yourHcp = analysis.partnershipHcp.ns; // human is always South (N/S)
  const oppHcp = analysis.partnershipHcp.ew;
  const suggested = suggestStrain(analysis.fits);
  const choices = strainChoices(analysis.fits);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">La tua coppia (Nord-Sud) ha</p>
        <p className="font-display text-4xl font-bold text-primary">{yourHcp} punti</p>
        <p className="mt-1 text-sm text-muted-foreground">avversari (Est-Ovest): {oppHcp}</p>
        <p className="mt-3 font-semibold">
          {youDeclare
            ? "La tua coppia ha la maggioranza: giochi tu il contratto! 🎯"
            : "Gli avversari hanno la maggioranza: tu difendi! 🛡️"}
        </p>
      </div>

      {youDeclare ? (
        <div className="mt-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">La Decision Table dice che potete puntare a</p>
            <p className="font-display text-3xl font-bold">{analysis.expectedTricks} prese</p>
          </div>
          {analysis.fits.length > 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Fit (8+ carte): {analysis.fits.map((f) => `${STRAIN_LABEL[f.suit]} (${f.count})`).join(", ")}
            </p>
          )}
          <p className="mt-4 mb-2 text-sm font-medium">Scegli il contratto:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {choices.map((strain) => {
              const contract = buildContract(analysis.expectedTricks, strain);
              const isSuggested = strain === suggested;
              return (
                <button
                  key={strain}
                  onClick={() => onDeclare(strain)}
                  className={`rounded-lg border p-3 text-center transition-colors ${
                    isSuggested ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <p className="font-display text-xl font-bold">{contract}</p>
                  <p className="text-[12px] text-muted-foreground">{STRAIN_LABEL[strain]}</p>
                  {isSuggested && <p className="mt-0.5 text-[12px] font-semibold text-primary">consigliato</p>}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-5 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Gli avversari giocheranno{" "}
            <span className="font-semibold text-foreground">{buildContract(analysis.expectedTricks, suggested)}</span>.
            Il tuo obiettivo: farli cadere!
          </p>
          <div className="mb-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">La tua mano</p>
            <HandBySuit hand={southHand} />
          </div>
          <Button onClick={onDefend}><Play className="mr-2 h-4 w-4" /> Inizia a difendere</Button>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: play the hand (declarer or defender) ───────────────────────────

function PlayStep({
  prepared, contract, strain, review, onNext,
}: {
  prepared: Prepared; contract: string; strain: Strain; review: string; onNext: () => void;
}) {
  const { deal, declarer } = prepared;
  const anchor: Position = "south"; // human is always South -> bottom of the table
  const dummy = getDummy(declarer);
  const isDeclarer = declarer === "south";
  const isMobile = useMobile();
  const { play } = useSound();
  const { saveGameResult } = useGameResults();
  const saved = useRef(false);
  const [showReview, setShowReview] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const playerPositions = isDeclarer ? [declarer, dummy] : [anchor];

  const game = useBridgeGame({
    hands: deal.hands, contract, declarer, playerPositions, vulnerability: "none",
  });

  const contractLevel = parseContract(contract).level;

  // Has the opening lead been played yet? (dummy stays hidden until then)
  const leadDone =
    !!game.gameState && (game.gameState.tricks.length > 0 || game.gameState.currentTrick.length > 0);

  const gameAt = (slot: Position) => toGamePosition(slot, anchor);
  const faceDownFor = (slot: Position) => {
    const gp = gameAt(slot);
    if (gp === anchor) return false;       // your own hand: always visible
    if (gp === dummy) return !leadDone;     // dummy: only after the opening lead
    return true;                            // hidden opponents
  };
  const displayHandFor = (slot: Position): CardData[] =>
    (game.gameState?.hands[gameAt(slot)] ?? deal.hands[gameAt(slot)]) as CardData[];

  const handlePlayCard = (displayPosition: string, cardIndex: number) => {
    if (!game.gameState) return;
    const gp = toGamePosition(displayPosition as Position, anchor);
    const hand = game.gameState.hands[gp];
    if (!hand || cardIndex >= hand.length) return;
    game.handleCardPlay(hand[cardIndex]);
  };

  const mapTrick = (plays: { position: string; card: CardData }[]) =>
    plays.map((tp) => ({ position: toDisplayPosition(tp.position as Position, anchor) as string, card: tp.card }));

  // Show the just-completed trick (all 4 cards) during the brief trick-complete pause.
  const currentTrickMapped =
    game.gameState?.currentTrick.map((tp) => ({ position: tp.position as string, card: tp.card as CardData })) ?? [];
  const displayTrick =
    game.phase === "trick-complete" && game.lastTrick
      ? mapTrick(game.lastTrick.map((tp) => ({ position: tp.position, card: tp.card as CardData })))
      : mapTrick(currentTrickMapped);

  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? (toDisplayPosition(game.gameState.currentPlayer, anchor) as string)
      : undefined;

  useEffect(() => {
    if (game.phase === "finished" && game.result && !saved.current) {
      saved.current = true;
      const res = game.result;
      const declarerMade = res.result >= 0;
      const humanWon = isDeclarer ? declarerMade : !declarerMade;
      play(humanWon ? "contractMade" : "contractFailed");

      const sc = scoreContract({ level: contractLevel, strain, tricksMade: res.tricksMade });
      const xp = 30 + (humanWon ? 25 : 0) + (isDeclarer ? Math.max(0, res.result) * 8 : 0);
      // Repeatable practice XP: paid every game, capped per day (anti-grind).
      const awarded = awardPracticeXp("minibridge", xp, 250);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reazione a evento asincrono di fine partita (con guard anti-doppio): non derivabile durante il render
      setXpEarned(awarded);
      try { localStorage.setItem("bq_minibridge_played", "1"); } catch {}

      saveGameResult({
        gameType: "smazzata",
        score: xp,
        details: {
          mode: "minibridge", role: isDeclarer ? "declarer" : "defender", contract,
          tricks: res.tricksMade, tricksNeeded: res.tricksNeeded, result: res.result,
          points: sc.score, humanWon, dealId: deal.id,
        },
      });
    }
  }, [game.phase, game.result, isDeclarer, contractLevel, strain, contract, deal.id, play, saveGameResult]);

  const declarerSide = partnershipOf(declarer);
  const declTricks = game.gameState?.trickCount[declarerSide] ?? 0;
  const defTricks = game.gameState?.trickCount[declarerSide === "ns" ? "ew" : "ns"] ?? 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-5 rounded-xl border border-border bg-card px-4 py-2 text-sm">
        <div className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Contratto</p>
          <p className="text-lg font-bold text-primary">{contract}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Ruolo</p>
          <p className="text-lg font-bold">{isDeclarer ? "Dichiarante" : "Difesa"}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Prese D/Dif</p>
          <p className="text-lg font-bold">{declTricks} / {defTricks}</p>
        </div>
      </div>

      <BridgeTable
        north={displayHandFor("north")}
        south={displayHandFor("south")}
        east={displayHandFor("east")}
        west={displayHandFor("west")}
        northFaceDown={faceDownFor("north")}
        southFaceDown={faceDownFor("south")}
        eastFaceDown={faceDownFor("east")}
        westFaceDown={faceDownFor("west")}
        currentTrick={displayTrick}
        contract={contract}
        declarer={DISPLAY_LETTER[toDisplayPosition(declarer, anchor)]}
        dummy={DISPLAY_LETTER[toDisplayPosition(dummy, anchor)]}
        vulnerability="none"
        trickCount={{ ns: declarerSide === "ns" ? declTricks : defTricks, ew: declarerSide === "ns" ? defTricks : declTricks }}
        onPlayCard={handlePlayCard}
        highlightedCards={game.validCards as CardData[]}
        activePosition={activeDisplayPos}
        disabled={!game.isPlayerTurn}
        compact={isMobile}
        trumpSuit={game.gameState?.trumpSuit ?? parseContract(contract).trumpSuit}
      />

      <p className="mt-3 text-center text-sm font-semibold text-muted-foreground">{game.message}</p>

      <div className="mt-4 flex justify-center gap-3">
        {game.phase === "ready" && (
          <Button onClick={game.startGame} className="h-12 px-8 font-bold">
            <Play className="mr-2 h-4 w-4" /> {isDeclarer ? "Gioca il contratto" : "Inizia la difesa"}
          </Button>
        )}
      </div>

      {game.phase === "finished" && game.result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-6 max-w-lg">
          <ResultCard
            result={game.result}
            isDeclarer={isDeclarer}
            contract={contract}
            score={scoreContract({ level: contractLevel, strain, tricksMade: game.result.tricksMade })}
            xpEarned={xpEarned}
          />
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowReview((s) => !s)}
              className="mb-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/70"
            >
              {showReview ? "Nascondi spiegazione" : "📘 Spiegazione della mano"}
            </button>
            {showReview && review && (
              <div className="rounded-2xl border border-border bg-card p-5 text-left">
                <p className="text-sm leading-relaxed text-muted-foreground">{review}</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={onNext} className="h-12 px-8 font-bold">Nuova mano →</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ResultCard({
  result, isDeclarer, contract, score, xpEarned,
}: {
  result: { result: number; tricksMade: number; tricksNeeded: number };
  isDeclarer: boolean; contract: string;
  score: { score: number; made: boolean; diff: number };
  xpEarned: number;
}) {
  const declarerMade = result.result >= 0;
  const humanWon = isDeclarer ? declarerMade : !declarerMade;
  const pointsForHuman = isDeclarer ? score.score : Math.abs(Math.min(0, score.score));

  return (
    <div className={`rounded-2xl border p-6 text-center ${
      humanWon
        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
        : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
    }`}>
      <div className="mb-2 flex justify-center">
        <Trophy className={`h-9 w-9 ${humanWon ? "text-emerald-500" : "text-red-400"}`} />
      </div>
      <h3 className={`font-display text-xl font-bold ${humanWon ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
        {isDeclarer
          ? declarerMade
            ? result.result === 0 ? `${contract} mantenuto!` : `${contract} +${result.result}!`
            : `${contract} caduto di ${Math.abs(result.result)}`
          : declarerMade
            ? `Gli avversari hanno mantenuto ${contract}`
            : `Difesa riuscita! ${contract} battuto di ${Math.abs(result.result)} 🎉`}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Prese del dichiarante: {result.tricksMade} / {result.tricksNeeded}
      </p>
      <div className="mt-3 flex items-center justify-center gap-3">
        {humanWon && pointsForHuman > 0 && (
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">{pointsForHuman} punti</span>
        )}
        {xpEarned > 0 && (
          <span className="rounded-full bg-[#c8a44e]/15 px-3 py-1 text-sm font-bold text-[#9a7b2e] dark:text-[#c8a44e]">
            +{xpEarned} XP
          </span>
        )}
      </div>
    </div>
  );
}
