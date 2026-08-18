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
import { useT } from "@/contexts/traduzioni-provider";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const SIMBOLO: Record<Suit, string> = { spade: "♠", heart: "♥", diamond: "♦", club: "♣" };
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const NOME: Record<Position, string> = {
  north: "Nord", east: "Est", south: "Sud", west: "Ovest",
};

interface Foglio {
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
 * LE SOLUZIONI VANNO IN FONDO
 * Un foglio che accanto a ogni mano scrive il contratto giusto si legge una
 * volta e si butta. Contratti e dichiaranti stanno in ultima pagina, così il
 * foglio si può usare come esercizio prima di diventare una risposta.
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

  useEffect(() => {
    if (!compitoId) return;
    getAssignment(compitoId)
      .then((a) => {
        setTitoloCompito(a.title);
        setDaCompito(
          (a.custom_hands ?? []).map((s: Smazzata) => ({
            hands: s.hands,
            titolo: s.title,
            contratto: s.contract,
            dichiarante: s.declarer,
          }))
        );
      })
      .catch((err) => reportError("dispensa:compito", err));
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
          Il foglio da consegnare a fine lezione. Le soluzioni stanno in fondo,
          così la stessa dispensa serve prima come esercizio.
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
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" aria-hidden="true" />
            {t("Stampa o salva in PDF")}
          </Button>
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
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          {fogli.map((f, i) => (
            // `break-inside-avoid`: senza, una mano finisce mezza su una pagina
            // e mezza sull'altra, ed è illeggibile proprio nel momento in cui
            // serve.
            <section
              key={i}
              className="rounded-xl border border-border p-3 break-inside-avoid print:border-black"
            >
              <h3 className="font-bold text-sm mb-2">{f.titolo}</h3>
              <Diagramma hands={f.hands} />
            </section>
          ))}
        </div>

        {conSoluzioni && (
          <section className="mt-8 break-before-page">
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
          {SIMBOLO[suit]} {formatSuit(cards, suit)}
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
  return cards.length ? cards.join("") : "—";
}
