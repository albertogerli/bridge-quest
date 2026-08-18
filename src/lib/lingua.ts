/**
 * La lingua sta nell'indirizzo: `/lezioni` è italiano, `/en/lezioni` inglese.
 *
 * PERCHÉ NELL'INDIRIZZO E NON IN UN COOKIE. Un link condiviso deve portare
 * chi lo apre nella stessa lingua di chi l'ha mandato — se la lingua vivesse
 * in un cookie, lo stesso indirizzo mostrerebbe cose diverse a persone diverse,
 * e non ci sarebbe modo di mandare a qualcuno «la lezione in inglese». Vale
 * anche per i motori di ricerca, che indicizzano indirizzi, non preferenze.
 *
 * L'ITALIANO NON HA PREFISSO, ed è una scelta: gli indirizzi esistenti sono in
 * giro da mesi, in email, nei messaggi, nei preferiti di chi usa la
 * piattaforma. Spostarli sotto `/it` li romperebbe tutti per un guadagno di
 * simmetria che non serve a nessuno.
 *
 * Qui dentro solo funzioni pure: le usano il proxy (server) e i componenti
 * (client), e devono dare la stessa risposta da tutte e due le parti.
 */

export const LINGUE = ["it", "en"] as const;
export type Lingua = (typeof LINGUE)[number];

export const LINGUA_PREDEFINITA: Lingua = "it";

/** Come si chiama ogni lingua nella lingua stessa, per il selettore. */
export const NOME_LINGUA: Record<Lingua, string> = {
  it: "Italiano",
  en: "English",
};

/** Il prefisso di una lingua, vuoto per l'italiano. */
function prefisso(lingua: Lingua): string {
  return lingua === LINGUA_PREDEFINITA ? "" : `/${lingua}`;
}

/**
 * La lingua di un indirizzo. Tutto ciò che non comincia con un prefisso noto
 * è italiano, compresi gli indirizzi che non esistono: la lingua non è il
 * posto dove segnalare un 404.
 */
export function linguaDaPercorso(percorso: string): Lingua {
  const pezzi = percorso.split("/").filter(Boolean);
  const prima = pezzi[0];
  return LINGUE.includes(prima as Lingua) && prima !== LINGUA_PREDEFINITA
    ? (prima as Lingua)
    : LINGUA_PREDEFINITA;
}

/**
 * L'indirizzo senza il prefisso di lingua: è quello che l'applicazione
 * conosce, e l'unico che il router deve vedere.
 *
 * `/en` da solo diventa `/`, non stringa vuota: un percorso vuoto non è un
 * indirizzo valido e farebbe fallire la riscrittura invece di portare a casa.
 */
export function senzaLingua(percorso: string): string {
  const lingua = linguaDaPercorso(percorso);
  if (lingua === LINGUA_PREDEFINITA) return percorso || "/";
  const resto = percorso.slice(`/${lingua}`.length);
  return resto.startsWith("/") ? resto : `/${resto}`;
}

/**
 * Lo stesso indirizzo in un'altra lingua, che è tutto ciò che serve al
 * selettore: si cambia lingua restando dove si è, non tornando alla home.
 */
export function conLingua(percorso: string, lingua: Lingua): string {
  const nudo = senzaLingua(percorso);
  const p = prefisso(lingua);
  if (!p) return nudo;
  return nudo === "/" ? p : `${p}${nudo}`;
}

/**
 * Gli indirizzi che non hanno una lingua e non devono prenderla.
 *
 * Le API rispondono a programmi, non a lettori; `sw.js` e il manifesto sono
 * file dell'applicazione. Riscriverli sarebbe silenziosamente sbagliato: la
 * chiamata funzionerebbe lo stesso e nessuno se ne accorgerebbe, finché un
 * giorno una rotta non esiste sotto `/en` e comincia a rispondere 404.
 */
export function fuoriDallaTraduzione(percorso: string): boolean {
  return (
    percorso.startsWith("/api/") ||
    percorso === "/sw.js" ||
    percorso === "/manifest.json" ||
    percorso === "/robots.txt" ||
    percorso === "/sitemap.xml" ||
    percorso.startsWith("/_next/") ||
    percorso.startsWith("/cdn-cgi/")
  );
}
