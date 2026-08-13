"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Calculator, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { generateDeals, handHcp } from "@/lib/deal-generator";
import { calcDdsTable, strainOf } from "@/lib/dds-table";
import {
  buildOptions,
  nextSeed,
  QUIZ_LEVELS,
  scoreAnswer,
  strainForRound,
  strainLabel,
  type QuizLevel,
  type QuizStrain,
} from "@/lib/trick-quiz";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ROUNDS = 8;

interface Question {
  deal: Record<Position, Card[]>;
  strain: QuizStrain;
  correct: number;
  options: number[];
}

/**
 * «Quante prese fa Nord-Sud?»
 *
 * Il primo quiz della piattaforma che non è scritto a mano: le mani vengono
 * dal generatore, la risposta dal double dummy. Gli altri 230 quiz sono
 * ciascuno il frutto di lavoro d'autore, e per questo coprono solo gli
 * argomenti che qualcuno ha avuto tempo di scrivere.
 *
 * Si vedono tutte e quattro le mani: è un esercizio di conteggio, non di
 * valutazione. Con le sole carte di Nord-Sud la risposta esatta sarebbe
 * indovinello anche per un campione.
 */
export default function QuizPresePage() {
  const [level, setLevel] = useState<QuizLevel | null>(null);
  const [seed] = useState(() => Math.floor(Date.now() % 1_000_000));
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const prepare = useCallback(
    async (lvl: QuizLevel, index: number) => {
      setLoading(true);
      setFailed(false);
      setAnswer(null);
      try {
        const roundSeed = nextSeed(seed, index);
        const strain = strainForRound(lvl, seed, index);
        // Nessun vincolo sulle mani: una distribuzione qualsiasi è già un buon
        // esercizio, e vincolarla renderebbe le domande tutte simili.
        const { deals } = generateDeals({}, { count: 1, seed: roundSeed });
        const table = await calcDdsTable(deals[0]);
        const correct = table.tricks[strainOf(strain)].south;
        setQuestion({
          deal: deals[0],
          strain,
          correct,
          options: buildOptions(correct, roundSeed),
        });
      } catch (err) {
        reportError("quiz-prese:genera", err);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [seed]
  );

  useEffect(() => {
    if (level) void prepare(level, round);
  }, [level, round, prepare]);

  const esito = useMemo(
    () => (answer !== null && question ? scoreAnswer(answer, question.correct) : null),
    [answer, question]
  );

  const rispondi = (value: number) => {
    if (answer !== null || !question) return;
    setAnswer(value);
    setScore((s) => s + scoreAnswer(value, question.correct).points);
  };

  // ── Scelta del livello ────────────────────────────────────────────────
  if (!level) {
    return (
      <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2 mb-1">
          <Calculator className="w-6 h-6 text-figb" aria-hidden="true" />
          Quante prese?
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Vedi tutte e quattro le mani. Conta quante prese fa Nord-Sud con
          gioco perfetto di entrambe le linee.
        </p>
        <div className="space-y-3">
          {QUIZ_LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l)}
              className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:bg-muted transition-colors flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{l.label}</p>
                <p className="text-xs text-muted-foreground">{l.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Sbagliare di una presa vale comunque punti: su tredici, significa aver
          visto quasi tutto.
        </p>
      </div>
    );
  }

  // ── Fine partita ──────────────────────────────────────────────────────
  if (round >= ROUNDS) {
    return (
      <div className="min-h-screen px-4 py-12 max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold font-display mb-2">Finito</h1>
        <p className="text-4xl font-bold text-figb my-6">{score}</p>
        <p className="text-sm text-muted-foreground mb-8">
          punti su {ROUNDS} mani
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              setRound(0);
              setScore(0);
              setLevel(null);
            }}
          >
            <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
            Gioca ancora
          </Button>
          <Link href="/gioca" className="text-sm text-muted-foreground hover:underline">
            Torna ai giochi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-muted-foreground">
          Mano {round + 1} di {ROUNDS}
        </span>
        <span className="text-sm font-bold text-figb">{score} punti</span>
      </header>

      {loading && (
        <div className="py-20 text-center">
          <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground mt-3">Preparo la mano…</p>
        </div>
      )}

      {failed && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Non è stato possibile preparare la mano.
          </p>
          <Button variant="outline" onClick={() => void prepare(level, round)}>
            Riprova
          </Button>
        </div>
      )}

      {question && !loading && !failed && (
        <>
          <div className="rounded-2xl border border-border bg-card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary">{strainLabel(question.strain)}</Badge>
              <span className="text-xs text-muted-foreground">
                N-S {handHcp(question.deal.north) + handHcp(question.deal.south)} PO
              </span>
            </div>
            {/* Disposizione del TAVOLO, non ordine di lettura: Nord in alto,
                Sud in basso, Ovest ed Est ai lati. Prima erano quattro riquadri
                in griglia (Nord, Ovest / Est, Sud) e la mano non si capiva —
                un giocatore legge una smazzata solo in questa forma. */}
            <div className="grid grid-cols-3 gap-2 items-start">
              <div />
              <Mano seat="north" label="Nord" deal={question.deal} />
              <div />

              <Mano seat="west" label="Ovest" deal={question.deal} />
              <div className="flex items-center justify-center py-4" aria-hidden="true">
                <div className="h-12 w-12 rounded-lg border border-border/60" />
              </div>
              <Mano seat="east" label="Est" deal={question.deal} />

              <div />
              <Mano seat="south" label="Sud" deal={question.deal} />
              <div />
            </div>
          </div>

          <p className="text-sm font-semibold mb-3">
            Quante prese fa Nord-Sud a {strainLabel(question.strain)}?
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {question.options.map((value) => {
              const scelta = answer === value;
              const giusta = answer !== null && value === question.correct;
              return (
                <button
                  key={value}
                  disabled={answer !== null}
                  onClick={() => rispondi(value)}
                  className={`h-14 rounded-xl border text-lg font-bold transition-colors ${
                    giusta
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : scelta
                        ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                        : "border-border bg-card hover:bg-muted disabled:opacity-50"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {esito && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <p className="font-semibold text-sm mb-1">{esito.message}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Il conteggio è a carte scoperte, con gioco perfetto di
                  entrambe le linee: al tavolo, senza vedere le mani avversarie,
                  alcune di queste prese non sarebbero trovabili.
                </p>
                <Button onClick={() => setRound((r) => r + 1)}>
                  {round + 1 >= ROUNDS ? "Vedi il risultato" : "Prossima mano"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

/** Una mano nella sua casella del tavolo. */
function Mano({
  seat,
  label,
  deal,
}: {
  seat: Position;
  label: string;
  deal: Record<Position, Card[]>;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold text-muted-foreground mb-1">{label}</p>
      {SUITS.map((suit) => (
        <p key={suit} className="text-xs font-mono flex items-center gap-1 whitespace-nowrap">
          <SuitSymbol suit={suit} size="xs" />
          {formatSuit(deal[seat], suit)}
        </p>
      ))}
    </div>
  );
}

function formatSuit(hand: readonly Card[], suit: Suit): string {
  const cards = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return cards.length ? cards.join(" ") : "—";
}
