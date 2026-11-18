"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "@/components/link";
import { Ventaglio } from "@/components/bridge/ventaglio";
import { getSmazzataById } from "@/lib/catalog";
import { ordinaManoAlternata } from "@/lib/ordine-semi";
import { reportError } from "@/lib/report-error";
import type { Card } from "@/lib/bridge-engine";
import type { Assignment, ClassRoom } from "@/lib/instructors";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";

/**
 * Il compito da fare adesso, con le carte della prossima mano.
 *
 * È l'unica cosa grande della home dell'allievo (direzione «Ibrido», 02/11/2026):
 * luce per leggere, panno appena compaiono le carte. Le carte sono quelle vere
 * della mano che l'allievo troverà toccando il pulsante, nella posizione da
 * cui la giocherà e nello stesso ordine dei semi del tavolo — così il secondo
 * dopo non c'è niente da riconoscere di nuovo.
 *
 * Senza la mano (compito di soli esercizi, o la mano che non arriva) il panno
 * resta con il titolo: il compito si vede lo stesso.
 */
export function CompitoInEvidenza({
  assignment,
  classe,
  giocate,
  prossima,
  conClasse,
}: {
  assignment: Assignment;
  classe: ClassRoom;
  /** Quante mani del compito l'allievo ha già giocato. */
  giocate: number;
  /** L'id della prima mano non ancora giocata. */
  prossima: string | null;
  /** Con più corsi, il nome della classe sopra il titolo. */
  conClasse: boolean;
}) {
  const t = useT();
  const { lingua } = useLingua();
  const totale = assignment.smazzata_ids.length + assignment.esercizio_ids.length;
  /** Un test della Commissione: solo domande, niente mani da giocare. */
  const soloDomande = assignment.smazzata_ids.length === 0 && assignment.esercizio_ids.length > 0;
  const carte = useManoDaGiocare(assignment, prossima);
  const scadenza = assignment.due_date
    ? new Date(assignment.due_date).toLocaleDateString(lingua === "en" ? "en-US" : "it-IT", { weekday: "long", day: "numeric", month: "long" })
    : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Il panno solo dove ci sono carte (18/11/2026): un compito di sole
          domande aveva un rettangolo verde vuoto al posto della mano. */}
      <div className={soloDomande ? "border-b border-border px-5 pt-5 pb-4" : "panno-bg px-5 pt-5 text-white"}>
        <p className={`text-xs font-semibold uppercase tracking-wider ${soloDomande ? "text-muted-foreground" : "text-white/75"}`}>
          {conClasse ? `${classe.name} · ` : ""}{t("Da fare adesso")}
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-balance">{assignment.title}</h2>
        {!soloDomande && <Ventaglio carte={carte} etichetta={t("Le tue carte della prossima mano")} />}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 p-5">
        {totale > 0 && (
          <div className="grid gap-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((giocate / totale) * 100)}%` }} />
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              {soloDomande
                ? t("{n} domande su {m}", { n: giocate, m: totale })
                : t("{n} mani giocate su {m}", { n: giocate, m: totale })}
              {scadenza ? ` · ${t("scade {giorno}", { giorno: scadenza })}` : ""}
            </p>
          </div>
        )}
        <Link
          href={`/classi/${classe.id}/compito/${assignment.id}`}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[17px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {totale === 0
            ? t("Apri il compito")
            : soloDomande
              ? giocate === 0
                ? t("Comincia")
                : t("Continua")
              : giocate === 0
              ? t("Inizia dalla prima mano")
              : t("Gioca la mano {n}", { n: Math.min(giocate + 1, totale) })}
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/**
 * Le carte della prossima mano, dal posto da cui la si gioca: Sud nei compiti
 * di licita, il dichiarante negli altri (il tavolo ruota sul dichiarante).
 */
function useManoDaGiocare(assignment: Assignment, prossima: string | null): Card[] | null {
  const [carte, setCarte] = useState<Card[] | null>(null);
  useEffect(() => {
    if (!prossima) return;
    let vivo = true;
    (async () => {
      try {
        const s =
          assignment.custom_hands?.find((h) => h.id === prossima) ?? (await getSmazzataById(prossima));
        if (!vivo || !s) return;
        const posto = assignment.licita ? "south" : s.declarer;
        setCarte(ordinaManoAlternata(s.hands[posto]));
      } catch (err) {
        reportError("home-allievo:mano-del-compito", err);
      }
    })();
    return () => { vivo = false; };
  }, [assignment, prossima]);
  return carte;
}
