"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LUNGHEZZA_NOME_IN_CLASSE, rinominaAllievo, type ClassMember } from "@/lib/instructors";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";

/**
 * Un allievo nell'elenco della classe, con il nome che gli dà l'insegnante.
 *
 * Il nome del profilo lo sceglie l'allievo, e due Giuseppe restano due
 * Giuseppe: l'insegnante non sa più di chi è un risultato, e quello che
 * dichiara male si prende i meriti dell'altro (regia di un corso,
 * 29/10/2026). Il nome in classe lo decide l'insegnante, e l'allievo non lo
 * può cambiare.
 */
export function RigaAllievo({
  classId,
  membro,
  doppio,
  onRinominato,
}: {
  classId: string;
  membro: ClassMember;
  /** Un altro allievo della classe si chiama nello stesso modo. */
  doppio: boolean;
  onRinominato: (studentId: string, nome: string | null) => void;
}) {
  const t = useT();
  const locale = useLingua().lingua === "en" ? "en-US" : "it-IT";
  const [modifica, setModifica] = useState(false);
  const [testo, setTesto] = useState("");
  const [stato, setStato] = useState<"fermo" | "in-corso" | "errore" | "non-tuo">("fermo");

  const nome = membro.display_name ?? t("Allievo senza nome");
  const profiloDiverso =
    !!membro.nome_in_classe && !!membro.nome_profilo && membro.nome_profilo.trim() !== membro.nome_in_classe;

  function apri() {
    setTesto(membro.nome_in_classe ?? membro.nome_profilo ?? "");
    setStato("fermo");
    setModifica(true);
  }

  async function salva() {
    setStato("in-corso");
    try {
      const salvato = await rinominaAllievo(classId, membro.student_id, testo);
      onRinominato(membro.student_id, salvato);
      setModifica(false);
      setStato("fermo");
    } catch (err) {
      if ((err as { code?: string } | null)?.code === "42501") {
        setStato("non-tuo");
        return;
      }
      segnalaSalvoRete("istruttori/classe:rinomina-allievo", err);
      setStato("errore");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
        {nome.charAt(0)}
      </div>
      {modifica ? (
        <form
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void salva();
          }}
        >
          <input
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            maxLength={LUNGHEZZA_NOME_IN_CLASSE}
            autoFocus
            aria-label={t("Nome dell'allievo in questa classe")}
            placeholder={t("Per esempio: Giuseppe Rossi")}
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
          />
          <Button size="sm" type="submit" disabled={stato === "in-corso"}>
            {t("Salva")}
          </Button>
          <Button size="sm" type="button" variant="outline" onClick={() => setModifica(false)}>
            {t("Annulla")}
          </Button>
          <p className="w-full text-xs text-muted-foreground">
            {t("Lo vedi tu, in questa classe. L'allievo non lo può cambiare. Lascia vuoto per tornare al nome del profilo.")}
          </p>
          {stato === "errore" && (
            <p className="w-full text-xs text-destructive">{t("Non salvato. Controlla la connessione e riprova.")}</p>
          )}
          {stato === "non-tuo" && (
            <p className="w-full text-xs text-destructive">
              {t("Il sito non ti riconosce come insegnante di questa classe: esci, rientra con il tuo account e riprova.")}
            </p>
          )}
        </form>
      ) : (
        <>
          <div className="min-w-0">
            <p className="text-sm font-medium">{nome}</p>
            {profiloDiverso && (
              <p className="text-xs text-muted-foreground">
                {t("Nel profilo: {nome}", { nome: membro.nome_profilo ?? "" })}
              </p>
            )}
            {doppio && (
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                {t("Un altro allievo si chiama così: dagli un nome diverso.")}
              </p>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={apri} className="ml-auto">
            <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            {t("Rinomina")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("iscritto il {data}", { data: new Date(membro.joined_at).toLocaleDateString(locale) })}
          </span>
        </>
      )}
    </div>
  );
}
