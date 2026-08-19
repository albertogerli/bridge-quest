"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  aggiornaSondaggio,
  carteComeOpzioni,
  dichiarazioniPossibili,
  distribuzione,
  lanciaSondaggio,
  sondaggioAperto,
  type Sondaggio,
  type VoceDistribuzione,
} from "@/lib/sondaggi";
import type { Card } from "@/lib/bridge-engine";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Il pannello dei sondaggi, lato insegnante.
 *
 * DUE CLIC E NESSUNA DIGITAZIONE, quando c'è un contesto: se la mano ha
 * un'asta, le opzioni sono le dichiarazioni sufficienti; se c'è una mano in
 * gioco, sono le carte giocabili. Scrivere le opzioni a mano davanti a una
 * classe che aspetta è la ragione per cui uno strumento del genere non si usa.
 *
 * I RISULTATI NON SI MOSTRANO DA SOLI. L'insegnante decide quando, e se prima o
 * dopo aver detto qual era la risposta: sono due lezioni diverse — «vediamo
 * cosa avete detto» e «adesso vi dico perché» — e l'ordine lo sceglie lui.
 */
export function SondaggioAula({
  classId,
  bids,
  giocabili,
  smazzataId,
}: {
  classId: string;
  /** L'asta fin qui, se siamo in dichiarazione. */
  bids?: string[];
  /** Le carte giocabili, se siamo nel gioco. */
  giocabili?: Card[];
  smazzataId?: string | null;
}) {
  const t = useT();
  const [aperto, setAperto] = useState(false);
  const [sondaggio, setSondaggio] = useState<Sondaggio | null>(null);
  const [dati, setDati] = useState<VoceDistribuzione[]>([]);
  const [domanda, setDomanda] = useState("");
  const [occupato, setOccupato] = useState(false);

  const ricarica = useCallback(async () => {
    const s = await sondaggioAperto(classId);
    setSondaggio(s);
    if (s) setDati(await distribuzione(s.id));
  }, [classId]);

  useEffect(() => {
    if (!aperto) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- `ricarica` è asincrona: ogni setState avviene dopo un await, cioè in una richiamata, non nel corpo dell'effetto. Senza la prima chiamata il riquadro resterebbe vuoto fino al primo intervallo.
    void ricarica();
    // Le risposte arrivano in pochi secondi tutte insieme: due al secondo
    // sarebbe rumore, ogni tre è il ritmo con cui la classe risponde.
    const t = setInterval(() => void ricarica(), 3000);
    return () => clearInterval(t);
  }, [aperto, ricarica]);

  const opzioniContesto =
    giocabili && giocabili.length > 0
      ? carteComeOpzioni(giocabili)
      : bids
        ? dichiarazioniPossibili(bids)
        : null;

  async function lancia(opzioni: string[], testo: string) {
    setOccupato(true);
    await lanciaSondaggio({ classId, domanda: testo, opzioni, smazzataId });
    await ricarica();
    setDomanda("");
    setOccupato(false);
  }

  if (!aperto) {
    return (
      <Button variant="outline" size="sm" onClick={() => setAperto(true)}>
        <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
        {t("Chiedi alla classe")}
      </Button>
    );
  }

  const totale = dati.reduce((a, d) => a + d.quante, 0);

  return (
    <div className="fixed bottom-4 left-4 z-40 w-80 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur print:hidden">
      <div className="mb-2 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-bold">{t("Chiedi alla classe")}</span>
        <button
          onClick={() => setAperto(false)}
          aria-label={t("Chiudi")}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!sondaggio ? (
        <div className="space-y-2">
          {opzioniContesto && (
            <Button
              size="sm"
              className="w-full"
              disabled={occupato}
              onClick={() =>
                void lancia(
                  opzioniContesto,
                  giocabili && giocabili.length > 0 ? "Quale carta giochi?" : "Cosa dichiari?",
                )
              }
            >
              {giocabili && giocabili.length > 0 ? "Quale carta giochi?" : "Cosa dichiari?"}
            </Button>
          )}
          <input
            value={domanda}
            onChange={(e) => setDomanda(e.target.value)}
            placeholder={t("Oppure scrivi una domanda")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={occupato || domanda.trim().length < 3}
            onClick={() => void lancia(["Sì", "No", "Non so"], domanda)}
          >
            {t("Chiedi (sì / no / non so)")}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">{sondaggio.domanda}</p>
          <p className="text-xs text-muted-foreground">
            {totale} {totale === 1 ? "risposta" : "risposte"}
          </p>

          <ul className="space-y-1">
            {dati.map((d) => (
              <li key={d.opzione} className="flex items-center gap-2 text-sm">
                <span className="w-14 shrink-0 font-mono font-bold">{d.opzione}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${totale ? (d.quante / totale) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right tabular-nums">{d.quante}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-1.5 border-t border-border pt-2">
            <Button
              size="sm"
              variant={sondaggio.mostra_risultati ? "default" : "outline"}
              onClick={async () => {
                await aggiornaSondaggio(sondaggio.id, {
                  mostra_risultati: !sondaggio.mostra_risultati,
                });
                await ricarica();
              }}
            >
              {sondaggio.mostra_risultati ? t("Nascondi alla classe") : t("Mostra alla classe")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await aggiornaSondaggio(sondaggio.id, { aperto: false });
                await ricarica();
              }}
            >
              {t("Chiudi il sondaggio")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
