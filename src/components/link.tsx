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
  return <NextLink href={localizzato} {...props} />;
}
