/**
 * I turni di una classe: lo stesso corso al pomeriggio e alla sera, con
 * allievi che a volte passano dall'uno all'altro (14/11/2026). Il turno è
 * un'etichetta che l'insegnante dà all'allievo; qui solo la logica pura per
 * proporla e per filtrare l'elenco. Vedi `scripts/sql/turno-allievo-2026-11.sql`.
 */

/** Le proposte che ci sono sempre, anche in una classe dove non c'è ancora nessun turno. */
export const TURNI_PROPOSTI = ["Pomeriggio", "Sera"] as const;

/** Lo stesso turno a meno di maiuscole e spazi: «sera » e «Sera» sono uno. */
export function chiaveTurno(turno: string): string {
  return turno.trim().replace(/\s+/g, " ").toLocaleLowerCase("it");
}

export interface ConteggioTurno {
  turno: string;
  allievi: number;
}

/**
 * I turni usati nella classe, ciascuno con quanti allievi ha, nell'ordine in
 * cui compaiono per primi. Il nome mostrato è quello del primo allievo che lo
 * porta: due grafie dello stesso turno contano come uno.
 */
export function turniDellaClasse(membri: readonly { turno?: string | null }[]): ConteggioTurno[] {
  const per = new Map<string, ConteggioTurno>();
  for (const m of membri) {
    if (!m.turno || !m.turno.trim()) continue;
    const k = chiaveTurno(m.turno);
    const c = per.get(k);
    if (c) c.allievi++;
    else per.set(k, { turno: m.turno.trim(), allievi: 1 });
  }
  return [...per.values()];
}

/** Le proposte per il campo del turno: quelli già usati, poi i soliti, senza doppioni. */
export function proposteTurno(membri: readonly { turno?: string | null }[]): string[] {
  const visti = new Set<string>();
  const out: string[] = [];
  for (const t of [...turniDellaClasse(membri).map((c) => c.turno), ...TURNI_PROPOSTI]) {
    const k = chiaveTurno(t);
    if (visti.has(k)) continue;
    visti.add(k);
    out.push(t);
  }
  return out;
}

/** Il filtro dell'elenco: `null` = tutti, `""` = chi non ha turno, altrimenti quel turno. */
export function nelTurno(turno: string | null | undefined, filtro: string | null): boolean {
  if (filtro === null) return true;
  if (filtro === "") return !turno || !turno.trim();
  return !!turno && chiaveTurno(turno) === chiaveTurno(filtro);
}
