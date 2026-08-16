"use client";

import { useEffect, useState } from "react";
import type { Position } from "@/lib/bridge-engine";

const ETICHETTA: Record<Position, string> = {
  north: "Il tuo compagno", east: "Est", south: "Sud", west: "Ovest",
};

/**
 * Chi si sta aspettando, e da quanto.
 *
 * PERCHÉ NON BASTA «GLI ALTRI STANNO DICHIARANDO».
 * La rete neurale che dichiara per gli altri risponde quasi sempre in mezzo
 * secondo, ma sulle aste difficili — quando deve cercare mani compatibili con
 * quello che è già stato detto — arriva a nove secondi. Misurati: 4 chiamate
 * su 21 stanno sopra gli otto. Nove secondi di frase immobile non si leggono
 * come «sta pensando», si leggono come «si è piantato», e chi legge così
 * ricarica la pagina proprio mentre la risposta sta arrivando.
 *
 * Dire CHI si aspetta e ammettere che ci sta mettendo più del solito costa due
 * righe e cambia completamente cosa sembra stia succedendo.
 *
 * NIENTE RIPIEGO LOCALE, PER SCELTA. Si potrebbe far dichiarare gli avversari
 * a una regoletta nostra quando il motore tarda: si è deciso di no. Un
 * avversario che dichiara come un principiante insegna cose sbagliate, e
 * l'esercizio vale per la qualità della licita che ci mette davanti — non per
 * la velocità con cui la mette.
 */
export function AttesaDichiarazione({ chi }: { chi: Position | null }) {
  const [secondi, setSecondi] = useState(0);

  useEffect(() => {
    if (!chi) return;
    const avvio = Date.now();
    const t = setInterval(() => setSecondi(Math.floor((Date.now() - avvio) / 1000)), 500);
    return () => clearInterval(t);
  }, [chi]);

  if (!chi) return null;

  return (
    <p className="text-sm text-muted-foreground mt-2 text-center" aria-live="polite">
      {ETICHETTA[chi]} sta dichiarando
      <span className="inline-flex w-6 justify-start">
        {".".repeat((secondi % 3) + 1)}
      </span>
      {secondi >= 4 && (
        <span className="block text-xs mt-1">
          Su questa asta ci vuole qualche secondo in più: la rete neurale sta
          cercando le mani che stanno in piedi con quello che è già stato detto.
        </span>
      )}
    </p>
  );
}
