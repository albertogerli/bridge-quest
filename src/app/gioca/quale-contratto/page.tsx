"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Target, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { DEAL_TEMPLATES, generateDeals, handHcp } from "@/lib/deal-generator";
import { calcTableAndPar, strainOf, type DdsTable } from "@/lib/dds-table";
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ROUNDS = 8;

/** I modelli in cui la domanda «fin dove arrivate?» ha davvero un senso. */
const MODELLI = ["invito-manche", "invito-slam", "manche-sicura", "apertura-1nt"];

/** Le risposte: il livello che conta, nei semi che si dichiarano davvero. */
const SCELTE: { label: string; strain: Suit | null; level: number }[] = [
  { label: "Parziale", strain: null, level: 2 },
  { label: "3SA", strain: null, level: 3 },
  { label: "4♥/4♠", strain: "heart", level: 4 },
  { label: "5♦/5♣", strain: "diamond", level: 5 },
  { label: "Slam (6)", strain: null, level: 6 },
];

interface Domanda {
  deal: Record<Position, Card[]>;
  table: DdsTable;
  parContracts: string[];
}

/**
 * «Che contratto giocate?»
 *
 * PERCHÉ NON UN TAVOLO DI LICITA COMPLETO
 * Simulare l'intera dichiarazione richiederebbe le regole di risposta del
 * sistema, e sono materia su cui due insegnanti litigano volentieri: una
 * regola scritta male qui non è un difetto tecnico, è una lezione sbagliata
 * data a mille persone.
 *
 * Qui si isola invece la domanda che conta di più e su cui la risposta è
 * VERIFICABILE: viste le due mani della linea, fin dove si può arrivare? Il
 * metro non è un'opinione, è il double dummy — quante prese fa davvero quella
 * combinazione, seme per seme.
 *
 * Gli avversari passano, come al tavolo di allenamento: l'esercizio è la
 * valutazione della propria forza, non l'interferenza.
 */
