"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { allSmazzate, getSmazzataById, type Smazzata } from "@/data/all-smazzate";
import type { Position } from "@/lib/bridge-engine";
import { parseContract, toDisplayPosition, toGamePosition } from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BenStatus } from "@/components/bridge/ben-status";
import { GameTutorial } from "@/components/bridge/game-tutorial";
import Link from "next/link";
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ──────────────────────────────────────────────
// Challenge encoding/decoding
// ──────────────────────────────────────────────

interface ChallengePayload {
  s: string;  // smazzataId
  t: number;  // tricks made by challenger
  n: number;  // tricks needed
}

function encodeChallenge(smazzataId: string, tricksMade: number, tricksNeeded: number): string {
  const payload: ChallengePayload = { s: smazzataId, t: tricksMade, n: tricksNeeded };
  return btoa(JSON.stringify(payload));
}

function decodeChallenge(id: string): ChallengePayload | null {
  try {
    const decoded = JSON.parse(atob(id));
    if (decoded && typeof decoded.s === "string" && typeof decoded.t === "number") {
      return decoded as ChallengePayload;
    }
    return null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// localStorage challenge history
// ──────────────────────────────────────────────

interface SavedChallenge {
  id: string;
  smazzataId: string;
  myTricks: number;
  tricksNeeded: number;
  createdAt: string;
}

function getSavedChallenges(): SavedChallenge[] {
  try {
    const raw = localStorage.getItem("bq_challenges");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChallenge(challenge: SavedChallenge) {
  try {
    const existing = getSavedChallenges();
    // Keep last 50 challenges max
    const updated = [challenge, ...existing].slice(0, 50);
    localStorage.setItem("bq_challenges", JSON.stringify(updated));
  } catch {}
}

// ──────────────────────────────────────────────
// Main page content (needs useSearchParams)
// ──────────────────────────────────────────────

function SfidaAmicoContent() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("id");
  const isMobile = useMobile();
  const profile = useProfile();
  const xpSaved = useRef(false);

  // Decode incoming challenge (if any)
  const incomingChallenge = useMemo(() => {
    if (!challengeId) return null;
    return decodeChallenge(challengeId);
  }, [challengeId]);

  // Pick smazzata: from challenge link or random
  const [smazzata, setSmazzata] = useState<Smazzata | null>(null);
  const [mode, setMode] = useState<"idle" | "creating" | "playing-challenge" | "finished-create" | "finished-challenge">("idle");
  const [challengeCode, setChallengeCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [challengerTricks, setChallengerTricks] = useState<number | null>(null);
  const [challengerNeeded, setChallengerNeeded] = useState<number | null>(null);

  // If we have an incoming challenge, set it up
  useEffect(() => {
    if (incomingChallenge) {
      const found = getSmazzataById(incomingChallenge.s);
      if (found) {
        setSmazzata(found);
        setChallengerTricks(incomingChallenge.t);
        setChallengerNeeded(incomingChallenge.n);
        setMode("playing-challenge");
      }
    }
  }, [incomingChallenge]);

  // Start creating a challenge: pick random hand
  const startCreate = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * allSmazzate.length);
    setSmazzata(allSmazzate[randomIdx]);
    setMode("creating");
    setChallengeCode(null);
    setChallengerTricks(null);
    setChallengerNeeded(null);
    xpSaved.current = false;
  }, []);

  if (!smazzata) {
    // Show landing / choice screen
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
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
                <h1 className="text-2xl font-extrabold text-gray-900">Sfida un Amico</h1>
                <p className="text-sm text-gray-500 mt-0.5">Gioca la stessa mano e confronta i risultati</p>
              </div>
            </div>
          </motion.div>

          {/* Create Challenge Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <button onClick={startCreate} className="w-full text-left">
              <div className="relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all hover:shadow-xl bg-gradient-to-br from-violet-600 to-indigo-700">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                    {"\u2694\uFE0F"}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-extrabold text-white mb-1">Crea una Sfida</h2>
                    <p className="text-sm text-white/70">
                      Gioca una mano casuale, poi condividi il link con un amico per sfidarlo!
                    </p>
                  </div>
                  <svg
                    className="h-6 w-6 shrink-0 text-white/60"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <polyline points="9,6 15,12 9,18" />
                  </svg>
                </div>
              </div>
            </button>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="rounded-2xl bg-white p-5 border-2 border-[#e5e0d5] shadow-[0_4px_0_#e5e0d5]">
              <h3 className="font-extrabold text-gray-900 mb-4">Come funziona</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-extrabold text-violet-600">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Gioca una mano</p>
                    <p className="text-xs text-gray-500 mt-0.5">Ti viene assegnata una mano casuale. Giocala al meglio!</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-extrabold text-violet-600">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Condividi il link</p>
                    <p className="text-xs text-gray-500 mt-0.5">Ricevi un link unico con il tuo risultato codificato.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-extrabold text-violet-600">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Confronta i risultati</p>
                    <p className="text-xs text-gray-500 mt-0.5">Il tuo amico gioca la stessa mano e confronta le prese!</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Past Challenges */}
          <PastChallenges />
        </div>
      </div>
    );
  }

  // ── Active game phase ──
  return (
    <ActiveChallenge
      smazzata={smazzata}
      mode={mode}
      setMode={setMode}
      challengeCode={challengeCode}
      setChallengeCode={setChallengeCode}
      challengerTricks={challengerTricks}
      challengerNeeded={challengerNeeded}
      copied={copied}
      setCopied={setCopied}
      isMobile={isMobile}
      profile={profile}
      xpSaved={xpSaved}
      onNewChallenge={() => {
        setSmazzata(null);
        setMode("idle");
        setChallengeCode(null);
        setChallengerTricks(null);
        setChallengerNeeded(null);
        xpSaved.current = false;
      }}
    />
  );
}

