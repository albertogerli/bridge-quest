"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BenStatus } from "@/components/bridge/ben-status";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { GameActions } from "@/components/bridge/game-actions";
import type { CardData } from "@/components/bridge/playing-card";
import type { ProfileConfig } from "@/hooks/use-profile";
import type { GameResult } from "@/hooks/use-game-results";
import { parseContract, partnershipOf, toGamePosition } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import { useDailyPlay } from "../_use-daily-play";
import { DailyGameResult } from "./daily-game-result";
import { useT } from "@/contexts/traduzioni-provider";

// Overlay del tutorial: compare solo a partita avviata e resta chiuso finché
// l'utente non lo apre → fuori dal first load della pagina di gioco.
const GameTutorial = dynamic(
  () => import("@/components/bridge/game-tutorial").then((m) => m.GameTutorial),
  { ssr: false },
);

/** Playing View — tavolo di gioco della mano del giorno (o di ieri). */
export function PlayingView({
  smazzata,
  isDaily,
  alreadyPlayed,
  onFinish,
  onBack,
  isMobile,
  profile,
  saveGameResult,
}: {
  smazzata: Smazzata;
  isDaily: boolean;
  alreadyPlayed: boolean;
  onFinish: (tricks: number, result: number, made: boolean) => void;
  onBack: () => void;
  isMobile: boolean;
  profile: ProfileConfig;
  saveGameResult: (result: GameResult) => void;
}) {
  const t = useT();
  const {
    game,
    tricksNeeded,
    declarer,
    hands,
    displayTrick,
    activeDisplayPos,
    showCelebration,
    handlePlayCard,
    replay,
  } = useDailyPlay({ smazzata, isDaily, onFinish, saveGameResult });

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
                <Badge className="bg-amber-50 text-amber-700 text-[12px] font-bold border-0 shrink-0">
                  {isDaily ? "Mano del Giorno" : "Mano di Ieri"}
                </Badge>
                <BenStatus available={game.benAvailable} aiLevel={game.aiLevel} />
              </div>
              <h1
                className={`${isMobile ? "text-sm" : "text-lg"} font-bold text-foreground truncate`}
              >
                {smazzata.title}
              </h1>
            </div>
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
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                {t("Contratto")}
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-bold text-emerald-dark`}
              >
                {smazzata.contract}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                {t("Obiettivo")}
              </p>
              <p
                className={`${isMobile ? "text-base" : "text-lg"} font-bold text-foreground`}
              >
                {tricksNeeded} prese
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                {t("Dich. / Dif.")}
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

        {/* Daily bonus badge (before play) */}
        {isDaily && !alreadyPlayed && game.phase === "ready" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-3 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full px-4 py-1.5">
              <span className="text-xs font-bold text-amber-700">
                +50 {profile.xpLabel} Bonus Giornaliero
              </span>
            </div>
          </motion.div>
        )}

        {/* Start button on mobile */}
        {isMobile && game.phase === "ready" && (
          <div className="mb-3 flex justify-center">
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-11 px-8 shadow-lg shadow-emerald/25"
            >
              {t("Inizia a giocare")}
            </Button>
          </div>
        )}

        {/* Bridge Table + Bidding Panel */}
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

          {/* Bidding Panel */}
          {smazzata.bidding && (!isMobile || game.phase === "ready") && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full lg:w-48 shrink-0"
            >
              <BiddingPanel bidding={smazzata.bidding} inBasso={declarer} />
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

        {/* In-game actions: claim */}
        {(game.phase === "playing" || game.phase === "trick-complete") && (
          <GameActions
            canClaim={game.canClaim}
            claimStatus={game.claimStatus}
            onClaim={game.requestClaim}
            canUndo={game.canUndo}
            onUndo={game.undoLastPlay}
          />
        )}

        {/* Actions */}
        <div className="mt-4 flex justify-center gap-3">
          {game.phase === "ready" && !isMobile && (
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-8 shadow-lg shadow-emerald/25"
            >
              {t("Inizia a giocare")}
            </Button>
          )}
          {game.phase === "finished" && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onBack}
                className="rounded-xl h-12 px-6 font-bold"
              >
                {t("Torna alla Mano del Giorno")}
              </Button>
              <Button
                onClick={replay}
                className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-6 shadow-lg shadow-emerald/25"
              >
                {t("Rigioca")}
              </Button>
            </div>
          )}
        </div>

        {/* Post-game result card */}
        <AnimatePresence>
          {game.phase === "finished" && game.result && (
            <DailyGameResult
              smazzata={smazzata}
              result={game.result}
              isDaily={isDaily}
              alreadyPlayed={alreadyPlayed}
              showCelebration={showCelebration}
              xpLabel={profile.xpLabel}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
