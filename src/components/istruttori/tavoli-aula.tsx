"use client";

import { useEffect, useState } from "react";
import { sessioneAperta, statoAula, type StatoTavolo } from "@/lib/aula";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * I tavoli dell'aula, in fila sopra il tavolo condiviso: quello che si sta
 * seguendo è evidenziato, gli altri sono a un tocco.
 *
 * PERCHÉ. Con l'aula aperta l'insegnante segue più tavoli, ma dal tavolo
 * condiviso non si vedeva né quanti fossero né come passare a un altro: si
 * tornava all'aula e si sceglieva di nuovo (Trevissoi, feedback 5).
 *
 * Si rilegge ogni dieci secondi: posti occupati e carte giocate cambiano mentre
 * l'insegnante è a un altro tavolo, e sono proprio quello che gli serve sapere.
 */
export function TavoliAula({
  classId,
  attuale,
  onScegli,
}: {
  classId: string;
  attuale: string | null;
  onScegli: (tavoloId: string) => void;
}) {
  const t = useT();
  const [tavoli, setTavoli] = useState<StatoTavolo[]>([]);

  useEffect(() => {
    let vivo = true;
    const leggi = async () => {
      const sessione = await sessioneAperta(classId);
      if (!vivo || !sessione) return;
      const stato = await statoAula(sessione.id);
      if (vivo) setTavoli([...stato].sort((a, b) => a.numero - b.numero));
    };
    void leggi();
    const intervallo = setInterval(() => void leggi(), 10_000);
    return () => {
      vivo = false;
      clearInterval(intervallo);
    };
  }, [classId]);

  if (tavoli.length < 2) return null;

  return (
    <nav aria-label={t("Tavoli dell'aula")} className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-muted-foreground">{t("Tavoli dell'aula")}:</span>
      {tavoli.map((tv) => {
        const qui = tv.tavolo_id === attuale;
        return (
          <button
            key={tv.tavolo_id}
            type="button"
            onClick={() => onScegli(tv.tavolo_id)}
            aria-current={qui ? "page" : undefined}
            className={`flex min-h-10 flex-col items-start rounded-lg border px-3 py-1 text-left text-sm transition-colors ${
              qui ? "border-figb bg-figb text-white" : "border-border bg-card hover:bg-muted"
            }`}
          >
            <span className="font-semibold">{t("Tavolo {n}", { n: tv.numero })}</span>
            <span className={`text-xs ${qui ? "text-white/80" : "text-muted-foreground"}`}>
              {t("{s}/4 seduti · {c} carte", { s: tv.posti_assegnati, c: tv.carte_giocate })}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
