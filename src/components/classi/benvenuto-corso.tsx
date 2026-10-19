"use client";

import type { ClassRoom } from "@/lib/instructors";
import { periodoDelCorso } from "@/lib/etichetta-classe";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Il benvenuto al corso, in cima alla pagina dell'allievo.
 *
 * PERCHÉ. Chi entrava con il codice trovava il nome della classe e «il tuo
 * insegnante non ha ancora assegnato compiti»: nessun segno di essere arrivato
 * nel posto giusto (Trevissoi, feedback 5: «benvenuto al corso di primo
 * livello che si terrà presso… ogni… insegnante…»).
 *
 * NIENTE CAMPI NUOVI. Il livello, il periodo e la descrizione sono della
 * classe; il luogo e il nome dell'insegnante sono quelli che l'insegnante ha
 * già scritto per la locandina. Giorno e ora delle lezioni stanno nella
 * descrizione, che l'insegnante scrive come vuole («ogni martedì alle 20.30»).
 * Quello che manca semplicemente non compare.
 */
export function BenvenutoCorso({ classe }: { classe: ClassRoom }) {
  const t = useT();
  const locandina = (classe.locandina ?? {}) as { dove?: unknown; insegnante?: unknown };
  const dove = typeof locandina.dove === "string" ? locandina.dove.trim() : "";
  const insegnante = typeof locandina.insegnante === "string" ? locandina.insegnante.trim() : "";
  const periodo = periodoDelCorso(classe);
  const corso = classe.livello?.trim() || classe.name;

  return (
    <section className="mb-6 rounded-2xl border border-figb/20 bg-figb/5 p-4" aria-labelledby="benvenuto-corso">
      <h2 id="benvenuto-corso" className="font-display text-lg font-bold text-foreground">
        {t("Ti diamo il benvenuto: {corso}", { corso })}
      </h2>
      <dl className="mt-1 space-y-0.5 text-sm text-muted-foreground">
        {dove && (
          <div className="flex gap-1.5">
            <dt className="font-semibold text-foreground">{t("Dove")}:</dt>
            <dd>{dove}</dd>
          </div>
        )}
        {periodo && (
          <div className="flex gap-1.5">
            <dt className="font-semibold text-foreground">{t("Quando")}:</dt>
            <dd>{periodo}</dd>
          </div>
        )}
        {insegnante && (
          <div className="flex gap-1.5">
            <dt className="font-semibold text-foreground">{t("Insegnante")}:</dt>
            <dd>{insegnante}</dd>
          </div>
        )}
      </dl>
      {classe.description && <p className="mt-2 whitespace-pre-line text-sm text-foreground">{classe.description}</p>}
    </section>
  );
}
