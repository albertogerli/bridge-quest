"use client";

import { useEffect, useState } from "react";
import { caricaCommenti, commentoGiaPresente } from "@/lib/commenti-smazzate";
import { useLingua } from "@/hooks/use-lingua";
import type { Smazzata } from "@/lib/catalog";

/**
 * Il commento didattico di una mano, quando spetta a chi guarda.
 *
 * Restituisce `undefined` sia quando il commento non c'è sia quando il
 * database ha deciso di non darlo: chi disegna la pagina non deve distinguere
 * i due casi, e in nessuno dei due mostra qualcosa.
 *
 * `ricarica` serve a richiederlo dopo che è cambiato qualcosa che può aver
 * aperto la porta — tipicamente la fine della mano in un compito con le
 * soluzioni «dopo il gioco». Cambiando quel valore la domanda si rifà.
 */
export function useCommento(s: Smazzata | undefined | null, ricarica: unknown = null): string | undefined {
  const { lingua } = useLingua();
  /**
   * Si tiene l'id insieme al testo perché la mano cambia sotto lo stesso hook —
   * nel navigatore delle smazzate basta un clic. Senza, per un render si
   * vedrebbe il commento della mano precedente sotto il titolo di quella nuova.
   */
  const [scaricato, setScaricato] = useState<{ id: string; testo: string } | null>(null);

  const id = s?.id;
  // Le mani importate portano il commento con sé, già filtrato a monte: non
  // c'è niente da chiedere, e non serve un effetto per saperlo.
  const inLinea = commentoGiaPresente(s);

  useEffect(() => {
    if (inLinea || !id) return;
    let vivo = true;
    void caricaCommenti([id], lingua).then((m) => {
      const testo = m.get(id);
      if (vivo && testo) setScaricato({ id, testo });
    });
    return () => {
      vivo = false;
    };
  }, [id, inLinea, lingua, ricarica]);

  if (inLinea) return inLinea;
  return scaricato && scaricato.id === id ? scaricato.testo : undefined;
}
