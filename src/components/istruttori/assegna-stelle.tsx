"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stelle } from "@/components/bridge/stelle";
import { assegnaStelleCompito, SCELTE_STELLE } from "@/lib/stelle-compito";
import { stelleScritte } from "@/lib/compito-licita";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Le stelle dell'insegnante su una mano di un allievo, da scegliere: da zero a
 * tre, di mezza in mezza. «Torna al voto del programma» cancella la scelta.
 * L'allievo le vede al posto di quelle calcolate dal programma.
 */
export function AssegnaStelle({
  assignmentId,
  smazzataId,
  studentId,
  programma,
  iniziale,
  soloInsegnante,
  onSalvato,
}: {
  assignmentId: string;
  smazzataId: string;
  studentId: string;
  /** Le stelle calcolate dal programma. */
  programma: number;
  /** Le stelle già date dall'insegnante, o `null`. */
  iniziale: number | null;
  /** Il compito ha le stelle «le assegno io»: senza voto l'allievo aspetta. */
  soloInsegnante: boolean;
  onSalvato: (stelle: number | null) => void;
}) {
  const t = useT();
  const [scelta, setScelta] = useState<number | null>(iniziale);
  const [stato, setStato] = useState<"fermo" | "in-corso" | "salvato" | "errore" | "da-attivare">("fermo");

  async function salva(stelle: number | null) {
    const prima = scelta;
    setScelta(stelle);
    setStato("in-corso");
    try {
      await assegnaStelleCompito({ assignmentId, smazzataId, studentId, stelle });
      onSalvato(stelle);
      setStato("salvato");
    } catch (err) {
      setScelta(prima);
      const codice = (err as { code?: string } | null)?.code;
      // La RPC non c'è ancora: lo script SQL si esegue a mano.
      if (codice === "PGRST202" || codice === "42883") {
        setStato("da-attivare");
        return;
      }
      segnalaSalvoRete("stelle-compito:salva", err);
      setStato("errore");
    }
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
        <Star className="h-4 w-4 text-primary" aria-hidden="true" />
        {t("Le tue stelle per questo allievo")}
      </p>
      <p className="mb-2 text-xs text-muted-foreground">
        {soloInsegnante
          ? t("Il programma darebbe {stelle} stelle, ma l'allievo non le vede: aspetta le tue.", { stelle: stelleScritte(programma) })
          : t("Il programma ha dato {stelle} stelle. Se le cambi, l'allievo vede le tue.", { stelle: stelleScritte(programma) })}
      </p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("Le tue stelle per questo allievo")}>
        {SCELTE_STELLE.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={scelta === n}
            disabled={stato === "in-corso"}
            onClick={() => void salva(n)}
            className={`flex h-9 min-w-11 items-center justify-center rounded-md border px-2 text-sm font-semibold transition ${
              scelta === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            }`}
          >
            {stelleScritte(n)}
          </button>
        ))}
      </div>
      {scelta !== null && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Stelle quante={scelta} />
          <Button size="sm" variant="ghost" disabled={stato === "in-corso"} onClick={() => void salva(null)}>
            {soloInsegnante ? t("Togli le tue stelle") : t("Torna al voto del programma")}
          </Button>
        </div>
      )}
      <div className="mt-1.5 min-h-4 text-xs">
        {stato === "salvato" && <span className="text-primary">{t("Salvato ✓ L'allievo le vede aprendo il compito.")}</span>}
        {stato === "errore" && <span className="text-destructive">{t("Non salvato. Controlla la connessione e riprova.")}</span>}
        {stato === "da-attivare" && (
          <span className="text-destructive">{t("Le stelle dell'insegnante non sono ancora attive: manca un aggiornamento del database.")}</span>
        )}
      </div>
    </div>
  );
}
