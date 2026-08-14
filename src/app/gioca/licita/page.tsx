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
import { valutaLicita, type EsitoLicita, type Metro } from "@/lib/stelle-licita";
import { benBid } from "@/lib/ben-client";
import { Asta } from "@/components/bridge/asta";
import { ConfrontoCampoPannello } from "@/components/bridge/confronto-campo";
import {
  confrontoCampo, manoDaFare, registraRisultato, riferimento,
  type ConfrontoCampo,
} from "@/lib/mani-condivise";
import type { Vulnerability } from "@/lib/catalog";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const ROUNDS = 6;

const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

const ZONA: Record<Vulnerability, string> = {
  none: "nessuno in zona",
  ns: "siamo in zona",
  ew: "loro in zona",
  both: "tutti in zona",
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
  dealer: Position;
  vulnerability: Vulnerability;
  /** Il punteggio con cui si confronta il risultato, visto da Nord-Sud. */
  riferimento: number;
  metro: Metro;
  /** L'id nella scorta condivisa, quando la mano viene da lì. */
  id?: string;
  /** Il nome dello scenario, quando c'è. */
  scenario?: string;
}

const GIRO: Position[] = ["north", "east", "south", "west"];

/** L'ordine dei posti a partire dal mazziere. */
function ordineDa(dealer: Position): Position[] {
  const i = GIRO.indexOf(dealer);
  return [0, 1, 2, 3].map((k) => GIRO[(i + k) % 4]);
}

