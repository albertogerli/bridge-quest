"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/report-error";
import type { Card, Position, Suit } from "@/lib/bridge-engine";
import {
  analyseReplay,
  significantMoments,
  type PlayedTrick,
  type ReplayAnalysis,
} from "@/lib/dds-replay";

/**
 * «Dove è cambiata la mano».
 *
 * Rigioca la smazzata presa per presa e mostra i momenti in cui il totale
 * ottenibile dal dichiarante è variato.
 *
 * IL TONO NON È NEUTRO PER CASO
 * Il double dummy vede tutte e 52 le carte: una presa persa qui poteva essere
 * imperdibile al tavolo, dove le mani avversarie sono coperte. Per questo si
 * dice «qui la mano è cambiata» e mai «qui hai sbagliato» — la seconda
 * formulazione sarebbe falsa e insegnerebbe che bisognava indovinare.
 *
 * Non parte da sola: è un calcolo di una decina di risoluzioni, e va chiesto.
 */
export function TurningPointPanel({
  hands,
  tricks,
  strain,
  declarer,
}: {
  hands: Record<Position, Card[]>;
  tricks: PlayedTrick[];
  strain: Suit | null;
  declarer: Position;
}) {
  const [analysis, setAnalysis] = useState<ReplayAnalysis | null>(null);
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    setWorking(true);
    setFailed(false);
    try {
      setAnalysis(await analyseReplay(hands, tricks, strain, declarer));
    } catch (err) {
      reportError("analisi:punto-di-svolta", err);
      setFailed(true);
    } finally {
      setWorking(false);
    }
  };

  if (!analysis) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-bold mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-figb" aria-hidden="true" />
          Dove è cambiata la mano
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Rigioca la smazzata presa per presa e indica i momenti in cui il
          risultato ottenibile è cambiato.
        </p>
        {failed && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
            Il calcolo non è riuscito. Riprova.
          </p>
        )}
        <Button disabled={working} onClick={run}>
          {working ? "Analizzo…" : "Analizza"}
        </Button>
      </div>
    );
  }

  const momenti = significantMoments(analysis);
  const cali = momenti.filter((m) => m.delta < 0);
  const regali = momenti.filter((m) => m.delta > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-figb" aria-hidden="true" />
        Dove è cambiata la mano
      </h3>

      <p className="text-sm text-muted-foreground mb-4">
        All&apos;inizio il dichiarante poteva fare{" "}
        <span className="font-bold text-foreground">{analysis.initialPotential}</span> prese
        a carte scoperte. Ne ha fatte{" "}
        <span className="font-bold text-foreground">{analysis.finalTricks}</span>.
      </p>

      {momenti.length === 0 ? (
        <p className="text-sm">
          Il risultato non è mai cambiato: la mano è stata giocata e difesa
          senza sbandamenti rispetto al gioco a carte scoperte.
        </p>
      ) : (
        <ul className="space-y-2">
          {cali.map((m) => (
            <motion.li
              key={`c${m.trick}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-2"
            >
              <TrendingDown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-amber-900 dark:text-amber-200">
                <span className="font-bold">Presa {m.trick}:</span> qui il
                risultato ottenibile è sceso di {Math.abs(m.delta)}{" "}
                {Math.abs(m.delta) === 1 ? "presa" : "prese"}. Vale la pena
                rivedere questa presa.
              </p>
            </motion.li>
          ))}
          {regali.map((m) => (
            <motion.li
              key={`r${m.trick}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">Presa {m.trick}:</span> qui il
                dichiarante ha guadagnato {m.delta}{" "}
                {m.delta === 1 ? "presa" : "prese"}: è la difesa ad aver
                lasciato qualcosa.
              </p>
            </motion.li>
          ))}
        </ul>
      )}

      {/* Senza questa avvertenza lo strumento insegnerebbe che quelle prese
          erano trovabili al tavolo, il che è falso e scoraggiante. */}
      <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
        Il conteggio è a carte scoperte, con gioco perfetto di entrambe le
        linee. Al tavolo, senza vedere le mani avversarie, alcune di queste
        prese non erano trovabili: questi sono i momenti su cui ragionare, non
        errori.
      </p>
    </div>
  );
}
