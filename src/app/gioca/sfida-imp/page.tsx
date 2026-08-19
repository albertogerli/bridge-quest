"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { useChallenges, type ChallengeData, type BoardResult } from "@/hooks/use-challenges";
import { dealFromSeed } from "@/lib/hand-encoder";
import { calcTableAndPar } from "@/lib/dds-table";
import { contrattoDallaMano } from "@/lib/contratto-sfida";
import { reportError } from "@/lib/report-error";
import {
  calculateRawScore,
  calculateBoardIMP,
  calculateMatchIMP,
  getIMPVerdict,
} from "@/lib/bridge-scoring";
import {
  parseContract,
  toDisplayPosition,
  toGamePosition,
  partnershipOf,
  type Card,
  type GameState,
  type Position,
} from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { createClient } from "@/lib/supabase/client";
import { useSharedAuth } from "@/contexts/auth-provider";
import { ArrowLeft, Trophy, Clock, Swords, ChevronRight, CheckCircle2, XCircle, Minus } from "lucide-react";
import Link from "next/link";
import { useMobile } from "@/hooks/use-mobile";
import { useT } from "@/contexts/traduzioni-provider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * La vulnerabilità, presa dal seme della mano.
 *
 * Questa sì può venire dal seme: è una convenzione della smazzata, non dipende
 * dalle carte, e dev'essere identica per i due sfidanti. Il CONTRATTO invece
 * si calcola dalle carte — vedi `contrattoDallaMano`.
 */
function vulnerabilitaDalSeed(seed: string): boolean {
  return seed.charCodeAt(1) % 2 === 0;
}

/** Converte un contratto con lettera seme (S/H/D/C/NT) nella SuitChar per lo scoring. */
function contractSuitChar(contract: string): "S" | "H" | "D" | "C" | "NT" {
  const stripped = contract.replace(/[0-9]/g, "").replace(/x/gi, "").toUpperCase();
  const map: Record<string, "S" | "H" | "D" | "C" | "NT"> = {
    S: "S", H: "H", D: "D", C: "C", NT: "NT",
  };
  return map[stripped] ?? "NT";
}

/** Formattazione del risultato della mano (es. "+1", "-2", "="). */
function formatResult(diff: number): string {
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return "=";
}

/** Simbolo seme dal contratto. */
function contractDisplay(contract: string): string {
  const level = contract[0];
  const suit = contract.slice(1).toUpperCase().replace(/X/g, "");
  const symbols: Record<string, string> = {
    S: "\u2660", H: "\u2665", D: "\u2666", C: "\u2663", NT: "SA",
  };
  return `${level}${symbols[suit] ?? suit}`;
}

// ---------------------------------------------------------------------------
// Match phases
// ---------------------------------------------------------------------------

type MatchPhase =
  | "loading"
  | "error"
  | "info"
  | "playing"
  | "board-result"
  | "match-complete"
  | "waiting";

// ---------------------------------------------------------------------------
// Inner content (needs useSearchParams)
// ---------------------------------------------------------------------------

function SfidaIMPContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const challengeIdParam = searchParams.get("challengeId");
  const isMobile = useMobile();
  const auth = useSharedAuth();
  const supabase = createClient();
  const { submitResults } = useChallenges();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [currentBoard, setCurrentBoard] = useState(0);
  const [boardResults, setBoardResults] = useState<BoardResult[]>([]);
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isChallenger, setIsChallenger] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gameKey, setGameKey] = useState(0); // key to force re-mount of game hook
  const resultsSubmittedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Fetch challenge
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!challengeIdParam) {
      setError("Per giocare una Sfida IMP, sfida un amico dalla pagina Amici.");
      setMatchPhase("error");
      return;
    }

    let cancelled = false;

    async function fetchChallenge() {
      try {
        // Wait for auth to resolve
        if (auth.loading) return;

        const userId = auth.user?.id;
        if (!userId) {
          setError("Devi effettuare l'accesso per giocare una sfida IMP.");
          setMatchPhase("error");
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeIdParam)
          .single();

        if (cancelled) return;

        if (fetchError || !data) {
          setError("Sfida non trovata.");
          setMatchPhase("error");
          return;
        }

        const ch = data as ChallengeData;
        setChallenge(ch);

        const iAmChallenger = ch.challenger_id === userId;
        const iAmOpponent = ch.opponent_id === userId;
        setIsChallenger(iAmChallenger);

        if (!iAmChallenger && !iAmOpponent) {
          setError("Non sei un partecipante di questa sfida.");
          setMatchPhase("error");
          return;
        }

        // Check if this user already submitted results
        if (iAmChallenger && ch.challenger_results) {
          // Already played, show results or wait
          if (ch.status === "completed") {
            setMatchPhase("match-complete");
          } else {
            setMatchPhase("waiting");
          }
          return;
        }

        if (!iAmChallenger && ch.opponent_results) {
          if (ch.status === "completed") {
            setMatchPhase("match-complete");
          } else {
            setMatchPhase("waiting");
          }
          return;
        }

        setMatchPhase("info");
      } catch {
        if (!cancelled) {
          setError("Errore nel caricamento della sfida.");
          setMatchPhase("error");
        }
      }
    }

    fetchChallenge();
    return () => { cancelled = true; };
  }, [challengeIdParam, auth.loading, auth.user?.id, supabase]);

  // ---------------------------------------------------------------------------
  // Current board data
  // ---------------------------------------------------------------------------
  const currentSeed = challenge?.hands?.[currentBoard] ?? "";
  const dealData = useMemo(() => {
    if (!currentSeed) return null;
    return dealFromSeed(currentSeed);
  }, [currentSeed]);

  // Hands formatted for the game engine
  const gameHands = useMemo(() => {
    if (!dealData) return null;
    return {
      north: dealData.north,
      south: dealData.south,
      east: dealData.east,
      west: dealData.west,
    } as Record<Position, Card[]>;
  }, [dealData]);

  /**
   * Il contratto arriva dal solver, quindi non può stare in un `useMemo`.
   *
   * Finché non c'è, la mano non si monta: meglio un istante di attesa che una
   * partita iniziata su un contratto sbagliato e poi cambiata sotto le mani di
   * chi gioca.
   */
  const [contrattoRisolto, setContrattoRisolto] = useState<{
    /**
     * Il seme della mano per cui questo contratto è stato calcolato.
     *
     * SENZA, DALLA SECONDA MANO IN POI SI GIOCA IL CONTRATTO DI QUELLA PRIMA.
     * Cambiando board le carte sono immediate — escono da un `useMemo` sul
     * seme — mentre il contratto deve fare un giro dal solver. In quella
     * finestra il contratto vecchio è ancora lì, non è più nullo, e la partita
     * si monta sopra le carte nuove: 4♠ su una mano che di picche non ne ha.
     * Confrontare il seme rende quel contratto «non ancora arrivato» invece
     * che «sbagliato», e rimette in piedi l'attesa che il resto del codice
     * già prevede. Protegge anche dalle risposte fuori ordine, se la mano 1
     * atterra dopo la 2.
     */
    seme: string;
    contract: string;
    declarer: Position;
    vulnerable: boolean;
  } | null>(null);

  const boardContract = contrattoRisolto?.seme === currentSeed ? contrattoRisolto : null;

  useEffect(() => {
    if (!gameHands || !currentSeed) return;
    let vivo = true;
    void calcTableAndPar(gameHands, "north", "none")
      .then(({ table }: { table: Awaited<ReturnType<typeof calcTableAndPar>>["table"] }) => {
        if (!vivo) return;
        const scelto = contrattoDallaMano(table);
        setContrattoRisolto({
          seme: currentSeed,
          contract: scelto.contract,
          declarer: scelto.declarer,
          vulnerable: vulnerabilitaDalSeed(currentSeed),
        });
      })
      .catch((err: unknown) => {
        reportError("sfida-imp:contratto", err);
        // Senza solver non si inventa un contratto a caso — è esattamente il
        // difetto da cui veniamo. Si resta in attesa e la mano non parte.
      });
    return () => {
      vivo = false;
    };
  }, [gameHands, currentSeed]);


  // ---------------------------------------------------------------------------
  // Bridge game hook
  // ---------------------------------------------------------------------------
  const declarer: Position = boardContract?.declarer ?? "south";
  const dummyGamePos = toGamePosition("north" as Position, declarer);

  const gameConfig = useMemo(() => {
    if (!gameHands || !boardContract) {
      return {
        hands: { north: [], south: [], east: [], west: [] } as Record<Position, Card[]>,
        contract: "1NT",
        declarer: "south" as Position,
        playerPositions: ["south" as Position, "north" as Position],
      };
    }
    return {
      hands: gameHands,
      contract: boardContract.contract,
      declarer: boardContract.declarer,
      playerPositions: [boardContract.declarer, dummyGamePos] as Position[],
    };
    // `boardContract` è in elenco perché arriva DOPO il primo render: senza,
    // la partita resterebbe montata sul contratto di ripiego.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameKey, currentBoard, boardContract]);

  const game = useBridgeGame(gameConfig);

  // ---------------------------------------------------------------------------
  // Game finish handler
  // ---------------------------------------------------------------------------
  const gameFinishedRef = useRef(false);

  useEffect(() => {
    if (game.phase !== "finished" || !game.result || !boardContract || gameFinishedRef.current) return;
    gameFinishedRef.current = true;

    const { tricksMade } = game.result;

    // Calculate raw score
    const suitChar = contractSuitChar(boardContract.contract);
    const level = parseInt(boardContract.contract[0], 10);
    const rawScore = calculateRawScore({
      level,
      suitChar,
      doubled: false,
      redoubled: false,
      vulnerable: boardContract.vulnerable,
      tricksMade,
    });

    const boardResult: BoardResult = {
      boardIndex: currentBoard,
      contract: boardContract.contract,
      declarer: boardContract.declarer,
      tricksMade,
      rawScore,
    };

    setBoardResults((prev) => [...prev, boardResult]);
    setMatchPhase("board-result");
  }, [game.phase, game.result, boardContract, currentBoard]);

  // ---------------------------------------------------------------------------
  // Navigation between boards
  // ---------------------------------------------------------------------------
  const totalBoards = challenge?.board_count ?? 1;

  const goNextBoard = useCallback(() => {
    const nextBoard = currentBoard + 1;
    if (nextBoard >= totalBoards) {
      // All boards played, submit results
      setMatchPhase("match-complete");
      return;
    }
    setCurrentBoard(nextBoard);
    gameFinishedRef.current = false;
    setGameKey((k) => k + 1);
    setMatchPhase("playing");
  }, [currentBoard, totalBoards]);

  // ---------------------------------------------------------------------------
  // Submit results to Supabase
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (matchPhase !== "match-complete" || !challenge || resultsSubmittedRef.current) return;
    if (boardResults.length === 0) return; // viewing completed challenge

    resultsSubmittedRef.current = true;
    setSubmitting(true);

    (async () => {
      try {
        await submitResults(challenge.id, boardResults, isChallenger);
        // Re-fetch to get opponent results if available
        const { data } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", challenge.id)
          .single();

        if (data) {
          setChallenge(data as ChallengeData);
        }
      } catch (err) {
        console.error("Errore invio risultati:", err);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [matchPhase, challenge, boardResults, isChallenger, submitResults, supabase]);

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------
  const displayHands = useCallback((gs: GameState | null) => {
    if (!gs) return null;
    return {
      north: gs.hands[toGamePosition("north" as Position, declarer)] as CardData[],
      south: gs.hands[toGamePosition("south" as Position, declarer)] as CardData[],
      east: gs.hands[toGamePosition("east" as Position, declarer)] as CardData[],
      west: gs.hands[toGamePosition("west" as Position, declarer)] as CardData[],
    };
  }, [declarer]);

  const handlePlayCard = useCallback((displayPosition: string, cardIndex: number) => {
    if (!game.gameState) return;
    const gamePos = toGamePosition(displayPosition as Position, declarer);
    const hand = game.gameState.hands[gamePos];
    if (!hand || cardIndex >= hand.length) return;
    game.handleCardPlay(hand[cardIndex]);
  }, [game, declarer]);

  const mapTrickToDisplay = useCallback((plays: { position: string; card: CardData }[]) =>
    plays.map((tp) => ({
      position: toDisplayPosition(tp.position as Position, declarer),
      card: tp.card,
    })), [declarer]);

  const trickDisplay = useMemo(() =>
    game.gameState?.currentTrick.map((tp) => ({
      position: tp.position as string,
      card: tp.card as CardData,
    })) ?? [], [game.gameState?.currentTrick]);

  const displayTrick = useMemo(() =>
    game.phase === "trick-complete" && game.lastTrick
      ? mapTrickToDisplay(
          game.lastTrick.map((tp) => ({
            position: tp.position,
            card: tp.card as CardData,
          }))
        )
      : mapTrickToDisplay(trickDisplay),
    [game.phase, game.lastTrick, mapTrickToDisplay, trickDisplay]);

  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? toDisplayPosition(game.gameState.currentPlayer, declarer)
      : undefined;

  const hands = game.gameState ? displayHands(game.gameState) : null;

  // Opponent info
  const opponentName = useMemo(() => {
    if (!challenge) return "Avversario";
    if (isChallenger) {
      return challenge.opponent_name ?? "Avversario";
    }
    return challenge.challenger_name ?? "Sfidante";
  }, [challenge, isChallenger]);

  const opponentAvatar = useMemo(() => {
    if (!challenge) return null;
    if (isChallenger) return challenge.opponent_avatar ?? null;
    return challenge.challenger_avatar ?? null;
  }, [challenge, isChallenger]);

  // Current board result (for board-result phase)
  const currentBoardResult = boardResults[boardResults.length - 1] ?? null;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  // ── LOADING ──
  if (matchPhase === "loading") {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full mb-4"
          />
          <p className="text-sm text-muted-foreground font-medium">{t("Caricamento sfida...")}</p>
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (matchPhase === "error") {
    const isNoChallengeId = !challengeIdParam;
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-20"
          >
            <div className={`flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 ${
              isNoChallengeId ? "bg-violet-50 dark:bg-violet-950/40" : "bg-red-50 dark:bg-red-950/40"
            }`}>
              {isNoChallengeId ? (
                <Swords className="w-8 h-8 text-violet-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {isNoChallengeId ? "Sfida IMP" : "Errore"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {isNoChallengeId && (
                <Link href="/amici">
                  <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-bold h-11 px-6">
                    <Swords className="w-4 h-4 mr-2" />
                    {t("Sfida un amico")}
                  </Button>
                </Link>
              )}
              <Link href="/gioca">
                <Button variant={isNoChallengeId ? "outline" : "default"} className={`rounded-xl text-sm font-bold h-11 px-6 ${
                  isNoChallengeId ? "" : "bg-figb hover:bg-figb-dark"
                }`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("Torna a Gioca")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── INFO (pre-game) ──
  if (matchPhase === "info" && challenge) {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-6xl">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Link href="/gioca" className="hover:text-figb dark:hover:text-primary transition-colors font-bold">
                {t("Gioca")}
              </Link>
              <span>/</span>
              <span className="text-figb dark:text-primary font-semibold">{t("Sfida IMP")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/gioca"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground font-display">{t("Sfida IMP")}</h1>
            </div>
          </motion.div>

          {/* Challenge Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-figb to-figb-dark p-6">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              <div className="relative">
                {/* Opponent */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl">
                    {opponentAvatar ? (
                      <Image
                        src={opponentAvatar}
                        alt={opponentName}
                        width={56}
                        height={56}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Swords className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white/60 font-medium">{t("Avversario")}</p>
                    <p className="text-lg font-bold text-white">{opponentName}</p>
                  </div>
                  <Badge className="ml-auto bg-amber-400/20 text-amber-200 text-xs font-bold border-0">
                    {challenge.board_count} {challenge.board_count === 1 ? "mano" : "mani"}
                  </Badge>
                </div>

                {/* Description */}
                <div className="bg-white/10 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-white/80 leading-relaxed">
                    {t("Giocherai")} <span className="font-bold text-white">{challenge.board_count} {challenge.board_count === 1 ? "mano" : "mani"}</span> con
                    lo stesso smazzamento del tuo avversario.
                    I risultati verranno confrontati in <span className="font-bold text-amber-300">IMP</span>.
                  </p>
                </div>

                {/* Start button */}
                <button
                  onClick={() => {
                    setMatchPhase("playing");
                    setCurrentBoard(0);
                    setBoardResults([]);
                    gameFinishedRef.current = false;
                    resultsSubmittedRef.current = false;
                    setGameKey((k) => k + 1);
                  }}
                  className="w-full py-4 rounded-2xl bg-white text-figb font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  {t("Inizia la Sfida")}
                </button>
              </div>
            </div>
          </motion.div>

          {/* How IMP works */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <div className="rounded-2xl bg-card p-5 border-2 border-border shadow-[0_4px_0_var(--border)]">
              <h3 className="font-bold text-foreground mb-3">{t("Come funziona il punteggio IMP")}</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-figb/10 dark:bg-primary/15 text-xs font-bold text-figb dark:text-primary">
                    1
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("Entrambi i giocatori giocano le stesse mani con lo stesso contratto.")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-figb/10 dark:bg-primary/15 text-xs font-bold text-figb dark:text-primary">
                    2
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("La differenza di punteggio viene convertita in IMP usando la tabella WBF.")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-figb/10 dark:bg-primary/15 text-xs font-bold text-figb dark:text-primary">
                    3
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chi ottiene pi&ugrave; IMP alla fine di tutte le mani vince il match.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── PLAYING ──
  if (matchPhase === "playing" && challenge && boardContract && gameHands) {
    const { tricksNeeded } = parseContract(boardContract.contract);

    return (
      <div className="pt-4 px-4 pb-24">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-3"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Link
                href="/gioca"
                className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Badge className="bg-figb/10 text-figb dark:bg-primary/15 dark:text-primary text-[12px] font-bold border-0">
                {t("Sfida IMP")}
              </Badge>
            </div>
            <h1 className="text-lg font-bold text-foreground">
              Mano {currentBoard + 1} di {totalBoards}
            </h1>
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {Array.from({ length: totalBoards }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i < currentBoard
                      ? "bg-emerald-500"
                      : i === currentBoard
                        ? "bg-figb dark:bg-primary"
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
            className="mb-4 flex items-center justify-center"
          >
            <div className="card-elevated rounded-xl bg-card px-4 py-2 flex items-center gap-5 text-sm">
              <div className="text-center">
                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{t("Contratto")}</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{contractDisplay(boardContract.contract)}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{t("Obiettivo")}</p>
                <p className="text-lg font-bold text-foreground">{tricksNeeded} prese</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{t("Dich. / Dif.")}</p>
                <p className="text-lg font-bold text-foreground">
                  {partnershipOf(declarer) === "ew"
                    ? `${game.gameState?.trickCount.ew ?? 0} / ${game.gameState?.trickCount.ns ?? 0}`
                    : `${game.gameState?.trickCount.ns ?? 0} / ${game.gameState?.trickCount.ew ?? 0}`}
                </p>
              </div>
              {boardContract.vulnerable && (
                <>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-[12px] font-bold border-0">
                      {t("Vuln.")}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Bridge Table */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto"
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
                contract={boardContract.contract}
                declarer="S"
                trickCount={game.gameState!.trickCount}
                onPlayCard={handlePlayCard}
                highlightedCards={game.validCards as CardData[]}
                activePosition={activeDisplayPos}
                disabled={!game.isPlayerTurn}
                compact={isMobile}
                trumpSuit={game.gameState?.trumpSuit}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p className="text-sm">{t("Preparazione della mano...")}</p>
              </div>
            )}
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
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                    : game.isPlayerTurn
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                }`}
              >
                {game.message}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Start button (before game starts) */}
          {game.phase === "ready" && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={game.startGame}
                className="rounded-xl bg-figb hover:bg-figb-dark text-sm font-bold h-12 px-8 shadow-lg shadow-figb/20"
              >
                {t("Gioca questa mano")}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── BOARD RESULT ──
  if (matchPhase === "board-result" && currentBoardResult && boardContract) {
    const { tricksNeeded } = parseContract(boardContract.contract);
    const trickDiff = currentBoardResult.tricksMade - tricksNeeded;
    const isLastBoard = currentBoard >= totalBoards - 1;

    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {/* Result Icon */}
            <div className={`flex h-20 w-20 items-center justify-center rounded-full mx-auto mb-4 ${
              trickDiff >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-red-50 dark:bg-red-950/40"
            }`}>
              {trickDiff >= 0 ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              ) : (
                <XCircle className="w-10 h-10 text-red-500" />
              )}
            </div>

            <h2 className="text-xl font-bold text-foreground mb-1">
              Mano {currentBoard + 1} di {totalBoards}
            </h2>
            <p className={`text-lg font-bold ${trickDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
              {trickDiff >= 0
                ? trickDiff === 0 ? "Contratto mantenuto!" : `Contratto fatto con ${trickDiff} extra!`
                : `Contratto caduto di ${Math.abs(trickDiff)}`}
            </p>

            {/* Stats */}
            <div className="mt-6 rounded-2xl bg-card p-5 border-2 border-border shadow-[0_4px_0_var(--border)]">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("Contratto")}</p>
                  <p className="text-xl font-bold text-foreground">{contractDisplay(boardContract.contract)}</p>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("Prese")}</p>
                  <p className="text-xl font-bold text-foreground">{currentBoardResult.tricksMade}/{tricksNeeded}</p>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("Risultato")}</p>
                  <p className={`text-xl font-bold ${trickDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {formatResult(trickDiff)}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border text-center">
                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("Punteggio grezzo")}</p>
                <p className={`text-lg font-bold ${currentBoardResult.rawScore >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                  {currentBoardResult.rawScore > 0 ? "+" : ""}{currentBoardResult.rawScore}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {Array.from({ length: totalBoards }, (_, i) => (
                <div
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    i <= currentBoard ? "bg-figb dark:bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Action */}
            <button
              onClick={goNextBoard}
              className="mt-6 w-full py-4 rounded-2xl bg-figb text-white font-bold text-base shadow-lg hover:bg-figb-dark transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLastBoard ? (
                <>
                  <Trophy className="w-5 h-5" />
                  {t("Vedi risultato finale")}
                </>
              ) : (
                <>
                  {t("Prossima mano")}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── MATCH COMPLETE ──
  if (matchPhase === "match-complete" && challenge) {
    const cResults = challenge.challenger_results ?? (isChallenger ? boardResults : null);
    const oResults = challenge.opponent_results ?? (!isChallenger ? boardResults : null);
    const bothPlayed = cResults && oResults && cResults.length > 0 && oResults.length > 0;

    // If we just submitted, use our local boardResults
    const myResults = isChallenger ? cResults : oResults;

    if (submitting) {
      return (
        <div className="pt-6 px-5 pb-24">
          <div className="mx-auto max-w-6xl flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full mb-4"
            />
            <p className="text-sm text-muted-foreground font-medium">{t("Invio risultati...")}</p>
          </div>
        </div>
      );
    }

    if (bothPlayed) {
      // Both sides have results -- show full comparison
      const boards = cResults!.map((cr, i) => ({
        challengerScore: cr.rawScore,
        opponentScore: oResults![i]?.rawScore ?? 0,
      }));
      const fullResult = calculateMatchIMP(boards);
      const myNet = isChallenger ? fullResult.net : -fullResult.net;
      const verdict = getIMPVerdict(myNet);

      // Per-board IMP details
      const boardIMPs = boards.map((b) => calculateBoardIMP(b));

      return (
        <div className="pt-6 px-5 pb-24">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              {/* Verdict */}
              <div className={`flex h-20 w-20 items-center justify-center rounded-full mx-auto mb-4 ${
                myNet > 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : myNet < 0 ? "bg-red-50 dark:bg-red-950/40" : "bg-amber-50 dark:bg-amber-950/40"
              }`}>
                {myNet > 0 ? (
                  <Trophy className="w-10 h-10 text-emerald-500" />
                ) : myNet < 0 ? (
                  <XCircle className="w-10 h-10 text-red-500" />
                ) : (
                  <Minus className="w-10 h-10 text-amber-500" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-1">{verdict}</h2>
              <p className={`text-lg font-bold ${
                myNet > 0 ? "text-emerald-600 dark:text-emerald-400" : myNet < 0 ? "text-red-500 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
              }`}>
                {myNet > 0 ? "+" : ""}{myNet} IMP
              </p>

              {/* Comparison Table */}
              <div className="mt-6 rounded-2xl bg-card border-2 border-border shadow-[0_4px_0_var(--border)] overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-5 text-[12px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-4 py-3">
                  <div className="text-left">{t("Mano")}</div>
                  <div className="text-center">{t("Contr.")}</div>
                  <div className="text-center">Tu</div>
                  <div className="text-center">{t("Avv.")}</div>
                  <div className="text-right">IMP</div>
                </div>

                {/* Table Rows */}
                {cResults!.map((cr, i) => {
                  const or = oResults![i];
                  const boardImp = boardIMPs[i];
                  const myIMP = isChallenger
                    ? boardImp.challengerIMP - boardImp.opponentIMP
                    : boardImp.opponentIMP - boardImp.challengerIMP;
                  const myTricksNeeded = parseContract(cr.contract).tricksNeeded;
                  const myDiff = (isChallenger ? cr : or).tricksMade - myTricksNeeded;
                  const theirDiff = (isChallenger ? or : cr).tricksMade - myTricksNeeded;

                  return (
                    <div key={i} className="grid grid-cols-5 text-sm px-4 py-2.5 border-t border-border items-center">
                      <div className="text-left font-bold text-foreground/80">{i + 1}</div>
                      <div className="text-center text-muted-foreground text-xs font-medium">
                        {contractDisplay(cr.contract)}
                      </div>
                      <div className={`text-center font-bold ${myDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {formatResult(myDiff)}
                      </div>
                      <div className={`text-center font-bold ${theirDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {formatResult(theirDiff)}
                      </div>
                      <div className={`text-right font-bold ${myIMP > 0 ? "text-emerald-600 dark:text-emerald-400" : myIMP < 0 ? "text-red-500 dark:text-red-400" : "text-muted-foreground"}`}>
                        {myIMP > 0 ? "+" : ""}{myIMP}
                      </div>
                    </div>
                  );
                })}

                {/* Total row */}
                <div className="grid grid-cols-5 text-sm px-4 py-3 border-t-2 border-figb/20 bg-figb/5 dark:border-primary/30 dark:bg-primary/10 items-center">
                  <div className="col-span-4 text-left font-bold text-figb dark:text-primary">{t("Totale")}</div>
                  <div className={`text-right font-bold text-lg ${
                    myNet > 0 ? "text-emerald-600 dark:text-emerald-400" : myNet < 0 ? "text-red-500 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                  }`}>
                    {myNet > 0 ? "+" : ""}{myNet}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <Link href="/amici" className="block">
                  <button className="w-full py-3.5 rounded-2xl bg-figb text-white font-bold text-sm shadow-lg hover:bg-figb-dark transition-all active:scale-[0.98]">
                    {t("Torna agli amici")}
                  </button>
                </Link>
                <Link href="/gioca" className="block">
                  <button className="w-full py-3 rounded-2xl bg-muted text-foreground/80 font-bold text-sm hover:bg-muted/70 transition-all">
                    {t("Vai a Gioca")}
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    // Only one side has submitted -- show "waiting" state
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-figb/10 dark:bg-primary/15 mx-auto mb-4">
              <Clock className="w-10 h-10 text-figb dark:text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t("Risultati inviati!")}</h2>
            <p className="text-sm text-muted-foreground mb-2 max-w-xs mx-auto">
              I tuoi risultati sono stati registrati.
              Ti notificheremo quando il tuo avversario avr&agrave; completato la sfida.
            </p>

            {/* My results summary */}
            {myResults && myResults.length > 0 && (
              <div className="mt-6 rounded-2xl bg-card p-4 border-2 border-border shadow-[0_4px_0_var(--border)]">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t("I tuoi risultati")}</h3>
                {myResults.map((r, i) => {
                  const needed = parseContract(r.contract).tricksNeeded;
                  const diff = r.tricksMade - needed;
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-t border-border/50 first:border-0">
                      <span className="text-sm text-muted-foreground">Mano {i + 1}: {contractDisplay(r.contract)}</span>
                      <span className={`text-sm font-bold ${diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {formatResult(diff)} ({r.rawScore > 0 ? "+" : ""}{r.rawScore})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <Link href="/amici" className="block">
                <button className="w-full py-3.5 rounded-2xl bg-figb text-white font-bold text-sm shadow-lg hover:bg-figb-dark transition-all active:scale-[0.98]">
                  {t("Torna agli amici")}
                </button>
              </Link>
              <Link href="/gioca" className="block">
                <button className="w-full py-3 rounded-2xl bg-muted text-foreground/80 font-bold text-sm hover:bg-muted/70 transition-all">
                  {t("Vai a Gioca")}
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── WAITING (already submitted, opponent hasn't yet) ──
  if (matchPhase === "waiting" && challenge) {
    return (
      <div className="pt-6 px-5 pb-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 mx-auto mb-4"
            >
              <Clock className="w-10 h-10 text-amber-500" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t("In attesa del risultato")}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Hai gi&agrave; giocato questa sfida. Stiamo aspettando che <strong>{opponentName}</strong> completi le sue mani.
            </p>

            {/* Check for updates */}
            <button
              onClick={async () => {
                const { data } = await supabase
                  .from("challenges")
                  .select("*")
                  .eq("id", challenge.id)
                  .single();
                if (data) {
                  const ch = data as ChallengeData;
                  setChallenge(ch);
                  if (ch.status === "completed") {
                    setMatchPhase("match-complete");
                  }
                }
              }}
              className="mb-4 py-2.5 px-6 rounded-xl border-2 border-figb/20 text-figb hover:bg-figb/5 dark:border-primary/30 dark:text-primary dark:hover:bg-primary/10 font-bold text-sm transition-all"
            >
              {t("Controlla aggiornamenti")}
            </button>

            <div className="space-y-3">
              <Link href="/amici" className="block">
                <button className="w-full py-3.5 rounded-2xl bg-figb text-white font-bold text-sm shadow-lg hover:bg-figb-dark transition-all active:scale-[0.98]">
                  {t("Torna agli amici")}
                </button>
              </Link>
              <Link href="/gioca" className="block">
                <button className="w-full py-3 rounded-2xl bg-muted text-foreground/80 font-bold text-sm hover:bg-muted/70 transition-all">
                  {t("Vai a Gioca")}
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── FALLBACK ──
  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-6xl flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full mb-4"
        />
        <p className="text-sm text-muted-foreground font-medium">{t("Caricamento...")}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper with Suspense (needed for useSearchParams)
// ---------------------------------------------------------------------------

export default function SfidaIMPPage() {
  const t = useT();
  return (
    <Suspense
      fallback={
        <div className="pt-6 px-5 pb-24">
          <div className="mx-auto max-w-6xl flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-muted-foreground font-medium">{t("Caricamento sfida...")}</p>
          </div>
        </div>
      }
    >
      <SfidaIMPContent />
    </Suspense>
  );
}