export default function QualeContrattoPage() {
  const t = useT();
  const [seed] = useState(() => Math.floor(Date.now() % 1_000_000));
  const [round, setRound] = useState(0);
  // La domanda si conserva INSIEME alla mano per cui vale: così «sto
  // preparando» è una deduzione e non un altro stato da azzerare a mano — e
  // non si rischia di mostrare per un istante le carte della mano precedente
  // accanto alla domanda nuova.
  const [preparata, setPreparata] = useState<{ round: number; dati: Domanda } | null>(null);
  const [risposta, setRisposta] = useState<number | null>(null);
  const [punti, setPunti] = useState(0);

  // La catena sta in chiaro dentro l'effetto: nascosta in una funzione, il
  // controllo del progetto non vede che il `setState` arriva dopo un'attesa e
  // segnala un render a cascata che qui non c'è.
  useEffect(() => {
    if (round >= ROUNDS) return;
    let vivo = true;
    const id = MODELLI[round % MODELLI.length];
    const modello = DEAL_TEMPLATES.find((t) => t.id === id) ?? DEAL_TEMPLATES[0];
    const { deals } = generateDeals(modello.constraints, { count: 1, seed: seed + round * 131 });
    if (!deals.length) return;
    calcTableAndPar(deals[0], "south", "none")
      .then(({ table, par }) => {
        if (vivo) {
          setPreparata({ round, dati: { deal: deals[0], table, parContracts: par.contracts } });
        }
      })
      .catch((err) => reportError("quale-contratto:genera", err));
    return () => { vivo = false; };
  }, [round, seed]);

  const domanda = preparata?.round === round ? preparata.dati : null;

  /** Prese che Nord-Sud fa davvero nel seme scelto, a carte scoperte. */
  const preseNs = (strain: Suit | null): number => {
    if (!domanda) return 0;
    const t = domanda.table.tricks[strainOf(strain)];
    return Math.max(t.north, t.south);
  };

  /** Il livello più alto che Nord-Sud mantiene, fra tutte le denominazioni. */
  const livelloMassimo = (): number => {
    if (!domanda) return 0;
    let best = 0;
    for (const s of [null, ...SUITS] as (Suit | null)[]) {
      best = Math.max(best, preseNs(s) - 6);
    }
    return best;
  };

  const rispondi = (i: number) => {
    if (risposta !== null || !domanda) return;
    setRisposta(i);
    const scelto = SCELTE[i];
    // Giusto se il livello scelto è quello che le carte reggono davvero.
    if (scelto.level === Math.min(6, Math.max(2, livelloMassimo()))) {
      setPunti((p) => p + 1);
    }
  };

  if (round >= ROUNDS) {
    return (
      <div className="min-h-screen px-4 py-12 max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold font-display mb-2">{t("Finito")}</h1>
        <p className="text-4xl font-bold text-figb my-6">{punti} / {ROUNDS}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => { setRound(0); setPunti(0); setRisposta(null); }}>
            <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
            {t("Ancora")}
          </Button>
          <Link href="/gioca" className="text-sm text-muted-foreground hover:underline">
            {t("Torna ai giochi")}
          </Link>
        </div>
      </div>
    );
  }

  const atteso = domanda ? Math.min(6, Math.max(2, livelloMassimo())) : 0;

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-muted-foreground">
          Mano {round + 1} di {ROUNDS}
        </span>
        <span className="text-sm font-bold text-figb">{punti} giuste</span>
      </header>

      <h1 className="sr-only">{t("Che contratto giocate?")}</h1>

      {!domanda && <p className="py-16 text-center text-sm text-muted-foreground">{t("Preparo la mano…")}</p>}

      {domanda && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary">{t("Gli avversari passano")}</Badge>
              <span className="text-xs text-muted-foreground">
                {handHcp(domanda.deal.north) + handHcp(domanda.deal.south)} punti in due
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(["north", "south"] as Position[]).map((p) => (
                <div key={p}>
                  <p className="text-xs font-bold text-muted-foreground mb-1">
                    {p === "north" ? "Nord" : "Sud"}{" "}
                    <span className="font-normal">{handHcp(domanda.deal[p])} PO</span>
                  </p>
                  {SUITS.map((suit) => (
                    <p key={suit} className="text-base font-mono flex items-center gap-1.5">
                      <SuitSymbol suit={suit} size="xs" />
                      {formatSuit(domanda.deal[p], suit)}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-figb" aria-hidden="true" />
            {t("Fin dove potete arrivare?")}
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {SCELTE.map((s, i) => {
              const scelta = risposta === i;
              const giusta = risposta !== null && s.level === atteso;
              return (
                <button
                  key={s.label}
                  disabled={risposta !== null}
                  onClick={() => rispondi(i)}
                  className={`h-14 rounded-xl border text-base font-bold transition-colors ${
                    giusta
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : scelta
                        ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                        : "border-border bg-card hover:bg-muted disabled:opacity-50"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {risposta !== null && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <p className="font-semibold text-sm mb-2">
                  {SCELTE[risposta].level === atteso
                    ? "Esatto."
                    : `Le carte reggono il livello ${atteso}.`}
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5 mb-3">
                  {([null, ...SUITS] as (Suit | null)[]).map((s) => (
                    <li key={s ?? "sa"} className="flex items-center gap-1.5">
                      {s ? <SuitSymbol suit={s} size="xs" /> : <span className="font-bold">SA</span>}
                      <span>{preseNs(s)} prese</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mb-3">
                  Par della mano: {domanda.parContracts.join(", ")}. Il conteggio è
                  a carte scoperte: al tavolo qualche presa in più o in meno
                  dipende dall&apos;attacco.
                </p>
                <Button onClick={() => { setRisposta(null); setRound((r) => r + 1); }}>
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

function formatSuit(hand: readonly Card[], suit: Suit): string {
  const cards = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return cards.length ? cards.join(" ") : "—";
}
