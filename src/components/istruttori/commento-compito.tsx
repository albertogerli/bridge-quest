"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { espandiSemi } from "@/lib/note-smazzate";
import { salvaCommentoCompito } from "@/lib/commenti-compito";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Il commento dell'insegnante su una mano del compito, da scrivere: per un
 * allievo (`studentId`) o per tutta la classe (`null`). L'allievo lo legge
 * nell'elenco delle mani del compito. Un testo vuoto lo cancella.
 */
export function CommentoCompito({
  assignmentId,
  smazzataId,
  studentId,
  etichetta,
  iniziale,
  onSalvato,
}: {
  assignmentId: string;
  smazzataId: string;
  studentId: string | null;
  etichetta: string;
  iniziale: string;
  onSalvato: (testo: string) => void;
}) {
  const t = useT();
  const [testo, setTesto] = useState(iniziale);
  const [stato, setStato] = useState<"fermo" | "in-corso" | "salvato" | "errore" | "da-attivare">("fermo");

  async function salva() {
    setStato("in-corso");
    try {
      await salvaCommentoCompito({ assignmentId, smazzataId, studentId, testo });
      onSalvato(testo.trim());
      setStato("salvato");
    } catch (err) {
      const codice = (err as { code?: string } | null)?.code;
      // La RPC non c'è ancora: lo script SQL si esegue a mano.
      if (codice === "PGRST202" || codice === "42883") {
        setStato("da-attivare");
        return;
      }
      segnalaSalvoRete("commenti-compito:salva", err);
      setStato("errore");
    }
  }

  const cambiato = testo.trim() !== iniziale.trim();

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
        <MessageSquareText className="h-4 w-4 text-primary" aria-hidden="true" />
        {etichetta}
      </p>
      <textarea
        value={testo}
        onChange={(e) => {
          setTesto(espandiSemi(e.target.value));
          if (stato !== "in-corso") setStato("fermo");
        }}
        rows={3}
        maxLength={4000}
        placeholder={t("La correzione, come la scriveresti su WhatsApp. Scrivi !s per ♠, !h per ♥, !d per ♦, !c per ♣.")}
        className="w-full rounded-md border border-border bg-background p-2 text-sm"
      />
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => void salva()} disabled={!cambiato || stato === "in-corso"}>
          {iniziale && !testo.trim() ? t("Cancella il commento") : t("Salva il commento")}
        </Button>
        {stato === "salvato" && <span className="text-xs text-primary">{t("Salvato ✓ Lo trovano aprendo il compito.")}</span>}
        {stato === "errore" && <span className="text-xs text-destructive">{t("Non salvato. Controlla la connessione e riprova.")}</span>}
        {stato === "da-attivare" && (
          <span className="text-xs text-destructive">{t("I commenti non sono ancora attivi: manca un aggiornamento del database.")}</span>
        )}
      </div>
    </div>
  );
}
