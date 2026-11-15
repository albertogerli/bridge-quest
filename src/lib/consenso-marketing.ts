/**
 * Quando chiedere il consenso alla newsletter FIGB.
 *
 * Non il primo giorno. Al primo ingresso la richiesta compariva sopra il
 * riquadro «Segui un corso? Hai un codice», cioè proprio sopra la cosa per
 * cui l'allievo era venuto (guida allievi, 14/11/2026): la prima schermata
 * dà, non chiede (CLAUDE.md). Dopo due giorni chi è tornato ha già avuto la
 * sua ragione per restare, e la domanda non copre più niente.
 */
export const GIORNI_PRIMA_DEL_CONSENSO = 2;

export function chiediConsensoOra(creatoIl: string | null | undefined, adesso: Date = new Date()): boolean {
  if (!creatoIl) return false;
  const t = Date.parse(creatoIl);
  if (Number.isNaN(t)) return false;
  return adesso.getTime() - t >= GIORNI_PRIMA_DEL_CONSENSO * 24 * 60 * 60 * 1000;
}
