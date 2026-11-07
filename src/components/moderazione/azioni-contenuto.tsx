"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/contexts/traduzioni-provider";
import {
  EVENTO_BLOCCHI,
  MOTIVI,
  bloccaUtente,
  elencaBloccati,
  segnalaContenuto,
  type ContenutoSegnalabile,
  type MotivoSegnalazione,
} from "@/lib/moderazione";

/**
 * Gli utenti bloccati da chi guarda, riletti quando cambiano. Finché non sono
 * letti l'insieme è vuoto: si vede tutto, come prima.
 */
export function useBloccati(attivo: boolean): Set<string> {
  const [bloccati, setBloccati] = useState<Set<string>>(new Set());
  const rileggi = useCallback(() => {
    void elencaBloccati().then(setBloccati);
  }, []);
  useEffect(() => {
    if (!attivo) return;
    rileggi();
    window.addEventListener(EVENTO_BLOCCHI, rileggi);
    return () => window.removeEventListener(EVENTO_BLOCCHI, rileggi);
  }, [attivo, rileggi]);
  return bloccati;
}

/**
 * Il pulsante «Segnala» accanto a un post, un commento o un messaggio di un
 * altro utente. Dalla stessa finestra si può anche bloccare chi l'ha scritto.
 */
export function AzioniContenuto({
  contenuto,
  nomeAutore,
  className = "",
}: {
  contenuto: ContenutoSegnalabile;
  nomeAutore: string;
  className?: string;
}) {
  const t = useT();
  const [aperto, setAperto] = useState(false);
  const [motivo, setMotivo] = useState<MotivoSegnalazione | null>(null);
  const [nota, setNota] = useState("");
  const [invio, setInvio] = useState(false);
  const [esito, setEsito] = useState<"segnalato" | "bloccato" | "errore" | null>(null);
  const [bloccaAnche, setBloccaAnche] = useState(false);

  function apri() {
    setMotivo(null);
    setNota("");
    setEsito(null);
    setBloccaAnche(false);
    setAperto(true);
  }

  async function invia() {
    if (invio) return;
    setInvio(true);
    let ok = true;
    if (motivo) ok = await segnalaContenuto(contenuto, motivo, nota);
    if (ok && bloccaAnche) ok = await bloccaUtente(contenuto.autoreId);
    setInvio(false);
    setEsito(!ok ? "errore" : motivo ? "segnalato" : "bloccato");
  }

  return (
    <>
      <button
        type="button"
        onClick={apri}
        className={`inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-red-500 ${className}`}
        aria-label={t("Segnala o blocca")}
      >
        <Flag className="h-3 w-3" aria-hidden="true" />
        {t("Segnala")}
      </button>

      <Dialog open={aperto} onOpenChange={setAperto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Segnala o blocca")}</DialogTitle>
            <DialogDescription>
              {t("La segnalazione arriva a chi modera BridgeLab, che può togliere il contenuto. Chi l’ha scritto non sa chi l’ha segnalato.")}
            </DialogDescription>
          </DialogHeader>

          {esito === "segnalato" || esito === "bloccato" ? (
            <p role="status" className="py-2 text-sm">
              {esito === "segnalato"
                ? bloccaAnche
                  ? t("Grazie, l’abbiamo ricevuta. Non vedrai più i messaggi di {nome}.", { nome: nomeAutore })
                  : t("Grazie, l’abbiamo ricevuta.")
                : t("Non vedrai più i messaggi di {nome}. Per sbloccare: Impostazioni.", { nome: nomeAutore })}
            </p>
          ) : (
            <div className="space-y-3 py-1">
              <fieldset className="space-y-1.5">
                <legend className="mb-1 text-sm font-medium">{t("Che cosa non va?")}</legend>
                {MOTIVI.map((m) => (
                  <label key={m.valore} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="motivo"
                      checked={motivo === m.valore}
                      onChange={() => setMotivo(m.valore)}
                    />
                    {t(m.etichetta)}
                  </label>
                ))}
              </fieldset>
              {motivo && (
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  placeholder={t("Vuoi aggiungere qualcosa? (facoltativo)")}
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              )}
              <label className="flex items-start gap-2 border-t border-border pt-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={bloccaAnche}
                  onChange={(e) => setBloccaAnche(e.target.checked)}
                />
                <span>
                  {t("Blocca {nome}", { nome: nomeAutore })}
                  <span className="block text-xs text-muted-foreground">
                    {t("Non vedrai più i suoi post, commenti e messaggi. Non riceve nessun avviso.")}
                  </span>
                </span>
              </label>
              {esito === "errore" && (
                <p role="alert" className="text-sm text-destructive">
                  {t("Non è andata a buon fine. Riprova tra poco.")}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            {esito === "segnalato" || esito === "bloccato" ? (
              <Button onClick={() => setAperto(false)}>{t("Chiudi")}</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setAperto(false)}>
                  {t("Annulla")}
                </Button>
                <Button onClick={() => void invia()} disabled={invio || (!motivo && !bloccaAnche)}>
                  {motivo ? t("Invia segnalazione") : t("Blocca")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