function inZona(v: Vulnerability, lato: "ns" | "ew"): boolean {
  return v === "both" || v === lato;
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
  const [campo, setCampo] = useState<ConfrontoCampo | null>(null);

  const mano = preparata?.round === round ? preparata.dati : null;

  /**
   * Chi dichiara: il primo della linea vincente ad aver nominato quel seme.
   * Serve perché ora anche gli avversari dichiarano, e un contratto loro va
   * contato dalla parte giusta — altrimenti le stelle direbbero il contrario
   * di quello che è successo.
   */
  const chiudiLicita = (bids: string[]) => {
    if (!mano) return;
    const ordine = ordineDa(mano.dealer);
    const iUltimo = bids.map((b) => b !== "P").lastIndexOf(true);
    if (iUltimo < 0) {
      // Passo generale: zero, e il riferimento dice quanto si è lasciato sul tavolo.
      const e = valutaLicita(0, mano.riferimento, mano.metro);
      setContrattoFinale("Passo generale");
      setEsito(e);
      setStelleTotali((s) => s + e.stelle);
      salva(null, null, 0, e.stelle);
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
    // Le prese le fa chi dichiara davvero, non il migliore della linea: con un
    // dichiarante diverso il colpo di apertura arriva dall'altra parte.
    const prese = t[dichiarante];
    const punti = scoreContract({
      level,
      strain: den.strain,
      tricksMade: prese,
      vulnerable: inZona(mano.vulnerability, lineaVincente),
    }).score;
    // Se dichiarano loro, quel punteggio è contro di noi.
    const punteggio = nostro ? punti : -punti;

    const e = valutaLicita(punteggio, mano.riferimento, mano.metro);
    setContrattoFinale(
      `${ultimo} di ${ETICHETTA[dichiarante]} — ${prese} prese` +
        (nostro ? "" : " (dichiarano gli avversari)")
    );
    setEsito(e);
    setStelleTotali((s) => s + e.stelle);
    salva(ultimo, dichiarante, punteggio, e.stelle);
  };

  /**
   * Registra il risultato nella scorta condivisa e chiede il confronto.
   *
   * Solo per le mani della scorta: una mano generata nel browser non ha un
   * campo con cui confrontarsi, e scriverne il risultato non servirebbe a
   * nessuno. Se la scrittura fallisce — di solito perché quella mano l'hai già
   * fatta — il confronto si chiede lo stesso: i numeri degli altri sono utili
   * comunque.
   */
  const salva = (
    contratto: string | null,
    dichiarante: Position | null,
    punteggio: number,
    stelle: number
  ) => {
    const id = mano?.id;
    if (!id) return;
    void registraRisultato({
      manoId: id,
      contratto,
      dichiarante,
      punteggio,
      stelle,
    })
      .then(() => confrontoCampo(id))
      .then((c) => setCampo(c))
      .catch((err) => reportError("licita:campo", err));
  };

  /**
   * Fa dichiarare tutti gli altri finché non tocca di nuovo a te.
   *
   * TUTTI E TRE GLI ALTRI DICHIARANO, avversari compresi. Prima li facevo
   * passare sempre, «per isolare l'intesa col compagno»: era sbagliato. Senza
   * competizione l'esercizio insegna metà del bridge, e la metà più facile —
   * al tavolo l'interferenza c'è quasi sempre.
   *
   * SERVE ANCHE PRIMA DELLA TUA PRIMA DICHIARAZIONE. Le mani della scorta hanno
   * il mazziere che gli tocca, non sempre Sud: se apre Ovest, tu parli per
   * quarto e i primi tre devono aver parlato prima che tu veda qualcosa. Senza
   * questo passaggio la tua apertura finirebbe scritta nella colonna del
   * mazziere, e tutta l'asta sarebbe girata di posto.
   *
   * SE IL MOTORE NON RISPONDE LA MANO SI ANNULLA. Non si dà zero stelle e non
   * si conta: una mano persa per un guasto nostro punisce l'utente per una
   * cosa che non ha fatto lui, ed è peggio che non avere l'esercizio.
   */
  const avanza = async (m: Mano, iniziali: string[]) => {
    const passiFinali = (b: string[]) => {
      const ultimo = b.map((x) => x !== "P").lastIndexOf(true);
      return ultimo < 0 ? b.length >= 4 : b.length - ultimo - 1 >= 3;
    };
    const ordine = ordineDa(m.dealer);

    let bids = iniziali;
    setLicita(bids);
    if (passiFinali(bids)) { chiudiLicita(bids); return; }

    setAttesa(true);
    while (!passiFinali(bids)) {
      const chi = ordine[bids.length % 4];
      if (chi === "south") break;
      let r;
      try {
        r = await benBid({
          hand: m.deal[chi],
          seat: chi,
          dealer: m.dealer,
          vulnerability: m.vulnerability,
          bidding: { dealer: m.dealer, bids },
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

  const dichiara = async (bid: string) => {
    if (!mano || attesa || esito) return;
    await avanza(mano, [...licita, bid]);
  };

  /**
   * Prima si chiede una mano alla scorta condivisa, e solo se non ce n'è si
   * genera qui.
   *
   * LA DIFFERENZA NON È IL COSTO, È IL CONFRONTO. Una mano generata nel browser
   * non l'ha mai vista nessun altro: le stelle restano un numero senza scala.
   * Una mano della scorta l'hanno dichiarata in cento, e accanto al voto si può
   * scrivere «meglio del 74%», che è l'unica cosa che dice davvero come stai
   * andando. La generazione locale resta per chi non ha fatto l'accesso e per
   * quando la scorta è finita.
   */
  useEffect(() => {
    if (round >= ROUNDS) return;
    let vivo = true;

    /** Mette in tavola la mano e, se non apri tu, fa parlare chi viene prima. */
    const metti = (dati: Mano) => {
      if (!vivo) return;
      setPreparata({ round, dati });
      if (dati.dealer !== "south") void avanza(dati, []);
    };

    const locale = () => {
      const modello = DEAL_TEMPLATES[round % DEAL_TEMPLATES.length];
      const { deals } = generateDeals(modello.constraints, { count: 1, seed: seed + round * 191 });
      if (!deals.length) return;
      calcTableAndPar(deals[0], "south", "none")
        .then(({ table, par }) =>
          metti({
            deal: deals[0], table, dealer: "south", vulnerability: "none",
            riferimento: par.score, metro: "esatto", scenario: modello.label,
          })
        )
        .catch((err) => reportError("licita:genera", err));
    };

    manoDaFare()
      .then((m) => {
        if (!vivo) return;
        if (!m || !m.dd_table) { locale(); return; }
        const rif = riferimento(m, "ns");
        metti({
          deal: m.hands,
          table: { tricks: m.dd_table } as DdsTable,
          dealer: m.dealer,
          vulnerability: m.vulnerability,
          riferimento: rif.punteggio,
          metro: rif.metro,
          id: m.id,
          scenario: m.scenario?.nome,
        });
      })
      .catch(() => { if (vivo) locale(); });

    return () => { vivo = false; };
    // `avanza` cambia a ogni render ma non cambia comportamento: metterlo fra
    // le dipendenze rigenererebbe la mano a ogni dichiarazione.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rigenererebbe la mano a ogni render
  }, [round, seed]);

  const prossima = () => {
    setLicita([]);
    setEsito(null);
    setContrattoFinale("");
    setAnnullata(false);
    setCampo(null);
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
              <Badge variant="secondary">
                Sei Sud · {mano.dealer === "south" ? "apri tu" : `apre ${ETICHETTA[mano.dealer]}`}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {handHcp(mano.deal.south)} PO · {ZONA[mano.vulnerability]}
              </span>
            </div>
            {mano.scenario && (
              <p className="text-xs text-muted-foreground mb-2">{mano.scenario}</p>
            )}
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
                  Il tuo contratto vale {esito.punteggio},{" "}
                  {mano.metro === "atteso"
                    ? "il contratto migliore in media"
                    : "il par della smazzata"}{" "}
                  {esito.punteggioPar}.
                </p>
                {campo && <ConfrontoCampoPannello campo={campo} manoId={mano.id} />}
                <Button className="mt-4" onClick={prossima}>
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
