"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { allSmazzate, type Smazzata } from "@/data/all-smazzate";
import type { Position } from "@/lib/bridge-engine";
import { parseContract, toDisplayPosition, toGamePosition } from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BenStatus } from "@/components/bridge/ben-status";
import { GameTutorial } from "@/components/bridge/game-tutorial";
import { ShareResult } from "@/components/bridge/share-result";
import Link from "next/link";
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { updateLastActivity } from "@/hooks/use-notifications";
import { awardGameXp } from "@/lib/xp-utils";

// Deterministic daily hand: hash date string to index
function getDailySmazzata(): Smazzata {
  const today = new Date().toISOString().slice(0, 10); // "2026-02-07"
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % allSmazzate.length;
  return allSmazzate[index];
}

function isDailyChallengeCompleted(): boolean {
  try {
    const today = new Date().toISOString().slice(0, 10);
    return localStorage.getItem("bq_daily_completed") === today;
  } catch {
    return false;
  }
}

function markDailyCompleted() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("bq_daily_completed", today);
  } catch {}
}

export default function SfidaDelGiornoPage() {
  const smazzata = getDailySmazzata();
  const { tricksNeeded } = parseContract(smazzata.contract);
  const declarer = smazzata.declarer;
  const dummyGamePos = toGamePosition("north", declarer);
  const xpSaved = useRef(false);
  const [alreadyCompleted] = useState(() => isDailyChallengeCompleted());
  const isMobile = useMobile();
  const profile = useProfile();

  const game = useBridgeGame({
    hands: smazzata.hands,
    contract: smazzata.contract,
    declarer,
    playerPositions: [declarer, dummyGamePos],
    openingLead: smazzata.openingLead,
    dealer: smazzata.bidding?.dealer,
    vulnerability: smazzata.vulnerability,
    bidding: smazzata.bidding,
  });

  const handlePlayCard = (displayPosition: string, cardIndex: number) => {
    if (!game.gameState) return;
    const gamePos = toGamePosition(displayPosition as Position, declarer);
    const hand = game.gameState.hands[gamePos];
    if (!hand || cardIndex >= hand.length) return;
    game.handleCardPlay(hand[cardIndex]);
  };

  const mapTrickToDisplay = (plays: { position: string; card: CardData }[]) =>
    plays.map((tp) => ({
      position: toDisplayPosition(tp.position as Position, declarer),
      card: tp.card,
    }));

  const trickDisplay =
    game.gameState?.currentTrick.map((tp) => ({
      position: tp.position as string,
      card: tp.card as CardData,
    })) ?? [];

  const displayTrick =
    game.phase === "trick-complete" && game.lastTrick
      ? mapTrickToDisplay(
          game.lastTrick.map((tp) => ({
            position: tp.position,
            card: tp.card as CardData,
          }))
        )
      : mapTrickToDisplay(trickDisplay);

  const displayHands = (gs: typeof game.gameState) => {
    if (!gs) return null;
    return {
      north: gs.hands[toGamePosition("north", declarer)] as CardData[],
      south: gs.hands[toGamePosition("south", declarer)] as CardData[],
      east: gs.hands[toGamePosition("east", declarer)] as CardData[],
      west: gs.hands[toGamePosition("west", declarer)] as CardData[],
    };
  };

  // Save XP when game finishes (40 XP daily bonus + game XP)
  useEffect(() => {
    if (game.phase === "finished" && game.result && !xpSaved.current) {
      xpSaved.current = true;
      const gameXp = 30 + (game.result.result >= 0 ? 20 : 0) + Math.max(0, game.result.result) * 10;
      const dailyBonus = alreadyCompleted ? 0 : 40;
      const totalEarned = gameXp + dailyBonus;
      const today = new Date().toISOString().slice(0, 10);
      awardGameXp(`sfida-${today}`, totalEarned);
      try { updateLastActivity(); } catch {}
      if (!alreadyCompleted) markDailyCompleted();
    }
  }, [game.phase, game.result, alreadyCompleted]);

  const hands = displayHands(game.gameState);
  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? toDisplayPosition(game.gameState.currentPlayer, declarer)
      : undefined;

  return (
    <div className="pt-4 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Link
              href="/gioca"
              className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </Link>
            <Badge className="bg-amber-50 text-amber-700 text-[10px] font-bold border-0">
              Sfida del Giorno
            </Badge>
            <BenStatus available={game.benAvailable} aiLevel={game.aiLevel} />
            {alreadyCompleted && (
              <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-0">
                Completata
              </Badge>
            )}
          </div>
          <h1 className="text-lg font-extrabold text-gray-900">
            {smazzata.title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Lezione {smazzata.lesson} · Board {smazzata.board}
          </p>
        </motion.div>

        {/* Contract bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 flex items-center justify-center"
        >
          <div className="card-elevated rounded-xl bg-white px-4 py-2 flex items-center gap-5 text-sm">
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contratto</p>
              <p className="text-lg font-black text-emerald-dark">{smazzata.contract}</p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Obiettivo</p>
              <p className="text-lg font-black text-gray-900">{tricksNeeded} prese</p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">N-S / E-O</p>
              <p className="text-lg font-black text-gray-900">
                {game.gameState?.trickCount.ns ?? 0} / {game.gameState?.trickCount.ew ?? 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Daily bonus badge */}
        {!alreadyCompleted && game.phase === "ready" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-4 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full px-4 py-1.5">
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold text-amber-700">+40 {profile.xpLabel} Bonus Giornaliero</span>
            </div>
          </motion.div>
        )}

        {/* Bridge Table + Bidding */}
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 max-w-2xl relative"
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
                trickCount={game.gameState!.trickCount}
                onPlayCard={handlePlayCard}
                highlightedCards={game.validCards as CardData[]}
                activePosition={activeDisplayPos}
                disabled={!game.isPlayerTurn}
                compact={isMobile}
                trumpSuit={game.gameState?.trumpSuit}
              />
            ) : (
              <BridgeTable
                north={smazzata.hands[toGamePosition("north", declarer)] as CardData[]}
                south={smazzata.hands[toGamePosition("south", declarer)] as CardData[]}
                east={smazzata.hands[toGamePosition("east", declarer)] as CardData[]}
                west={smazzata.hands[toGamePosition("west", declarer)] as CardData[]}
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
              <BiddingPanel bidding={smazzata.bidding} />
            </motion.div>
          )}
        </div>

        {/* Message */}
        <div className="mt-4 text-center">
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
                    : "text-gray-500"
              }`}
            >
              {game.message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-center gap-3">
          {game.phase === "ready" && (
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-8 shadow-lg shadow-emerald/25"
            >
              Gioca la sfida
            </Button>
          )}
          {game.phase === "finished" && (
            <div className="flex gap-3">
              <Link href="/gioca">
                <Button variant="outline" className="rounded-xl h-12 px-6 font-bold">
                  Torna a Gioca
                </Button>
              </Link>
              <Button
                onClick={() => { xpSaved.current = false; game.startGame(); }}
                className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-6 shadow-lg shadow-emerald/25"
              >
                Rigioca
              </Button>
            </div>
          )}
        </div>

        {/* Result */}
        <AnimatePresence>
          {game.phase === "finished" && game.result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 mx-auto max-w-lg"
            >
              <div
                className={`card-elevated rounded-2xl p-6 text-center ${
                  game.result.result >= 0
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                    : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
                }`}
              >
                <div className="text-4xl mb-3">
                  {game.result.result >= 0 ? "🎉" : "😔"}
                </div>
                <h3
                  className={`text-xl font-extrabold ${
                    game.result.result >= 0 ? "text-emerald-dark" : "text-red-600"
                  }`}
                >
                  {game.result.result >= 0
                    ? game.result.result === 0
                      ? "Sfida Superata!"
                      : `Sfida Superata +${game.result.result}!`
                    : `Caduto di ${Math.abs(game.result.result)}`}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Prese: {game.result.tricksMade} / {game.result.tricksNeeded}
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <div className="inline-flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-2">
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-bold text-amber-700">
                      +{30 + (game.result.result >= 0 ? 20 : 0) + Math.max(0, game.result.result) * 10} {profile.xpLabel}
                    </span>
                  </div>
                  {!alreadyCompleted && (
                    <div className="inline-flex items-center gap-2 bg-orange-50 rounded-xl px-4 py-2">
                      <span className="text-lg">🔥</span>
                      <span className="text-sm font-bold text-orange-700">+40 {profile.xpLabel} Bonus</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Result */}
              <div className="mt-4 mx-auto max-w-lg">
                <ShareResult
                  contract={smazzata.contract}
                  tricksMade={game.result.tricksMade}
                  tricksNeeded={game.result.tricksNeeded}
                  result={game.result.result}
                  stars={game.result.result > 0 ? 3 : game.result.result === 0 ? 2 : game.result.result === -1 ? 1 : 0}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Maestro Fiori tip */}
        {game.phase === "ready" && smazzata.commentary && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 mx-auto max-w-lg"
          >
            <div className="card-elevated rounded-2xl bg-white p-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark text-white font-extrabold text-sm shadow-md shadow-emerald/30">
                  M
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="font-bold text-sm text-gray-900">Maestro Fiori</p>
                    <Badge className="bg-amber-50 text-amber-700 text-[10px] font-bold border-0">
                      Suggerimento
                    </Badge>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    {smazzata.commentary}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
