"use client";

import { useT } from "@/contexts/traduzioni-provider";

/**
 * Il collegamento «salta al contenuto», tradotto.
 *
 * PERCHÉ UN COMPONENTE PER UNA RIGA. Sta nel layout radice, che è un
 * componente SERVER e — di proposito — statico: `<html lang="it">` è scritto
 * a mano e lo corregge un componente client dopo, proprio per non rendere
 * dinamica ogni pagina del sito. Usare `tServer()` qui avrebbe tradotto la
 * frase e reso dinamico tutto il resto: un cattivo scambio per tre parole.
 *
 * Così invece il layout resta statico e la frase si traduce nel browser.
 *
 * NON È UNA FRASE QUALSIASI: è il primo collegamento della pagina, quello
 * che incontra chi naviga da tastiera o con un lettore di schermo. Lasciarlo
 * in italiano sotto /en vuol dire che l'unica scorciatoia d'accessibilità
 * che abbiamo parla una lingua che chi la usa potrebbe non capire.
 */
export function SaltaAlContenuto() {
  const t = useT();
  return (
    <a href="#main-content" className="skip-link">
      {t("Vai al contenuto")}
    </a>
  );
}
