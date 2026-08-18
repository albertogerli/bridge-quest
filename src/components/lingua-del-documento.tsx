"use client";

import { useLingua } from "@/hooks/use-lingua";

/**
 * Tiene `lang` dell'elemento radice allineato all'indirizzo. Non disegna niente.
 *
 * PERCHÉ SERVE UN COMPONENTE APPOSTA. Il layout radice è statico — è la
 * ragione per cui la landing arriva già scritta nell'HTML, e non vogliamo
 * perderla — quindi al momento della generazione non sa se la pagina sarà
 * italiana o inglese. L'unico posto che lo sa è il browser, che l'indirizzo ce
 * l'ha davanti.
 *
 * Senza, `lang` resterebbe «it» su tutto il sito inglese: i lettori di schermo
 * pronuncerebbero l'inglese con le regole dell'italiano — che per un non
 * vedente è la differenza fra capire e non capire — e i browser offrirebbero
 * di tradurre in italiano una pagina già in inglese.
 *
 * Sta nel layout perché la lingua è una proprietà del documento, non di una
 * pagina: metterlo nel footer voleva dire averlo solo dove c'è il footer, e
 * infatti sul glossario mancava.
 */
export function LinguaDelDocumento() {
  useLingua();
  return null;
}
