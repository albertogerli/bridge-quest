"use client";

import { useEffect, useMemo, useRef, useState, use } from "react";
import { Briciole } from "@/components/briciole";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import Link from "@/components/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BridgeTable } from "@/components/bridge/bridge-table";
import { GameActions } from "@/components/bridge/game-actions";
import { useBridgeGame } from "@/hooks/use-bridge-game";
import { useCommento } from "@/hooks/use-commento";
import { useSmazzate, useValidatedSmazzate } from "@/store/use-smazzate-store";
import type { BiddingData, Smazzata } from "@/lib/catalog";
import { getLessonDisplayNumber } from "@/data/lesson-meta";
import type { Position } from "@/lib/bridge-engine";
import {
  parseContract,
  toDisplayPosition,
  toGamePosition,
  partnershipOf,
  partnerOf,
} from "@/lib/bridge-engine";
import type { CardData } from "@/components/bridge/playing-card";
import { classifyPlayErrors } from "@/lib/play-error-classifier";
import { BiddingPanel } from "@/components/bridge/bidding-panel";
import { senzaLicita } from "@/lib/gioco-della-carta";
import { PannelloMinibridge } from "@/components/bridge/pannello-minibridge";
import { PulsanteSegnalazione } from "@/components/pulsante-segnalazione";
import { Cronometro, ripulisci } from "@/lib/tempi";
import { ConfrontoClasse } from "@/components/bridge/confronto-classe";
import { ProvaDaQui } from "@/components/bridge/prova-da-qui";
import { BenStatus } from "@/components/bridge/ben-status";
// Overlay del tutorial: compare solo a partita avviata e resta chiuso finché
// l'utente non lo apre → fuori dal first load della pagina di gioco.
const GameTutorial = dynamic(
  () => import("@/components/bridge/game-tutorial").then((m) => m.GameTutorial),
  { ssr: false },
);
import { CelebrationCombo } from "@/components/celebration-effects";
import { useSound } from "@/hooks/use-sound";
import { useMobile } from "@/hooks/use-mobile";
import { awardGameXp } from "@/lib/xp-utils";
import {
  getAssignment,
  getMyAssignmentProgress,
  getMyAssignmentResults,
  recordAssignmentResult,
  type Assignment,
  type HandResult,
} from "@/lib/instructors";
import { ArrowLeft, Play, CheckCircle2, XCircle, Lightbulb, RotateCcw } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { contrattoLeggibile } from "@/lib/contratto-leggibile";
import { CompitoLicitaMano, type ContrattoDaGiocare } from "@/components/classi/compito-licita-mano";
import { licitaInAscii, stelleScritte } from "@/lib/compito-licita";
import { segnalaSalvoRete } from "@/lib/report-error";

