"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSharedAuth } from "@/contexts/auth-provider";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import { DEAL_TEMPLATES, generateDeals, handHcp } from "@/lib/deal-generator";
import { getAssignment } from "@/lib/instructors";
import type { Smazzata } from "@/lib/catalog";
import { getAllSmazzate } from "@/lib/catalog";
import { mieNote } from "@/lib/note-smazzate";
import { RanghiSeme } from "@/components/bridge/ranghi-seme";
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const SIMBOLO: Record<Suit, string> = { spade: "♠", heart: "♥", diamond: "♦", club: "♣" };
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const NOME: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

/**
 * Che cosa finisce sul foglio.
 *
 * PERCHÉ TRE VALORI E NON UN INTERRUTTORE. «Con o senza soluzioni» sembra un
 * sì/no, ma le stampe che servono sono tre e diverse fra loro: il foglio da
 * consegnare, il foglietto delle sole risposte da tenere in mano mentre si
 * spiega, e il documento intero per l'archivio dell'insegnante.
 *
 * PRONTO PER IL PERMESSO CHE ARRIVERÀ. Giuseppe Trevissoi ha chiesto anche che
 * sia l'insegnante a decidere se l'allievo possa avere le soluzioni. Quella
 * richiesta è ancora ambigua — se intenda «scelgo cosa metto nel PDF che
 * distribuisco» oppure «l'allievo stampa da solo dal portale» — e va chiarita
 * con lui. Qui la scelta è già un valore tipizzato e non un booleano sparso:
 * quando il permesso arriverà basterà restringere le opzioni disponibili, non
 * rifare la pagina.
 */
type ParteDaStampare = "dispensa" | "soluzioni" | "tutto";

const MOSTRA_MANI: Record<ParteDaStampare, boolean> = {
  dispensa: true, soluzioni: false, tutto: true,
};
const MOSTRA_SOLUZIONI: Record<ParteDaStampare, boolean> = {
  dispensa: false, soluzioni: true, tutto: true,
};

interface Foglio {
  /** L'id nel catalogo, quando la mano viene da lì: serve per la nota. */
  id?: string;
  hands: Record<Position, Card[]>;
  titolo: string;
  contratto?: string;
  dichiarante?: Position;
}

/**
 * Dispensa da stampare.
 *
 * PERCHÉ ESISTE
 * Alla fine della lezione l'allievo si porta a casa un foglio, e finora quel
 * foglio se lo ricopiava a mano l'insegnante. Qui esce dalle stesse mani che
 * la classe ha appena visto — generate o assegnate come compito.
 *
 * NON È UNA PAGINA WEB STAMPATA
 * Con `@media print` sparisce tutto ciò che su carta non ha senso: pulsanti,
 * navigazione, colori di sfondo che divorano il toner. Restano i diagrammi,
 * in bianco e nero, uno per riquadro, con l'interruzione di pagina messa dove
 * non spezza una mano a metà.
 *
 * TRE FOGLI, NON UNO
 * Prima era un documento solo con le soluzioni in ultima pagina. Giuseppe
 * Trevissoi ha fatto notare che quella che si consegna deve contenere solo gli
 * esercizi: se l'allievo ha già le risposte, non viene a lezione a sentirsele
 * spiegare. Quindi si sceglie che cosa stampare — dispensa, sole soluzioni,
 * oppure tutto — e la dispensa parte senza risposte.
 *
 * Contratti e dichiaranti, quando ci sono, restano comunque in ultima pagina e
 * mai accanto alla mano: un foglio che scrive la risposta di fianco
 * all'esercizio si legge una volta e si butta.
 */
export default function DispensaPage() {
  return (
    <Suspense fallback={null}>
      <Dispensa />
    </Suspense>
  );
}

