import { getYouTubeWatchUrl } from "@/components/maestro-video";
import { dispensaDellaLezione, MATERIALI_CORSO } from "@/lib/materiali-corso";
import type { LezioneProgramma } from "@/lib/programma-corso";
import { testDellaLezione, type TestCommissione } from "@/lib/test-commissione";
import type { TipoMateriale } from "@/lib/materiali-lezione";

/**
 * Le quattro cose di una lezione del programma: slide, videolezione,
 * dispensa ed esercizi, ognuna da vedere, stampare o assegnare alla classe.
 *
 * PERCHÉ. Nel programma c'erano i collegamenti alle «lezioni del sito», e
 * Trevissoi (03/11/2026) li ha trovati sbagliati: portavano alle lezioni di
 * BridgeLab, non ai materiali della Commissione. Ha chiesto, sotto ogni
 * lezione, proprio questi quattro, e in ogni classe la stessa struttura con
 * in evidenza cosa è già stato assegnato.
 *
 * Le slide, le dispense e i video sono legati alle lezioni del sito
 * (`lezioniSito`); gli esercizi alla lezione del programma. Una lezione di
 * solo gioco al tavolo non ha niente di questo: ha le smazzate.
 */
export interface VoceMateriale {
  /** Il tipo con cui si assegna fra i «Materiali dopo la lezione». */
  tipo: TipoMateriale;
  /** Il titolo che leggono gli allievi, quando si assegna. */
  titolo: string;
  /** Il nome del materiale nel programma, senza «Le slide:» davanti. */
  etichetta: string;
  url: string;
  /** PDF: si stampa aprendolo. Il video no. */
  stampabile: boolean;
}

export interface MaterialiLezione {
  slide: VoceMateriale[];
  video: VoceMateriale[];
  dispense: VoceMateriale[];
  esercizi: TestCommissione[];
}

export function materialiDellaLezione(l: LezioneProgramma): MaterialiLezione {
  const tocca = (lezioni: number[]) => lezioni.some((x) => l.lezioniSito.includes(x));
  const slide = MATERIALI_CORSO.flatMap((m) => m.slide)
    .filter((s) => tocca(s.lezioni))
    .map((s) => ({ tipo: "dispensa" as const, titolo: `Le slide: ${s.titolo}`, etichetta: s.titolo, url: s.file, stampabile: true }));
  const video = l.lezioniSito
    .map((id) => getYouTubeWatchUrl(id))
    .filter((u): u is string => !!u)
    .map((url, i, tutti) => ({
      tipo: "video" as const,
      titolo: tutti.length > 1 ? `La videolezione (${i + 1} di ${tutti.length})` : "La videolezione",
      etichetta: tutti.length > 1 ? `${l.titolo} (${i + 1} di ${tutti.length})` : l.titolo,
      url,
      stampabile: false,
    }));
  const visti = new Set<string>();
  const dispense = l.lezioniSito
    .map((id) => dispensaDellaLezione(id))
    .filter((d) => d && !visti.has(d.file) && visti.add(d.file))
    .map((d) => ({ tipo: "dispensa" as const, titolo: `La dispensa: ${d!.titolo}`, etichetta: d!.titolo, url: d!.file, stampabile: true }));
  return { slide, video, dispense, esercizi: testDellaLezione(l.numero) };
}

/** L'etichetta con cui i materiali di una lezione del programma si raggruppano in classe. */
export function etichettaLezioneProgramma(l: Pick<LezioneProgramma, "numero" | "titolo">): string {
  return `Lezione ${l.numero} – ${l.titolo}`;
}
