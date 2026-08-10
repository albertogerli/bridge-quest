"use client";

import { useEffect } from "react";
import { loadMetaPixel } from "@/lib/meta-pixel";
import { onConsentChange } from "@/lib/consent-client";

/**
 * Carica il Meta Pixel quando — e solo quando — c'è il consenso pubblicitario.
 *
 * Due momenti possibili: all'avvio, per chi ha già acconsentito in una visita
 * precedente; e subito dopo il clic su "Accetta tutti", senza dover ricaricare
 * la pagina. In assenza di consenso lo script non viene scaricato affatto: è
 * il caricamento in sé a impostare i cookie `_fbp`/`_fbc`, quindi non basta
 * evitare di inviare eventi.
 *
 * Non rende nulla.
 */
export function MetaPixelLoader() {
  useEffect(() => {
    loadMetaPixel();
    return onConsentChange((marketing) => {
      if (marketing) loadMetaPixel();
    });
  }, []);

  return null;
}
