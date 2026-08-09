"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { GameActions } from "@/components/bridge/game-actions";
import { HintPanel } from "@/components/bridge/hint-panel";
import { PlanningQuiz } from "@/components/bridge/planning-quiz";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { useSmazzate } from "@/store/use-smazzate-store";
import type { Smazzata, CourseId } from "@/lib/catalog";
import { useCatalog } from "@/store/use-catalog-store";
import { lessonTitles as fallbackLessonTitles } from "@/lib/catalog";
import { getLessonDisplayNumber } from "@/data/lesson-meta";
import { updateLastActivity } from "@/hooks/use-notifications";
import { awardGameXp } from "@/lib/xp-utils";
import { useGameResults } from "@/hooks/use-game-results";
import type { Position } from "@/lib/bridge-engine";
import { parseContract, toDisplayPosition, toGamePosition, cardToString, partnershipOf, getDummy, nextPlayer } from "@/lib/bridge-engine";

const DISPLAY_LETTER: Record<Position, string> = { north: "N", south: "S", east: "E", west: "W" };
import { saveGameForAnalysis } from "@/lib/save-analysis-data";
import type { CardData } from "@/components/bridge/playing-card";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { BenStatus } from "@/components/bridge/ben-status";
// Overlay del tutorial: compare solo a partita avviata e resta chiuso finché
// l'utente non lo apre → fuori dal first load della pagina di gioco.
const GameTutorial = dynamic(
  () => import("@/components/bridge/game-tutorial").then((m) => m.GameTutorial),
  { ssr: false },
);
// Replay della mano: si apre su richiesta a fine partita.
const HandReplay = dynamic(
  () => import("@/components/bridge/hand-replay").then((m) => m.HandReplay),
  { ssr: false },
);
// Pannello di condivisione: esiste solo nella schermata di fine mano.
const ShareResult = dynamic(
  () => import("@/components/bridge/share-result").then((m) => m.ShareResult),
  { ssr: false },
);
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { useDDS, type DDSAnalysis } from "@/hooks/use-dds";
import { addGameRecordDirect } from "@/hooks/use-game-history";
import { classifyPlayErrors, type PlayError } from "@/lib/play-error-classifier";
import { useSpacedReview } from "@/hooks/use-spaced-review";
import Link from "next/link";

export default function SmazzataBrowserPage() {
  return (
    <Suspense fallback={<div className="pt-10 text-center text-muted-foreground text-sm">Caricamento...</div>}>
      <SmazzataBrowserContent />
    </Suspense>
  );
}

