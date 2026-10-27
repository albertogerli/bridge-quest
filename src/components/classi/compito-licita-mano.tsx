"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { Asta } from "@/components/bridge/asta";
import { AttesaDichiarazione } from "@/components/bridge/attesa-dichiarazione";
import { RiepilogoMano } from "@/components/bridge/riepilogo-mano";
import { RisultatoDoppioMorto } from "@/components/bridge/risultato-doppio-morto";
import { Stelle } from "@/components/bridge/stelle";
import { partnershipOf, type Card, type Position, type Suit } from "@/lib/bridge-engine";
import type { Smazzata, Vulnerability } from "@/lib/catalog";
import { handHcp } from "@/lib/deal-generator";
import { calcTableAndPar, type DdsTable } from "@/lib/dds-table";
import { benBid } from "@/lib/ben-client";
import { astaChiusa, esitoAsta, ordineDa } from "@/lib/licita-mano";
import { contestoDaEsito, valutaLicita, type EsitoLicita } from "@/lib/stelle-licita";
import { tabelleFineMano } from "@/lib/riepilogo-mano";
import type { Strain } from "@/lib/minibridge";
import { mazziereDellaMano, rigaCompitoLicita } from "@/lib/compito-licita";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

const ETICHETTA: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

const ZONA: Record<Vulnerability, string> = {
  none: "Nessuno in zona",
  ns: "Siamo in zona",
  ew: "Loro in zona",
  both: "Tutti in zona",
};

/**
 * Una mano di un compito di licita: l'allievo la dichiara da Sud.
 *
 * È «Licita e vediamo» sulle mani dell'insegnante. Compagno e avversari sono
 * BEN, il voto è il contratto raggiunto rispetto al par della smazzata, e a
 * mano finita si aprono tutte le carte con la tabella dei contratti. Vedi
 * `src/lib/compito-licita.ts` per come si registra il risultato.
 *
 * IL RISULTATO SI REGISTRA APPENA L'ASTA SI CHIUDE, non quando l'allievo
 * torna all'elenco: chi legge il riepilogo e chiude la scheda ha comunque
 * fatto la mano.
 *
 * L'ASTA REGISTRATA NON SI RIFÀ: l'insegnante la corregge e l'allievo la
 * rivede dall'elenco del compito (`RivediLicita`), errore compreso. Prima la
 * si poteva ridichiarare e l'errore spariva (Saccomanno, 27/10/2026).
 *
 * POI SI GIOCA IL CONTRATTO DICHIARATO (`onGioca`): la licita è registrata
 * comunque, e il gioco si aggiunge alla stessa mano. L'insegnante lo voleva
 * per vedere insieme come ci arrivano e come lo giocano (Allievi Mondello,
 * 23/10/2026). Se dichiarano gli avversari l'allievo lo controgioca da Sud.
 *
 * SE IL COMPAGNO NON RISPONDE la mano non si conta e si può riprovare, come in
 * «Licita e vediamo»: un voto dato su un passo inventato misurerebbe il guasto,
 * non l'allievo. Se tace un avversario passa d'ufficio, e lo si dice.
 */