export default function CompitoPage({
  params,
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const t = useT();
  const { classId, assignmentId } = use(params);

  const { isLoaded: smazzateLoaded } = useSmazzate();
  const validated = useValidatedSmazzate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, HandResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  /** Compito di licita: il contratto appena dichiarato, mentre lo si gioca. */
  const [giocoLicita, setGiocoLicita] = useState<{
    index: number;
    gioco: ContrattoDaGiocare;
    dopoLicita: { contract: string; declarer: Position; bidding: BiddingData };
  } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const a = await getAssignment(assignmentId);
        const [prog, res] = await Promise.all([
          getMyAssignmentProgress([assignmentId]),
          getMyAssignmentResults([assignmentId]),
        ]);
        if (active) {
          setAssignment(a);
          setDoneIds(prog.get(assignmentId) ?? new Set());
          setResults(res.get(assignmentId) ?? new Map());
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Errore nel caricamento");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [assignmentId]);

  // Ordered playable hands for this assignment: from the global catalog or,
  // for ids not found there, from the assignment's own PBN-imported hands.
  const hands: Smazzata[] = assignment
    ? assignment.smazzata_ids
        .map(
          (id) =>
            validated.find((s) => s.id === id) ??
            assignment.custom_hands?.find((s) => s.id === id)
        )
        .filter((s): s is Smazzata => s !== undefined)
    : [];

  if (loading || !smazzateLoaded) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-destructive">{error ?? "Compito non trovato"}</p>
      </div>
    );
  }

  // Compito di licita, seconda parte: si gioca il contratto dichiarato. La
  // riga della licita è già registrata; questa la sostituisce aggiungendo il
  // gioco, con lo stesso `score` — la classifica di classe resta sulla licita.
  if (assignment.licita && giocoLicita && currentIndex === giocoLicita.index) {
    const smazzata = hands[currentIndex];
    const { riga } = giocoLicita.gioco;
    return (
      <CompitoHandGame
        key={`${smazzata.id}-gioco`}
        smazzata={smazzata}
        dopoLicita={giocoLicita.dopoLicita}
        handNumber={currentIndex + 1}
        totalHands={hands.length}
        onFinish={async (_score, gioco) => {
          const details = {
            ...riga.details,
            play: gioco.play,
            errors: gioco.errors,
            gioco: {
              contract: gioco.contract,
              tricksMade: gioco.tricksMade,
              tricksNeeded: gioco.tricksNeeded,
              result: gioco.result,
              difesa: gioco.difesa === true,
              durationMs: gioco.durationMs,
              tempi: gioco.tempi,
            },
          };
          try {
            await recordAssignmentResult({ assignmentId, smazzataId: smazzata.id, score: riga.score, details });
          } catch (err) {
            segnalaSalvoRete("compito-licita:gioco", err);
          }
          setGiocoLicita(null);
          setCurrentIndex(null);
        }}
        onBack={() => {
          setGiocoLicita(null);
          setCurrentIndex(null);
        }}
      />
    );
  }

  // Compito di licita: la mano si dichiara invece di giocarsi.
  if (assignment.licita && currentIndex !== null && currentIndex < hands.length) {
    const smazzata = hands[currentIndex];
    return (
      <CompitoLicitaMano
        key={smazzata.id}
        smazzata={smazzata}
        handNumber={currentIndex + 1}
        totalHands={hands.length}
        onRegistra={async (score, details) => {
          await recordAssignmentResult({ assignmentId, smazzataId: smazzata.id, score, details });
          setDoneIds((prev) => new Set(prev).add(smazzata.id));
          setResults((prev) =>
            new Map(prev).set(smazzata.id, {
              made: details.made === true,
              result: score,
              stelle: typeof details.stelle === "number" ? details.stelle : undefined,
              contratto: typeof details.contratto === "string" ? details.contratto : null,
            }),
          );
        }}
        onEsci={() => setCurrentIndex(null)}
        // «Solo licita»: l'insegnante ha scelto che la mano finisca con l'asta.
        onGioca={
          assignment.licita_gioca === false
            ? undefined
            : (gioco) =>
                setGiocoLicita({
                  index: currentIndex,
                  gioco,
                  dopoLicita: {
                    contract: gioco.contract,
                    declarer: gioco.declarer,
                    bidding: { dealer: gioco.dealer, bids: licitaInAscii(gioco.bids) },
                  },
                })
        }
      />
    );
  }

  // Playing a hand
  if (currentIndex !== null && currentIndex < hands.length) {
    const smazzata = hands[currentIndex];
    return (
      <CompitoHandGame
        smazzata={smazzata}
        minibridge={assignment.minibridge}
        handNumber={currentIndex + 1}
        totalHands={hands.length}
        onFinish={async (score, details) => {
          try {
            await recordAssignmentResult({
              assignmentId,
              smazzataId: smazzata.id,
              score,
              details,
            });
          } catch {
            // best-effort; the local state still advances so the student isn't stuck
          }
          setDoneIds((prev) => new Set(prev).add(smazzata.id));
          setResults((prev) => new Map(prev).set(smazzata.id, { made: score >= 0, result: score }));
          setCurrentIndex(null);
        }}
        onBack={() => setCurrentIndex(null)}
      />
    );
  }

  const completedCount = hands.filter((h) => doneIds.has(h.id)).length;
  const downCount = hands.filter((h) => {
    const r = results.get(h.id);
    return r && !r.made;
  }).length;
  const nextIndex = hands.findIndex((h) => !doneIds.has(h.id));
  const allDone = completedCount === hands.length && hands.length > 0;

  // Overview
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <PulsanteSegnalazione
        zona="compito"
        contestoExtra={{ classId, assignmentId }}
      />

      <Briciole
        percorso={[
          { etichetta: "Le mie classi", href: "/classi" },
          { etichetta: "La classe", href: `/classi/${classId}` },
          { etichetta: assignment.title },
        ]}
      />

      <div className="mb-2">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          {assignment.title}
        </h1>
        {assignment.instructor_note && (
          <p className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            📝 {assignment.instructor_note}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6 mt-4">
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hands.length ? (completedCount / hands.length) * 100 : 0}%` }}
            transition={{ duration: 0.6 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {completedCount}/{hands.length} mani completate
          {downCount > 0 && !assignment.licita && (
            <span className="font-bold text-red-600"> · {downCount} {downCount === 1 ? "caduta" : "cadute"} da rigiocare</span>
          )}
          {downCount > 0 && assignment.licita && (
            <span className="font-bold text-red-600">
              {" · "}
              {downCount === 1
                ? t("1 da ridichiarare")
                : t("{n} da ridichiarare", { n: downCount })}
            </span>
          )}
          {allDone && downCount === 0 && " — Compito completato! 🎉"}
        </p>
      </div>

      {hands.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("Le smazzate di questo compito non sono al momento disponibili nel catalogo.")}
        </p>
      )}

      {/* Hands list */}
      {assignment.esercizio_ids.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold">{t("Posizioni da risolvere")}</p>
          <div className="space-y-2">
            {assignment.esercizio_ids.map((id, i) => (
              <Link
                key={id}
                href={`/classi/${classId}/esercizio/${id}?compito=${assignmentId}`}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50 ${
                  doneIds.has(id) ? "border-emerald-200 dark:border-emerald-900" : "border-border"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                  {doneIds.has(id) ? "✓" : i + 1}
                </span>
                <span className="text-sm font-medium">
                  {doneIds.has(id) ? "Risolta — rivedila" : "Cosa faresti qui?"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {hands.map((hand, i) => {
          const r = results.get(hand.id);
          const isPlayed = doneIds.has(hand.id) || !!r;
          const isDown = !!r && !r.made;
          const isMade = !!r && r.made;
          const isNext = i === nextIndex;
          return (
            <motion.div
              key={hand.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border bg-card p-4 transition-all ${
                isDown
                  ? "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                  : isMade
                    ? "border-emerald-200 dark:border-emerald-900"
                    : isNext
                      ? "border-primary/40 shadow-md"
                      : "border-border opacity-70"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    isDown
                      ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                      : isMade
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : isNext
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDown ? <XCircle className="h-5 w-5" /> : isMade ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-bold">{i + 1}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    Mano {i + 1}: {hand.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.licita
                      ? t("Da dichiarare: sei Sud")
                      : senzaLicita(hand.lesson)
                      ? t("Obiettivo {n} prese", { n: parseContract(hand.contract).tricksNeeded })
                      : t("Contratto {c}", { c: contrattoLeggibile(hand.contract) })} ·{" "}
                    {hand.lesson > 0
                      ? `Lezione ${getLessonDisplayNumber(hand.lesson)}`
                      : "Mano dell'insegnante"}
                  </p>
                  {assignment.licita && r && (
                    <p className={`mt-0.5 text-xs font-semibold ${isDown ? "text-red-600" : "text-emerald-600"}`}>
                      {r.contratto
                        ? t("{contratto} — {stelle} stelle su 3", { contratto: r.contratto, stelle: stelleScritte(r.stelle ?? 0) })
                        : t("Passo generale — {stelle} stelle su 3", { stelle: stelleScritte(r.stelle ?? 0) })}
                      {isDown && ` · ${t("ridichiarala")}`}
                    </p>
                  )}
                  {!assignment.licita && isDown && (
                    <p className="mt-0.5 text-xs font-bold text-red-600">
                      {senzaLicita(hand.lesson)
                        ? t("Obiettivo mancato — rigioca questa mano")
                        : <>Caduto{r ? ` di ${Math.abs(r.result)}` : ""} — rigioca questa mano</>}
                    </p>
                  )}
                  {!assignment.licita && isMade && (
                    <p className="mt-0.5 text-xs font-semibold text-emerald-600">{t("Mantenuto ✓")}</p>
                  )}
                </div>
                {(isNext || isPlayed) && (
                  <Button
                    onClick={() => setCurrentIndex(i)}
                    size="sm"
                    variant={isDown ? "default" : isPlayed ? "outline" : "default"}
                    className={`shrink-0 ${isDown ? "bg-red-600 text-white hover:bg-red-700" : ""}`}
                  >
                    <Play className="mr-1 h-3.5 w-3.5" />
                    {assignment.licita
                      ? isPlayed ? t("Ridichiara") : t("Dichiara")
                      : isPlayed ? "Rigioca" : "Gioca"}
                  </Button>
                )}
              </div>
              {isPlayed && (
                <SoluzioneMano smazzata={hand} ricarica={doneIds.size} assignmentId={assignmentId} licita={assignment.licita} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * La soluzione di una mano già giocata.
 *
 * PRIMA STAVA SOLO PRIMA DELLA MANO, e con le soluzioni protette non si sarebbe
 * più vista mai: il suggerimento compariva alla schermata di partenza — proprio
 * il momento in cui ora il commento non arriva — e alla fine della mano si
 * torna qui all'elenco senza passare da nessuna schermata che lo mostri. Il
 * posto giusto per il commento, quando è una soluzione e non un aiuto, è
 * accanto alla mano finita.
 *
 * Se il commento non arriva non si mostra niente: può non esserci, o può non
 * spettare ancora (compito «dopo la scadenza»), e all'allievo le due cose
 * devono somigliare.
 */
function SoluzioneMano({
  smazzata,
  ricarica,
  assignmentId,
  licita = false,
}: {
  smazzata: Smazzata;
  ricarica: unknown;
  assignmentId?: string;
  /**
   * Compito di licita: il confronto («l'hanno mantenuto») e la prova col
   * contratto di riserva parlano del gioco della carta, che qui non c'è.
   * Resta la spiegazione dell'insegnante.
   */
  licita?: boolean;
}) {
  const t = useT();
  const [aperta, setAperta] = useState(false);
  const [prova, setProva] = useState(false);
  const commento = useCommento(smazzata, ricarica);

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {/*
        Il confronto e la prova stanno QUI, sulla mano già giocata, e non nella
        schermata di fine mano: lì si torna all'elenco dopo due secondi, e una
        cosa che si vuole guardare con calma va messa dove si può tornare.
      */}
      {assignmentId && !licita && (
        <ConfrontoClasse assignmentId={assignmentId} smazzataId={smazzata.id} />
      )}

      {smazzata.contract && !licita && (
        prova ? (
          <ProvaDaQui
            hands={smazzata.hands}
            contract={smazzata.contract}
            declarer={smazzata.declarer}
            onChiudi={() => setProva(false)}
          />
        ) : (
          <button
            onClick={() => setProva(true)}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("Riprova questa mano — non conta")}
          </button>
        )
      )}

      {commento && <SpiegazioneMano commento={commento} aperta={aperta} onApri={setAperta} />}
    </div>
  );
}

function SpiegazioneMano({
  commento,
  aperta,
  onApri,
}: {
  commento: string;
  aperta: boolean;
  onApri: (v: boolean) => void;
}) {
  const setAperta = onApri;
  return (
    <div>
      <button
        onClick={() => setAperta(!aperta)}
        className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
      >
        <Lightbulb className="h-3.5 w-3.5" />
        {aperta ? "Nascondi la soluzione" : "Vedi la soluzione"}
      </button>
      <AnimatePresence>
        {aperta && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{commento}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Inline game component (adapted from the weekly challenge engine) ──────

interface CompitoHandGameProps {
  smazzata: Smazzata;
  handNumber: number;
  totalHands: number;
  onFinish: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
  /** Il compito si gioca senza dichiarazione. */
  minibridge?: boolean;
  /**
   * Compito di licita: si gioca il contratto che l'allievo ha appena
   * dichiarato, non quello scritto sulla mano. L'attacco lo sceglie il
   * motore — quello registrato era pensato per un altro contratto.
   *
   * Se il contratto è di Est-Ovest l'allievo lo CONTROGIOCA da Sud: il
   * compagno a Nord è il motore e resta coperto, il morto si scopre dopo
   * l'attacco (Allievi Mondello, 23/10/2026: «la giocano gli avversari e non
   * mi fa controgiocare»).
   */
  dopoLicita?: { contract: string; declarer: Position; bidding: BiddingData };
}

function CompitoHandGame({ smazzata, handNumber, totalHands, onFinish, onBack, minibridge, dopoLicita }: CompitoHandGameProps) {
  const t = useT();
  const contratto = dopoLicita?.contract ?? smazzata.contract;
  const bidding = dopoLicita?.bidding ?? smazzata.bidding;
  const { tricksNeeded } = parseContract(contratto);
  /**
   * Lezioni del gioco della carta (Fiori 1–6): il contratto non è ancora stato
   * spiegato. Si dice solo l'obiettivo in prese, e l'esito è «obiettivo
   * raggiunto / mancato» (Trevissoi, feedback 5).
   */
  const soloGioco = !dopoLicita && senzaLicita(smazzata.lesson);
  const declarer = dopoLicita?.declarer ?? smazzata.declarer;
  const difesa = !!dopoLicita && partnershipOf(declarer) === "ew";
  /**
   * Il posto che si mette in basso. Da dichiarante il tavolo ruota sul
   * dichiarante; in difesa non ruota: l'allievo è Sud, come nell'asta.
   */
  const vista: Position = difesa ? "south" : declarer;
  const dummyGamePos = toGamePosition("north", declarer);
  const giocatori = useMemo<Position[]>(() => (difesa ? ["south"] : [declarer, dummyGamePos]), [difesa, declarer, dummyGamePos]);
  const mortoReale = partnerOf(declarer);
  const saved = useRef(false);
  // eslint-disable-next-line react-hooks/purity -- timestamp di inizio catturato una sola volta (init del ref) per il tiebreak di velocità
  const startRef = useRef<number>(Date.now()); // for the speed tiebreak in the class leaderboard
  /**
   * Il tempo di ogni singola decisione, non solo della mano intera.
   *
   * `durationMs` diceva già quanto è durata la mano, ma non distingue «ci ha
   * pensato molto su una carta» da «ha giocato con calma tutte e tredici», che
   * per un insegnante sono due cose diverse. Il cronometro parte da quando la
   * mano compare a schermo: è quando si comincia a pensare, non quando si tocca
   * la prima carta.
   */
  // eslint-disable-next-line react-hooks/purity -- stesso motivo del ref qui sopra: istante di partenza catturato una volta sola
  const cronometro = useRef<Cronometro>(new Cronometro(Date.now()));
  const isMobile = useMobile();
  const { play } = useSound();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHint, setShowHint] = useState(false);
  /**
   * Con `soluzioni = 'subito'` il commento arriva e il suggerimento c'è, come
   * prima. Negli altri casi il database non lo manda, `commento` resta vuoto e
   * il pulsante non compare: la mano si gioca e la soluzione si legge dopo,
   * nell'elenco.
   */
  const commento = useCommento(smazzata);

  const game = useBridgeGame({
    hands: smazzata.hands,
    contract: contratto,
    declarer,
    playerPositions: giocatori,
    openingLead: dopoLicita ? undefined : smazzata.openingLead,
    dealer: bidding?.dealer,
    vulnerability: smazzata.vulnerability,
    bidding,
  });

  const handlePlayCard = (displayPosition: string, cardIndex: number) => {
    if (!game.gameState) return;
    cronometro.current.segna(Date.now());
    const gamePos = toGamePosition(displayPosition as Position, vista);
    const hand = game.gameState.hands[gamePos];
    if (!hand || cardIndex >= hand.length) return;
    game.handleCardPlay(hand[cardIndex]);
  };

  const mapTrickToDisplay = (plays: { position: string; card: CardData }[]) =>
    plays.map((tp) => ({
      position: toDisplayPosition(tp.position as Position, vista),
      card: tp.card,
    }));

  const trickDisplay =
    game.gameState?.currentTrick.map((tp) => ({
      position: tp.position as string,
      card: tp.card as CardData,
    })) ?? [];

  const displayTrick =
    game.phase === "trick-complete" && game.lastTrick
      ? mapTrickToDisplay(game.lastTrick.map((tp) => ({ position: tp.position, card: tp.card as CardData })))
      : mapTrickToDisplay(trickDisplay);

  const displayHands = (gs: typeof game.gameState) => {
    if (!gs) return null;
    return {
      north: gs.hands[toGamePosition("north", vista)] as CardData[],
      south: gs.hands[toGamePosition("south", vista)] as CardData[],
      east: gs.hands[toGamePosition("east", vista)] as CardData[],
      west: gs.hands[toGamePosition("west", vista)] as CardData[],
    };
  };

  // Record result + XP when the game finishes.
  useEffect(() => {
    if (game.phase === "finished" && game.result && !saved.current) {
      saved.current = true;
      const res = game.result;
      // In difesa si vince quando il contratto cade.
      const riuscito = difesa ? res.result < 0 : res.result >= 0;
      play(riuscito ? "contractMade" : "contractFailed");
      setShowCelebration(true);

      const xp = difesa
        ? 30 + (riuscito ? 20 : 0) + Math.max(0, -res.result - 1) * 10
        : 30 + (res.result >= 0 ? 20 : 0) + Math.max(0, res.result) * 10;
      awardGameXp(`compito-${smazzata.id}`, xp);

      // Classify the student's play errors (rule-based, best-effort) so the
      // instructor portal can aggregate them into a per-student taxonomy.
      let errors: { category: string; trick?: number }[] = [];
      try {
        if (game.gameState) {
          errors = classifyPlayErrors({
            tricks: game.gameState.tricks,
            originalHands: smazzata.hands,
            trumpSuit: parseContract(contratto).trumpSuit,
            playerPositions: giocatori,
            declarer,
          }).map((e) => ({ category: e.category, trick: e.trickNumber }));
        }
      } catch {}

      // score = bridge result (e.g. +1, 0, -2); details power the heatmap.
      setTimeout(
        () =>
          onFinish(res.result, {
            tricksMade: res.tricksMade,
            tricksNeeded: res.tricksNeeded,
            result: res.result,
            made: res.result >= 0,
            contract: contratto,
            ...(difesa ? { difesa: true, declarer } : {}),
            durationMs: Date.now() - startRef.current,
            // I tempi già ripuliti: il difetto da evitare è che un intervallo
            // di quaranta minuti — scheda in secondo piano, telefono in tasca —
            // entri nelle medie di classe come se fosse riflessione.
            tempi: ripulisci(cronometro.current.grezzi()),
            errors,
            // Full card-by-card play so the instructor can replay the hand.
            play: game.gameState
              ? { hands: game.gameState.hands, tricks: game.gameState.tricks }
              : undefined,
          }),
        2200
      );
    }
  }, [game.phase, game.result, game.gameState, declarer, difesa, giocatori, smazzata, contratto, onFinish, play]);

  const hands = displayHands(game.gameState);
  const activeDisplayPos =
    game.isPlayerTurn && game.gameState
      ? toDisplayPosition(game.gameState.currentPlayer, vista)
      : undefined;
  /** In difesa il morto si scopre solo dopo l'attacco, come al tavolo. */
  const mortoScoperto =
    !!game.gameState && (game.gameState.tricks.length > 0 || game.gameState.currentTrick.length > 0);
  const scoperta = (pos: Position) =>
    difesa ? pos === "south" || (pos === mortoReale && mortoScoperto) : pos === "north" || pos === "south";
  const lettera: Record<Position, string> = { north: "N", south: "S", east: "E", west: "W" };
  const riuscita = (r: number) => (difesa ? r < 0 : r >= 0);

  return (
    <div className="min-h-screen bg-background px-4 pt-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-3 text-center">
          <button
            onClick={onBack}
            className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="mb-2 flex items-center justify-center gap-2">
            <Badge variant="outline">{t("Compito")}</Badge>
            <Badge variant="outline">Mano {handNumber}/{totalHands}</Badge>
            <BenStatus available={game.benAvailable} aiLevel={game.aiLevel} />
          </div>
          <h1 className="text-lg font-bold">{smazzata.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {smazzata.lesson > 0
              ? `Lezione ${getLessonDisplayNumber(smazzata.lesson)} · `
              : "Mano dell'insegnante · "}
            Board {smazzata.board}
          </p>
        </motion.div>

        {/* Contract bar */}
        <div className="mb-4 flex items-center justify-center">
          <div className="flex items-center gap-5 rounded-xl border border-border bg-card px-4 py-2 text-sm">
            {!soloGioco && (
              <>
                <div className="text-center">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{t("Contratto")}</p>
                  <p className="text-lg font-bold text-primary">{contrattoLeggibile(contratto)}</p>
                </div>
                <div className="h-8 w-px bg-border" />
              </>
            )}
            <div className="text-center">
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{t("Obiettivo")}</p>
              <p className="text-lg font-bold">{difesa ? 14 - tricksNeeded : tricksNeeded} prese</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{soloGioco || difesa ? t("Prese: tue / avversari") : t("Dich. / Dif.")}</p>
              <p className="text-lg font-bold">
                {partnershipOf(declarer) === "ew" && !difesa
                  ? `${game.gameState?.trickCount.ew ?? 0} / ${game.gameState?.trickCount.ns ?? 0}`
                  : `${game.gameState?.trickCount.ns ?? 0} / ${game.gameState?.trickCount.ew ?? 0}`}
              </p>
            </div>
          </div>
        </div>

        {/* Bridge table + bidding */}
        <div className="flex flex-col items-start justify-center gap-4 lg:flex-row">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="relative w-full max-w-5xl flex-1 lg:w-auto">
            {hands ? (
              <BridgeTable ancora={vista}
                north={hands.north}
                south={hands.south}
                east={hands.east}
                west={hands.west}
                northFaceDown={!scoperta("north")}
                southFaceDown={!scoperta("south")}
                eastFaceDown={!scoperta("east")}
                westFaceDown={!scoperta("west")}
                currentTrick={displayTrick}
                contract={contratto}
                declarer={difesa ? lettera[declarer] : "S"}
                vulnerability={smazzata.vulnerability}
                trickCount={partnershipOf(declarer) === "ew" ? { ns: game.gameState!.trickCount.ew, ew: game.gameState!.trickCount.ns } : game.gameState!.trickCount}
                onPlayCard={handlePlayCard}
                highlightedCards={game.validCards as CardData[]}
                activePosition={activeDisplayPos}
                disabled={!game.isPlayerTurn}
                compact={isMobile}
                largo
                trumpSuit={game.gameState?.trumpSuit}
              />
            ) : (
              <BridgeTable ancora={vista}
                north={smazzata.hands[toGamePosition("north", vista)] as CardData[]}
                south={smazzata.hands[toGamePosition("south", vista)] as CardData[]}
                east={smazzata.hands[toGamePosition("east", vista)] as CardData[]}
                west={smazzata.hands[toGamePosition("west", vista)] as CardData[]}
                northFaceDown={!scoperta("north")}
                southFaceDown={!scoperta("south")}
                eastFaceDown={!scoperta("east")}
                westFaceDown={!scoperta("west")}
                contract={contratto}
                declarer={difesa ? lettera[declarer] : "S"}
                vulnerability={smazzata.vulnerability}
                trickCount={{ ns: 0, ew: 0 }}
                disabled={true}
                compact={isMobile}
                largo
                trumpSuit={parseContract(contratto).trumpSuit}
              />
            )}
            {/* Il tutorial spiega il gioco da dichiarante: in difesa direbbe il falso. */}
            {game.phase === "playing" && !difesa && <GameTutorial />}
          </motion.div>

          {/*
            In minibridge la cassetta non si mostra: l'allievo della prima
            lezione non l'ha ancora vista, e metterla lì — anche solo da
            leggere — è la cosa che il minibridge esiste per evitare.
          */}
          {minibridge && game.phase === "ready" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="w-full shrink-0 lg:w-64">
              <PannelloMinibridge mani={smazzata.hands} compatto />
            </motion.div>
          )}

          {/* Nel gioco della carta (Fiori 1–6) la dichiarazione non si è ancora fatta: niente licita. */}
          {!minibridge && bidding && !soloGioco && (!isMobile || game.phase === "ready") && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="w-full shrink-0 lg:w-48">
              <BiddingPanel bidding={bidding} />
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
                  ? game.result && riuscita(game.result.result)
                    ? "text-emerald-600"
                    : "text-red-500"
                  : game.isPlayerTurn
                    ? "text-amber-600"
                    : "text-muted-foreground"
              }`}
            >
              {soloGioco && game.phase === "finished" && game.result
                ? game.result.result >= 0
                  ? t("Obiettivo raggiunto! {n} prese.", { n: game.result.tricksMade })
                  : t("Obiettivo mancato: {n} prese su {m}.", { n: game.result.tricksMade, m: game.result.tricksNeeded })
                : game.message}
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
          {game.phase === "ready" && (
            <Button onClick={game.startGame} className="h-12 px-8 text-sm font-bold">
              <Play className="mr-2 h-4 w-4" />
              {t("Gioca la mano")}
            </Button>
          )}
          {game.phase === "finished" && (
            <Button onClick={onBack} className="h-12 px-6 text-sm font-bold">
              {t("Continua →")}
            </Button>
          )}
        </div>

        {/* Result */}
        <AnimatePresence>
          {game.phase === "finished" && game.result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-auto mt-6 max-w-lg"
            >
              <CelebrationCombo trigger={showCelebration} type={riuscita(game.result.result) ? (Math.abs(game.result.result) >= 2 ? "epic" : "medium") : "small"} />
              <div
                className={`rounded-2xl border p-6 text-center ${
                  riuscita(game.result.result)
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                    : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                }`}
              >
                <div className="mb-3 text-4xl">{riuscita(game.result.result) ? "🎉" : "😔"}</div>
                <h3 className={`text-xl font-bold ${riuscita(game.result.result) ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {soloGioco
                    ? game.result.result >= 0
                      ? t("Obiettivo raggiunto!")
                      : t("Obiettivo mancato")
                    : game.result.result >= 0
                      ? game.result.result === 0
                        ? "Contratto mantenuto!"
                        : `Contratto +${game.result.result}!`
                      : `Caduto di ${Math.abs(game.result.result)}`}
                </h3>
                {difesa && (
                  <p className="mt-1 text-sm font-semibold">
                    {game.result.result < 0 ? t("Bravo: l'avete battuto in difesa.") : t("In difesa non siete riusciti a batterlo.")}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {difesa
                    ? t("Il dichiarante ha fatto {n} prese su {m}.", { n: game.result.tricksMade, m: game.result.tricksNeeded })
                    : `Prese: ${game.result.tricksMade} / ${game.result.tricksNeeded}`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint */}
        {game.phase === "ready" && commento && (
          <div className="mx-auto mt-6 max-w-lg">
            <button
              onClick={() => setShowHint(!showHint)}
              className="mx-auto mb-2 flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/70"
            >
              {showHint ? "Nascondi suggerimento" : "Mostra suggerimento"}
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{commento}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
