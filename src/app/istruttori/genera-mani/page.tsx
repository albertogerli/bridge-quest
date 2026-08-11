"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Download, RefreshCw, Wand2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useSharedAuth } from "@/contexts/auth-provider";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import {
  DEAL_TEMPLATES,
  generateDeals,
  handHcp,
  handShape,
  type DealConstraints,
} from "@/lib/deal-generator";
import { dealsToPbn } from "@/lib/pbn";

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const SEATS: { key: Position; label: string }[] = [
  { key: "north", label: "Nord" },
  { key: "east", label: "Est" },
  { key: "south", label: "Sud" },
  { key: "west", label: "Ovest" },
];

/**
 * Generatore di mani con vincoli, per insegnanti.
 *
 * Risolve il limite che oggi hanno i compiti: tutte le mani sono curate a mano
 * nel catalogo, quindi un esercizio su un argomento specifico dipende dal fatto
 * che qualcuno abbia già preparato le mani giuste. Qui si dichiara cosa deve
 * avere la mano e si ottengono tutte le distribuzioni coerenti che servono.
 *
 * Tutto gira nel browser: nessuna chiamata al server, nessuna mano salvata
 * finché non si decide di scaricarla.
 */
export default function GeneraManiPage() {
  const { user, loading: authLoading } = useSharedAuth();

  const [templateId, setTemplateId] = useState(DEAL_TEMPLATES[0].id);
  const [count, setCount] = useState(8);
  // Il seme è esplicito e modificabile: è ciò che rende una serie
  // riproducibile. Stesso seme e stesso modello = stesse mani, anche fra un
  // anno e su un altro computer.
  const [seed, setSeed] = useState(2026);
  const [result, setResult] = useState<ReturnType<typeof generateDeals> | null>(null);
  const [working, setWorking] = useState(false);

  const template = useMemo(
    () => DEAL_TEMPLATES.find((t) => t.id === templateId) ?? DEAL_TEMPLATES[0],
    [templateId]
  );

  const run = useCallback(
    (constraints: DealConstraints, useSeed: number) => {
      setWorking(true);
      // Un frame di respiro prima di un ciclo che può durare qualche decimo di
      // secondo, così il pulsante mostra lo stato invece di bloccarsi muto.
      requestAnimationFrame(() => {
        setResult(generateDeals(constraints, { count, seed: useSeed }));
        setWorking(false);
      });
    },
    [count]
  );

  const download = useCallback(() => {
    if (!result?.deals.length) return;
    const blob = new Blob([dealsToPbn(result.deals, `BridgeLab - ${template.label}`)], {
      type: "application/x-pbn",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bridgelab-${template.id}-${seed}.pbn`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, template, seed]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Questa pagina è riservata agli insegnanti.{" "}
          <Link href="/login?redirect=/istruttori/genera-mani" className="underline">
            Accedi
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-figb" aria-hidden="true" />
          Genera mani
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scegli cosa deve avere la mano e ottieni tutte le distribuzioni che
          servono, senza aspettare che esca quella giusta per caso.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <label
          htmlFor="modello"
          className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider"
        >
          Argomento
        </label>
        <select
          id="modello"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-border bg-card text-sm mb-1"
        >
          {DEAL_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mb-4">{template.description}</p>

        <div className="flex flex-wrap gap-4 mb-5">
          <div>
            <label
              htmlFor="quante"
              className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider"
            >
              Quante mani
            </label>
            <input
              id="quante"
              type="number"
              min={1}
              max={32}
              value={count}
              onChange={(e) =>
                setCount(Math.min(32, Math.max(1, Number(e.target.value) || 1)))
              }
              className="w-28 h-12 px-4 rounded-xl border border-border bg-card text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="seme"
              className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider"
            >
              Seme
            </label>
            <input
              id="seme"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="w-32 h-12 px-4 rounded-xl border border-border bg-card text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Lo stesso seme, con lo stesso argomento, produce sempre le stesse
          mani: annotalo e potrai ridistribuire alla classe esattamente la
          stessa serie, anche fra un anno.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button disabled={working} onClick={() => run(template.constraints, seed)}>
            {working ? "Genero…" : "Genera"}
          </Button>
          <Button
            variant="outline"
            disabled={working}
            onClick={() => {
              const next = seed + 1;
              setSeed(next);
              run(template.constraints, next);
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
            Altre mani
          </Button>
          {result?.deals.length ? (
            <Button variant="outline" onClick={download}>
              <Download className="w-4 h-4 mr-1" aria-hidden="true" />
              Scarica PBN
            </Button>
          ) : null}
        </div>
      </div>

      {result?.exhausted && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 mb-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Trovate {result.deals.length} mani su {count} richieste dopo{" "}
            {result.attempts.toLocaleString("it-IT")} tentativi. Il vincolo è
            molto stretto: distribuzioni così sono rare anche al tavolo.
          </p>
        </div>
      )}

      {result && result.deals.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            {result.deals.length} mani ·{" "}
            {result.attempts.toLocaleString("it-IT")} distribuzioni esaminate
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {result.deals.map((deal, i) => (
              <li key={i} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm">Mano {i + 1}</span>
                  <Badge variant="secondary">
                    N-S {handHcp(deal.north) + handHcp(deal.south)} PO
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SEATS.map(({ key, label }) => (
                    <div key={key}>
                      <p className="text-xs font-bold text-muted-foreground mb-1">
                        {label}{" "}
                        <span className="font-normal">
                          {handHcp(deal[key])} PO · {handShape(deal[key])}
                        </span>
                      </p>
                      {SUITS.map((suit) => (
                        <p key={suit} className="text-xs font-mono flex items-center gap-1">
                          <SuitSymbol suit={suit} size="xs" />
                          {formatSuit(deal[key], suit)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Carte di un seme in ordine decrescente, o un trattino se il seme è vuoto. */
function formatSuit(hand: readonly Card[], suit: Suit): string {
  const order = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const cards = hand
    .filter((c) => c.suit === suit)
    .sort((a, b) => order.indexOf(a.rank) - order.indexOf(b.rank))
    .map((c) => c.rank);
  return cards.length ? cards.join(" ") : "—";
}