export function CompitoLicitaMano({
  smazzata,
  handNumber,
  totalHands,
  onRegistra,
  onEsci,
  onGioca,
  stelleDallInsegnante = false,
}: {
  smazzata: Smazzata;
  handNumber: number;
  totalHands: number;
  onRegistra: (score: number, details: Record<string, unknown>) => Promise<void>;
  onEsci: () => void;
  /** Gioca il contratto appena dichiarato; `riga` è la licita già registrata. */
  onGioca?: (gioco: ContrattoDaGiocare) => void;
  /**
   * Il compito ha le stelle «le assegna l'insegnante»: niente voto del
   * programma, che confronta col par e può smentire quello che è stato
   * spiegato in classe (25/10/2026). Si registra lo stesso, l'insegnante lo
   * vede accanto al proprio.
   */
  stelleDallInsegnante?: boolean;
}) {
  const t = useT();
  const dealer = mazziereDellaMano(smazzata);
  const vulnerability = smazzata.vulnerability;
  const deal = smazzata.hands;

  const [calcolo, setCalcolo] = useState<{ table: DdsTable; par: number } | null>(null);
  const [erroreCalcolo, setErroreCalcolo] = useState(false);
  /** Cambia a ogni «Riprova»: rifà partire l'asta da capo. */
  const [giro, setGiro] = useState(0);
  const [licita, setLicita] = useState<string[]>([]);
  const [attesa, setAttesa] = useState(false);
  const [attesaDi, setAttesaDi] = useState<Position | null>(null);
  const [annullata, setAnnullata] = useState(false);
  const [avversarioMuto, setAvversarioMuto] = useState(false);
  const [esito, setEsito] = useState<EsitoLicita | null>(null);
  const [contrattoFinale, setContrattoFinale] = useState("");
  const [giocato, setGiocato] = useState<
    { level: number; strain: Strain; declarer: Position; doppio: 1 | 2 | 4 } | null
  >(null);
  const [daGiocare, setDaGiocare] = useState<ContrattoDaGiocare | null>(null);
  const [salvataggio, setSalvataggio] = useState<"in-corso" | "fatto" | "errore" | null>(null);
  /** Una pagina che si chiude a metà asta non deve continuare a chiedere a BEN. */
  const viva = useRef(true);
  useEffect(() => {
    // Rimessa a vero a ogni montaggio: React può smontare e rimontare lo
    // stesso componente, e un ref spento una volta resterebbe spento.
    viva.current = true;
    return () => { viva.current = false; };
  }, []);

  // Il par serve solo a fine asta, ma si calcola subito: è WebAssembly, qualche
  // decina di millisecondi, e così il voto arriva senza attesa.
  useEffect(() => {
    let vivo = true;
    calcTableAndPar(deal, dealer, vulnerability)
      .then(({ table, par }) => { if (vivo) setCalcolo({ table, par: par.score }); })
      .catch((err) => {
        reportError("compito-licita:par", err);
        if (vivo) setErroreCalcolo(true);
      });
    return () => { vivo = false; };
  }, [deal, dealer, vulnerability]);

  const registra = (riga: ReturnType<typeof rigaCompitoLicita>) => {
    setSalvataggio("in-corso");
    onRegistra(riga.score, riga.details)
      .then(() => { if (viva.current) setSalvataggio("fatto"); })
      .catch((err) => {
        reportError("compito-licita:registra", err);
        if (viva.current) setSalvataggio("errore");
      });
  };

  const chiudi = (bids: string[]) => {
    if (!calcolo) return;
    const e = esitoAsta(bids, dealer, calcolo.table, vulnerability);
    const voto = valutaLicita(e?.punteggio ?? 0, calcolo.par, "esatto", e?.punteggio, {
      contesto: contestoDaEsito(e),
      tr: t,
    });
    setEsito(voto);
    if (e) {
      setContrattoFinale(
        `${e.contratto} di ${t(ETICHETTA[e.declarer])} — ${e.prese} prese` +
          (e.lato === "ns" ? "" : ` ${t("(dichiarano gli avversari)")}`),
      );
      setGiocato({ level: e.level, strain: e.strain, declarer: e.declarer, doppio: e.doppio });
    } else {
      setContrattoFinale(t("Passo generale"));
      setGiocato(null);
    }
    const riga = rigaCompitoLicita({
      stelle: voto.stelle,
      contratto: e?.contratto ?? null,
      dichiarante: e?.declarer ?? null,
      punteggio: e?.punteggio ?? 0,
      par: calcolo.par,
      bids,
      mazziere: dealer,
    });
    registra(riga);
    setDaGiocare(e ? { contract: e.contratto, declarer: e.declarer, dealer, bids, riga } : null);
  };

  const chiediABen = async (chi: Position, bids: string[]) => {
    try {
      return await benBid({
        hand: deal[chi],
        seat: chi,
        dealer,
        vulnerability,
        bidding: { dealer, bids },
      });
    } catch (err) {
      reportError("compito-licita:ben", err);
      return { bid: "P", fallback: true };
    }
  };

  /** Fa dichiarare gli altri tre finché non tocca di nuovo a Sud. */
  const avanza = async (iniziali: string[]) => {
    const ordine = ordineDa(dealer);
    let bids = iniziali;
    setLicita(bids);
    if (astaChiusa(bids)) { chiudi(bids); return; }

    setAttesa(true);
    while (!astaChiusa(bids)) {
      const chi = ordine[bids.length % 4];
      if (chi === "south") break;
      setAttesaDi(chi);
      let r = await chiediABen(chi, bids);
      if (r.fallback) r = await chiediABen(chi, bids);
      if (!viva.current) return;
      if (r.fallback) {
        if (chi === "north") {
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
    if (astaChiusa(bids)) chiudi(bids);
  };

  // Se non dà le carte Sud, parlano prima gli altri. Si parte solo col par
  // pronto: un'asta chiusa da tre passi deve poter dare subito il voto.
  useEffect(() => {
    if (!calcolo) return;
    if (dealer !== "south") void avanza([]);
    // `avanza` cambia a ogni render: tra le dipendenze rifarebbe partire
    // l'asta a ogni dichiarazione.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- riparte solo con un par nuovo o con «Riprova»
  }, [calcolo, giro]);

  const dichiara = async (bid: string) => {
    if (attesa || esito || annullata || !calcolo) return;
    await avanza([...licita, bid]);
  };

  const riprova = () => {
    setLicita([]);
    setEsito(null);
    setContrattoFinale("");
    setGiocato(null);
    setDaGiocare(null);
    setAnnullata(false);
    setAvversarioMuto(false);
    setSalvataggio(null);
    setGiro((g) => g + 1);
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onEsci}>
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          {t("Torna al compito")}
        </Button>
        <span className="text-sm font-bold text-muted-foreground">
          {t("Mano {n} di {tot}", { n: handNumber, tot: totalHands })}
        </span>
      </header>

      <h1 className="sr-only">{t("Dichiara la mano")}</h1>

      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge variant="secondary">
            {dealer === "south"
              ? t("Sei Sud, apri tu")
              : t("Sei Sud, apre {posto}", { posto: t(ETICHETTA[dealer]) })}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {handHcp(deal.south)} PO · {t(ZONA[vulnerability])}
          </span>
        </div>
        {SUITS.map((suit) => (
          <p key={suit} className="flex items-center gap-2 font-mono text-lg">
            <SuitSymbol suit={suit} size="sm" />
            {formatSuit(deal.south, suit)}
          </p>
        ))}
      </div>

      {erroreCalcolo && (
        <p className="mb-4 text-sm text-destructive">
          {t("Non riesco a preparare la mano su questo dispositivo. Ricarica la pagina e riprova.")}
        </p>
      )}

      <div className="mb-4">
        <Asta
          dealer={dealer}
          bids={licita}
          ioSono="south"
          onDichiara={dichiara}
          disabilitato={!calcolo || attesa || !!esito || annullata}
        />
        <AttesaDichiarazione chi={attesaDi} />
      </div>

      {avversarioMuto && !annullata && (
        <p className="mb-3 text-xs text-muted-foreground">
          {t("Un avversario non ha risposto in tempo e ha passato d'ufficio: la sua dichiarazione non c'è, non è che abbia scelto di passare. Il voto non ne risente — dipende dalla tua linea.")}
        </p>
      )}

      {annullata && (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/30">
          <p className="mb-1 text-sm font-semibold text-amber-900 dark:text-amber-200">
            {t("Il compagno non ha risposto")}
          </p>
          <p className="mb-3 text-xs text-amber-900/80 dark:text-amber-200/80">
            {t("Il motore che dichiara per Nord non ha risposto. La mano non è stata contata: puoi riprovarla adesso o più tardi.")}
          </p>
          <Button onClick={riprova}>
            <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" />
            {t("Riprova la mano")}
          </Button>
        </div>
      )}

      {esito && calcolo && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          {!stelleDallInsegnante && (
            <div className="mb-2 flex justify-center">
              <Stelle quante={esito.stelle} className="[&_svg]:h-8 [&_svg]:w-8" />
            </div>
          )}
          <p className="mb-1 text-center font-semibold">{contrattoFinale}</p>
          {stelleDallInsegnante ? (
            <p className="mb-2 text-center text-sm text-muted-foreground">
              {t("Le stelle di questo compito te le dà il tuo insegnante, quando corregge: le trovi nell'elenco delle mani.")}
            </p>
          ) : (
            <p className="mb-2 text-sm text-muted-foreground">{esito.commento}</p>
          )}
          <p className="mb-3 text-xs text-muted-foreground">
            {t("Il tuo contratto vale {punti}, il par della smazzata {par}.", {
              punti: esito.punteggio,
              par: esito.punteggioPar,
            })}
          </p>
          <RiepilogoMano
            deal={deal}
            vulnerability={vulnerability}
            {...tabelleFineMano({
              table: calcolo.table,
              vulnerability,
              giocato,
              stelleDelVoto: esito.stelle,
              noi: { riferimento: calcolo.par, metro: "esatto" },
              loro: { riferimento: Math.max(calcolo.par, -calcolo.par), metro: "esatto" },
            })}
          />
          <div className="mt-4">
            <RisultatoDoppioMorto mani={deal} dealer={dealer} vulnerability={vulnerability} bids={licita} />
          </div>
          {salvataggio === "errore" && (
            <p className="mt-3 text-xs text-destructive">
              {t("Il risultato non è arrivato all'insegnante. Controlla la connessione e ridichiara la mano.")}
            </p>
          )}
          {onGioca && daGiocare && partnershipOf(daGiocare.declarer) === "ew" && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("Il contratto è degli avversari: lo giochi in difesa, da Sud.")}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {onGioca && daGiocare && (
              <Button onClick={() => onGioca(daGiocare)} disabled={salvataggio === "in-corso"}>
                <Play className="mr-1 h-4 w-4" aria-hidden="true" />
                {partnershipOf(daGiocare.declarer) === "ew" ? t("Gioca in difesa") : t("Gioca il contratto")}
              </Button>
            )}
            <Button
              variant={onGioca && daGiocare ? "outline" : "default"}
              onClick={onEsci}
              disabled={salvataggio === "in-corso"}
            >
              {t("Torna al compito")}
            </Button>
            {/* Un'asta registrata resta quella: l'insegnante la corregge e
                l'allievo ci torna a guardare l'errore (27/10/2026). Si rifà
                solo se non è arrivata all'insegnante. */}
            {salvataggio === "errore" && (
              <Button variant="outline" onClick={riprova}>
                <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" />
                {t("Ridichiarala")}
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="mt-5 text-xs text-muted-foreground">
        {t("Il compagno e gli avversari sono BEN: le loro scelte possono differire dagli accordi del corso. Il voto valuta il contratto raggiunto, non l'aderenza al sistema.")}
      </p>
    </div>
  );
}

/** Il contratto che l'allievo ha appena dichiarato, pronto da giocare. */
export interface ContrattoDaGiocare {
  /** «4♠», «3SAX»: la forma che legge il motore di gioco. */
  contract: string;
  declarer: Position;
  dealer: Position;
  /** La licita come l'ha dichiarata, nella forma della schermata. */
  bids: string[];
  riga: ReturnType<typeof rigaCompitoLicita>;
}

function formatSuit(hand: readonly Card[], suit: Suit): string {
  const cards = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
  return cards.length ? cards.join(" ") : "—";
}
