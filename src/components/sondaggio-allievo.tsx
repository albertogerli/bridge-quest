"use client";

import { useCallback, useEffect, useState } from "react";
import {
  distribuzione,
  rispondi,
  sondaggioAperto,
  type Sondaggio,
  type VoceDistribuzione,
} from "@/lib/sondaggi";

/**
 * La domanda dell'insegnante, sul dispositivo dell'allievo.
 *
 * COMPARE DA SOLA e sparisce da sola: chi sta giocando non deve andare a
 * cercare niente, e quando il sondaggio si chiude il riquadro se ne va. In una
 * lezione frontale la domanda dura un minuto, e un minuto non basta per
 * spiegare dove si trova la risposta.
 *
 * SI PUÒ CAMBIARE IDEA finché il sondaggio è aperto: ripensarci fa parte del
 * ragionare, e bloccare la prima risposta trasformerebbe una domanda in un
 * esame.
 *
 * I RISULTATI SI VEDONO SOLO SE L'INSEGNANTE LI MOSTRA, e senza nomi. Vederli
 * prima di aver risposto vorrebbe dire copiare la maggioranza, che è
 * esattamente l'opposto della domanda.
 */
export function SondaggioAllievo({ classId }: { classId: string }) {
  const [sondaggio, setSondaggio] = useState<Sondaggio | null>(null);
  const [scelta, setScelta] = useState<string | null>(null);
  const [dati, setDati] = useState<VoceDistribuzione[]>([]);

  const ricarica = useCallback(async () => {
    const s = await sondaggioAperto(classId);
    setSondaggio(s);
    if (s?.mostra_risultati) setDati(await distribuzione(s.id));
    else setDati([]);
  }, [classId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- `ricarica` è asincrona: ogni setState avviene dopo un await, cioè in una richiamata, non nel corpo dell'effetto. Senza la prima chiamata il riquadro resterebbe vuoto fino al primo intervallo.
    void ricarica();
    const t = setInterval(() => void ricarica(), 4000);
    return () => clearInterval(t);
  }, [ricarica]);

  if (!sondaggio) return null;

  const totale = dati.reduce((a, d) => a + d.quante, 0);

  return (
    <div className="mb-4 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <p className="mb-3 text-base font-bold">{sondaggio.domanda}</p>

      <div className="flex flex-wrap gap-2">
        {sondaggio.opzioni.map((o) => {
          const scelto = scelta === o;
          return (
            <button
              key={o}
              onClick={async () => {
                setScelta(o);
                await rispondi(sondaggio.id, o);
              }}
              aria-pressed={scelto}
              className={`rounded-lg px-3 py-2 text-base font-bold transition-colors ${
                scelto
                  ? "bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>

      {scelta && (
        <p className="mt-2 text-xs text-muted-foreground">
          Risposta registrata. Puoi ancora cambiarla.
        </p>
      )}

      {sondaggio.mostra_risultati && totale > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Come ha risposto la classe
          </p>
          <ul className="space-y-1">
            {dati.map((d) => (
              <li key={d.opzione} className="flex items-center gap-2 text-sm">
                <span className="w-14 shrink-0 font-mono font-bold">{d.opzione}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(d.quante / totale) * 100}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right tabular-nums">{d.quante}</span>
              </li>
            ))}
          </ul>
          {sondaggio.mostra_risposta && sondaggio.risposta_giusta && (
            <p className="mt-2 text-sm font-semibold text-primary">
              La risposta era {sondaggio.risposta_giusta}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
