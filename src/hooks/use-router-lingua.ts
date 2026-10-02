"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { linguaDaPercorso, localizzaHref } from "@/lib/lingua";

/**
 * `useRouter` che conserva la lingua: `push("/gioca")` sotto `/en` va a
 * `/en/gioca`. Stessa ragione di `components/link.tsx`.
 */
export function useRouter() {
  const router = useNextRouter();
  const lingua = linguaDaPercorso(usePathname() ?? "/");
  return useMemo(
    () => ({
      ...router,
      push: (href: string, opzioni?: Parameters<typeof router.push>[1]) =>
        router.push(localizzaHref(href, lingua), opzioni),
      replace: (href: string, opzioni?: Parameters<typeof router.replace>[1]) =>
        router.replace(localizzaHref(href, lingua), opzioni),
      prefetch: (href: string, opzioni?: Parameters<typeof router.prefetch>[1]) =>
        router.prefetch(localizzaHref(href, lingua), opzioni),
    }),
    [router, lingua],
  );
}
