"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { linguaDaPercorso, localizzaHref } from "@/lib/lingua";

/**
 * `next/link` che non fa perdere la lingua.
 *
 * Sotto `/en` un `href="/gioca"` porterebbe all'italiano: questo componente
 * riscrive l'indirizzo con il prefisso della lingua in cui si sta leggendo. In
 * italiano non fa niente. Vedi `localizzaHref` per cosa lascia com'è.
 *
 * I selettori di lingua NON lo usano, di proposito: il loro `href` è già
 * l'indirizzo di arrivo nella lingua scelta e riscriverlo li annullerebbe.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const lingua = linguaDaPercorso(usePathname() ?? "/");
  const localizzato =
    typeof href === "string"
      ? localizzaHref(href, lingua)
      : { ...href, pathname: href.pathname ? localizzaHref(href.pathname, lingua) : href.pathname };
  // La radice `/en` è una riscrittura di `/`: il prefetch a segmenti di Next la
  // cerca come rotta vera e riceve 404 (in produzione, a ogni pagina). Il clic
  // funzionava lo stesso, ma ogni pagina inglese lasciava un 404 in rete.
  const radiceInglese = typeof localizzato === "string" && /^\/en([?#]|$)/.test(localizzato);
  return <NextLink href={localizzato} {...props} prefetch={radiceInglese ? false : props.prefetch} />;
}
