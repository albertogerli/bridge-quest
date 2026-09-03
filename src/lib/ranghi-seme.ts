/**
 * I ranghi di un seme, raggruppati perché si possano CONTARE a colpo d'occhio.
 *
 * IL PROBLEMA, che non è l'ambiguità. Scritti tutti attaccati — `AKQJ1098` —
 * i ranghi si leggono benissimo: non esistono carte «1» e «0», quindi nessuno
 * fraintende. Ma un maestro non legge le carte, le CONTA: guarda `AKQ72` e sa
 * che sono cinque senza contarle. Con `AKQJ1098` ha otto caratteri per sette
 * carte, e il colpo d'occhio si sballa proprio nel caso peggiore — la mano
 * lunga, dove il conteggio serve di più.
 *
 * È il motivo per cui la notazione internazionale usa `T`: un carattere, una
 * carta. In italiano il dieci si scrive «10», e allora lo si stacca.
 *
 * PERCHÉ NON UNO SPAZIO. In un carattere a spaziatura fissa lo spazio sottile
 * non è sottile: misurato, `U+2009` e `U+200A` occupano esattamente quanto uno
 * spazio normale, perché ogni glifo ha la stessa cella. Uno spazio vero
 * porterebbe la mano lunga da 106 a 132 pixel — un quarto in più, che è
 * proprio quello che stavamo togliendo. Staccando il dieci con un margine si
 * paga sei pixel invece di ventisei.
 *
 * Qui si decide solo COME raggruppare; lo stacco lo mette chi disegna
 * (`RanghiSeme`), perché è una questione di stile e non di dati.
 */

export interface GruppoRanghi {
  testo: string;
  /** Il dieci: va staccato dai vicini perché si conti come una carta sola. */
  staccato: boolean;
}

/**
 * Da `["A","K","Q","J","10","9","8"]` a `[AKQJ][10][98]`.
 *
 * I ranghi arrivano già ordinati da chi chiama: qui non si riordina niente,
 * altrimenti due punti del portale potrebbero mostrare la stessa mano in due
 * ordini diversi.
 */
export function gruppiDiRanghi(ranghi: readonly string[]): GruppoRanghi[] {
  const gruppi: GruppoRanghi[] = [];
  for (const rango of ranghi) {
    if (rango === "10") {
      gruppi.push({ testo: "10", staccato: true });
      continue;
    }
    const ultimo = gruppi[gruppi.length - 1];
    if (ultimo && !ultimo.staccato) ultimo.testo += rango;
    else gruppi.push({ testo: rango, staccato: false });
  }
  return gruppi;
}
