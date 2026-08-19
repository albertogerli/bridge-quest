"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Card, Position } from "@/lib/bridge-engine";
import {
  apriCanale,
  apriFinestraProiezione,
  costruisciStato,
  IMPOSTAZIONI_INIZIALI,
  spedisci,
  type ImpostazioniProiezione,
  type MessaggioProiezione,
} from "@/lib/proiezione";

/**
 * Il pannello che decide cosa vede la classe.
 *
 * Sta sulla finestra dell'insegnante e comanda quella proiettata. Chi lo usa
 * continua a vedere tutte e quattro le mani: qui non si nasconde niente a chi
 * insegna, si sceglie soltanto cosa esce.
 *
 * FLOTTANTE E IN BASSO A DESTRA, ripiegabile. Durante la lezione le mani stanno
 * al centro dello schermo e servono tutte: un pannello fisso in colonna
 * ruberebbe spazio proprio a quello che si sta guardando.
 *
 * OGNI CAMBIAMENTO PARTE SUBITO, e con lui un battito. La finestra proiettata
 * usa il battito per capire se il comando è ancora vivo, e in caso contrario
 * tiene l'ultimo stato buono invece di sbiancare.
 */
export function ComandoProiezione({
  mani,
  titolo,
  dichiarazione,
  giocate,
  contratto,
  dichiarante,
  doppioMorto,
  /** Le posizioni scoperte sul tavolo dell'insegnante, se vuole tenerle allineate. */
  scopertiEsterni,
}: {
  mani: Partial<Record<Position, Card[]>>;
  titolo?: string | null;
  dichiarazione?: { dealer: Position; bids: string[] } | null;
  giocate?: { seat: Position; card: Card }[];
  contratto?: string | null;
  dichiarante?: Position | null;
  doppioMorto?: string | null;
  scopertiEsterni?: Position[];
}) {
  const [aperta, setAperta] = useState(false);
  const [ripiegato, setRipiegato] = useState(false);
  const [interruttori, setInterruttori] = useState<Omit<ImpostazioniProiezione, "scoperti">>(
    IMPOSTAZIONI_INIZIALI,
  );
  /**
   * Le mani scoperte sulla proiezione.
   *
   * `null` vuol dire «segui il tavolo»: scoprire una mano davanti alla classe è
   * un gesto solo, e l'insegnante non deve farlo due volte. Appena tocca uno
   * dei tasti qui sotto la proiezione si stacca e va per conto suo — serve
   * quando si vuole guardare una mano senza mostrarla — e un tasto la
   * riaggancia.
   *
   * Non è uno stato sincronizzato da un effetto: è derivato. Tenerlo in stato e
   * riallinearlo a ogni cambiamento della prop sarebbe la stessa cosa scritta
   * peggio, con un render in più e una finestra in cui i due valori non
   * coincidono.
   */
  const [scopertiScelti, setScopertiScelti] = useState<Position[] | null>(null);
  const canale = useRef<BroadcastChannel | null>(null);

  const scoperti = useMemo(
    () => scopertiScelti ?? scopertiEsterni ?? [],
    [scopertiScelti, scopertiEsterni],
  );
  // In `useMemo` perché entra fra le dipendenze di `manda`: ricostruirlo a ogni
  // render rifarebbe partire l'effetto del canale a ogni battito.
  const imp = useMemo<ImpostazioniProiezione>(
    () => ({ ...interruttori, scoperti }),
    [interruttori, scoperti],
  );

  const manda = useCallback(() => {
    spedisci(canale.current, {
      tipo: "stato",
      stato: costruisciStato({
        titolo,
        mani,
        impostazioni: imp,
        dichiarazione,
        giocate,
        contratto,
        dichiarante,
        doppioMorto,
        battito: Date.now(),
      }),
    });
  }, [titolo, mani, imp, dichiarazione, giocate, contratto, dichiarante, doppioMorto]);

  useEffect(() => {
    canale.current = apriCanale();
    const c = canale.current;
    if (!c) return;
    // La finestra proiettata chiede lo stato quando si apre o si ricarica.
    c.onmessage = (e: MessageEvent<MessaggioProiezione>) => {
      if (e.data?.tipo === "chiedi-stato") manda();
    };
    return () => {
      c.close();
      canale.current = null;
    };
    // `manda` cambia a ogni render utile: la si legge dalla chiusura aggiornata
    // grazie alla dipendenza qui sotto.
  }, [manda]);

  // Ogni cambiamento di stato o di impostazioni parte subito…
  useEffect(() => {
    if (aperta) manda();
  }, [aperta, manda]);

  // …e un battito ogni due secondi tiene viva l'indicazione di collegamento,
  // anche quando per un po' non cambia niente.
  useEffect(() => {
    if (!aperta) return;
    const t = setInterval(manda, 2000);
    return () => clearInterval(t);
  }, [aperta, manda]);

  const interruttore = (
    chiave: keyof Omit<ImpostazioniProiezione, "scoperti">,
    etichetta: string,
  ) => (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={interruttori[chiave]}
        onChange={(e) => setInterruttori((p) => ({ ...p, [chiave]: e.target.checked }))}
      />
      {etichetta}
    </label>
  );

  const POSTI: { key: Position; label: string; nome: string }[] = [
    { key: "north", label: "N", nome: "Nord" },
    { key: "east", label: "E", nome: "Est" },
    { key: "south", label: "S", nome: "Sud" },
    { key: "west", label: "O", nome: "Ovest" },
  ];

  if (!aperta) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          apriFinestraProiezione();
          setAperta(true);
        }}
      >
        <Monitor className="mr-2 h-4 w-4" aria-hidden="true" />
        Apri vista proiezione
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur print:hidden">
      <div className="mb-2 flex items-center gap-2">
        <Monitor className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-bold">Proiezione</span>
        <button
          onClick={() => setRipiegato((v) => !v)}
          className="ml-auto text-xs text-muted-foreground hover:underline"
        >
          {ripiegato ? "apri" : "riduci"}
        </button>
        <button
          onClick={() => {
            spedisci(canale.current, { tipo: "chiudi" });
            setAperta(false);
          }}
          aria-label="Chiudi la proiezione"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!ripiegato && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mani visibili
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POSTI.map((p) => {
                const acceso = scoperti.includes(p.key);
                return (
                  <button
                    key={p.key}
                    aria-pressed={acceso}
                    // Il nome accessibile dice cosa fa il tasto, non che
                    // lettera c'è sopra: «N» da solo non si legge, né con uno
                    // screen reader né in un test.
                    aria-label={`${acceso ? "Nascondi" : "Mostra"} ${p.nome} alla classe`}
                    onClick={() =>
                      setScopertiScelti(
                        acceso ? scoperti.filter((s) => s !== p.key) : [...scoperti, p.key],
                      )
                    }
                    className={`h-8 w-8 rounded-lg text-sm font-bold transition-colors ${
                      acceso ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
              <button
                onClick={() => setScopertiScelti(["north", "east", "south", "west"])}
                aria-label="Mostra tutte le mani alla classe"
                className="rounded-lg bg-muted px-2 text-xs font-semibold hover:bg-muted/70"
              >
                tutte
              </button>
              <button
                onClick={() => setScopertiScelti([])}
                aria-label="Copri tutte le mani"
                className="rounded-lg bg-muted px-2 text-xs font-semibold hover:bg-muted/70"
              >
                nessuna
              </button>
            </div>
            {scopertiScelti !== null && scopertiEsterni && (
              <button
                onClick={() => setScopertiScelti(null)}
                className="mt-1.5 text-xs text-primary hover:underline"
              >
                segui di nuovo il tavolo
              </button>
            )}
          </div>

          <div className="space-y-1.5 border-t border-border pt-2">
            {interruttore("mostraDichiarazione", "Dichiarazione e contratto")}
            {interruttore("mostraGiocate", "Carte giocate")}
            {interruttore("mostraDoppioMorto", "Analisi doppio morto")}
            {interruttore("mostraDivisioni", "Divisioni dei semi")}
          </div>
        </div>
      )}
    </div>
  );
}
