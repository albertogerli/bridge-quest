import type { ReactNode } from "react";

/**
 * Una frase tradotta con dentro dei pezzi di JSX: un collegamento, un grassetto.
 *
 * IL PROBLEMA CHE RISOLVE. Un paragrafo di testo con due link dentro, scritto
 * direttamente in JSX, si spezza in cinque frammenti — «La FIGB si impegna a
 * rendere», «accessibile a tutti, in conformità con», «e con le». Avvolgere
 * quelli in `t()` produce chiavi di dizionario che non si possono tradurre:
 * l'ordine delle parole cambia da una lingua all'altra, e un frammento senza
 * la sua frase non ha abbastanza contesto nemmeno per un umano.
 *
 * Qui la frase resta INTERA nel dizionario, con dei segnaposto:
 *
 *   <FraseConElementi
 *     testo={t("Vedi il {sito} e le {linee} per i dettagli.")}
 *     elementi={{ sito: <a href="…">bridgelab.it</a>, linee: <a href="…">Linee guida</a> }}
 *   />
 *
 * Chi traduce può spostare i segnaposto dove la sua lingua li vuole, e il
 * risultato resta una frase e non un collage.
 *
 * `riempi()` in `traduzioni.ts` fa la stessa cosa per i valori TESTUALI. Questo
 * serve quando il pezzo da inserire è un elemento React, che in una stringa non
 * ci sta.
 */
export function FraseConElementi({
  testo,
  elementi,
}: {
  testo: string;
  elementi: Record<string, ReactNode>;
}) {
  // Si divide TENENDO i separatori: `split` con un gruppo catturante restituisce
  // alternati testo e nome del segnaposto.
  const pezzi = testo.split(/\{(\w+)\}/g);

  return (
    <>
      {pezzi.map((pezzo, i) =>
        // Le posizioni dispari sono i nomi catturati dal gruppo.
        i % 2 === 1 ? (
          <span key={i}>{elementi[pezzo] ?? `{${pezzo}}`}</span>
        ) : (
          pezzo
        ),
      )}
    </>
  );
}
