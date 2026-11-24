"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "@/components/link";
import { Ventaglio } from "@/components/bridge/ventaglio";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import { getSmazzataForDate, getTodayString } from "@/lib/daily-hand";
import { contrattoLeggibile } from "@/lib/contratto-leggibile";
import { ordinaManoAlternata } from "@/lib/ordine-semi";
import { toGamePosition } from "@/lib/bridge-engine";

/**
 * La Mano del giorno come tessera: il panno con la mano di Sud a sinistra, il
 * testo e il pulsante a destra. Sta in Gioca e nella home di chi non ha un
 * corso, così la stessa cosa ha lo stesso aspetto nei due posti (18/11/2026).
 */
export function ManoDelGiornoTessera({ pool }: { pool: Parameters<typeof getSmazzataForDate>[1] }) {
  const t = useT();
  const { lingua } = useLingua();
  // La data si legge dopo il primo disegno: sul server sarebbe un altro giorno.
  const [oggi, setOggi] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data locale letta dopo il mount: sul server il giorno può essere un altro, e il disegno non deve divergere
    setOggi(getTodayString(Date.now()));
  }, []);
  const mano = useMemo(() => (oggi ? getSmazzataForDate(oggi, pool) : null), [oggi, pool]);
  const contratto = mano ? contrattoLeggibile(mano.contract) : "";
  const contrattoMostrato = lingua === "en" ? contratto.replace("SA", "NT") : contratto;
  const giorno = oggi
    ? new Date(`${oggi}T12:00:00`).toLocaleDateString(lingua === "en" ? "en-US" : "it-IT", { weekday: "long", day: "numeric", month: "long" })
    : "";
  const posti: Record<string, string> = { north: t("Nord"), south: t("Sud"), east: t("Est"), west: t("Ovest") };

  return (
    <section className="grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="panno-bg flex min-h-52 flex-col items-center justify-center gap-3 px-5 py-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{giorno}</p>
        {mano ? (
          <>
            <p className="font-display text-5xl font-extrabold tabular-nums" aria-label={t("Contratto {c}", { c: contrattoMostrato })}>{contrattoMostrato}</p>
            <Ventaglio carte={ordinaManoAlternata(mano.hands[toGamePosition("south", mano.declarer)])} larghezza={44} etichetta={t("La tua mano (Sud)")} />
          </>
        ) : (
          <div className="h-32" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-col gap-2 p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden="true" />
          {t("Mano del Giorno")}
        </p>
        <h2 className="font-display text-xl font-bold text-balance">{mano?.title ? t(mano.title) : t("Una mano al giorno, uguale per tutti")}</h2>
        <p className="text-sm text-muted-foreground text-pretty">
          {mano ? t("Dichiarante {posto}. Una mano al giorno, uguale per tutti, con la classifica.", { posto: posti[mano.declarer] ?? mano.declarer }) : t("Una mano al giorno, uguale per tutti. Classifica!")}
        </p>
        <Link
          href="/gioca/mano-del-giorno"
          className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("Gioca la mano")}
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
