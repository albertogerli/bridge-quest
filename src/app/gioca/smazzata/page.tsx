"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import {
  allSmazzate,
  getSmazzateByLesson,
  lessonTitles,
  type Smazzata,
} from "@/data/all-smazzate";
import { updateLastActivity } from "@/hooks/use-notifications";
import { awardGameXp } from "@/lib/xp-utils";
import type { Card, Position } from "@/lib/bridge-engine";
import { parseContract, toDisplayPosition, toGamePosition, cardToString } from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BenStatus } from "@/components/bridge/ben-status";
import { GameTutorial } from "@/components/bridge/game-tutorial";
import { HandReplay } from "@/components/bridge/hand-replay";
import { ShareResult } from "@/components/bridge/share-result";
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { useDDS, type DDSAnalysis } from "@/hooks/use-dds";
import { addGameRecordDirect } from "@/hooks/use-game-history";
import Link from "next/link";

export default function SmazzataBrowserPage() {
  return (
    <Suspense fallback={<div className="pt-10 text-center text-gray-400 text-sm">Caricamento...</div>}>
      <SmazzataBrowserContent />
    </Suspense>
  );
}

function SmazzataBrowserContent() {
  const profile = useProfile();
  const searchParams = useSearchParams();
  const lessonParam = searchParams.get("lesson");
  const randomParam = searchParams.get("random");
  const [selectedLesson, setSelectedLesson] = useState<number>(
    lessonParam ? parseInt(lessonParam) : 1
  );
  const [selectedSmazzata, setSelectedSmazzata] = useState<Smazzata | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Update when URL param changes
  useEffect(() => {
    if (lessonParam) setSelectedLesson(parseInt(lessonParam));
  }, [lessonParam]);

  // Auto-play random smazzata
  useEffect(() => {
    if (randomParam) {
      const idx = parseInt(randomParam);
      if (idx >= 0 && idx < allSmazzate.length) {
        const hand = allSmazzate[idx];
        setSelectedLesson(hand.lesson);
        setSelectedSmazzata(hand);
        setIsPlaying(true);
      }
    }
  }, [randomParam]);

  const lessonSmazzate = getSmazzateByLesson(selectedLesson);
  const lessons = Object.entries(lessonTitles).map(([id, title]) => ({
    id: parseInt(id),
    title,
    count: getSmazzateByLesson(parseInt(id)).length,
  }));

  if (isPlaying && selectedSmazzata) {
    return (
      <PlayingView
        smazzata={selectedSmazzata}
        onBack={() => setIsPlaying(false)}
      />
    );
  }

  return (
    <div className="pt-6 px-4 sm:px-5">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <Link href="/gioca" className="hover:text-emerald transition-colors">
              Gioca
            </Link>
            <span>/</span>
            <span className="text-emerald font-semibold">Smazzate</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Smazzate del Corso
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            96 mani pratiche dalle lezioni FIGB
          </p>
        </motion.div>

        {/* Lesson tabs - horizontal scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-5 -mx-5 px-5"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setSelectedLesson(lesson.id);
                  setSelectedSmazzata(null);
                }}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  selectedLesson === lesson.id
                    ? "bg-emerald text-white shadow-md shadow-emerald/25"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                Lez. {lesson.id}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Lesson title */}
        <motion.div
          key={selectedLesson}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4"
        >
          <h2 className="text-lg font-bold text-gray-900">
            Lezione {selectedLesson}
          </h2>
          <p className="text-sm text-gray-500">
            {lessonTitles[selectedLesson]} · {lessonSmazzate.length} mani
          </p>
        </motion.div>

        {/* Smazzate grid */}
        <div className="grid grid-cols-2 gap-3">
          {lessonSmazzate.map((smazzata, idx) => {
            const { tricksNeeded } = parseContract(smazzata.contract);
            const isSelected = selectedSmazzata?.id === smazzata.id;

            return (
              <motion.div
                key={smazzata.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  onClick={() => setSelectedSmazzata(smazzata)}
                  className={`w-full text-left card-elevated rounded-2xl bg-white p-4 transition-all ${
                    isSelected
                      ? "ring-2 ring-emerald shadow-lg"
                      : "hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold"
                    >
                      Board {smazzata.board}
                    </Badge>
                    <span className="text-lg font-bold text-emerald-dark">
                      {smazzata.contract}
                    </span>
                  </div>
                  <p className="text-[12px] font-semibold text-gray-700 leading-tight mt-1 mb-1 line-clamp-2">
                    {smazzata.title}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Dich: {smazzata.declarer === "north" ? "N" : smazzata.declarer === "south" ? "S" : smazzata.declarer === "east" ? "E" : "O"}
                    {" · "}
                    {tricksNeeded} prese
                  </p>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Selected smazzata detail */}
        <AnimatePresence>
          {selectedSmazzata && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-5 card-elevated rounded-2xl bg-white p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">
                    Smazzata {selectedSmazzata.id}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedSmazzata.title}
                  </p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 text-xs font-bold border-0">
                  {selectedSmazzata.contract}
                </Badge>
              </div>

              {selectedSmazzata.commentary && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald to-emerald-dark text-white font-bold text-[10px]">
                      M
                    </div>
                    <p className="text-[12px] text-amber-800 leading-relaxed">
                      {selectedSmazzata.commentary}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setIsPlaying(true)}
                className="w-full rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 shadow-lg shadow-emerald/25"
              >
                Gioca questa mano
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ===== Playing View Component =====
function PlayingView({
  smazzata,
  onBack,
}: {
  smazzata: Smazzata;
  onBack: () => void;
}) {
  const { tricksNeeded } = parseContract(smazzata.contract);
  const declarer = smazzata.declarer;
  const [xpSaved, setXpSaved] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [ddsResult, setDdsResult] = useState<DDSAnalysis | null>(null);
  const [ddsLoading, setDdsLoading] = useState(false);
  const isMobile = useMobile();
  const profile = useProfile();
  const dds = useDDS();

  // Player controls declarer + dummy (dummy = north display position)
  const dummyGamePos = toGamePosition("north", declarer);

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

  // Map trick plays to display positions
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

  // Map hands to display positions
  const displayHands = (gs: typeof game.gameState) => {
    if (!gs) return null;
    return {
      north: gs.hands[toGamePosition("north", declarer)] as CardData[],
      south: gs.hands[toGamePosition("south", declarer)] as CardData[],
      east: gs.hands[toGamePosition("east", declarer)] as CardData[],
      west: gs.hands[toGamePosition("west", declarer)] as CardData[],
    };
  };

  // Save XP, track hands played, and record game history when game finishes
  useEffect(() => {
    if (game.phase === "finished" && game.result && !xpSaved) {
      setXpSaved(true);
      const earned = 30 + (game.result.result >= 0 ? 20 : 0) + Math.max(0, game.result.result) * 10;
      // Only award XP on first completion of this hand
      const gameId = `smazzata-${smazzata.id}`;
      awardGameXp(gameId, earned);
      try { updateLastActivity(); } catch {}

      // Record game in history for advanced stats
      try {
        addGameRecordDirect({
          date: new Date().toISOString(),
          contract: smazzata.contract,
          declarer: smazzata.declarer,
          tricksMade: game.result.tricksMade,
          tricksNeeded: game.result.tricksNeeded,
          result: game.result.result,
          course: `Lezione ${smazzata.lesson}`,
          lessonId: String(smazzata.lesson),
        });
      } catch {}
    }
  }, [game.phase, game.result, xpSaved, smazzata]);

  // Run DDS analysis when game finishes
  useEffect(() => {
    if (game.phase === "finished" && !ddsResult && !ddsLoading) {
      setDdsLoading(true);
      dds.analyzeHand(
        smazzata.hands,
        smazzata.contract,
        smazzata.declarer,
        smazzata.openingLead,
      ).then((result) => {
        setDdsResult(result);
        setDdsLoading(false);
      }).catch(() => {
        setDdsLoading(false);
      });
    }
  }, [game.phase, ddsResult, ddsLoading, dds, smazzata]);

  // Compute DDS-based star rating (1-5 scale)
  const ddTricks = ddsResult?.ddTricks ?? null;
  const ddsStars = (() => {
    if (!game.result) return 0;
    if (ddTricks === null) {
      // Fallback to old logic if DDS not available
      return game.result.result > 0 ? 3 : game.result.result === 0 ? 2 : game.result.result === -1 ? 1 : 0;
    }
    const diff = game.result.tricksMade - ddTricks;
    if (diff >= 0) return 5;       // Matched or exceeded DD
    if (diff === -1) return 4;     // DD - 1
    if (diff === -2) return 3;     // DD - 2
    if (diff === -3) return 2;     // DD - 3
    return 1;                      // Worse
  })();

  const hands = displayHands(game.gameState);
  const activeDisplayPos = game.isPlayerTurn && game.gameState
    ? toDisplayPosition(game.gameState.currentPlayer, declarer)
    : undefined;

  return (
    <div className={`pt-4 ${isMobile ? "px-2" : "px-4"}`}>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
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
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold text-emerald border-emerald/30 bg-emerald-50 shrink-0"
                >
                  Lez. {smazzata.lesson} · Board {smazzata.board}
                </Badge>
                <BenStatus available={game.benAvailable} aiLevel={game.aiLevel} />
              </div>
              <h1 className={`${isMobile ? "text-sm" : "text-lg"} font-bold text-gray-900 truncate`}>
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
          <div className={`card-elevated rounded-xl bg-white flex items-center text-sm ${isMobile ? "px-3 py-1.5 gap-3" : "px-4 py-2 gap-5"}`}>
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Contratto
              </p>
              <p className={`${isMobile ? "text-base" : "text-lg"} font-bold text-emerald-dark`}>
                {smazzata.contract}
              </p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Obiettivo
              </p>
              <p className={`${isMobile ? "text-base" : "text-lg"} font-bold text-gray-900`}>
                {tricksNeeded} prese
              </p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                N-S / E-O
              </p>
              <p className={`${isMobile ? "text-base" : "text-lg"} font-bold text-gray-900`}>
                {game.gameState?.trickCount.ns ?? 0} /{" "}
                {game.gameState?.trickCount.ew ?? 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Start button - shown above table on mobile so it's visible */}
        {isMobile && game.phase === "ready" && (
          <div className="mb-3 flex justify-center">
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-11 px-8 shadow-lg shadow-emerald/25"
            >
              Inizia a giocare
            </Button>
          </div>
        )}

        {/* Bridge Table + Bidding Panel side by side on desktop */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-start items-stretch justify-center">
          {/* Bridge Table - rotated so declarer=South, dummy=North */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 w-full max-w-2xl relative"
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

          {/* Bidding Panel - side on desktop, hidden on mobile during play */}
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
        <div className={`mt-3 text-center ${isMobile ? "sticky bottom-16 z-20 bg-white/90 backdrop-blur-sm rounded-xl py-2 mx-auto max-w-xs shadow-sm" : ""}`}>
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
          {game.phase === "ready" && !isMobile && (
            <Button
              onClick={game.startGame}
              className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-8 shadow-lg shadow-emerald/25"
            >
              Inizia a giocare
            </Button>
          )}
          {game.phase === "finished" && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onBack}
                className="rounded-xl h-12 px-6 font-bold"
              >
                Altra mano
              </Button>
              <Button
                onClick={game.startGame}
                className="rounded-xl bg-emerald hover:bg-emerald-dark text-sm font-bold h-12 px-6 shadow-lg shadow-emerald/25"
              >
                Rigioca
              </Button>
            </div>
          )}
        </div>

        {/* Pagella - Post-hand Analysis */}
        <AnimatePresence>
          {game.phase === "finished" && game.result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 mx-auto max-w-lg space-y-4"
            >
              {/* Main Result Card */}
              <div
                className={`card-elevated rounded-2xl p-6 text-center ${
                  game.result.result >= 0
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                    : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
                }`}
              >
                {/* Star Rating (DDS-based, 1-5) */}
                <div className="flex justify-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.span
                      key={star}
                      initial={{ opacity: 0, scale: 0, rotate: -30 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + star * 0.1, type: "spring", stiffness: 300 }}
                      className={`text-2xl ${star <= ddsStars ? "" : "grayscale opacity-30"}`}
                    >
                      ⭐
                    </motion.span>
                  ))}
                </div>

                <h3
                  className={`text-xl font-bold ${
                    game.result.result >= 0 ? "text-emerald-dark" : "text-red-600"
                  }`}
                >
                  {game.result.result > 0
                    ? `Fatto +${game.result.result}!`
                    : game.result.result === 0
                      ? "Contratto Mantenuto!"
                      : `Caduto di ${Math.abs(game.result.result)}`}
                </h3>

                {/* Tricks breakdown bar */}
                <div className="mt-4 mx-auto max-w-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1.5">
                    <span>Prese fatte</span>
                    <span>{game.result.tricksMade} / {game.result.tricksNeeded} necessarie</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((game.result.tricksMade / 13) * 100, 100)}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`h-full rounded-full ${
                        game.result.result >= 0
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-gradient-to-r from-red-400 to-red-500"
                      }`}
                    />
                  </div>
                  {/* Target line */}
                  <div className="relative h-0">
                    <div
                      className="absolute -top-3 w-0.5 h-3 bg-gray-900/40"
                      style={{ left: `${(game.result.tricksNeeded / 13) * 100}%` }}
                    />
                  </div>
                  {/* DD target line (if available and different from contract) */}
                  {ddTricks !== null && ddTricks !== game.result.tricksNeeded && (
                    <div className="relative h-0">
                      <div
                        className="absolute -top-3 w-0.5 h-3 bg-indigo-500/60"
                        style={{ left: `${(ddTricks / 13) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* DDS Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 rounded-xl bg-indigo-50/80 border border-indigo-200/60 p-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-500 text-white">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-indigo-700">Analisi Double-Dummy</span>
                    {ddsLoading && (
                      <span className="text-[10px] text-indigo-400 animate-pulse">Calcolo...</span>
                    )}
                    {ddsResult && !ddsResult.isExact && (
                      <span className="text-[10px] text-indigo-400">(stima)</span>
                    )}
                  </div>
                  {ddTricks !== null ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-indigo-900">
                        {ddTricks} prese ottimali
                      </p>
                      <p className={`text-xs font-semibold ${
                        game.result.tricksMade >= ddTricks
                          ? "text-emerald-600"
                          : game.result.tricksMade >= ddTricks - 1
                            ? "text-amber-600"
                            : "text-red-500"
                      }`}>
                        {game.result.tricksMade >= ddTricks
                          ? game.result.tricksMade === ddTricks
                            ? `Hai raggiunto il risultato ottimale!`
                            : `Hai superato il risultato ottimale di ${game.result.tricksMade - ddTricks}!`
                          : `Hai fatto ${game.result.tricksMade}/${ddTricks} prese possibili`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-indigo-400">Analisi in corso...</p>
                  )}
                </motion.div>

                {/* Score detail grid */}
                <div className="grid grid-cols-3 gap-2 mt-6">
                  <div className="bg-white/60 rounded-xl p-2.5">
                    <p className="text-lg font-bold text-gray-900">{game.result.tricksMade}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Prese</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-2.5">
                    <p className={`text-lg font-bold ${game.result.result >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {game.result.result >= 0 ? `+${game.result.result}` : game.result.result}
                    </p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Risultato</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-2.5">
                    <p className="text-lg font-bold text-amber-600">
                      +{30 + (game.result.result >= 0 ? 20 : 0) + Math.max(0, game.result.result) * 10}
                    </p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">{profile.xpLabel}</p>
                  </div>
                </div>

                {/* Performance verdict (DDS-aware) */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${
                    ddsStars >= 5
                      ? "bg-emerald-100 text-emerald-700"
                      : ddsStars >= 4
                        ? "bg-blue-100 text-blue-700"
                        : ddsStars >= 3
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                  }`}
                >
                  {ddsStars >= 5
                    ? "Perfetto! Gioco ottimale double-dummy"
                    : ddsStars >= 4
                      ? "Ottimo! Solo 1 presa sotto il risultato ottimale"
                      : ddsStars >= 3
                        ? "Buono! 2 prese sotto il risultato ottimale"
                        : ddsStars >= 2
                          ? "Da migliorare - riprova la mano!"
                          : "Da rivedere - studia la lezione e riprova!"}
                </motion.div>

                {/* Replay button */}
                {game.gameState && game.gameState.tricks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-4"
                  >
                    <Button
                      variant="outline"
                      onClick={() => setShowReplay(true)}
                      className="rounded-xl text-xs font-bold h-9 px-5 border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400"
                    >
                      <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="1,4 1,10 7,10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      Rivedi la mano
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Commentary / Maestro tip */}
              {smazzata.commentary && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="card-elevated rounded-2xl bg-white p-5 border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald to-emerald-dark text-white font-bold text-xs">
                      M
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">Analisi del Maestro</h4>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {smazzata.commentary}
                  </p>
                </motion.div>
              )}

              {/* Key concepts */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="card-elevated rounded-2xl bg-white p-5 border border-gray-100"
              >
                <h4 className="text-sm font-bold text-gray-900 mb-3">Riepilogo mano</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Contratto</span>
                    <span className="font-bold text-gray-900">{smazzata.contract}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Lezione</span>
                    <span className="font-bold text-gray-900">Lez. {smazzata.lesson} - {lessonTitles[smazzata.lesson] || ""}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Vulnerabilita'</span>
                    <span className="font-bold text-gray-900">
                      {smazzata.vulnerability === "none" ? "Nessuna" : smazzata.vulnerability === "ns" ? "N-S" : smazzata.vulnerability === "ew" ? "E-O" : "Tutti"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Attacco</span>
                    <span className="font-bold text-gray-900">{cardToString(smazzata.openingLead)}</span>
                  </div>
                  {ddTricks !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">DD Ottimale</span>
                      <span className="font-bold text-indigo-600">
                        {ddTricks} prese{ddsResult && !ddsResult.isExact ? " (stima)" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Share Result */}
              <ShareResult
                contract={smazzata.contract}
                tricksMade={game.result.tricksMade}
                tricksNeeded={game.result.tricksNeeded}
                result={game.result.result}
                stars={ddsStars}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hand Replay Modal */}
        <AnimatePresence>
          {showReplay && game.gameState && (
            <HandReplay
              gameState={game.gameState}
              onClose={() => setShowReplay(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
