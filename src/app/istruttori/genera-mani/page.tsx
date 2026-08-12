"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { dealsToSmazzate } from "@/lib/deals-to-smazzate";
import { bestContractFor, calcTableAndPar, type ParResult } from "@/lib/dds-table";
import { createAssignment, getMyClasses, type ClassRoom } from "@/lib/instructors";
import { reportError } from "@/lib/report-error";

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

  // Assegnazione a una classe
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState("");
  const [contract, setContract] = useState("3NT");
  const [declarer, setDeclarer] = useState<Position>("south");
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState("");

  // Analisi double dummy, una voce per mano nello stesso ordine dei risultati.
  // Non parte da sola: e' un calcolo, e chi genera venti mani per scorrerle
  // non deve pagarlo se non gli serve.
  const [analisi, setAnalisi] = useState<
    {
      par: ParResult;
      suggerito: string | null;
      /** Contratto e dichiarante da usare per questa mano nel compito. */
      migliore: { contract: string; declarer: Position } | null;
    }[] | null
  >(null);
  const [analizzando, setAnalizzando] = useState(false);

  useEffect(() => {
    // Se non insegna in nessuna classe, il riquadro di assegnazione non
    // compare affatto: meglio di un elenco vuoto che sembra un guasto.
    getMyClasses()
      .then(setClasses)
      .catch((err) => reportError("genera-mani:classi", err));
  }, []);

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
        // L'analisi vale per le mani precedenti: tenerla mostrerebbe il par
        // di una mano accanto alle carte di un'altra.
        setAnalisi(null);
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

  /** Calcola par e contratto consigliato per ogni mano generata. */
  const analizza = async () => {
    if (!result?.deals.length) return;
    setAnalizzando(true);
    setAnalisi([]);
    try {
      const out: NonNullable<typeof analisi> = [];
      for (const [i, deal] of result.deals.entries()) {
        // Dichiarante e vulnerabilità seguono la rotazione dei board, la
        // stessa che finisce nelle smazzate assegnate: il par mostrato qui è
        // quello del compito, non di una mano astratta.
        const dealer = SEATS[i % 4].key;
        const vuln = (["none", "ns", "ew", "both"] as const)[i % 4];
        const { table, par } = await calcTableAndPar(deal, dealer, vuln);
        const best = bestContractFor(table, "ns");
        out.push({
          par,
          suggerito: best
            ? `${best.contract} ${SEATS.find((s) => s.key === best.declarer)?.label}`
            : null,
          migliore: best ? { contract: best.contract, declarer: best.declarer } : null,
        });
        // Si mostra man mano e si cede il controllo al browser: venti mani a
        // qualche centinaio di millisecondi ciascuna congelerebbero la pagina
        // per secondi, e l'insegnante non saprebbe se sta lavorando.
        setAnalisi([...out]);
        await new Promise((r) => setTimeout(r, 0));
      }
    } catch (err) {
      reportError("genera-mani:dds", err);
    } finally {
      setAnalizzando(false);
    }
  };

  const assign = async () => {
    if (!result?.deals.length || !classId) return;
    setAssigning(true);
    setAssigned("");
    try {
      const smazzate = dealsToSmazzate(result.deals, {
        // Se il par e' stato calcolato, ogni mano prende il contratto che
        // regge davvero: un contratto unico e' impossibile su alcune mani e
        // troppo timido su altre.
        perHand: analisi?.map((a) => a.migliore) ?? undefined,
        // Il seme entra nell'id: due compiti generati con semi diversi non si
        // sovrappongono, e lo stesso seme resta riconoscibile.
        idPrefix: `gen-${template.id}-${seed}`,
        contract,
        declarer,
        title: template.label,
        commentary: template.description,
      });
      await createAssignment({
        classId,
        title: `${template.label} (${smazzate.length} mani)`,
        smazzataIds: smazzate.map((s) => s.id),
        customHands: smazzate,
        instructorNote: template.description,
      });
      setAssigned(`Compito creato con ${smazzate.length} mani.`);
    } catch (err) {
      reportError("genera-mani:assegna", err);
      setAssigned("Non è stato possibile creare il compito. Riprova.");
    } finally {
      setAssigning(false);
    }
  };

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
            <Button variant="outline" disabled={analizzando} onClick={analizza}>
              {analizzando
              ? `Calcolo il par… ${analisi?.length ?? 0}/${result?.deals.length ?? 0}`
              : "Calcola par"}
            </Button>
          ) : null}
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

      {result && result.deals.length > 0 && classes.length > 0 && (
        <div className="rounded-2xl border border-figb/30 bg-figb/5 p-5 mb-6">
          <h2 className="font-bold mb-1">Assegna alla classe</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Le mani diventano un compito che gli allievi trovano nella loro
            classe.
          </p>
          {analisi?.length === result.deals.length ? (
            <p className="text-sm text-figb font-medium mb-4">
              Hai calcolato il par: ogni mano userà il contratto più alto che
              regge davvero, invece di uno uguale per tutte. Le scelte qui sotto
              valgono solo per le mani senza un contratto mantenibile.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              Contratto e dichiarante valgono per tutte le mani. Se prima premi
              «Calcola par», ognuna prende invece il contratto che le sue carte
              reggono — un contratto unico è impossibile su alcune mani e troppo
              timido su altre.
            </p>
          )}

          <div className="flex flex-wrap gap-3 mb-4">
            <div>
              <label htmlFor="classe" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Classe
              </label>
              <select
                id="classe"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="h-12 px-4 rounded-xl border border-border bg-card text-sm min-w-[12rem]"
              >
                <option value="">Scegli…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contratto" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Contratto
              </label>
              <select
                id="contratto"
                value={contract}
                onChange={(e) => setContract(e.target.value)}
                className="h-12 px-4 rounded-xl border border-border bg-card text-sm"
              >
                {["1NT", "2NT", "3NT", "2♠", "3♠", "4♠", "2♥", "3♥", "4♥", "3♦", "5♦", "3♣", "5♣"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dichiarante" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Dichiarante
              </label>
              <select
                id="dichiarante"
                value={declarer}
                onChange={(e) => setDeclarer(e.target.value as typeof declarer)}
                className="h-12 px-4 rounded-xl border border-border bg-card text-sm"
              >
                {SEATS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button disabled={assigning || !classId} onClick={assign}>
            {assigning ? "Creo il compito…" : `Assegna ${result.deals.length} mani`}
          </Button>
          {assigned && <p className="text-sm mt-3 font-medium">{assigned}</p>}
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
                {analisi?.[i] && (
                  <div className="mb-3 rounded-xl bg-figb/5 border border-figb/20 px-3 py-2">
                    <p className="text-xs">
                      <span className="font-bold text-figb">Par:</span>{" "}
                      {analisi[i].par.contracts.join(", ")}{" "}
                      <span className="text-muted-foreground">
                        ({analisi[i].par.score > 0 ? "+" : ""}
                        {analisi[i].par.score} per N-S)
                      </span>
                    </p>
                    {analisi[i].suggerito && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Contratto più alto mantenibile da N-S: {analisi[i].suggerito}
                      </p>
                    )}
                  </div>
                )}
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
