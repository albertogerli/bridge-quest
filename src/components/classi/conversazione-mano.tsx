"use client";

import { useState } from "react";
import { MessagesSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { espandiSemi } from "@/lib/note-smazzate";
import { LUNGHEZZA_MESSAGGIO, scriviMessaggioCompito, type MessaggioCompito } from "@/lib/messaggi-compito";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";

/**
 * La conversazione tra allievo e insegnante su una mano del compito.
 *
 * La stessa per tutti e due: `daInsegnante` dice chi sta scrivendo, e quindi
 * quali messaggi sono «tuoi». L'allievo la trova sotto la mano nell'elenco del
 * compito, l'insegnante nella finestra della mano dai risultati.
 */
export function ConversazioneMano({
  assignmentId,
  smazzataId,
  studentId,
  filo,
  daInsegnante,
  nomeAllievo,
  onScritto,
}: {
  assignmentId: string;
  smazzataId: string;
  /** L'allievo del filo. */
  studentId: string;
  filo: readonly MessaggioCompito[];
  daInsegnante: boolean;
  /** Per l'insegnante: come si chiama l'allievo, nei suoi messaggi. */
  nomeAllievo?: string;
  onScritto: (m: MessaggioCompito) => void;
}) {
  const t = useT();
  // La data nella lingua del sito, non in quella del browser: server e browser la scrivono uguale.
  const locale = useLingua().lingua === "en" ? "en-US" : "it-IT";
  const [testo, setTesto] = useState("");
  const [stato, setStato] = useState<"fermo" | "in-corso" | "errore" | "troppi" | "da-attivare">("fermo");

  async function manda() {
    if (!testo.trim()) return;
    setStato("in-corso");
    try {
      const m = await scriviMessaggioCompito({ assignmentId, smazzataId, studentId, testo });
      onScritto(m);
      setTesto("");
      setStato("fermo");
    } catch (err) {
      const codice = (err as { code?: string } | null)?.code;
      // La RPC non c'è ancora: lo script SQL si esegue a mano.
      if (codice === "PGRST202" || codice === "42883") {
        setStato("da-attivare");
        return;
      }
      if (codice === "PT429") {
        setStato("troppi");
        return;
      }
      segnalaSalvoRete("messaggi-compito:scrivi", err);
      setStato("errore");
    }
  }

  const chi = (m: MessaggioCompito) =>
    m.dallInsegnante === daInsegnante
      ? t("Tu")
      : m.dallInsegnante
        ? t("L'insegnante")
        : (nomeAllievo ?? t("L'allievo"));

  return (
    <div className="rounded-xl border border-border p-3">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <MessagesSquare className="h-4 w-4 text-primary" aria-hidden="true" />
        {daInsegnante ? t("Domande e risposte con l'allievo") : t("Hai un dubbio? Scrivi all'insegnante")}
      </p>
      {filo.length > 0 && (
        <ol className="mb-2 space-y-1.5">
          {filo.map((m) => {
            const mio = m.dallInsegnante === daInsegnante;
            return (
              <li
                key={m.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  mio ? "ml-auto bg-primary/10" : "mr-auto bg-muted"
                }`}
              >
                <p className="text-xs font-semibold text-muted-foreground">
                  {chi(m)} · {new Date(m.creato).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="whitespace-pre-line">{m.testo}</p>
              </li>
            );
          })}
        </ol>
      )}
      <textarea
        value={testo}
        onChange={(e) => {
          setTesto(espandiSemi(e.target.value));
          if (stato !== "in-corso") setStato("fermo");
        }}
        rows={2}
        maxLength={LUNGHEZZA_MESSAGGIO}
        aria-label={daInsegnante ? t("Rispondi all'allievo") : t("Scrivi all'insegnante")}
        placeholder={
          daInsegnante
            ? t("Rispondi all'allievo. Scrivi !s per ♠, !h per ♥, !d per ♦, !c per ♣.")
            : t("Per esempio: perché qui non si apriva 1♦? Scrivi !s per ♠, !h per ♥, !d per ♦, !c per ♣.")
        }
        className="w-full rounded-md border border-border bg-background p-2 text-sm"
      />
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => void manda()} disabled={!testo.trim() || stato === "in-corso"}>
          <Send className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {t("Manda")}
        </Button>
        {stato === "errore" && <span className="text-xs text-destructive">{t("Non mandato. Controlla la connessione e riprova.")}</span>}
        {stato === "troppi" && <span className="text-xs text-destructive">{t("Hai scritto molti messaggi oggi su questo compito: riprova domani.")}</span>}
        {stato === "da-attivare" && (
          <span className="text-xs text-destructive">{t("I messaggi non sono ancora attivi: manca un aggiornamento del database.")}</span>
        )}
      </div>
    </div>
  );
}
