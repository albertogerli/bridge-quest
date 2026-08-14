"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw } from "lucide-react";
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
import { Asta } from "@/components/bridge/asta";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ROUNDS = 6;

const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

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
  const [annullata, setAnnullata] = useState(false);
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

  /**
   * Chi dichiara: il primo della linea vincente ad aver nominato quel seme.
   * Serve perché ora anche gli avversari dichiarano, e un contratto loro va
   * contato dalla parte giusta — altrimenti le stelle direbbero il contrario
   * di quello che è successo.
   */
  const chiudiLicita = (bids: string[]) => {
    if (!mano) return;
    const ordine: Position[] = ["south", "west", "north", "east"];
    const iUltimo = bids.map((b) => b !== "P").lastIndexOf(true);
    if (iUltimo < 0) {
      // Passo generale: zero, e il par dice quanto si è lasciato sul tavolo.
      const e = valutaLicita(0, mano.parScore);
      setContrattoFinale("Passo generale");
      setEsito(e);
      setStelleTotali((s) => s + e.stelle);
      return;
    }

    const ultimo = bids[iUltimo];
    const den = DENOM.find((d) => ultimo.slice(1) === d.label)!;
    const level = Number(ultimo[0]);

    // Il primo della stessa linea che ha nominato quel seme.
    const linea = (p: Position) => (p === "north" || p === "south" ? "ns" : "ew");
    const lineaVincente = linea(ordine[iUltimo % 4]);
    let dichiarante = ordine[iUltimo % 4];
    for (let i = 0; i <= iUltimo; i++) {
      const chi = ordine[i % 4];
      if (linea(chi) === lineaVincente && bids[i].slice(1) === den.label) {
        dichiarante = chi;
        break;
      }
    }

    const t = mano.table.tricks[strainOf(den.suit)];
    const nostro = lineaVincente === "ns";
    const prese = nostro ? Math.max(t.north, t.south) : Math.max(t.east, t.west);
    const punti = scoreContract({ level, strain: den.strain, tricksMade: prese }).score;
    // Se dichiarano loro, quel punteggio è contro di noi.
    const punteggio = nostro ? punti : -punti;

    const e = valutaLicita(punteggio, mano.parScore);
    setContrattoFinale(
      `${ultimo} di ${ETICHETTA[dichiarante]} — ${prese} prese` +
        (nostro ? "" : " (dichiarano gli avversari)")
    );
    setEsito(e);
    setStelleTotali((s) => s + e.stelle);
  };

  /**
   * Il giro della licita: tu, poi Ovest, il compagno, Est, e di nuovo tu.
   *
   * TUTTI E TRE GLI ALTRI DICHIARANO, avversari compresi. Prima li facevo
   * passare sempre, «per isolare l'intesa col compagno»: era sbagliato. Senza
   * competizione l'esercizio insegna metà del bridge, e la metà più facile —
   * al tavolo l'interferenza c'è quasi sempre.
   *
   * SE IL MOTORE NON RISPONDE LA MANO SI ANNULLA. Non si dà zero stelle e non
   * si conta: una mano persa per un guasto nostro punisce l'utente per una
   * cosa che non ha fatto lui, ed è peggio che non avere l'esercizio.
   */
  const dichiara = async (bid: string) => {
    if (!mano || attesa || esito) return;

    const passiFinali = (b: string[]) => {
      const ultimo = b.map((x) => x !== "P").lastIndexOf(true);
      return ultimo < 0 ? b.length >= 4 : b.length - ultimo - 1 >= 3;
    };
    // L'ordine dei posti a partire da Sud, che è il mazziere.
    const ordine: Position[] = ["south", "west", "north", "east"];

    let bids = [...licita, bid];
    setLicita(bids);
    if (passiFinali(bids)) { chiudiLicita(bids); return; }

    setAttesa(true);
    // Si va avanti finché non torna il turno a Sud.
    while (!passiFinali(bids)) {
      const chi = ordine[bids.length % 4];
      if (chi === "south") break;
      let r;
      try {
        r = await benBid({
          hand: mano.deal[chi],
          seat: chi,
          dealer: "south",
          vulnerability: "none",
          bidding: { dealer: "south", bids },
        });
      } catch (err) {
        reportError("licita:ben", err);
        r = { bid: "P", fallback: true };
      }
      if (r.fallback) {
        // Mano annullata: niente stelle, niente conteggio.
        setAnnullata(true);
        setAttesa(false);
        return;
      }
      bids = [...bids, r.bid];
      setLicita(bids);
    }
    setAttesa(false);
    if (passiFinali(bids)) chiudiLicita(bids);
  };

  const prossima = () => {
    setLicita([]);
    setEsito(null);
    setContrattoFinale("");
    setAnnullata(false);
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

          {/* La griglia d'asta vera: quattro colonne, mazziere segnato, e
              solo le dichiarazioni lecite premibili. Vedi components/bridge/asta. */}
          <div className="mb-4">
            <Asta
              dealer="south"
              bids={licita}
              ioSono="south"
              onDichiara={dichiara}
              disabilitato={attesa || !!esito || annullata}
            />
            {attesa && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Gli altri stanno dichiarando…
              </p>
            )}
          </div>

          {annullata && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 mb-4">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Mano annullata
              </p>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mb-3">
                Il motore che dichiara per gli altri non ha risposto. Questa mano
                non viene contata: non sarebbe giusto darti un voto per un
                problema nostro.
              </p>
              <Button onClick={prossima}>Prossima mano</Button>
            </div>
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
            Il compagno e gli avversari dichiarano tutti: al tavolo
            l&apos;interferenza c&apos;è quasi sempre, e imparare a reggerla fa
            parte del gioco.
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
