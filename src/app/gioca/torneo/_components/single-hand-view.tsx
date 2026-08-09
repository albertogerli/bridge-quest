"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BenStatus } from "@/components/bridge/ben-status";
import type { CardData } from "@/components/bridge/playing-card";
import { parseContract, partnershipOf, toGamePosition } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import { useTournamentHand } from "../_use-tournament-hand";
import type { HandResult } from "../_types";
// Overlay del tutorial: compare solo a partita avviata e resta chiuso finché
// l'utente non lo apre → fuori dal first load della pagina di gioco.
const GameTutorial = dynamic(
  () => import("@/components/bridge/game-tutorial").then((m) => m.GameTutorial),
  { ssr: false },
);

/** Una singola mano del torneo: tavolo di bridge, contratto e esito. */
export function SingleHandView({
  smazzata,
  handNumber,
  totalHands,
  handResults,
  onFinish,
  onBack,
  isMobile,
}: {
  smazzata: Smazzata;
  handNumber: number;
  totalHands: number;
  handResults: HandResult[];
  onFinish: (tricksMade: number, result: number) => void;
  onBack: () => void;
  isMobile: boolean;
}) {
  const {
    game,
    tricksNeeded,
    declarer,
    hands,
    displayTrick,
    activeDisplayPos,
    handlePlayCard,
  } = useTournamentHand({ smazzata, onFinish });

  return (
    <div className={`pt-4 ${isMobile ? "px-2" : "px-4"}`}>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-50 text-indigo-700 text-[10px] font-bold border-0 shrink-0">
                  Torneo · Mano {handNumber}/{totalHands}
                </Badge>
                <BenStatus available={game.benAvailable} />
              </div>
              <h1
                className={`${isMobile ? "text-sm" : "text-lg"} font-bold text-foreground truncate`}
              >
                {smazzata.title}
              </h1>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-1 ml-10">
            {Array.from({ length: totalHands }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 max-w-8 rounded-full ${
                  i < handNumber - 1
                    ? handResults[i]?.result >= 0
                      ? "bg-emerald-400"
                      : "bg-red-400"
                    : i === handNumber - 1
                      ? "bg-indigo-500"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Contract bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-3 flex items-center justify-center"
        >
          <div
            className={`card-elevated rounded-xl bg-card flex items-center text-sm ${isMobile ? "px-3 py-1.5 gap-3" : "px-4 py-2 gap-5"}`}
          >
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Contratto
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-bold text-emerald-dark`}
              >
                {smazzata.contract}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Obiettivo
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-bold text-foreground`}
              >
                {tricksNeeded} prese
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Dich. / Dif.
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-bold text-foreground`}
              >
                {partnershipOf(declarer) === "ew"
                  ? `${game.gameState?.trickCount.ew ?? 0} / ${game.gameState?.trickCount.ns ?? 0}`
                  : `${game.gameState?.trickCount.ns ?? 0} / ${game.gameState?.trickCount.ew ?? 0}`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Start button on mobile */}
        {isMobile && game.phase === "ready" && (
          <div className="mb-3 flex justify-center">
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold h-11 px-8 shadow-lg shadow-indigo-600/25"
            >
              Inizia Mano #{handNumber}
            </Button>
          </div>
        )}

        {/* Bridge Table + Bidding */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-start items-stretch justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 w-full max-w-3xl relative"
          >
            {hands ? (
              <BridgeTable
                north={hands.north}
                south={hands.south}
                east={hands.east}
                west={hands.west}
                northFaceDown={false}
                southFaceDown={false}
                eastFaceDown={true}
                westFaceDown={true}
                currentTrick={displayTrick}
                contract={smazzata.contract}
                declarer="S"
                vulnerability={smazzata.vulnerability}
                trickCount={partnershipOf(declarer) === "ew" ? { ns: game.gameState!.trickCount.ew, ew: game.gameState!.trickCount.ns } : game.gameState!.trickCount}
                onPlayCard={handlePlayCard}
                highlightedCards={game.validCards as CardData[]}
                activePosition={activeDisplayPos}
                disabled={!game.isPlayerTurn}
                compact={isMobile}
                trumpSuit={game.gameState?.trumpSuit}
              />
            ) : (
              <BridgeTable
                north={
                  smazzata.hands[
                    toGamePosition("north", declarer)
                  ] as CardData[]
                }
                south={
                  smazzata.hands[
                    toGamePosition("south", declarer)
                  ] as CardData[]
                }
                east={
                  smazzata.hands[
                    toGamePosition("east", declarer)
                  ] as CardData[]
                }
                west={
                  smazzata.hands[
                    toGamePosition("west", declarer)
                  ] as CardData[]
                }
                northFaceDown={false}
                southFaceDown={false}
                eastFaceDown={true}
                westFaceDown={true}
                contract={smazzata.contract}
                declarer="S"
                vulnerability={smazzata.vulnerability}
                trickCount={{ ns: 0, ew: 0 }}
                disabled={true}
                compact={isMobile}
                trumpSuit={parseContract(smazzata.contract).trumpSuit}
              />
            )}
            {game.phase === "playing" && <GameTutorial />}
          </motion.div>

          {smazzata.bidding && (!isMobile || game.phase === "ready") && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full lg:w-48 shrink-0"
            >
              <BiddingPanel bidding={smazzata.bidding} declarer={declarer} />
            </motion.div>
          )}
        </div>

        {/* Message */}
        <div
          className={`mt-3 text-center ${isMobile ? "sticky bottom-16 z-20 bg-card/90 backdrop-blur-sm rounded-xl py-2 mx-auto max-w-xs shadow-sm" : ""}`}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={game.message}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`text-sm font-semibold ${
                game.phase === "finished"
                  ? game.result && game.result.result >= 0
                    ? "text-emerald"
                    : "text-red-500"
                  : game.isPlayerTurn
                    ? "text-amber-600"
                    : "text-muted-foreground"
              }`}
            >
              {game.message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-center gap-3">
          {game.phase === "ready" && !isMobile && (
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold h-12 px-8 shadow-lg shadow-indigo-600/25"
            >
              Inizia Mano #{handNumber}
            </Button>
          )}
        </div>

        {/* Inline result after hand finishes (auto-advances via parent) */}
        <AnimatePresence>
          {game.phase === "finished" && game.result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 mx-auto max-w-6xl"
            >
              <div
                className={`card-elevated rounded-2xl p-5 text-center ${
                  game.result.result >= 0
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:border-emerald-900"
                    : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 dark:from-red-950/40 dark:to-red-900/20 dark:border-red-900"
                }`}
              >
                <h3
                  className={`text-xl font-bold ${
                    game.result.result >= 0
                      ? "text-emerald-dark dark:text-emerald-300"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {game.result.result > 0
                    ? `Fatto +${game.result.result}!`
                    : game.result.result === 0
                      ? "Contratto Mantenuto!"
                      : `Caduto di ${Math.abs(game.result.result)}`}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Prese: {game.result.tricksMade} / {game.result.tricksNeeded}
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  {handNumber < totalHands
                    ? "Passaggio alla prossima mano..."
                    : "Calcolo risultati finali..."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