function Dispensa() {
  const t = useT();
  const { user, loading } = useSharedAuth();
  const params = useSearchParams();
  const compitoId = params.get("compito");

  const [daCompito, setDaCompito] = useState<Foglio[] | null>(null);
  const [titoloCompito, setTitoloCompito] = useState<string>("");
  const [modelloId, setModelloId] = useState(DEAL_TEMPLATES[0].id);
  const [seed, setSeed] = useState(2026);
  const [quante, setQuante] = useState(8);
  const [note, setNote] = useState<Map<string, string>>(new Map());
  /** Formato compatto: ~24 mani per pagina, per gli hand record. */
  const [compatto, setCompatto] = useState(false);
  /**
   * Il foglio da consegnare parte SENZA soluzioni: è la richiesta di
   * Trevissoi — «la dispensa deve contenere solo il testo della lezione, non i
   * risultati degli esercizi» — e il motivo didattico è che se l'allievo ha già
   * le risposte non viene a lezione a sentirsele spiegare.
   */
  const [parte, setParte] = useState<ParteDaStampare>("dispensa");
  const [conPunti, setConPunti] = useState(false);

  useEffect(() => {
    if (!compitoId) return;
    let vivo = true;
    void (async () => {
      try {
        const a = await getAssignment(compitoId);
        if (!vivo) return;
        setTitoloCompito(a.title);

        /**
         * LE MANI DEL CATALOGO, non solo quelle importate.
         *
         * Prima si leggeva solo `custom_hands`, cioè le mani caricate da PBN.
         * Un compito nato da «assegna la lezione» non ne ha nessuna — ha solo
         * gli id delle smazzate — quindi la dispensa di quel compito usciva
         * VUOTA e ripiegava sulle mani generate a caso: un foglio che non
         * c'entrava niente con la lezione, stampato senza che nessuno se ne
         * accorgesse.
         */
        const catalogo = await getAllSmazzate();
        const perId = new Map(catalogo.map((s) => [s.id, s]));
        const fogli = a.smazzata_ids
          .map((id) => perId.get(id) ?? a.custom_hands?.find((h) => h.id === id))
          .filter((s): s is Smazzata => s !== undefined)
          .map((s) => ({
            hands: s.hands,
            titolo: s.title,
            contratto: s.contract,
            dichiarante: s.declarer,
            id: s.id,
          }));
        if (vivo) setDaCompito(fogli);

        // Le note dell'insegnante seguono la mano: se ne ha scritta una l'anno
        // scorso, ricompare su questo foglio senza cercarla.
        const note = await mieNote(fogli.map((f) => f.id).filter(Boolean) as string[]);
        if (vivo) setNote(note);
      } catch (err) {
        reportError("dispensa:compito", err);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [compitoId]);

  const modello = DEAL_TEMPLATES.find((t) => t.id === modelloId) ?? DEAL_TEMPLATES[0];

  const generate = useMemo<Foglio[]>(() => {
    const { deals } = generateDeals(modello.constraints, { count: quante, seed });
    return deals.map((d, i) => ({ hands: d, titolo: `Mano ${i + 1}` }));
  }, [modello, seed, quante]);

  const fogli = daCompito && daCompito.length > 0 ? daCompito : generate;
  const titolo = titoloCompito || modello.label;
  const conSoluzioni = fogli.some((f) => f.contratto);

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Riservato agli insegnanti.{" "}
          <Link href="/login?redirect=/istruttori/dispensa" className="underline">{t("Accedi")}</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
      {/* Comandi: spariscono in stampa */}
      <div className="print:hidden mb-6">
        <h1 className="text-2xl font-bold font-display mb-1">{t("Dispensa")}</h1>
        <p className="text-sm text-muted-foreground mb-4">
          {parte === "dispensa"
            ? t("Il foglio da consegnare a fine lezione: solo le mani, senza le risposte.")
            : parte === "soluzioni"
              ? t("Solo contratti e dichiaranti: il foglietto da tenere in mano mentre spieghi.")
              : t("Mani e soluzioni insieme, con le risposte in ultima pagina: la copia per te.")}
        </p>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          {!compitoId && (
            <>
              <div>
                <label htmlFor="argomento" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  {t("Argomento")}
                </label>
                <select
                  id="argomento"
                  value={modelloId}
                  onChange={(e) => setModelloId(e.target.value)}
                  className="h-11 px-3 rounded-xl border border-border bg-card text-sm"
                >
                  {DEAL_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quante" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  {t("Quante mani")}
                </label>
                <input
                  id="quante"
                  type="number"
                  min={1}
                  max={24}
                  value={quante}
                  onChange={(e) => setQuante(Math.min(24, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-24 h-11 px-3 rounded-xl border border-border bg-card text-sm"
                />
              </div>
              <Button variant="outline" onClick={() => setSeed((s) => s + 1)}>
                {t("Altre mani")}
              </Button>
            </>
          )}
          <Button variant={compatto ? "default" : "outline"} onClick={() => setCompatto((v) => !v)}>
            {compatto ? t("Una per pagina") : t("Formato compatto")}
          </Button>
          <Button variant={conPunti ? "default" : "outline"} onClick={() => setConPunti((v) => !v)}>
            {conPunti ? t("Nascondi i punti") : t("Mostra i punti")}
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" aria-hidden="true" />
            {t("Stampa o salva in PDF")}
          </Button>
        </div>

        {/* Che cosa stampare: tre fogli diversi, non un interruttore. */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("Cosa stampare:")}</span>
          {([
            ["dispensa", t("Dispensa per gli allievi")],
            ["soluzioni", t("Solo le soluzioni")],
            ["tutto", t("Tutto")],
          ] as [ParteDaStampare, string][]).map(([valore, etichetta]) => (
            <Button
              key={valore}
              size="sm"
              variant={parte === valore ? "default" : "outline"}
              onClick={() => setParte(valore)}
            >
              {etichetta}
            </Button>
          ))}
        </div>
      </div>

      {/* Il foglio vero e proprio */}
      <article className="print:text-black">
        <header className="mb-6">
          <h2 className="text-xl font-bold">{titolo}</h2>
          {!compitoId && (
            <p className="text-sm text-muted-foreground print:text-black">{modello.description}</p>
          )}
          <p className="text-xs text-muted-foreground print:text-black mt-1">
            Bridge LAB — FIGB · {fogli.length} {fogli.length === 1 ? "mano" : "mani"}
            {parte === "soluzioni" && ` · ${t("soluzioni")}`}
          </p>
        </header>

        {/*
          Due formati, e la differenza non è estetica: uno è il foglio da
          consegnare — una mano per riquadro, con spazio per la nota — l'altro
          è l'hand record, quello che si tiene sul tavolo mentre si gioca, dove
          quello che conta è quante ne stanno su una pagina.
        */}
        {MOSTRA_MANI[parte] && (
        <div
          className={
            compatto
              ? "grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4 print:text-[10pt]"
              : "grid gap-5 sm:grid-cols-2"
          }
        >
          {fogli.map((f, i) => (
            // `break-inside-avoid`: senza, una mano finisce mezza su una pagina
            // e mezza sull'altra, ed è illeggibile proprio nel momento in cui
            // serve.
            <section
              key={i}
              className={`break-inside-avoid rounded-xl border border-border print:border-black ${
                compatto ? "p-1.5" : "p-3"
              }`}
            >
              {/*
                Non meno di 12px a schermo: il guardiano in `tipografia.test.ts`
                lo vieta, e ha ragione — il pubblico di BridgeLab ha fra i 45 e
                i 65 anni. In stampa comanda comunque `print:text-[10pt]` sul
                contenitore, che è la misura giusta per un hand record.
              */}
              <h3 className={`font-bold mb-2 ${compatto ? "text-[12px]" : "text-sm"}`}>
                {compatto ? `${i + 1}. ${f.titolo}` : f.titolo}
              </h3>
              <Diagramma hands={f.hands} />
              {conPunti && (
                <p className="mt-1 text-[12px] text-muted-foreground print:text-black">
                  N {handHcp(f.hands.north)} · E {handHcp(f.hands.east)} · S{" "}
                  {handHcp(f.hands.south)} · O {handHcp(f.hands.west)}
                </p>
              )}
              {!compatto && f.id && note.get(f.id) && (
                <p className="mt-2 border-t border-border pt-2 text-[12px] leading-relaxed print:border-black print:text-black">
                  {note.get(f.id)}
                </p>
              )}
            </section>
          ))}
        </div>
        )}

        {conSoluzioni && MOSTRA_SOLUZIONI[parte] && (
          <section className={MOSTRA_MANI[parte] ? "mt-8 break-before-page" : "mt-4"}>
            <h2 className="text-lg font-bold mb-3">{t("Soluzioni")}</h2>
            <ol className="text-sm space-y-1">
              {fogli.map((f, i) => (
                <li key={i}>
                  <strong>{f.titolo}:</strong>{" "}
                  {f.contratto
                    ? `${f.contratto} — dichiara ${f.dichiarante ? NOME[f.dichiarante] : "—"}`
                    : "—"}
                </li>
              ))}
            </ol>
          </section>
        )}
      </article>
    </div>
  );
}

/** Diagramma di una smazzata nella forma del tavolo. */
function Diagramma({ hands }: { hands: Record<Position, Card[]> }) {
  return (
    <div className="grid grid-cols-3 gap-1 text-[13px] leading-tight font-mono">
      <div />
      <ManoStampa cards={hands.north} etichetta="N" />
      <div />
      <ManoStampa cards={hands.west} etichetta="O" />
      <div />
      <ManoStampa cards={hands.east} etichetta="E" />
      <div />
      <ManoStampa cards={hands.south} etichetta="S" />
      <div />
    </div>
  );
}

function ManoStampa({ cards, etichetta }: { cards: Card[]; etichetta: string }) {
  return (
    <div className="min-w-0">
      <p className="font-sans font-bold text-[12px] text-muted-foreground print:text-black">
        {etichetta} <span className="font-normal">{handHcp(cards)} PO</span>
      </p>
      {SUITS.map((suit) => (
        <p key={suit} className="whitespace-nowrap">
          {SIMBOLO[suit]} <RanghiSeme ranghi={ranghiDelSeme(cards, suit)} />
        </p>
      ))}
    </div>
  );
}

/** I ranghi del seme, ordinati. Il raggruppamento lo fa `RanghiSeme`. */
function ranghiDelSeme(hand: readonly Card[], suit: Suit): string[] {
  return hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank))
    .map((c) => c.rank);
}
