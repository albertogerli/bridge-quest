"use client";

import type { ConfrontoCampo } from "@/lib/mani-condivise";

/**
 * Come è andata agli altri sulla stessa mano.
 *
 * PERCHÉ VALE PIÙ DELLE STELLE
 * «Due stelle» è un voto senza scala: non si sa se sia un buon risultato per
 * quella mano o un disastro. «Meglio del 74%» si capisce subito, e soprattutto
 * mostra che la mano era difficile per tutti — che è l'informazione che tiene
 * uno a studiare invece di concludere che non è portato.
 *
 * NIENTE NOMI, MAI. Il database non li restituisce nemmeno, e non è una
 * dimenticanza: sapere CHI ha sbagliato trasformerebbe un esercizio in una
 * classifica pubblica di bravura, che al circolo è esattamente il motivo per
 * cui certe persone smettono di provarci.
 *
 * QUANDO SEI IL PRIMO non c'è niente da confrontare, e si dice: un «meglio del
 * 100%» calcolato su zero persone sarebbe una bugia lusinghiera.
 */
export function ConfrontoCampoPannello({ campo }: { campo: ConfrontoCampo }) {
  const altri = campo.totale - (campo.mio ? 1 : 0);

  if (altri <= 0) {
    return (
      <p className="text-xs text-muted-foreground mt-3">
        Sei il primo a dichiarare questa mano: il confronto con gli altri
        comparirà quando l&apos;avranno fatta anche loro.
      </p>
    );
  }

  const massimo = Math.max(...campo.contratti.map((c) => c.quanti), 1);

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Come è andata agli altri
      </p>

      {campo.percentile !== null && (
        <p className="text-sm mb-3">
          Hai fatto meglio del <strong>{campo.percentile}%</strong> di chi ha
          dichiarato questa mano{" "}
          <span className="text-muted-foreground">({altri} giocatori)</span>.
        </p>
      )}

      <ul className="space-y-1.5">
        {campo.contratti.map((c) => {
          const mio = campo.mio?.contratto === c.contratto ||
            (campo.mio?.contratto === null && c.contratto === "passo");
          return (
            <li key={c.contratto} className="flex items-center gap-2 text-sm">
              <span className={`w-16 shrink-0 font-mono ${mio ? "font-bold text-figb" : ""}`}>
                {c.contratto}
              </span>
              <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                <span
                  className={`block h-full rounded-full ${mio ? "bg-figb" : "bg-muted-foreground/40"}`}
                  style={{ width: `${Math.round((c.quanti / massimo) * 100)}%` }}
                />
              </span>
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                {c.quanti} · {c.punteggioMedio}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground mt-2">
        Quanti l&apos;hanno dichiarato e quanto ha reso in media. In grassetto il tuo.
      </p>
    </div>
  );
}
