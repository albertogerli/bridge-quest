"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import type { Position, Card } from "@/lib/bridge-engine";
import { parseContract, toDisplayPosition, toGamePosition, sortHand } from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { BenStatus } from "@/components/bridge/ben-status";
import { PlayingCard } from "@/components/bridge/playing-card";
import Link from "next/link";
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { awardGameXp } from "@/lib/xp-utils";
import { generateSeed, dealFromSeed, encodeChallengeUrl } from "@/lib/hand-encoder";

// ──────────────────────────────────────────────
// localStorage challenge results
// ──────────────────────────────────────────────

interface ChallengeResult {
  myTricks: number;
  myScore: number;
  timestamp: number;
}

type ChallengeResults = Record<string, ChallengeResult>;

function getChallengeResults(): ChallengeResults {
  try {
    const raw = localStorage.getItem("bq_challenge_results");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveChallengeResult(seed: string, tricks: number, score: number) {
  try {
    const results = getChallengeResults();
    results[seed] = {
      myTricks: tricks,
      myScore: score,
      timestamp: Date.now(),
    };
    localStorage.setItem("bq_challenge_results", JSON.stringify(results));
  } catch {}
}

// ──────────────────────────────────────────────
// Main page content
// ──────────────────────────────────────────────

function SfidaLinkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const seedParam = searchParams.get("s");
  const isMobile = useMobile();
  const profile = useProfile();
  const xpSaved = useRef(false);

  // State
  const [mode, setMode] = useState<"create" | "challenge" | "playing-create" | "playing-challenge" | "finished">("create");
  const [seed, setSeed] = useState<string | null>(null);
  const [deal, setDeal] = useState<ReturnType<typeof dealFromSeed> | null>(null);
  const [copied, setCopied] = useState(false);
  const [creatorResult, setCreatorResult] = useState<ChallengeResult | null>(null);

  // Determine mode on mount
  useEffect(() => {
    if (seedParam) {
      // Challenge mode: seed provided in URL
      setSeed(seedParam);
      const generatedDeal = dealFromSeed(seedParam);
      setDeal(generatedDeal);
      setMode("challenge");

      // Check if creator's result exists
      const results = getChallengeResults();
      if (results[seedParam]) {
        setCreatorResult(results[seedParam]);
      }
    } else {
      // Creator mode: generate new seed
      const newSeed = generateSeed();
      setSeed(newSeed);
      const generatedDeal = dealFromSeed(newSeed);
      setDeal(generatedDeal);
      setMode("create");
    }
  }, [seedParam]);

  // Contract: 3NT (simple for challenges)
  const contract = "3NT";
  const declarer: Position = "south";
  const dummyGamePos = toGamePosition("north", declarer);

  // Create hands for game
  const hands = useMemo(() => {
    if (!deal) return null;
    return {
      north: deal.north as Card[],
      east: deal.east as Card[],
      south: deal.south as Card[],
      west: deal.west as Card[],
    };
  }, [deal]);

  // Bridge game hook
  const game = useBridgeGame({
    hands: hands ?? { north: [], east: [], south: [], west: [] },
    contract,
    declarer,
    playerPositions: [declarer, dummyGamePos],
    dealer: deal?.dealer as Position,
    vulnerability: deal?.vulnerability as any,
  });

  // Handle game start
  const handleStartGame = useCallback(() => {
    xpSaved.current = false;
    game.startGame();
    setMode(mode === "create" ? "playing-create" : "playing-challenge");
  }, [game, mode]);

  // Handle game finish
  useEffect(() => {
    if (game.phase === "finished" && game.result && !xpSaved.current && seed) {
      xpSaved.current = true;

      const tricksNeeded = game.result.tricksNeeded;
      const tricksMade = game.result.tricksMade;
      const contractMade = game.result.result >= 0;
      const score = contractMade ? 100 + game.result.result * 30 : -50 * Math.abs(game.result.result);

      // Save result
      saveChallengeResult(seed, tricksMade, score);

      // Award XP
      const gameXp = 30 + (contractMade ? 20 : 0) + Math.max(0, game.result.result) * 10;
      awardGameXp(`sfida-link-${seed}`, gameXp);

      setMode("finished");
    }
  }, [game.phase, game.result, seed]);

  // Copy challenge link
  const handleCopyLink = useCallback(async () => {
    if (!seed) return;
    const link = encodeChallengeUrl(seed);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [seed]);

  // Share via Web Share API
  const handleShare = useCallback(async () => {
    if (!seed) return;
    const link = encodeChallengeUrl(seed);
    const myTricks = game.result?.tricksMade ?? 0;
    const text = `Ti sfido a Bridge! Ho fatto ${myTricks} prese. Riesci a fare meglio?\n${link}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "FIGB Bridge LAB - Sfida via Link",
          text,
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    handleCopyLink();
  }, [seed, game.result, handleCopyLink]);

  // WhatsApp share
  const handleWhatsApp = useCallback(() => {
    if (!seed) return;
    const link = encodeChallengeUrl(seed);
    const myTricks = game.result?.tricksMade ?? 0;
    const text = `Ti sfido a Bridge! Ho fatto ${myTricks} prese. Riesci a fare meglio?`;
    const fullMessage = `${text}\n${link}`;
    const encoded = encodeURIComponent(fullMessage);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }, [seed, game.result]);

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

  const displayedHands = displayHands(game.gameState);
  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? toDisplayPosition(game.gameState.currentPlayer, declarer)
      : undefined;

  // Get current result
  const myResult = seed ? getChallengeResults()[seed] : null;

  // Determine winner for comparison
  let comparisonVerdict = "";
  let comparisonColor = "text-gray-700";
  if (mode === "finished" && creatorResult && myResult) {
    if (myResult.myTricks > creatorResult.myTricks) {
      comparisonVerdict = "Hai vinto la sfida!";
      comparisonColor = "text-emerald-700";
    } else if (myResult.myTricks < creatorResult.myTricks) {
      comparisonVerdict = "Vince lo sfidante!";
      comparisonColor = "text-red-600";
    } else {
      comparisonVerdict = "Pareggio!";
      comparisonColor = "text-amber-600";
    }
  }

  if (!deal || !hands || !seed) {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded-xl w-48 mx-auto" />
            <div className="h-40 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Preview mode (before game start) ──
  if (game.phase === "ready") {
    const southHand = sortHand(hands.south, null);

    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/gioca"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {mode === "create" ? "Crea Sfida via Link" : "Sfida Ricevuta!"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {mode === "create" ? "Gioca questa mano e condividi il link" : "Un amico ti ha sfidato a questa mano"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Challenge Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#003DA5] to-[#002E7A]">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              <div className="relative text-center">
                <div className="text-5xl mb-3">{"\u2694\uFE0F"}</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {mode === "create" ? "La tua mano" : "Sfida"}
                </h2>
                <p className="text-sm text-white/70">
                  Contratto: <span className="font-bold text-white">{contract}</span>
                  <span className="mx-2">{"\u00B7"}</span>
                  Obiettivo: <span className="font-bold text-white">9 prese</span>
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
                  <span className="text-xs text-white/80 font-mono">Seed: {seed}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hand Preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="rounded-2xl bg-white p-6 border-2 border-[#e5e0d5] shadow-[0_4px_0_#e5e0d5]">
              <h3 className="font-bold text-gray-900 mb-4 text-center">La tua mano (Sud)</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {southHand.map((card, idx) => (
                  <PlayingCard
                    key={`${card.suit}-${card.rank}-${idx}`}
                    card={card}
                    size="md"
                    faceDown={false}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3"
          >
            <Button
              onClick={handleStartGame}
              className="w-full rounded-xl bg-[#003DA5] hover:bg-[#002E7A] text-base font-bold h-14 shadow-lg shadow-[#003DA5]/20"
            >
              {mode === "create" ? "Gioca questa mano" : "Accetta Sfida"}
            </Button>

            {mode === "create" && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Gioca prima la mano, poi potrai condividere il link con il tuo risultato</p>
              </div>
            )}

            {mode === "challenge" && creatorResult && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{"\uD83C\uDFAF"}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900">Obiettivo da battere</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Lo sfidante ha fatto <span className="font-bold">{creatorResult.myTricks} prese</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Playing / Finished mode ──
  const { tricksNeeded } = parseContract(contract);

  return (
    <div className="pt-4 px-4 pb-24">
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
            <Badge className="bg-[#003DA5]/10 text-[#003DA5] text-[10px] font-bold border-0">
              {mode === "playing-create" || mode === "finished" ? "Sfida via Link" : "Sfida Ricevuta"}
            </Badge>
            <BenStatus available={game.benAvailable} />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Sfida via Link</h1>
          <p className="text-xs text-gray-500 mt-1">Seed: {seed}</p>
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
              <p className="text-lg font-bold text-emerald-dark">{contract}</p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Obiettivo</p>
              <p className="text-lg font-bold text-gray-900">{tricksNeeded} prese</p>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">N-S / E-O</p>
              <p className="text-lg font-bold text-gray-900">
                {game.gameState?.trickCount.ns ?? 0} / {game.gameState?.trickCount.ew ?? 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bridge Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 max-w-2xl mx-auto relative"
        >
          {displayedHands ? (
            <BridgeTable
              north={displayedHands.north}
              south={displayedHands.south}
              east={displayedHands.east}
              west={displayedHands.west}
              northFaceDown={false}
              southFaceDown={false}
              eastFaceDown={true}
              westFaceDown={true}
              currentTrick={displayTrick}
              contract={contract}
              declarer="S"
              vulnerability={deal.vulnerability as any}
              trickCount={game.gameState!.trickCount}
              onPlayCard={handlePlayCard}
              highlightedCards={game.validCards as CardData[]}
              activePosition={activeDisplayPos}
              disabled={!game.isPlayerTurn}
              compact={isMobile}
              trumpSuit={game.gameState?.trumpSuit}
            />
          ) : null}
        </motion.div>

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

        {/* Finished: Show results */}
        <AnimatePresence>
          {mode === "finished" && game.result && myResult && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 mx-auto max-w-lg space-y-4"
            >
              {/* Result card */}
              <div
                className={`card-elevated rounded-2xl p-6 text-center ${
                  game.result.result >= 0
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"
                    : "bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200"
                }`}
              >
                <div className="text-4xl mb-3">
                  {game.result.result >= 0 ? "\uD83C\uDF89" : "\uD83D\uDE14"}
                </div>
                <h3
                  className={`text-xl font-bold ${
                    game.result.result >= 0 ? "text-emerald-dark" : "text-red-600"
                  }`}
                >
                  {game.result.result >= 0
                    ? game.result.result === 0
                      ? "Contratto Fatto!"
                      : `Fatto +${game.result.result}!`
                    : `Caduto di ${Math.abs(game.result.result)}`}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Prese: {game.result.tricksMade} / {game.result.tricksNeeded}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-2">
                  <span className="text-lg">{"\u26A1"}</span>
                  <span className="text-sm font-bold text-amber-700">
                    +{30 + (game.result.result >= 0 ? 20 : 0) + Math.max(0, game.result.result) * 10} {profile.xpLabel}
                  </span>
                </div>
              </div>

              {/* Comparison (if challenger and creator result exists) */}
              {creatorResult && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="card-elevated rounded-2xl overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#003DA5] to-[#002E7A] px-5 py-4 text-center">
                      <div className="text-3xl mb-1">{"\u2694\uFE0F"}</div>
                      <h3 className="text-lg font-bold text-white">Confronto Risultati</h3>
                    </div>

                    {/* Two columns */}
                    <div className="bg-white p-5">
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        {/* Your result */}
                        <div className="text-center rounded-2xl bg-gray-50 p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tu</p>
                          <p className="text-4xl font-bold text-gray-900">{myResult.myTricks}</p>
                          <p className="text-xs text-gray-500 mt-1">prese</p>
                        </div>

                        {/* Creator result */}
                        <div className="text-center rounded-2xl bg-gray-50 p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sfidante</p>
                          <p className="text-4xl font-bold text-gray-900">{creatorResult.myTricks}</p>
                          <p className="text-xs text-gray-500 mt-1">prese</p>
                        </div>
                      </div>

                      {/* Verdict */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center"
                      >
                        <div className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 ${
                          myResult.myTricks > creatorResult.myTricks
                            ? "bg-emerald-50 border border-emerald-200"
                            : myResult.myTricks < creatorResult.myTricks
                              ? "bg-red-50 border border-red-200"
                              : "bg-amber-50 border border-amber-200"
                        }`}>
                          <span className="text-xl">
                            {myResult.myTricks > creatorResult.myTricks ? "\uD83C\uDFC6" : myResult.myTricks < creatorResult.myTricks ? "\uD83D\uDE14" : "\uD83E\uDD1D"}
                          </span>
                          <span className={`text-sm font-bold ${comparisonColor}`}>
                            {comparisonVerdict}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Share section (for creator) */}
              {!creatorResult && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="rounded-2xl bg-gradient-to-br from-[#003DA5] to-[#002E7A] p-6 text-center text-white">
                    <div className="text-3xl mb-2">{"\u2694\uFE0F"}</div>
                    <h3 className="text-lg font-bold mb-1">Sfida Pronta!</h3>
                    <p className="text-sm text-white/70 mb-5">
                      Condividi il link e vedi se i tuoi amici riescono a fare meglio!
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold transition-colors backdrop-blur-sm"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        Condividi
                      </button>
                      <button
                        onClick={handleWhatsApp}
                        className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold transition-colors backdrop-blur-sm"
                      >
                        <span className="text-lg">📱</span>
                        WhatsApp
                      </button>
                    </div>

                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors backdrop-blur-sm"
                    >
                      {copied ? (
                        <>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Link Copiato!
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copia Link
                        </>
                      )}
                    </button>

                    {/* Link preview */}
                    <div className="mt-4 bg-black/20 rounded-xl px-4 py-2.5">
                      <p className="text-[11px] text-white/50 font-mono break-all">
                        bridgelab.it/gioca/sfida-link?s={seed}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    xpSaved.current = false;
                    game.startGame();
                    setMode(creatorResult ? "playing-challenge" : "playing-create");
                  }}
                  variant="outline"
                  className="flex-1 rounded-xl h-12 px-6 font-bold"
                >
                  Rigioca
                </Button>
                <Button
                  onClick={() => router.push("/gioca/sfida-link")}
                  className="flex-1 rounded-xl bg-[#003DA5] hover:bg-[#002E7A] text-sm font-bold h-12 px-6 shadow-lg shadow-[#003DA5]/20"
                >
                  Nuova Sfida
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Page export with Suspense
// ──────────────────────────────────────────────

export default function SfidaLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-6 px-5 pb-24">
          <div className="mx-auto max-w-lg text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded-xl w-48 mx-auto" />
              <div className="h-40 bg-gray-100 rounded-2xl" />
            </div>
          </div>
        </div>
      }
    >
      <SfidaLinkContent />
    </Suspense>
  );
}