function SmazzataBrowserContent() {
  const { courses } = useCatalog();
  const { smazzate: allSmazzate } = useSmazzate();
  const searchParams = useSearchParams();
  const lessonParam = searchParams.get("lesson");
  const courseParam = searchParams.get("course");
  const randomParam = searchParams.get("random");

  // Derive course lesson IDs from the live catalog (was getCourseById().lessons)
  const courseLessonIds = useMemo<number[]>(() => {
    if (courseParam) {
      const course = courses.find((c) => c.id === (courseParam as CourseId));
      const ids = new Set(course?.lessons.map((l) => l.id) ?? []);
      return [...new Set(allSmazzate.filter((s) => ids.has(s.lesson)).map((s) => s.lesson))].sort((a, b) => a - b);
    }
    return [...new Set(allSmazzate.map((s) => s.lesson))].sort((a, b) => a - b);
  }, [courses, allSmazzate, courseParam]);

  const [selectedLesson, setSelectedLesson] = useState<number>(
    lessonParam ? parseInt(lessonParam) : (courseLessonIds[0] ?? 1)
  );
  const [selectedSmazzata, setSelectedSmazzata] = useState<Smazzata | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Update when URL param changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync dello stato dal parametro URL: lo stato è modificabile anche dall’utente, non derivabile
    if (lessonParam) setSelectedLesson(parseInt(lessonParam));
  }, [lessonParam]);

  useEffect(() => {
    if (!lessonParam && courseLessonIds.length > 0 && !courseLessonIds.includes(selectedLesson)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- riallineamento della lezione selezionata al load asincrono del corso
      setSelectedLesson(courseLessonIds[0]);
    }
  }, [courseLessonIds, lessonParam, selectedLesson]);

  // Auto-play random smazzata
  useEffect(() => {
    if (randomParam) {
      const idx = parseInt(randomParam);
      if (idx >= 0 && idx < allSmazzate.length) {
        const hand = allSmazzate[idx];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- avvio automatico da parametro URL dopo il load asincrono delle smazzate
        setSelectedLesson(hand.lesson);
        setSelectedSmazzata(hand);
        setIsPlaying(true);
      }
    }
  }, [randomParam, allSmazzate]);

  const lessonSmazzate = useMemo(
    () => allSmazzate.filter((s) => s.lesson === selectedLesson),
    [allSmazzate, selectedLesson],
  );

  // Title resolver: catalog → fallback hardcoded → "Lezione N"
  function titleFor(lessonId: number): string {
    for (const c of courses) {
      const l = c.lessons.find((l) => l.id === lessonId);
      if (l) return l.title;
    }
    return fallbackLessonTitles[lessonId] ?? `Lezione ${lessonId}`;
  }

  const lessons = courseLessonIds.map((id) => ({
    id,
    title: titleFor(id),
    count: allSmazzate.filter((s) => s.lesson === id).length,
  }));
  const selectedLessonNumber = getLessonDisplayNumber(selectedLesson);

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
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/gioca" className="hover:text-emerald transition-colors">
              Gioca
            </Link>
            <span>/</span>
            <span className="text-emerald font-semibold">Smazzate</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Smazzate del Corso
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allSmazzate.filter((s) => courseLessonIds.includes(s.lesson)).length} mani pratiche dalle lezioni FIGB
          </p>
        </motion.div>

        {/* Lesson tabs - grouped by course */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-5 -mx-5 px-5 space-y-2"
        >
          {(() => {
            // Group lessons by course
            const courseGroups: { courseName: string; lessons: typeof lessons }[] = [];
            const seen = new Set<string>();
            for (const lesson of lessons) {
              const course = courses.find((c) => c.lessons.some((l) => l.id === lesson.id));
              const name = course?.name ?? "Altro";
              if (!seen.has(name)) {
                seen.add(name);
                courseGroups.push({ courseName: name, lessons: [] });
              }
              courseGroups.find((g) => g.courseName === name)!.lessons.push(lesson);
            }
            return courseGroups.map((group) => (
              <div key={group.courseName}>
                {courseGroups.length > 1 && (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">
                    {group.courseName}
                  </p>
                )}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {group.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setSelectedLesson(lesson.id);
                        setSelectedSmazzata(null);
                      }}
                      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                        selectedLesson === lesson.id
                          ? "bg-emerald text-white shadow-md shadow-emerald/25"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      Lez. {getLessonDisplayNumber(lesson.id)}
                    </button>
                  ))}
                </div>
              </div>
            ));
          })()}
        </motion.div>

        {/* Lesson title */}
        <motion.div
          key={selectedLesson}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4"
        >
          <h2 className="text-lg font-bold text-foreground">
            Lezione {selectedLessonNumber}
          </h2>
          <p className="text-sm text-muted-foreground">
            {titleFor(selectedLesson)} · {lessonSmazzate.length} mani
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
                  className={`w-full text-left card-elevated rounded-2xl bg-card p-4 transition-all ${
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
                  <p className="text-[12px] font-semibold text-foreground/80 leading-tight mt-1 mb-1 line-clamp-2">
                    {smazzata.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
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
              className="mt-5 card-elevated rounded-2xl bg-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground">
                    Smazzata {selectedSmazzata.id}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedSmazzata.title}
                  </p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold border-0">
                  {selectedSmazzata.contract}
                </Badge>
              </div>

              {selectedSmazzata.commentary && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald to-emerald-dark text-white font-bold text-[10px]">
                      M
                    </div>
                    <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
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
  const { courses } = useCatalog();
  const lessonTitle = (() => {
    for (const c of courses) {
      const l = c.lessons.find((l) => l.id === smazzata.lesson);
      if (l) return l.title;
    }
    return fallbackLessonTitles[smazzata.lesson] ?? `Lezione ${smazzata.lesson}`;
  })();
  const [xpSaved, setXpSaved] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [ddsResult, setDdsResult] = useState<DDSAnalysis | null>(null);
  const [ddsLoading, setDdsLoading] = useState(false);
  const isMobile = useMobile();
  const profile = useProfile();
  const dds = useDDS();
  const { saveGameResult } = useGameResults();
  const { addReviewItem } = useSpacedReview();

  // ── Mode: play as declarer (default) or defend the contract ──────────
  const [mode, setMode] = useState<"declare" | "defend">("declare");
  const dummy = getDummy(declarer);
  // Anchor = the seat shown at the bottom (the human). Declaring → declarer;
  // defending → the opening leader (the defender to declarer's left).
  const anchor: Position = mode === "declare" ? declarer : nextPlayer(declarer);
  const playerPositions = mode === "declare" ? [declarer, dummy] : [anchor];

  const game = useBridgeGame({
    hands: smazzata.hands,
    contract: smazzata.contract,
    declarer,
    playerPositions,
    // When defending, the human is the opening leader and makes the lead.
    openingLead: mode === "declare" ? smazzata.openingLead : undefined,
    dealer: smazzata.bidding?.dealer,
    vulnerability: smazzata.vulnerability,
    bidding: smazzata.bidding,
    allowUndo: true, // didactic free play: take back the last card
  });

  // Cumulative XP penalty from progressive hints (level 2: 5, level 3: 10)
  const hintPenaltyRef = useRef(0);
  const handleHintUsed = (level: number) => {
    if (level === 2) hintPenaltyRef.current = Math.min(30, hintPenaltyRef.current + 5);
    if (level === 3) hintPenaltyRef.current = Math.min(30, hintPenaltyRef.current + 10);
  };

  // Planning quiz (count your tricks before playing) — once per hand, declare mode
  const [planDismissed, setPlanDismissed] = useState(false);
  const planBonusRef = useRef(0);
  const showPlanQuiz =
    mode === "declare" &&
    !planDismissed &&
    game.phase === "playing" &&
    !!game.gameState &&
    game.gameState.tricks.length === 0 &&
    game.gameState.currentTrick.length === 1;

  const leadDone =
    !!game.gameState && (game.gameState.tricks.length > 0 || game.gameState.currentTrick.length > 0);

  const gameAt = (slot: Position) => toGamePosition(slot, anchor);
  const faceDownFor = (slot: Position) => {
    const gp = gameAt(slot);
    if (gp === anchor) return false;     // your own hand: always visible
    if (gp === dummy) return !leadDone;   // dummy: revealed after the opening lead
    return true;                          // hidden hands
  };

  const handlePlayCard = (displayPosition: string, cardIndex: number) => {
    if (!game.gameState) return;
    const gamePos = toGamePosition(displayPosition as Position, anchor);
    const hand = game.gameState.hands[gamePos];
    if (!hand || cardIndex >= hand.length) return;
    game.handleCardPlay(hand[cardIndex]);
  };

  // Map trick plays to display positions
  const mapTrickToDisplay = (plays: { position: string; card: CardData }[]) =>
    plays.map((tp) => ({
      position: toDisplayPosition(tp.position as Position, anchor),
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

  // Map hands to display positions (anchor at the bottom = south)
  const displayHands = (gs: typeof game.gameState) => {
    if (!gs) return null;
    return {
      north: gs.hands[gameAt("north")] as CardData[],
      south: gs.hands[gameAt("south")] as CardData[],
      east: gs.hands[gameAt("east")] as CardData[],
      west: gs.hands[gameAt("west")] as CardData[],
    };
  };

  // Save XP, track hands played, and record game history when game finishes
  useEffect(() => {
    if (game.phase === "finished" && game.result && !xpSaved) {
      setXpSaved(true);
      const r = game.result.result;
      // Declaring rewards making the contract; defending rewards setting it.
      const baseEarned =
        mode === "defend"
          ? 30 + (r < 0 ? 20 : 0) + Math.max(0, -r) * 10
          : 30 + (r >= 0 ? 20 : 0) + Math.max(0, r) * 10;
      // Progressive hints reduce the reward; a correct pre-play plan adds a bonus
      const earned = Math.max(10, baseEarned - hintPenaltyRef.current + planBonusRef.current);
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

      // Save game data for AI analysis page
      const parsed = parseContract(smazzata.contract);
      saveGameForAnalysis(smazzata.hands, game.gameState?.tricks || [], { level: parsed.level, suit: parsed.trumpSuit, declarer: smazzata.declarer }, game.result);

      // Sync to Supabase
      saveGameResult({
        gameType: "smazzata",
        lessonId: smazzata.lesson,
        score: earned,
        details: {
          tricks: game.result.tricksMade,
          tricksNeeded: game.result.tricksNeeded,
          result: game.result.result,
          made: game.result.result >= 0,
          contract: smazzata.contract,
          declarer: smazzata.declarer,
          smazzataId: smazzata.id,
          board: smazzata.board,
        },
      });
    }
  }, [game.phase, game.result, game.gameState?.tricks, mode, xpSaved, smazzata, saveGameResult]);

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

  // Classify the human's play errors and feed the spaced-repetition queue
  // (/ripasso). Runs once per hand, after the DD analysis is available.
  const errorsLoggedRef = useRef(false);
  const [playErrors, setPlayErrors] = useState<PlayError[]>([]);
  useEffect(() => {
    if (
      game.phase !== "finished" ||
      !game.result ||
      !game.gameState ||
      !ddsResult ||
      errorsLoggedRef.current
    )
      return;
    errorsLoggedRef.current = true;
    try {
      const { trumpSuit } = parseContract(smazzata.contract);
      const errors = classifyPlayErrors({
        tricks: game.gameState.tricks,
        originalHands: smazzata.hands,
        trumpSuit,
        playerPositions,
        declarer,
        // Only grade against the DD optimum when the solver result is exact
        ddTricks: ddsResult.isExact ? ddsResult.ddTricks : null,
        tricksMade: game.result.tricksMade,
      }).slice(0, 2); // at most 2 review items per hand
      setPlayErrors(errors);
      for (const err of errors) {
        addReviewItem(err.lessonId, err.moduleId, err.description);
      }
    } catch {
      // Classification is best-effort: never block the end-of-hand flow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.phase, game.result, game.gameState, ddsResult]);

  // Compute DDS-based star rating (1-5 scale)
  const ddTricks = ddsResult?.ddTricks ?? null;
  const declared = mode === "declare";
  const ddsStars = (() => {
    if (!game.result) return 0;
    const r = game.result.result;
    if (ddTricks === null) {
      if (!declared) return r < 0 ? 3 : r === 0 ? 1 : 0; // defender: beat the contract
      return r > 0 ? 3 : r === 0 ? 2 : r === -1 ? 1 : 0;
    }
    const diff = game.result.tricksMade - ddTricks;
    if (!declared) {
      // Defender: holding declarer to (or below) the DD optimum is best defense.
      if (diff <= 0) return 5;
      if (diff === 1) return 4;
      if (diff === 2) return 3;
      if (diff === 3) return 2;
      return 1;
    }
    if (diff >= 0) return 5;       // Matched or exceeded DD
    if (diff === -1) return 4;     // DD - 1
    if (diff === -2) return 3;     // DD - 2
    if (diff === -3) return 2;     // DD - 3
    return 1;                      // Worse
  })();
  // Success from the human's perspective: declarer makes / defender sets.
  const success = game.result ? (declared ? game.result.result >= 0 : game.result.result < 0) : false;

  const hands = displayHands(game.gameState);
  const activeDisplayPos = game.isPlayerTurn && game.gameState
    ? toDisplayPosition(game.gameState.currentPlayer, anchor)
    : undefined;

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
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold text-emerald dark:text-emerald-300 border-emerald/30 bg-emerald-50 dark:bg-emerald-950/40 shrink-0"
                >
                  Lez. {getLessonDisplayNumber(smazzata.lesson)} · Board {smazzata.board}
                </Badge>
                <BenStatus available={game.benAvailable} aiLevel={game.aiLevel} />
              </div>
              <h1 className={`${isMobile ? "text-sm" : "text-lg"} font-bold text-foreground truncate`}>
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
          <div className={`card-elevated rounded-xl bg-card flex items-center text-sm ${isMobile ? "px-3 py-1.5 gap-3" : "px-4 py-2 gap-5"}`}>
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Contratto
              </p>
              <p className={`${isMobile ? "text-base" : "text-lg"} font-bold text-emerald-dark`}>
                {smazzata.contract}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Obiettivo
              </p>
              <p className={`${isMobile ? "text-base" : "text-lg"} font-bold text-foreground`}>
                {tricksNeeded} prese
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Dich. / Dif.
              </p>
              <p className={`${isMobile ? "text-base" : "text-lg"} font-bold text-foreground`}>
                {partnershipOf(declarer) === "ew"
                  ? `${game.gameState?.trickCount.ew ?? 0} / ${game.gameState?.trickCount.ns ?? 0}`
                  : `${game.gameState?.trickCount.ns ?? 0} / ${game.gameState?.trickCount.ew ?? 0}`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mode selector: declare or defend (before the hand starts) */}
        {game.phase === "ready" && (
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Gioca come</span>
            <div className="inline-flex rounded-xl border border-border bg-card p-0.5 shadow-sm">
              <button
                onClick={() => setMode("declare")}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-colors ${mode === "declare" ? "bg-emerald text-white" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                Dichiarante
              </button>
              <button
                onClick={() => setMode("defend")}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-colors ${mode === "defend" ? "bg-emerald text-white" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                Difesa
              </button>
            </div>
          </div>
        )}

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
            className="flex-1 w-full max-w-3xl relative"
          >
            {hands ? (
              <BridgeTable
                north={hands.north}
                south={hands.south}
                east={hands.east}
                west={hands.west}
                northFaceDown={faceDownFor("north")}
                southFaceDown={faceDownFor("south")}
                eastFaceDown={faceDownFor("east")}
                westFaceDown={faceDownFor("west")}
                currentTrick={displayTrick}
                contract={smazzata.contract}
                declarer={DISPLAY_LETTER[toDisplayPosition(declarer, anchor)]}
                dummy={DISPLAY_LETTER[toDisplayPosition(dummy, anchor)]}
                vulnerability={smazzata.vulnerability}
                trickCount={partnershipOf(anchor) === "ew" ? { ns: game.gameState!.trickCount.ew, ew: game.gameState!.trickCount.ns } : game.gameState!.trickCount}
                onPlayCard={handlePlayCard}
                highlightedCards={game.validCards as CardData[]}
                activePosition={activeDisplayPos}
                disabled={!game.isPlayerTurn}
                compact={isMobile}
                trumpSuit={game.gameState?.trumpSuit}
              />
            ) : (
              <BridgeTable
                north={smazzata.hands[gameAt("north")] as CardData[]}
                south={smazzata.hands[gameAt("south")] as CardData[]}
                east={smazzata.hands[gameAt("east")] as CardData[]}
                west={smazzata.hands[gameAt("west")] as CardData[]}
                northFaceDown={faceDownFor("north")}
                southFaceDown={faceDownFor("south")}
                eastFaceDown={faceDownFor("east")}
                westFaceDown={faceDownFor("west")}
                contract={smazzata.contract}
                declarer={DISPLAY_LETTER[toDisplayPosition(declarer, anchor)]}
                dummy={DISPLAY_LETTER[toDisplayPosition(dummy, anchor)]}
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
              <BiddingPanel bidding={smazzata.bidding} declarer={declarer} />
            </motion.div>
          )}
        </div>

        {/* Message */}
        <div className={`mt-3 text-center ${isMobile ? "sticky bottom-16 z-20 bg-card/90 backdrop-blur-sm rounded-xl py-2 mx-auto max-w-xs shadow-sm" : ""}`}>
          <AnimatePresence mode="wait">
            <motion.p
              key={game.message}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`text-sm font-semibold ${
                game.phase === "finished"
                  ? success
                    ? "text-emerald"
                    : "text-red-500"
                  : game.isPlayerTurn
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
              }`}
            >
              {game.message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* In-game actions: claim + undo */}
        {(game.phase === "playing" || game.phase === "trick-complete") && (
          <GameActions
            canClaim={game.canClaim}
            claimStatus={game.claimStatus}
            onClaim={game.requestClaim}
            canUndo={game.canUndo}
            onUndo={game.undoLastPlay}
          />
        )}

        {/* Planning quiz: count tricks after the lead, before playing from dummy */}
        {showPlanQuiz && (
          <PlanningQuiz
            hands={smazzata.hands}
            contract={smazzata.contract}
            declarer={declarer}
            openingLead={game.gameState!.currentTrick[0].card}
            onAnswer={(correct) => {
              if (correct) planBonusRef.current = 5;
            }}
            onDismiss={() => setPlanDismissed(true)}
          />
        )}

        {/* Progressive hints (free play only) */}
        {game.phase === "playing" && (
          <HintPanel
            gameState={game.gameState}
            isPlayerTurn={game.isPlayerTurn}
            onHintUsed={handleHintUsed}
          />
        )}

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
              className="mt-6 mx-auto max-w-6xl space-y-4"
            >
              {/* Main Result Card */}
              <div
                className={`card-elevated rounded-2xl p-6 text-center ${
                  success
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-900"
                    : "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border border-red-200 dark:border-red-900"
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
                    success ? "text-emerald-dark dark:text-emerald-300" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {declared
                    ? game.result.result > 0
                      ? `Fatto +${game.result.result}!`
                      : game.result.result === 0
                        ? "Contratto Mantenuto!"
                        : `Caduto di ${Math.abs(game.result.result)}`
                    : game.result.result < 0
                      ? `Contratto battuto di ${Math.abs(game.result.result)}!`
                      : game.result.result === 0
                        ? "Contratto mantenuto"
                        : `Mantenuto +${game.result.result}`}
                </h3>

                {/* Tricks breakdown bar */}
                <div className="mt-4 mx-auto max-w-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
                    <span>Prese fatte</span>
                    <span>{game.result.tricksMade} / {game.result.tricksNeeded} necessarie</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((game.result.tricksMade / 13) * 100, 100)}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`h-full rounded-full ${
                        success
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-gradient-to-r from-red-400 to-red-500"
                      }`}
                    />
                  </div>
                  {/* Target line */}
                  <div className="relative h-0">
                    <div
                      className="absolute -top-3 w-0.5 h-3 bg-foreground/40"
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
                  className="mt-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900 p-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-500 text-white">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Analisi Double-Dummy</span>
                    {ddsLoading && (
                      <span className="text-[10px] text-indigo-400 animate-pulse">Calcolo...</span>
                    )}
                    {ddsResult && !ddsResult.isExact && (
                      <span className="text-[10px] text-indigo-400">(stima)</span>
                    )}
                  </div>
                  {ddTricks !== null ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                        {ddTricks} prese ottimali
                      </p>
                      <p className={`text-xs font-semibold ${
                        (declared ? game.result.tricksMade >= ddTricks : game.result.tricksMade <= ddTricks)
                          ? "text-emerald-600 dark:text-emerald-400"
                          : (declared ? game.result.tricksMade >= ddTricks - 1 : game.result.tricksMade <= ddTricks + 1)
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-500 dark:text-red-400"
                      }`}>
                        {declared
                          ? game.result.tricksMade >= ddTricks
                            ? game.result.tricksMade === ddTricks
                              ? `Hai raggiunto il risultato ottimale!`
                              : `Hai superato il risultato ottimale di ${game.result.tricksMade - ddTricks}!`
                            : `Hai fatto ${game.result.tricksMade}/${ddTricks} prese possibili`
                          : game.result.tricksMade <= ddTricks
                            ? game.result.tricksMade === ddTricks
                              ? `Difesa ottimale: dichiarante tenuto all'ottimo!`
                              : `Hai tenuto il dichiarante ${ddTricks - game.result.tricksMade} sotto l'ottimale!`
                            : `Il dichiarante ha fatto ${game.result.tricksMade} (ottimale ${ddTricks})`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-indigo-400">Analisi in corso...</p>
                  )}
                </motion.div>

                {/* Score detail grid */}
                <div className="grid grid-cols-3 gap-2 mt-6">
                  <div className="bg-card/60 rounded-xl p-2.5">
                    <p className="text-lg font-bold text-foreground">{game.result.tricksMade}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Prese</p>
                  </div>
                  <div className="bg-card/60 rounded-xl p-2.5">
                    <p className={`text-lg font-bold ${success ? "text-emerald-600" : "text-red-600"}`}>
                      {game.result.result >= 0 ? `+${game.result.result}` : game.result.result}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Risultato</p>
                  </div>
                  <div className="bg-card/60 rounded-xl p-2.5">
                    <p className="text-lg font-bold text-amber-600">
                      +{declared
                        ? 30 + (game.result.result >= 0 ? 20 : 0) + Math.max(0, game.result.result) * 10
                        : 30 + (game.result.result < 0 ? 20 : 0) + Math.max(0, -game.result.result) * 10}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{profile.xpLabel}</p>
                  </div>
                </div>

                {/* Performance verdict (DDS-aware) */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${
                    ddsStars >= 5
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : ddsStars >= 4
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        : ddsStars >= 3
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
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
                      className="rounded-xl text-xs font-bold h-9 px-5 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
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

              {/* Detected play errors → personalized review */}
              {playErrors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="card-elevated rounded-2xl bg-card p-5 border border-amber-200 dark:border-amber-900"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-bold text-xs">
                      !
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Su cosa lavorare</h4>
                  </div>
                  <ul className="space-y-2">
                    {playErrors.map((err, i) => (
                      <li key={i} className="text-sm text-foreground/80 leading-relaxed flex gap-2">
                        <span className="text-amber-500 font-bold shrink-0">•</span>
                        <span>{err.description}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/ripasso">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 h-8 rounded-xl px-4 text-xs font-bold border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
                    >
                      Aggiunto al tuo ripasso →
                    </Button>
                  </Link>
                </motion.div>
              )}

              {/* Commentary / Maestro tip */}
              {smazzata.commentary && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="card-elevated rounded-2xl bg-card p-5 border border-border"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald to-emerald-dark text-white font-bold text-xs">
                      M
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Analisi del Maestro</h4>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {smazzata.commentary}
                  </p>
                </motion.div>
              )}

              {/* Key concepts */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="card-elevated rounded-2xl bg-card p-5 border border-border"
              >
                <h4 className="text-sm font-bold text-foreground mb-3">Riepilogo mano</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Contratto</span>
                    <span className="font-bold text-foreground">{smazzata.contract}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Lezione</span>
                    <span className="font-bold text-foreground">Lez. {getLessonDisplayNumber(smazzata.lesson)} - {lessonTitle}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vulnerabilità</span>
                    <span className="font-bold text-foreground">
                      {smazzata.vulnerability === "none" ? "Nessuna" : smazzata.vulnerability === "ns" ? "N-S" : smazzata.vulnerability === "ew" ? "E-O" : "Tutti"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Attacco</span>
                    <span className="font-bold text-foreground">{cardToString(smazzata.openingLead)}</span>
                  </div>
                  {ddTricks !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">DD Ottimale</span>
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
                defended={!declared}
              />

              {/* AI Analysis CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Link href="/gioca/analisi">
                  <div className="card-elevated card-interactive rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-900 p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 border border-violet-200 dark:bg-violet-900/40 dark:border-violet-800">
                        <span className="text-lg">🤖</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">Analizza con l&apos;AI</p>
                        <p className="text-[11px] text-muted-foreground">Scopri dove potevi migliorare</p>
                      </div>
                      <svg className="h-5 w-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="9,6 15,12 9,18" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
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
