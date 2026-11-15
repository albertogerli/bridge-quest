"use client";

import { useCallback } from "react";
import { useLingua } from "@/hooks/use-lingua";
import { testoConSA } from "@/lib/contratto-leggibile";

/**
 * In italiano il senza atout si scrive SA (1SA, 3SA), come nel resto del
 * sito; in inglese resta NT. Per i testi e le dichiarazioni che arrivano dai
 * dati scritti con la sigla inglese. Solo per mostrare: i confronti con la
 * risposta giusta restano sui valori originali.
 */
export function useTestoSA(): (testo: string) => string {
  const { lingua } = useLingua();
  return useCallback((testo: string) => (lingua === "en" ? testo : testoConSA(testo)), [lingua]);
}
