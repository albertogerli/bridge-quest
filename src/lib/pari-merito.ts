/**
 * Le posizioni di una classifica già ordinata, con i pari merito: chi è
 * appaiato prende lo stesso numero e il successivo salta («1, 1, 3»), come
 * nei tornei. Prima la posizione era l'indice della riga, e due allievi con
 * gli stessi risultati finivano primo e secondo per ordine alfabetico
 * (Trevissoi, 03/11/2026: «hai testato i casi di parimerito?»).
 *
 * `uguali` dice se due righe vicine hanno lo stesso risultato.
 */
export function posizioniConPariMerito<T>(righe: readonly T[], uguali: (a: T, b: T) => boolean): number[] {
  const out: number[] = [];
  righe.forEach((r, i) => {
    out.push(i > 0 && uguali(righe[i - 1], r) ? out[i - 1] : i + 1);
  });
  return out;
}

/** Vero se la posizione `i` è condivisa con la riga prima o con quella dopo. */
export function eParimerito(posizioni: readonly number[], i: number): boolean {
  return posizioni[i - 1] === posizioni[i] || posizioni[i + 1] === posizioni[i];
}
