"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Gavel, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { DEAL_TEMPLATES, generateDeals, handHcp } from "@/lib/deal-generator";
import { calcTableAndPar, strainOf, type DdsTable } from "@/lib/dds-table";
import { scoreContract } from "@/lib/scoring";
import type { Strain } from "@/lib/minibridge";
import { valutaLicita, type EsitoLicita } from "@/lib/stelle-licita";
import { benBid } from "@/lib/ben-client";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ROUNDS = 6;

const DENOM: { label: string; suit: Suit | null; strain: Strain }[] = [
  { label: "♣", suit: "club", strain: "club" },
  { label: "♦", suit: "diamond", strain: "diamond" },
  { label: "♥", suit: "heart", strain: "heart" },
  { label: "♠", suit: "spade", strain: "spade" },
  { label: "SA", suit: null, strain: "nt" },
];

interface Mano {
  deal: Record<Position, Card[]>;
  table: DdsTable;
  parScore: number;
}

/**
 * «Licita e vediamo» — l'esercizio di dichiarazione con il voto.
 *
 * L'IDEA È DI CUEBIDS, il metro è il nostro.
 * Vedi solo la TUA mano, come al tavolo. Dichiari, il compagno ti risponde —
 * è la rete neurale di BEN, la stessa che gioca la carta — e gli avversari
 * passano. Alla fine il contratto raggiunto viene confrontato col par della
 * smazzata: tre stelle vuol dire esserci arrivati.
 *
 * PERCHÉ GLI AVVERSARI PASSANO
 * Perché l'esercizio è la comunicazione con il compagno. Con l'interferenza
 * diventa un altro esercizio — utile, ma diverso, e mescolarli non aiuta
 * nessuno. Anche Cuebids fa così.
 *
 * SE BEN NON RISPONDE il compagno passa, e la schermata lo dice. Un esercizio
 * che si blocca perché un server è occupato è peggio di un esercizio con un
 * compagno silenzioso — ma fingere che abbia scelto di passare sarebbe
 * peggio ancora.
 */
