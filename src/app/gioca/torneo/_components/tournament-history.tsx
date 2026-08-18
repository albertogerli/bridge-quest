"use client";

import { motion } from "motion/react";
import { History } from "lucide-react";
import { calcStars, formatDateShort, getWeekDates } from "@/lib/tournament-stats";
import type { TournamentHistoryEntry } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Le settimane già giocate.
 *
 * PERCHÉ ESISTE
 * Segnalazione di un iscritto: «ho partecipato per la prima volta la settimana
 * scorsa, non si vede la performance, valore essenziale!». Aveva ragione: la
 * pagina del torneo mostra solo la settimana corrente, quindi il lunedì
 * successivo chi aveva giocato trovava un torneo nuovo, nessun risultato e una
 * classifica in cui non compariva. Il dato c'era, mancava dove guardarlo.
 *
 * La settimana in corso non compare qui: è già tutta sopra, con la classifica
 * viva e il countdown. Ripeterla farebbe sembrare che siano due cose diverse.
 */
export function TournamentHistory({
  entries,
  weekNumCorrente,
  loading,
}: {
  entries: TournamentHistoryEntry[];
  weekNumCorrente: number;
  loading: boolean;
}) {
  const t = useT();
  const passate = entries.filter((e) => e.weekNum !== weekNumCorrente);

  // Chi non ha mai giocato non ha bisogno di un riquadro vuoto che glielo
  // ricordi: sopra c'è già l'invito a giocare.
  if (loading || passate.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-5 card-elevated rounded-2xl border border-border bg-card p-5"
      aria-labelledby="storico-tornei"
    >
      <h2
        id="storico-tornei"
        className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4"
      >
        <History className="w-4 h-4" aria-hidden="true" />
        {t("Le tue settimane")}
      </h2>

      <ul className="divide-y divide-border">
        {passate.map((e) => (
          <RigaSettimana key={e.weekNum} entry={e} />
        ))}
      </ul>
    </motion.section>
  );
}

function RigaSettimana({ entry }: { entry: TournamentHistoryEntry }) {
  const { start, end } = getWeekDates(entry.weekNum);
  const delta = entry.totalTricks - entry.totalNeeded;
  const riuscito = delta >= 0;
  const stelle = calcStars(delta);

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          Settimana #{entry.weekNum}
          <span className="ml-2 font-normal text-muted-foreground">
            {formatDateShort(start)} – {formatDateShort(end)}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {entry.totalTricks} prese su {entry.totalNeeded} necessarie
          {/* La posizione manca quando il risultato viene dal solo
              dispositivo: meglio tacerla che inventare un «1º su 1». */}
          {entry.posizione !== null && entry.partecipanti !== null && (
            <>
              {" · "}
              <span className="font-semibold text-foreground">
                {entry.posizione}º su {entry.partecipanti}
              </span>
            </>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`text-base font-bold ${
            riuscito
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {delta > 0 ? `+${delta}` : delta}
        </p>
        <p className="text-xs" aria-label={`${stelle} stelle su 3`}>
          {[1, 2, 3].map((s) => (
            <span key={s} className={s <= stelle ? "" : "grayscale opacity-30"} aria-hidden="true">
              {"⭐"}
            </span>
          ))}
        </p>
      </div>
    </li>
  );
}
