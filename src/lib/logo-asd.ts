/**
 * Il logo che l'ASD carica, e cosa fare quando non va bene.
 *
 * È L'UNICO PUNTO IN CUI ENTRA UN FILE DA FUORI, e le ASD caricheranno quello
 * che hanno: un JPEG da due megabyte con lo sfondo bianco, un ritaglio da
 * Facebook a bassa risoluzione, ogni tanto uno screenshot. Una locandina
 * stampata in A4 e appesa in bacheca non può rovinarsi per questo.
 *
 * SI DICE PRIMA, NON DOPO. Il controllo sta davanti alla generazione: chi
 * carica un file inservibile lo scopre subito e ne prende un altro, invece di
 * scaricare una locandina sfocata e accorgersene davanti alla stampante — o,
 * peggio, in bacheca.
 *
 * NIENTE SVG, ed è una scelta di sicurezza e non di comodità: un SVG è un
 * documento che può contenere script, e questo finisce dentro una pagina che
 * poi viene renderizzata in immagine. I formati raster non hanno quel problema.
 */

export type EsitoLogo =
  | { ok: true; larghezza: number; altezza: number }
  | { ok: false; motivo: MotivoScarto; spiegazione: string };

export type MotivoScarto = "formato" | "troppo-grande" | "troppo-piccolo" | "sproporzionato";

/** Oltre questo il file è quasi sempre una foto, non un logo. */
const BYTE_MASSIMI = 8 * 1024 * 1024;

/**
 * Sotto i 200px di lato lungo, in A4 il logo si vede sgranato. La locandina si
 * guarda da mezzo metro appesa a una bacheca: lì la sgranatura si nota.
 */
const LATO_MINIMO = 200;

/** Un logo più lungo che largo di otto volte è una striscia, non un marchio. */
const RAPPORTO_MASSIMO = 8;

const FORMATI = ["image/png", "image/jpeg", "image/webp"];

export function valutaLogo(file: {
  tipo: string;
  byte: number;
  larghezza: number;
  altezza: number;
}): EsitoLogo {
  if (!FORMATI.includes(file.tipo)) {
    return {
      ok: false,
      motivo: "formato",
      spiegazione: "Serve un'immagine PNG, JPEG o WEBP. I file PDF e SVG non vanno bene.",
    };
  }
  if (file.byte > BYTE_MASSIMI) {
    return {
      ok: false,
      motivo: "troppo-grande",
      spiegazione: "Il file supera gli 8 MB: probabilmente è una fotografia e non un logo.",
    };
  }
  const lato = Math.max(file.larghezza, file.altezza);
  if (lato < LATO_MINIMO) {
    return {
      ok: false,
      motivo: "troppo-piccolo",
      spiegazione: `L'immagine è di ${file.larghezza}×${file.altezza} pixel: stampata verrebbe sgranata. Ne serve una di almeno ${LATO_MINIMO} pixel di lato.`,
    };
  }
  const corto = Math.min(file.larghezza, file.altezza);
  if (corto > 0 && lato / corto > RAPPORTO_MASSIMO) {
    return {
      ok: false,
      motivo: "sproporzionato",
      spiegazione: "L'immagine è troppo allungata per lo spazio del logo: probabilmente è un'intestazione e non un marchio.",
    };
  }
  return { ok: true, larghezza: file.larghezza, altezza: file.altezza };
}

/**
 * Quanto grande metterlo nella locandina, a parità di ingombro.
 *
 * Si ragiona per ALTEZZA e non per larghezza: nella testata i tre loghi stanno
 * su una riga, e ciò che li fa sembrare della stessa importanza è l'altezza
 * uguale. Un logo largo e basso scalato in larghezza diventerebbe un francobollo
 * accanto agli altri due.
 */
export function altezzaLogo(larghezza: number, altezza: number, altezzaTarget = 64): {
  larghezza: number;
  altezza: number;
} {
  if (altezza <= 0) return { larghezza: altezzaTarget, altezza: altezzaTarget };
  const scala = altezzaTarget / altezza;
  const largo = Math.round(larghezza * scala);
  // Un logo molto largo, scalato per altezza, mangerebbe il titolo accanto:
  // in quel caso comanda la larghezza massima.
  const LARGHEZZA_MASSIMA = 200;
  if (largo > LARGHEZZA_MASSIMA) {
    return {
      larghezza: LARGHEZZA_MASSIMA,
      altezza: Math.round(altezza * (LARGHEZZA_MASSIMA / larghezza)),
    };
  }
  return { larghezza: largo, altezza: altezzaTarget };
}
