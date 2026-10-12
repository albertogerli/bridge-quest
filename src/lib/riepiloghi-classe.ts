/**
 * Riepiloghi di classe calcolati dai dati che l'insegnante vede già: la
 * classifica di un compito e l'elenco allievi da esportare.
 *
 * Funzioni pure: niente letture dal database, così si provano senza rete e la
 * pagina e il file esportato non possono raccontare due cose diverse.
 */

export interface EsitoMano {
  /** Differenza fra prese fatte e prese richieste: 0 mantenuto giusto, < 0 caduto. */
  score: number;
}

export interface RigaClassifica {
  studentId: string;
  nome: string;
  giocate: number;
  mantenute: number;
  /** Somma delle differenze di prese: le prese in più contano, le cadute tolgono. */
  saldo: number;
}

/**
 * La classifica di un compito, per l'insegnante (Trevissoi, ottobre 2026:
 * «dove si visualizza la classifica dell'esercizio specifico?»).
 *
 * Ordine: più contratti mantenuti, poi più mani giocate, poi saldo di prese
 * migliore, poi nome — così chi non ha ancora giocato resta in fondo, e due
 * pari stanno sempre nello stesso ordine.
 */
export function classificaCompito(
  allievi: { student_id: string; display_name?: string | null }[],
  smazzataIds: string[],
  esito: (studentId: string, smazzataId: string) => EsitoMano | null,
): RigaClassifica[] {
  return allievi
    .map((a) => {
      let giocate = 0;
      let mantenute = 0;
      let saldo = 0;
      for (const id of smazzataIds) {
        const e = esito(a.student_id, id);
        if (!e) continue;
        giocate++;
        if (e.score >= 0) mantenute++;
        saldo += e.score;
      }
      return { studentId: a.student_id, nome: a.display_name ?? "Allievo", giocate, mantenute, saldo };
    })
    .sort(
      (x, y) =>
        y.mantenute - x.mantenute ||
        y.giocate - x.giocate ||
        y.saldo - x.saldo ||
        x.nome.localeCompare(y.nome, "it"),
    );
}

export interface RigaElenco {
  nome: string;
  classe: string;
  stato: string;
  iscrittoIl: string;
  compitiSvolti: number;
  compitiAssegnati: number;
}

/**
 * Un campo CSV: fra virgolette se contiene il separatore, virgolette o a capo,
 * e con le virgolette raddoppiate. Un nome come «Rossi; Mario» non deve
 * spostare le colonne.
 */
function campo(v: string | number): string {
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * L'elenco allievi in CSV da aprire in Excel.
 *
 * Punto e virgola come separatore e BOM in testa: è la combinazione che Excel
 * italiano apre da solo nelle colonne giuste e con le lettere accentate al
 * loro posto. Con la virgola, Excel in italiano mette tutto in una colonna.
 */
export function elencoAllieviCsv(righe: RigaElenco[], intestazioni: string[]): string {
  const corpo = righe.map((r) =>
    [r.nome, r.classe, r.stato, r.iscrittoIl, r.compitiSvolti, r.compitiAssegnati].map(campo).join(";"),
  );
  return "﻿" + [intestazioni.map(campo).join(";"), ...corpo].join("\r\n") + "\r\n";
}
