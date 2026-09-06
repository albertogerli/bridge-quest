import type { ClassRoom } from "@/lib/instructors";

/**
 * Come si riconosce una classe fra le altre.
 *
 * PERCHÉ SERVE. Giuseppe Trevissoi ha avviato quattordici corsi in contemporanea
 * in Puglia, e lo dice esplicitamente: «uno può fare più corsi dello stesso
 * livello, che si sovrappongono anche». Due classi «Corso Fiori» nello stesso
 * elenco, senza altro, sono indistinguibili — e l'insegnante ci entra dentro per
 * capire quale sia, che è il momento in cui l'elenco ha già fallito.
 *
 * L'ORDINE DEI PEZZI NON È CASUALE: ASD, livello, periodo. Chi insegna in due
 * circoli distingue prima per circolo — è la domanda «dove» — e solo dopo per
 * livello e data. Chi insegna in uno solo non vede l'ASD ripetuta su ogni riga,
 * perché lì non distingue niente e sarebbe rumore.
 */
export function dettagliClasse(
  classe: ClassRoom,
  opzioni: { mostraAsd: boolean },
): string[] {
  const pezzi: string[] = [];
  if (opzioni.mostraAsd && classe.asd_code) pezzi.push(classe.asd_code);
  if (classe.livello) pezzi.push(classe.livello);
  const periodo = periodoDelCorso(classe);
  if (periodo) pezzi.push(periodo);
  return pezzi;
}

/**
 * «da marzo», «marzo — giugno 2026», oppure niente.
 *
 * Il mese e non il giorno: serve a distinguere due corsi, non a ricordare
 * quando c'è lezione. «12/03/2026 — 18/06/2026» occupa una riga intera per
 * dire quello che «marzo — giugno» dice in due parole.
 */
export function periodoDelCorso(classe: ClassRoom): string | null {
  const inizio = classe.inizio_corso ? new Date(classe.inizio_corso) : null;
  const fine = classe.fine_corso ? new Date(classe.fine_corso) : null;
  if (!inizio && !fine) return null;

  const mese = (d: Date) =>
    d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  if (inizio && fine) {
    // Stesso anno: l'anno si scrive una volta sola.
    if (inizio.getFullYear() === fine.getFullYear()) {
      const soloMese = inizio.toLocaleDateString("it-IT", { month: "long" });
      return `${soloMese} — ${mese(fine)}`;
    }
    return `${mese(inizio)} — ${mese(fine)}`;
  }
  if (inizio) return `da ${mese(inizio)}`;
  return `fino a ${mese(fine as Date)}`;
}
