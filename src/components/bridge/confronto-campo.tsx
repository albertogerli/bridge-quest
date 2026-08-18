"use client";

import { useState } from "react";
import { reportError } from "@/lib/report-error";
import {
  confrontoFiltrato, type ConfrontoCampo, type FiltroCampo, type PersonaConfronto,
} from "@/lib/mani-condivise";
import { Stelle } from "@/components/bridge/stelle";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Come è andata agli altri sulla stessa mano.
 *
 * PERCHÉ VALE PIÙ DELLE STELLE
 * «Due stelle» è un voto senza scala: non si sa se sia un buon risultato per
 * quella mano o un disastro. «Meglio del 74%» si capisce subito, e soprattutto
 * mostra che la mano era difficile per tutti — che è l'informazione che tiene
 * uno a studiare invece di concludere che non è portato.
 *
 * I FILTRI SERVONO PERCHÉ IL CAMPO NON È OMOGENEO: comprende chi gioca da
 * vent'anni e chi ha cominciato a marzo. Il paragone che insegna qualcosa a un
 * allievo è con i suoi compagni di classe.
 *
 * NIENTE NOMI, TRANNE FRA AMICI. Sapere CHI ha sbagliato trasformerebbe un
 * esercizio in una classifica pubblica di bravura, che al circolo è
 * esattamente il motivo per cui certe persone smettono di provarci. Fra amici
 * è diverso: l'amicizia è già un consenso reciproco, e lì il paragone col nome
 * è tutto il senso della cosa. Il filtro sta nel database, non qui.
 *
 * QUANDO SEI IL PRIMO non c'è niente da confrontare, e si dice: un «meglio del
 * 100%» calcolato su zero persone sarebbe una bugia lusinghiera.
 */
export function ConfrontoCampoPannello({
  campo,
  manoId,
}: {
  campo: ConfrontoCampo;
  /** Se c'è, compaiono i filtri: senza id non si può richiedere altro. */
  manoId?: string;
}) {
  const t = useT();
  /**
   * La scelta di filtro si tiene insieme alla mano a cui appartiene, invece di
   * riazzerarla con un effetto quando arriva una mano nuova: uno stato che si
   * ricopia da una proprietà è sempre uno stato che prima o poi resta indietro.
   */
  const [scelta, setScelta] = useState<{
    mano: string | undefined;
    filtro: FiltroCampo;
    dati: ConfrontoCampo & { persone?: PersonaConfronto[] | null };
  } | null>(null);

  const valida = scelta && scelta.mano === manoId ? scelta : null;
  const filtro = valida?.filtro ?? "tutti";
  const dati: ConfrontoCampo & { persone?: PersonaConfronto[] | null } = valida?.dati ?? campo;

  const cambia = (f: FiltroCampo) => {
    if (!manoId) return;
    setScelta({ mano: manoId, filtro: f, dati });
    confrontoFiltrato(manoId, f)
      .then((r) => { if (r) setScelta({ mano: manoId, filtro: f, dati: r }); })
      .catch((err) => reportError("confronto-campo:filtro", err));
  };

  const altri = dati.totale - (dati.mio ? 1 : 0);

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {t("Come è andata agli altri")}
      </p>

      {manoId && (
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Con chi confrontarsi">
          {(
            [
              ["tutti", "Tutti"],
              ["amici", "Amici"],
              ["classe", "La mia classe"],
              ["asd", "Il mio circolo"],
            ] as [FiltroCampo, string][]
          ).map(([f, etichetta]) => (
            <button
              key={f}
              onClick={() => cambia(f)}
              aria-pressed={filtro === f}
              className={`text-sm rounded-full px-3 py-1 border transition-colors ${
                filtro === f
                  ? "bg-figb text-white border-figb"
                  : "border-border text-muted-foreground hover:border-figb"
              }`}
            >
              {etichetta}
            </button>
          ))}
        </div>
      )}

      {altri <= 0 ? (
        <p className="text-sm text-muted-foreground">
          {filtro === "tutti"
            ? "Sei il primo a dichiarare questa mano: il confronto comparirà quando l'avranno fatta anche gli altri."
            : "Nessun altro di questo gruppo ha ancora dichiarato questa mano."}
        </p>
      ) : (
        <>
          {dati.percentile !== null && (
            <p className="text-sm mb-3">
              {t("Hai fatto meglio del")} <strong>{dati.percentile}%</strong>{" "}
              <span className="text-muted-foreground">({altri} giocatori)</span>.
            </p>
          )}

          <ul className="space-y-1.5">
            {dati.contratti.map((c) => {
              const massimo = Math.max(...dati.contratti.map((x) => x.quanti), 1);
              const mio =
                dati.mio?.contratto === c.contratto ||
                (dati.mio?.contratto === null && c.contratto === "passo");
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

          {filtro === "amici" && dati.persone && dati.persone.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {dati.persone.map((p, i) => (
                <li key={`${p.nome}-${i}`} className="flex justify-between gap-3">
                  <span>{p.nome ?? "Un amico"}</span>
                  <span className="text-muted-foreground">
                    {p.contratto} · {p.punteggio} ·{" "}
                    <Stelle quante={p.stelle} className="align-middle" />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