// ──────────────────────────────────────────────
// Active challenge game component
// ──────────────────────────────────────────────

interface ActiveChallengeProps {
  smazzata: Smazzata;
  mode: string;
  setMode: (m: "idle" | "creating" | "playing-challenge" | "finished-create" | "finished-challenge") => void;
  challengeCode: string | null;
  setChallengeCode: (c: string | null) => void;
  challengerTricks: number | null;
  challengerNeeded: number | null;
  copied: boolean;
  setCopied: (c: boolean) => void;
  isMobile: boolean;
  profile: ReturnType<typeof useProfile>;
  xpSaved: React.RefObject<boolean>;
  onNewChallenge: () => void;
}

function ActiveChallenge({
  smazzata,
  mode,
  setMode,
  challengeCode,
  setChallengeCode,
  challengerTricks,
  challengerNeeded,
  copied,
  setCopied,
  isMobile,
  profile,
  xpSaved,
  onNewChallenge,
}: ActiveChallengeProps) {
  const { tricksNeeded } = parseContract(smazzata.contract);
  const declarer = smazzata.declarer;
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

  // Save XP + generate challenge code when game finishes
  useEffect(() => {
    if (game.phase === "finished" && game.result && !xpSaved.current) {
      xpSaved.current = true;
      const gameXp = 30 + (game.result.result >= 0 ? 20 : 0) + Math.max(0, game.result.result) * 10;
      try {
        const prev = parseInt(localStorage.getItem("bq_xp") || "0", 10);
        localStorage.setItem("bq_xp", String(prev + gameXp));
        const hp = parseInt(localStorage.getItem("bq_hands_played") || "0", 10);
        localStorage.setItem("bq_hands_played", String(hp + 1));
      } catch {}

      if (mode === "creating") {
        // Generate challenge code
        const code = encodeChallenge(smazzata.id, game.result.tricksMade, game.result.tricksNeeded);
        setChallengeCode(code);
        setMode("finished-create");

        // Save to local history
        saveChallenge({
          id: code,
          smazzataId: smazzata.id,
          myTricks: game.result.tricksMade,
          tricksNeeded: game.result.tricksNeeded,
          createdAt: new Date().toISOString(),
        });
      } else if (mode === "playing-challenge") {
        setMode("finished-challenge");
      }
    }
  }, [game.phase, game.result, mode, smazzata.id, setChallengeCode, setMode, xpSaved]);

  const hands = displayHands(game.gameState);
  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? toDisplayPosition(game.gameState.currentPlayer, declarer)
      : undefined;

  // Copy challenge link
  const handleCopyLink = useCallback(async () => {
    if (!challengeCode) return;
    const link = `https://bridge-quest.vercel.app/gioca/sfida-amico?id=${encodeURIComponent(challengeCode)}`;
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
  }, [challengeCode, setCopied]);

  // Share via Web Share API
  const handleShare = useCallback(async () => {
    if (!challengeCode) return;
    const link = `https://bridge-quest.vercel.app/gioca/sfida-amico?id=${encodeURIComponent(challengeCode)}`;
    const myTricks = game.result?.tricksMade ?? 0;
    const text = `Ti sfido a Bridge! Ho fatto ${myTricks} prese su ${tricksNeeded} necessarie. Riesci a fare meglio?\n${link}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "BridgeQuest - Sfida un Amico",
          text,
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    handleCopyLink();
  }, [challengeCode, game.result, tricksNeeded, handleCopyLink]);

  // Determine winner for challenge mode
  const myTricks = game.result?.tricksMade ?? 0;
  const isChallenge = mode === "finished-challenge" && challengerTricks !== null;

  let challengeVerdict = "";
  let challengeVerdictColor = "text-gray-700";
  if (isChallenge) {
    if (myTricks > challengerTricks!) {
      challengeVerdict = "Hai vinto la sfida!";
      challengeVerdictColor = "text-emerald-700";
    } else if (myTricks < challengerTricks!) {
      challengeVerdict = "Vince lo sfidante!";
      challengeVerdictColor = "text-red-600";
    } else {
      challengeVerdict = "Pareggio!";
      challengeVerdictColor = "text-amber-600";
    }
  }

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
            <Badge className="bg-violet-50 text-violet-700 text-[10px] font-bold border-0">
              {mode === "creating" || mode === "finished-create" ? "Crea Sfida" : "Sfida Ricevuta"}
            </Badge>
            <BenStatus available={game.benAvailable} />
          </div>
          <h1 className="text-lg font-extrabold text-gray-900">
            {smazzata.title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Lezione {smazzata.lesson} {"\u00B7"} Board {smazzata.board}
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
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-bold h-12 px-8 shadow-lg shadow-violet-600/25"
            >
              {mode === "playing-challenge" ? "Accetta la sfida" : "Gioca la sfida"}
            </Button>
          )}
          {game.phase === "finished" && (
            <div className="flex gap-3">
              <Link href="/gioca/sfida-amico">
                <Button variant="outline" className="rounded-xl h-12 px-6 font-bold">
                  Nuova sfida
                </Button>
              </Link>
              <Button
                onClick={() => { xpSaved.current = false; game.startGame(); }}
                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-bold h-12 px-6 shadow-lg shadow-violet-600/25"
              >
                Rigioca
              </Button>
            </div>
          )}
        </div>

        {/* Result: Create mode */}
        <AnimatePresence>
          {mode === "finished-create" && game.result && (
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
                  className={`text-xl font-extrabold ${
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

              {/* Share card */}
              {challengeCode && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-center text-white">
                    <div className="text-3xl mb-2">{"\u2694\uFE0F"}</div>
                    <h3 className="text-lg font-extrabold mb-1">Sfida Pronta!</h3>
                    <p className="text-sm text-white/70 mb-5">
                      Condividi il link e vedi se il tuo amico riesce a fare meglio!
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
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
                        onClick={handleCopyLink}
                        className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold transition-colors backdrop-blur-sm"
                      >
                        {copied ? (
                          <>
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Copiato!
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copia Link
                          </>
                        )}
                      </button>
                    </div>

                    {/* Link preview */}
                    <div className="mt-4 bg-black/20 rounded-xl px-4 py-2.5">
                      <p className="text-[11px] text-white/50 font-mono break-all">
                        bridge-quest.vercel.app/gioca/sfida-amico?id=...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result: Challenge (comparison) mode */}
        <AnimatePresence>
          {mode === "finished-challenge" && game.result && challengerTricks !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 mx-auto max-w-lg space-y-4"
            >
              {/* Comparison card */}
              <div className="card-elevated rounded-2xl overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-5 py-4 text-center">
                  <div className="text-3xl mb-1">{"\u2694\uFE0F"}</div>
                  <h3 className="text-lg font-extrabold text-white">Risultato Sfida</h3>
                  <p className="text-xs text-white/60 mt-1">
                    Contratto: {smazzata.contract} {"\u00B7"} Obiettivo: {tricksNeeded} prese
                  </p>
                </div>

                {/* Two columns */}
                <div className="bg-white p-5">
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    {/* Your result */}
                    <div className="text-center rounded-2xl bg-gray-50 p-4 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tu</p>
                      <p className="text-4xl font-black text-gray-900">{myTricks}</p>
                      <p className="text-xs text-gray-500 mt-1">prese</p>
                      <div className="mt-2">
                        {game.result.result >= 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-0.5">
                            {game.result.result === 0 ? "Fatto" : `+${game.result.result}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 rounded-full px-2.5 py-0.5">
                            {game.result.result}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Challenger result */}
                    <div className="text-center rounded-2xl bg-gray-50 p-4 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sfidante</p>
                      <p className="text-4xl font-black text-gray-900">{challengerTricks}</p>
                      <p className="text-xs text-gray-500 mt-1">prese</p>
                      <div className="mt-2">
                        {challengerTricks! - (challengerNeeded ?? tricksNeeded) >= 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-0.5">
                            {challengerTricks! - (challengerNeeded ?? tricksNeeded) === 0
                              ? "Fatto"
                              : `+${challengerTricks! - (challengerNeeded ?? tricksNeeded)}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 rounded-full px-2.5 py-0.5">
                            {challengerTricks! - (challengerNeeded ?? tricksNeeded)}
                          </span>
                        )}
                      </div>
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
                      myTricks > challengerTricks!
                        ? "bg-emerald-50 border border-emerald-200"
                        : myTricks < challengerTricks!
                          ? "bg-red-50 border border-red-200"
                          : "bg-amber-50 border border-amber-200"
                    }`}>
                      <span className="text-xl">
                        {myTricks > challengerTricks! ? "\uD83C\uDFC6" : myTricks < challengerTricks! ? "\uD83D\uDE14" : "\uD83E\uDD1D"}
                      </span>
                      <span className={`text-sm font-extrabold ${challengeVerdictColor}`}>
                        {challengeVerdict}
                      </span>
                    </div>
                  </motion.div>

                  {/* XP earned */}
                  <div className="mt-4 flex justify-center">
                    <div className="inline-flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-2">
                      <span className="text-lg">{"\u26A1"}</span>
                      <span className="text-sm font-bold text-amber-700">
                        +{30 + (game.result.result >= 0 ? 20 : 0) + Math.max(0, game.result.result) * 10} {profile.xpLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Counter-challenge */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={onNewChallenge}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors shadow-lg shadow-violet-600/25"
                >
                  {"\u2694\uFE0F"} Crea la tua sfida
                </button>
              </motion.div>
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

// ──────────────────────────────────────────────
// Past challenges list
// ──────────────────────────────────────────────

function PastChallenges() {
  const [challenges, setChallenges] = useState<SavedChallenge[]>([]);

  useEffect(() => {
    setChallenges(getSavedChallenges());
  }, []);

  if (challenges.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-4"
    >
      <div className="rounded-2xl bg-white p-5 border-2 border-[#e5e0d5] shadow-[0_4px_0_#e5e0d5]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-gray-900">Sfide Create</h3>
          <Badge variant="outline" className="text-[10px] font-bold text-gray-400 border-gray-200">
            {challenges.length} sfide
          </Badge>
        </div>
        <div className="space-y-2">
          {challenges.slice(0, 5).map((ch, i) => {
            const smz = getSmazzataById(ch.smazzataId);
            const result = ch.myTricks - ch.tricksNeeded;
            const date = new Date(ch.createdAt);
            const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;

            return (
              <div
                key={ch.id + i}
                className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${
                  result >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                }`}>
                  {result >= 0 ? `+${result}` : result}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {smz?.title ?? `Mano ${ch.smazzataId}`}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {ch.myTricks}/{ch.tricksNeeded} prese {"\u00B7"} {dateStr}
                  </p>
                </div>
                <CopyMiniButton challengeId={ch.id} />
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function CopyMiniButton({ challengeId }: { challengeId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const link = `https://bridge-quest.vercel.app/gioca/sfida-amico?id=${encodeURIComponent(challengeId)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
      title="Copia link sfida"
    >
      {copied ? (
        <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────
// Page export with Suspense for useSearchParams
// ──────────────────────────────────────────────

export default function SfidaAmicoPage() {
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
      <SfidaAmicoContent />
    </Suspense>
  );
}
