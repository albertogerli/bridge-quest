"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Gavel, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { reportError } from "@/lib/report-error";
import type { Card, Suit } from "@/lib/bridge-engine";
import { DEAL_TEMPLATES, generateDeals, handHcp } from "@/lib/deal-generator";
import { aperturaConsigliata, type Apertura } from "@/lib/apertura";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ROUNDS = 10;

/** Le dichiarazioni fra cui scegliere: quelle che la regola può produrre. */
const RISPOSTE = ["1♣", "1♦", "1♥", "1♠", "1SA", "3♣", "3♦", "3♥", "3♠"];

interface Domanda {
  hand: Card[];
  attesa: Apertura;
}

/**
 * «Cosa apri?» — esercizi di licita su mani generate.
 *
 * Gli esercizi di licita del catalogo sono scritti a mano, quindi finiscono.
 * Qui le mani le produce il generatore con vincoli e la risposta la deduce
 * `aperturaConsigliata` dalla mano stessa: non si esauriscono mai.
 *
 * Si scartano le mani su cui la regola tace. Sono i casi in cui due aperture
 * sono entrambe difendibili: trasformarli in esercizio insegnerebbe che una
 * delle due è sbagliata.
 */
export default function CosaApriPage() {
  const [seed] = useState(() => Math.floor(Date.now() % 1_000_000));
  const [round, setRound] = useState(0);
  const [risposta, setRisposta] = useState<string | null>(null);
  const [punti, setPunti] = useState(0);

  // La domanda si CALCOLA dal seme e dal numero di mano: generare è
  // deterministico, quindi non serve tenerla in stato né produrla in un
  // effetto. Stesso seme, stessa serie — anche ricaricando la pagina.
  const domanda = useMemo<Domanda | null>(() => {
    try {
      // Si prova finché non esce una mano su cui la regola ha una risposta
      // sola. Il modello ruota, così l'esercizio non diventa monotono.
      for (let tentativo = 0; tentativo < 40; tentativo++) {
        const modello = DEAL_TEMPLATES[(round + tentativo) % DEAL_TEMPLATES.length];
        const { deals } = generateDeals(modello.constraints, {
          count: 1,
          seed: seed + round * 97 + tentativo,
        });
        if (!deals.length) continue;
        const hand = deals[0].south;
        const attesa = aperturaConsigliata(hand);
        if (attesa) return { hand, attesa };
      }
      return null;
    } catch (err) {
      reportError("cosa-apri:genera", err);
      return null;
    }
  }, [seed, round]);

  const prossima = () => {
    setRisposta(null);
    setRound((r) => r + 1);
  };

  const rispondi = (bid: string) => {
    if (risposta || !domanda) return;
    setRisposta(bid);
    if (bid === domanda.attesa.bid) setPunti((p) => p + 1);
  };

  if (round >= ROUNDS) {
    return (
      <div className="min-h-screen px-4 py-12 max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold font-display mb-2">Finito</h1>
        <p className="text-4xl font-bold text-figb my-6">{punti} / {ROUNDS}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => { setRound(0); setPunti(0); setRisposta(null); }}>
            <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
            Ancora
          </Button>
          <Link href="/gioca" className="text-sm text-muted-foreground hover:underline">
            Torna ai giochi
          </Link>
        </div>
      </div>
    );
  }

  const giusta = risposta !== null && domanda !== null && risposta === domanda.attesa.bid;

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-muted-foreground">
          Mano {round + 1} di {ROUNDS}
        </span>
        <span className="text-sm font-bold text-figb">{punti} giuste</span>
      </header>

      <h1 className="sr-only">Cosa apri?</h1>

      {!domanda && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Preparo la mano…
        </p>
      )}

      {domanda && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary">Sei Sud, apri tu</Badge>
              <span className="text-xs text-muted-foreground">
                {handHcp(domanda.hand)} punti onori
              </span>
            </div>
            {SUITS.map((suit) => (
              <p key={suit} className="text-lg font-mono flex items-center gap-2">
                <SuitSymbol suit={suit} size="sm" />
                {formatSuit(domanda.hand, suit)}
              </p>
            ))}
          </div>

          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Gavel className="w-4 h-4 text-figb" aria-hidden="true" />
            Cosa dichiari?
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {RISPOSTE.map((bid) => {
              const scelta = risposta === bid;
              const corretta = risposta !== null && bid === domanda.attesa.bid;
              return (
                <button
                  key={bid}
                  disabled={risposta !== null}
                  onClick={() => rispondi(bid)}
                  className={`h-14 rounded-xl border text-lg font-bold transition-colors ${
                    corretta
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : scelta
                        ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                        : "border-border bg-card hover:bg-muted disabled:opacity-50"
                  }`}
                >
                  {bid}
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
                <p className="font-semibold text-sm mb-1">
                  {giusta ? "Esatto." : `La risposta è ${domanda.attesa.bid}.`}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {domanda.attesa.perche}
                </p>
                <Button onClick={prossima}>
                  {round + 1 >= ROUNDS ? "Vedi il risultato" : "Prossima mano"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-muted-foreground mt-5">
            Sistema Naturale, quinta maggiore — quello dei corsi FIGB.
          </p>
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
