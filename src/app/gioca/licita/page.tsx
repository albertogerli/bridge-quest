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
import { calcTableAndPar, type DdsTable } from "@/lib/dds-table";
import type { Strain } from "@/lib/minibridge";
import { valutaLicita, type EsitoLicita, type Metro } from "@/lib/stelle-licita";
import { benBid } from "@/lib/ben-client";
import { Asta } from "@/components/bridge/asta";
import { AttesaDichiarazione } from "@/components/bridge/attesa-dichiarazione";
import { astaChiusa, esitoAsta, ordineDa, ZONE_PER_BOARD } from "@/lib/licita-mano";
import { ConfrontoCampoPannello } from "@/components/bridge/confronto-campo";
import { RiepilogoMano } from "@/components/bridge/riepilogo-mano";
import { Stelle } from "@/components/bridge/stelle";
import { contrattiDaRivedere } from "@/lib/riepilogo-mano";
import {
  confrontoCampo, evDelContratto, manoDaFare, registraRisultato, riferimento,
  type ConfrontoCampo, type ManoCondivisa, riferimentoUnico } from "@/lib/mani-condivise";
import type { Vulnerability } from "@/lib/catalog";
import { useT } from "@/contexts/traduzioni-provider";

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
  /**
   * La riga della scorta, quando la mano viene da lì: serve per il valore
   * atteso dei contratti, che è il metro con cui si danno le stelle.
   */
  condivisa?: ManoCondivisa;
  /** Il nome dello scenario, quando c'è. */
  scenario?: string;
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
  const t = useT();
  const [seed] = useState(() => Math.floor(Date.now() % 1_000_000));
  const [round, setRound] = useState(0);
  const [preparata, setPreparata] = useState<{ round: number; dati: Mano } | null>(null);
  const [licita, setLicita] = useState<string[]>([]);
  const [attesa, setAttesa] = useState(false);
  /** Il posto da cui si aspetta una dichiarazione: serve a dirlo in schermata. */
  const [attesaDi, setAttesaDi] = useState<Position | null>(null);
  const [annullata, setAnnullata] = useState(false);
  /** Un avversario non ha risposto e ha passato d'ufficio: va detto. */
  const [avversarioMuto, setAvversarioMuto] = useState(false);
  const [esito, setEsito] = useState<EsitoLicita | null>(null);
  const [contrattoFinale, setContrattoFinale] = useState<string>("");
  const [stelleTotali, setStelleTotali] = useState(0);
  const [campo, setCampo] = useState<ConfrontoCampo | null>(null);
  /**
   * Il contratto raggiunto, in forma leggibile dal codice.
   *
   * `contrattoFinale` è una frase da mostrare; per segnare la riga giusta nel
   * riepilogo serve il contratto vero, e ricavarlo di nuovo dalla frase
   * sarebbe un secondo conto che può divergere dal primo.
   */
  const [giocato, setGiocato] = useState<
    // `doppio` serve alla tabella di fine mano: senza, la riga «← il vostro»
    // mostrava il punteggio del contratto liscio anche quando era contrato,
    // cioè un numero diverso da quello del voto qui sopra.
    {
      level: number;
      strain: Strain;
      declarer: Position;
      lato: "ns" | "ew";
      doppio: 1 | 2 | 4;
    } | null
  >(null);

  const mano = preparata?.round === round ? preparata.dati : null;

  /**
   * Come finisce l'asta. Il conto vero sta in `licita-mano.ts`, non qui.
   *
   * Ci stava, e conteneva un difetto arrivato in produzione: prendeva come
   * contratto l'ultima dichiarazione diversa da «passo» — che però può essere
   * un CONTRO, e un contro non è un contratto. Su iPad, il 15/08/2026, quella
   * riga è esplosa con «undefined is not an object». Lo stesso conto serve
   * all'allenamento e ai tornei: scriverlo due volte vuol dire sbagliarlo due
   * volte, e infatti era già stato corretto nella funzione del database senza
   * che questa se ne accorgesse.
   */
  const chiudiLicita = (bids: string[]) => {
    if (!mano) return;
    const e = esitoAsta(bids, mano.dealer, mano.table, mano.vulnerability);

    if (!e) {
      // Passo generale: zero, e il riferimento dice quanto si è lasciato sul tavolo.
      const voto = valutaLicita(0, mano.riferimento, mano.metro);
      setContrattoFinale("Passo generale");
      setGiocato(null);
      setEsito(voto);
      setStelleTotali((s) => s + voto.stelle);
      salva(null, null, 0, voto.stelle);
      return;
    }

    /**
     * Le stelle si danno sul VALORE ATTESO del contratto raggiunto, non sul
     * punteggio di questa smazzata.
     *
     * Il riferimento è un valore atteso: confrontarci un risultato reale
     * significa premiare chi ha trovato le carte messe bene e punire chi le ha
     * trovate messe male — cioè misurare la fortuna invece della scelta, che è
     * l'opposto di quello che serve a chi impara. Il punteggio reale resta
     * quello che si mostra: è successo, e va detto.
     */
    const perStelle =
      (mano.metro === "atteso" && mano.condivisa
        ? evDelContratto(mano.condivisa, {
            level: e.level,
            strain: e.strain,
            declarer: e.declarer,
            doppio: e.doppio,
          })
        : null) ?? e.punteggio;

    const voto = valutaLicita(perStelle, mano.riferimento, mano.metro);
    setContrattoFinale(
      `${e.contratto} di ${ETICHETTA[e.declarer]} — ${e.prese} prese` +
        (e.lato === "ns" ? "" : " (dichiarano gli avversari)")
    );
    setGiocato({ level: e.level, strain: e.strain, declarer: e.declarer, lato: e.lato, doppio: e.doppio });
    setEsito(voto);
    setStelleTotali((s) => s + voto.stelle);
    salva(e.contratto, e.declarer, e.punteggio, voto.stelle);
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
  /** Una dichiarazione dal motore, con l'errore già ridotto a «non risponde». */
  const chiediABen = async (m: Mano, chi: Position, bids: string[]) => {
    try {
      return await benBid({
        hand: m.deal[chi],
        seat: chi,
        dealer: m.dealer,
        vulnerability: m.vulnerability,
        bidding: { dealer: m.dealer, bids },
      });
    } catch (err) {
      reportError("licita:ben", err);
      return { bid: "P", fallback: true };
    }
  };

  const avanza = async (m: Mano, iniziali: string[]) => {
    const ordine = ordineDa(m.dealer);

    let bids = iniziali;
    setLicita(bids);
    if (astaChiusa(bids)) { chiudiLicita(bids); return; }

    setAttesa(true);
    while (!astaChiusa(bids)) {
      const chi = ordine[bids.length % 4];
      if (chi === "south") break;
      /**
       * Una riprova, poi si decide in base a CHI è rimasto muto.
       *
       * Il motore neurale su certe aste impiega più di dieci secondi e non
       * risponde in tempo: succedeva sull'asta «P 1♦ 1♠ contro P», sempre, e
       * l'esercizio si interrompeva. Annullare la mano per il silenzio di un
       * AVVERSARIO è sproporzionato: quello che si sta imparando è l'intesa
       * col compagno, e il voto non dipende da cosa avrebbero detto loro. Si
       * fa passare quel posto e LO SI DICE, che è diverso dal fingere che
       * abbia scelto di passare.
       *
       * Se invece a tacere è il COMPAGNO, la mano si annulla: senza di lui
       * l'esercizio non esiste, e dargli un passo inventato falserebbe proprio
       * la cosa che si sta misurando.
       */
      setAttesaDi(chi);
      let r = await chiediABen(m, chi, bids);
      if (r.fallback) r = await chiediABen(m, chi, bids);

      if (r.fallback) {
        if (chi === "north") {
          // Mano annullata: niente stelle, niente conteggio.
          setAnnullata(true);
          setAttesa(false);
          setAttesaDi(null);
          return;
        }
        setAvversarioMuto(true);
        r = { bid: "P", fallback: false };
      }
      bids = [...bids, r.bid];
      setLicita(bids);
    }
    setAttesa(false);
    setAttesaDi(null);
    if (astaChiusa(bids)) chiudiLicita(bids);
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

      /**
       * ZONA E DICHIARANTE COME AL TAVOLO, non fissi.
       *
       * Le mani generate qui uscivano sempre con Sud di mano e nessuno in
       * zona. Sono le due cose che al bridge cambiano la decisione più di
       * quasi tutto: in zona un parziale sicuro vale più di una manche
       * incerta, e chi apre decide di chi è la parola. Chi si allenava senza
       * account — cioè chi comincia — non ha mai visto una licita in zona.
       *
       * Il giro è quello del torneo, board 1..16: dichiarante e zona seguono
       * la rotazione vera, così l'allenamento assomiglia a una sessione invece
       * che a sedici copie della stessa situazione.
       */
      const board = round + 1;
      const dealer = (["north", "east", "south", "west"] as const)[(board - 1) % 4];
      const vulnerability = ZONE_PER_BOARD[(board - 1) % 16];

      calcTableAndPar(deals[0], dealer, vulnerability)
        .then(({ table, par }) =>
          metti({
            deal: deals[0], table, dealer, vulnerability,
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
          // La riga intera, non solo l'id: da lì escono le distribuzioni delle
          // prese, che sono il metro con cui si danno le stelle.
          condivisa: m,
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
    setAvversarioMuto(false);
    setCampo(null);
    setGiocato(null);
    setRound((r) => r + 1);
  };

  if (round >= ROUNDS) {
    return (
      <div className="min-h-screen px-4 py-12 max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold font-display mb-2">{t("Finito")}</h1>
        <p className="text-4xl font-bold text-figb my-6 flex items-center justify-center gap-2">
          {stelleTotali}
          <Stelle quante={Math.min(3, stelleTotali)} className="[&_svg]:w-7 [&_svg]:h-7" />
        </p>
        <p className="text-sm text-muted-foreground mb-8">su {ROUNDS * 3} possibili</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => { setRound(0); setStelleTotali(0); setLicita([]); setEsito(null); }}>
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

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-muted-foreground">
          Mano {round + 1} di {ROUNDS}
        </span>
        <span className="text-sm font-bold text-figb flex items-center gap-1">
          {stelleTotali}
          <Stelle quante={1} su={1} />
        </span>
      </header>

      <h1 className="sr-only">{t("Licita e vediamo")}</h1>

      {!mano && <p className="py-16 text-center text-sm text-muted-foreground">{t("Preparo la mano…")}</p>}

      {mano && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary">
                {/* Due frasi INTERE, non un pezzo più un altro: chi traduce
                    deve poter cambiare l'ordine delle parole, e «Sei Sud ·» +
                    «apre Nord» in inglese non si monta allo stesso modo. */}
                {mano.dealer === "south"
                  ? t("Sei Sud, apri tu")
                  : t("Sei Sud, apre {posto}", { posto: t(ETICHETTA[mano.dealer]) })}
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
              // Il mazziere è quello della mano, non sempre Sud: le mani della
              // scorta lo ruotano. Con «south» fisso la griglia attribuiva
              // ogni dichiarazione al posto sbagliato — tre volte su quattro —
              // e l'asta mostrata non era quella giocata.
              dealer={mano.dealer}
              bids={licita}
              ioSono="south"
              onDichiara={dichiara}
              disabilitato={attesa || !!esito || annullata}
            />
            <AttesaDichiarazione chi={attesaDi} />
          </div>

          {avversarioMuto && !annullata && (
            <p className="text-xs text-muted-foreground mb-3">
              Un avversario non ha risposto in tempo e ha passato d&apos;ufficio:
              la sua dichiarazione non c&apos;è, non è che abbia scelto di
              passare. Il voto non ne risente — dipende dalla tua linea.
            </p>
          )}

          {annullata && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 mb-4">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                {t("Mano annullata")}
              </p>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mb-3">
                Il motore che dichiara per gli altri non ha risposto. Questa mano
                non viene contata: non sarebbe giusto darti un voto per un
                problema nostro.
              </p>
              <Button onClick={prossima}>{t("Prossima mano")}</Button>
            </div>
          )}

          <AnimatePresence>
            {esito && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-4 mt-4"
              >
                <div className="flex justify-center mb-2">
                  <Stelle quante={esito.stelle} className="[&_svg]:w-8 [&_svg]:h-8" />
                </div>
                <p className="text-center font-semibold mb-1">{contrattoFinale}</p>
                <p className="text-sm text-muted-foreground mb-2">{esito.commento}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {mano.metro === "atteso" ? (
                    <>
                      Il tuo contratto rende in media {esito.punteggio}, il
                      migliore {esito.punteggioPar}.
                    </>
                  ) : (
                    <>
                      Il tuo contratto vale {esito.punteggio}, il par della
                      smazzata {esito.punteggioPar}.
                    </>
                  )}
                </p>
                {/* A mano finita le carte si aprono tutte: durante la licita
                    vedi solo le tue, dopo nascondere il resto non insegna più
                    niente — anzi, toglie la spiegazione. */}
                <RiepilogoMano
                  deal={mano.deal}
                  vulnerability={mano.vulnerability}
                  // Le due migliori per loro: senza, non si capisce se la mano
                  // era vostra, e un parziale che li tiene fuori da una manche
                  // sembra un risultato mediocre.
                  avversari={contrattiDaRivedere({
                    table: mano.table,
                    lato: "ew",
                    ancheSenzaContratto: true,
                    vulnerability: mano.vulnerability,
                    // UN METRO SOLO per tutta la tabella — il miglior
                    // contratto della smazzata, chiunque lo dichiari — così le
                    // stelle vogliono dire la stessa cosa sopra e sotto. Sul
                    // meglio della LORO linea il loro contratto migliore
                    // prendeva tre stelle anche cadendo di due, e chi legge
                    // capiva «avevano una bella mano»: l'opposto della verità.
                    // Vedi `riferimentoUnico`.
                    riferimento: mano.condivisa
                      ? riferimentoUnico(mano.condivisa).punteggio
                      : Math.max(mano.riferimento, -mano.riferimento),
                    metro: mano.condivisa
                      ? riferimentoUnico(mano.condivisa).metro
                      : mano.metro,
                    giocato: giocato?.lato === "ew" ? giocato : null,
                    ev: mano.condivisa ? (c) => evDelContratto(mano.condivisa!, c) : undefined,
                  }).slice(0, 2)}
                  contratti={contrattiDaRivedere({
                    table: mano.table,
                    lato: "ns",
                    vulnerability: mano.vulnerability,
                    // Lo stesso metro della sezione qui sotto: è una tabella
                    // sola, e due riferimenti diversi renderebbero le stelle
                    // incomparabili proprio dove servono per confrontare.
                    riferimento: mano.condivisa
                      ? riferimentoUnico(mano.condivisa).punteggio
                      : mano.riferimento,
                    metro: mano.condivisa
                      ? riferimentoUnico(mano.condivisa).metro
                      : mano.metro,
                    giocato: giocato?.lato === "ns" ? giocato : null,
                    // Il valore atteso entra in tabella solo quando è anche il
                    // metro del riferimento: mostrarlo accanto a stelle
                    // calcolate sul par confonderebbe due conti diversi.
                    ev:
                      mano.metro === "atteso" && mano.condivisa
                        ? (c) => evDelContratto(mano.condivisa!, c)
                        : undefined,
                  })}
                />
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
