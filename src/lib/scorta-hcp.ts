/**
 * Quanti punti deve avere Nord-Sud nelle mani della scorta.
 *
 * PERCHÉ NON SI LASCIA AL CASO
 * Una smazzata a caso dà in media venti punti onori per linea, e la maggior
 * parte finisce in parziali senza storia: non c'è niente da decidere, quindi
 * non c'è niente da imparare. La zona in cui la dichiarazione conta davvero
 * sta più in alto — attorno ai ventitré punti combinati è dove si decide se
 * andare a manche, che è la scelta più frequente e più costosa del bridge.
 *
 * COME SI OTTIENE UNA MEDIA ESATTA
 * Non si può vincolare la media di UNA mano: la media è una proprietà del
 * mucchio. Si estrae per ogni mano un bersaglio da un intervallo simmetrico
 * attorno alla media — da `minimo` a `2×media − minimo` — con i valori
 * centrali più probabili. Essendo simmetrico, la media dei bersagli è la media
 * chiesta per costruzione, e il minimo è rispettato senza scartare nulla:
 * scartare le mani sotto soglia sposterebbe la media in su di nascosto.
 */

/** L'intervallo dei bersagli che realizza `media` rispettando `minimo`. */
export function intervalloBersagli(media: number, minimo: number): [number, number] {
  if (minimo > media) throw new Error("il minimo non può superare la media");
  // Un massimo oltre i 37 non ha senso: con 38 punti in due la licita non è
  // più un esercizio, è un conteggio di assi.
  return [minimo, Math.min(37, 2 * media - minimo)];
}

/**
 * Pesi triangolari: il centro è il più probabile, gli estremi i più rari.
 * Restano simmetrici, che è la condizione perché la media torni.
 */
export function pesiBersagli(media: number, minimo: number): { valore: number; peso: number }[] {
  const [da, a] = intervalloBersagli(media, minimo);
  const pesi: { valore: number; peso: number }[] = [];
  for (let v = da; v <= a; v++) {
    // Distanza dal centro dell'intervallo, non dalla media: se il tetto dei 37
    // ha tagliato l'intervallo, il centro si sposta e i pesi vanno con lui —
    // altrimenti la simmetria si romperebbe proprio dove serve.
    const centro = (da + a) / 2;
    pesi.push({ valore: v, peso: Math.max(1, Math.round(a - da + 1 - Math.abs(v - centro) * 2)) });
  }
  return pesi;
}

/** Estrae un bersaglio con quei pesi. `caso` è un numero fra 0 e 1. */
export function bersaglio(media: number, minimo: number, caso: number): number {
  const pesi = pesiBersagli(media, minimo);
  const totale = pesi.reduce((s, p) => s + p.peso, 0);
  let soglia = caso * totale;
  for (const p of pesi) {
    soglia -= p.peso;
    if (soglia <= 0) return p.valore;
  }
  return pesi[pesi.length - 1].valore;
}

/** La media che i pesi realizzano davvero: si verifica, non si promette. */
export function mediaRealizzata(media: number, minimo: number): number {
  const pesi = pesiBersagli(media, minimo);
  const totale = pesi.reduce((s, p) => s + p.peso, 0);
  return pesi.reduce((s, p) => s + p.valore * p.peso, 0) / totale;
}