export default function LicitaPage() {
  const [seed] = useState(() => Math.floor(Date.now() % 1_000_000));
  const [round, setRound] = useState(0);
  const [preparata, setPreparata] = useState<{ round: number; dati: Mano } | null>(null);
  const [licita, setLicita] = useState<string[]>([]);
  const [attesa, setAttesa] = useState(false);
  const [benMuto, setBenMuto] = useState(false);
  const [esito, setEsito] = useState<EsitoLicita | null>(null);
  const [contrattoFinale, setContrattoFinale] = useState<string>("");
  const [stelleTotali, setStelleTotali] = useState(0);

  useEffect(() => {
    if (round >= ROUNDS) return;
    let vivo = true;
    const modello = DEAL_TEMPLATES[round % DEAL_TEMPLATES.length];
    const { deals } = generateDeals(modello.constraints, { count: 1, seed: seed + round * 191 });
    if (!deals.length) return;
    calcTableAndPar(deals[0], "south", "none")
      .then(({ table, par }) => {
        if (vivo) setPreparata({ round, dati: { deal: deals[0], table, parScore: par.score } });
      })
      .catch((err) => reportError("licita:genera", err));
    return () => { vivo = false; };
  }, [round, seed]);

  const mano = preparata?.round === round ? preparata.dati : null;

  /** Prese che Nord-Sud fa in quel seme, col dichiarante migliore. */
  const preseNs = (suit: Suit | null): number => {
    if (!mano) return 0;
    const t = mano.table.tricks[strainOf(suit)];
    return Math.max(t.north, t.south);
  };

  const chiudiLicita = (bids: string[]) => {
    if (!mano) return;
    // L'ultimo contratto nominato, o passo generale.
    const ultimo = [...bids].reverse().find((b) => b !== "P");
    if (!ultimo) {
      const e = valutaLicita(0, mano.parScore);
      setContrattoFinale("Passo generale");
      setEsito(e);
      setStelleTotali((s) => s + e.stelle);
      return;
    }
    const level = Number(ultimo[0]);
    const den = DENOM.find((d) => ultimo.slice(1) === d.label)!;
    const prese = preseNs(den.suit);
    const punteggio = scoreContract({ level, strain: den.strain, tricksMade: prese }).score;
    const e = valutaLicita(punteggio, mano.parScore);
    setContrattoFinale(`${ultimo} — ${prese} prese`);
    setEsito(e);
    setStelleTotali((s) => s + e.stelle);
  };

  /**
   * Tocca a te, poi Est passa, poi il compagno, poi Ovest passa.
   * Tre passi dopo una dichiarazione chiudono la licita.
   */
  const dichiara = async (bid: string) => {
    if (!mano || attesa || esito) return;
    const dopoDiTe = [...licita, bid];
    setLicita(dopoDiTe);

    const passiFinali = (b: string[]) => {
      const ultimoContratto = b.map((x) => x !== "P").lastIndexOf(true);
      return ultimoContratto >= 0 && b.length - ultimoContratto - 1 >= 3;
    };
    if (passiFinali(dopoDiTe) || dopoDiTe.length >= 4 && dopoDiTe.every((b) => b === "P")) {
      chiudiLicita(dopoDiTe);
      return;
    }

    setAttesa(true);
    // Est passa, poi risponde il compagno.
    const conEst = [...dopoDiTe, "P"];
    let rispostaNord = "P";
    try {
      const r = await benBid({
        hand: mano.deal.north,
        seat: "north",
        dealer: "south",
        vulnerability: "none",
        bidding: { dealer: "south", bids: conEst },
      });
      if (r.fallback) setBenMuto(true);
      else rispostaNord = r.bid;
    } catch (err) {
      reportError("licita:ben", err);
      setBenMuto(true);
    }
    const conNord = [...conEst, rispostaNord];
    const conOvest = [...conNord, "P"];
    setLicita(conOvest);
    setAttesa(false);
    if (passiFinali(conOvest)) chiudiLicita(conOvest);
  };

  const prossima = () => {
    setLicita([]);
    setEsito(null);
    setContrattoFinale("");
    setBenMuto(false);
    setRound((r) => r + 1);
  };

  if (round >= ROUNDS) {
    return (
      <div className="min-h-screen px-4 py-12 max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold font-display mb-2">Finito</h1>
        <p className="text-4xl font-bold text-figb my-6">{stelleTotali} ⭐</p>
        <p className="text-sm text-muted-foreground mb-8">su {ROUNDS * 3} possibili</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => { setRound(0); setStelleTotali(0); setLicita([]); setEsito(null); }}>
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

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-muted-foreground">
          Mano {round + 1} di {ROUNDS}
        </span>
        <span className="text-sm font-bold text-figb">{stelleTotali} ⭐</span>
      </header>

      <h1 className="sr-only">Licita e vediamo</h1>

      {!mano && <p className="py-16 text-center text-sm text-muted-foreground">Preparo la mano…</p>}

      {mano && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary">Sei Sud · apri tu</Badge>
              <span className="text-xs text-muted-foreground">{handHcp(mano.deal.south)} PO</span>
            </div>
            {SUITS.map((suit) => (
              <p key={suit} className="text-lg font-mono flex items-center gap-2">
                <SuitSymbol suit={suit} size="sm" />
                {formatSuit(mano.deal.south, suit)}
              </p>
            ))}
          </div>

          {licita.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-3 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Licita — Sud, Ovest, Nord, Est
              </p>
              <p className="text-base font-mono">{licita.join("  ·  ")}</p>
              {attesa && <p className="text-xs text-muted-foreground mt-1">Il compagno sta pensando…</p>}
              {benMuto && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Il compagno non ha risposto (motore non raggiungibile): ha passato.
                </p>
              )}
            </div>
          )}

          {!esito && (
            <>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-figb" aria-hidden="true" />
                Cosa dichiari?
              </p>
              <div className="grid grid-cols-5 gap-1 mb-2">
                {[1, 2, 3, 4, 5, 6, 7].map((lvl) =>
                  DENOM.map((d) => (
                    <button
                      key={`${lvl}${d.label}`}
                      disabled={attesa}
                      onClick={() => dichiara(`${lvl}${d.label}`)}
                      className="h-10 rounded-lg border border-border bg-card text-sm font-bold hover:bg-muted disabled:opacity-40"
                    >
                      {lvl}{d.label}
                    </button>
                  ))
                )}
              </div>
              <Button variant="outline" disabled={attesa} onClick={() => dichiara("P")} className="w-full">
                Passo
              </Button>
            </>
          )}

          <AnimatePresence>
            {esito && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-4 mt-4"
              >
                <div className="flex justify-center gap-1 mb-2 text-2xl">
                  {[1, 2, 3].map((s) => (
                    <span key={s} className={s <= esito.stelle ? "" : "grayscale opacity-30"}>⭐</span>
                  ))}
                </div>
                <p className="text-center font-semibold mb-1">{contrattoFinale}</p>
                <p className="text-sm text-muted-foreground mb-2">{esito.commento}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Il tuo contratto vale {esito.punteggio}, il par della smazzata{" "}
                  {esito.punteggioPar}.
                </p>
                <Button onClick={prossima}>
                  {round + 1 >= ROUNDS ? "Vedi il risultato" : "Prossima mano"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-muted-foreground mt-5">
            Gli avversari passano: l&apos;esercizio è intendersi col compagno, non
            reggere l&apos;interferenza.
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
