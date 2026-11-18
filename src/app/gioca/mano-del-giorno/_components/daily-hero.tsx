"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toGamePosition } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import {
  formatDate,
  formatVulnerability,
  positionLabelIt,
} from "@/lib/daily-hand";
import { Ventaglio } from "@/components/bridge/ventaglio";
import { ordinaManoAlternata } from "@/lib/ordine-semi";
import { useLingua } from "@/hooks/use-lingua";
import { useT } from "@/contexts/traduzioni-provider";
import { contrattoLeggibile } from "@/lib/contratto-leggibile";

/**
 * Scheda principale: data, contratto della mano di oggi, anteprima della mano
 * di Sud e CTA di gioco (o di rigioco, se la giornata è già stata completata).
 */
export function DailyHero({
  mounted,
  today,
  todayHand,
  tricksNeeded,
  alreadyPlayed,
  xpLabel,
  onPlay,
}: {
  mounted: boolean;
  today: string;
  todayHand: Smazzata;
  tricksNeeded: number;
  alreadyPlayed: boolean;
  xpLabel: string;
  onPlay: () => void;
}) {
  const t = useT();
  const { lingua } = useLingua();
  const contratto = contrattoLeggibile(todayHand.contract);
  const sud = todayHand.hands[toGamePosition("south", todayHand.declarer)];
  /*
   * RIDISEGNATA IL 18/11/2026. Prima: un riquadro crema e arancio con due
   * bagliori sfocati, la mano di Sud in un rettangolino a lato e un pulsante
   * verde largo tutta la pagina. Adesso le carte stanno sul panno, grandi, e il
   * pulsante è il blu di tutte le azioni principali del sito.
   */
  return (
    <section className="grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="panno-bg flex flex-col items-center justify-center gap-3 px-5 py-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{t("La tua mano (Sud)")}</p>
        <Ventaglio carte={ordinaManoAlternata(sud)} larghezza={46} etichetta={t("La tua mano (Sud)")} />
      </div>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">{t("Mano del Giorno")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{mounted ? formatDate(today) : ""}</p>
          </div>
          {alreadyPlayed && (
            <Badge className="shrink-0 border-0 bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {t("Completata")}
            </Badge>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("Contratto")}</dt>
            <dd className="font-display text-2xl font-bold tabular-nums">{lingua === "en" ? contratto.replace("SA", "NT") : contratto}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("Dichiarante")}</dt>
            <dd className="font-display text-2xl font-bold">{t(positionLabelIt(todayHand.declarer))}</dd>
          </div>
        </dl>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{t("Obiettivo: {n} prese", { n: tricksNeeded })}</span>
          <span>{t("Vulnerabilità: {v}", { v: formatVulnerability(todayHand.vulnerability) })}</span>
        </p>
        <p className="font-semibold text-pretty">{todayHand.title}</p>
        {!alreadyPlayed && (
          <p className="text-sm text-muted-foreground">
            <span className="rounded-full bg-gold/20 px-2 py-0.5 font-bold text-foreground">+50 {xpLabel}</span> {t("Bonus Giornaliero")}
          </p>
        )}
        <div className="mt-auto">
          {!alreadyPlayed ? (
            <Button onClick={onPlay} className="h-12 w-full rounded-xl text-base font-bold sm:w-auto sm:px-8">
              {t("Gioca la Mano del Giorno")}
            </Button>
          ) : (
            <Button onClick={onPlay} variant="outline" className="h-12 w-full rounded-xl font-bold sm:w-auto sm:px-8">
              {t("Rigioca la mano di oggi")}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
