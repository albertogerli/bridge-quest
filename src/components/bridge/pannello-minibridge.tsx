"use client";

import { useMemo } from "react";
import type { Card, Position } from "@/lib/bridge-engine";
import {
  analyzeDeal,
  buildContract,
  STRAIN_LABEL,
  strainChoices,
  suggestStrain,
  type Strain,
} from "@/lib/minibridge";

const NOME: Record<Position, string> = {
  north: "Nord",
  east: "Est",
  south: "Sud",
  west: "Ovest",
};

/**
 * Il minibridge come MODALITÀ, non come prodotto.
 *
 * Esiste già una pagina `/gioca/minibridge`, con il suo percorso a tre passi.
 * Ma le prime lezioni del Corso Fiori si fanno senza dichiarazione, e
 * l'insegnante che sta spiegando in aula non vuole mandare la classe su
 * un'altra pagina: vuole che il tavolo che ha davanti, per stasera, funzioni
 * senza cassetta delle dichiarazioni. Questo pannello è quel pezzo, staccato
 * dal percorso e riusabile sulla lavagna, sul tavolo di studio e dentro un
 * compito.
 *
 * IL CONTRATTO NON SI DICHIARA, SI DEDUCE. Chi ha più punti gioca, il livello
 * viene dalla tabella delle decisioni, e l'atout è il fit più lungo — meglio se
 * nobile. Sono le tre regole del minibridge, e stanno tutte in
 * `src/lib/minibridge.ts`, già scritte e testate.
 *
 * LE PRESE IN PIÙ NON CONTANO, e va detto in una riga sotto i tasti: è la
 * differenza che confonde di più chi passa dal minibridge al bridge, e
 * scoprirla dal punteggio invece che dall'interfaccia fa sembrare il programma
 * sbagliato.
 */
export function PannelloMinibridge({
  mani,
  onScelta,
  contrattoScelto,
  compatto = false,
}: {
  mani: Record<Position, Card[]>;
  /** Chiamato quando si sceglie l'atout: dà contratto e dichiarante. */
  onScelta?: (contratto: string, dichiarante: Position) => void;
  contrattoScelto?: string | null;
  compatto?: boolean;
}) {
  const analisi = useMemo(() => analyzeDeal(mani), [mani]);
  const consigliato = suggestStrain(analisi.fits);
  const scelte = strainChoices(analisi.fits);

  const linea = analisi.declaringSide === "ns" ? "Nord-Sud" : "Est-Ovest";
  const avversari = analisi.declaringSide === "ns" ? "Est-Ovest" : "Nord-Sud";
  const puntiLinea = analisi.partnershipHcp[analisi.declaringSide];
  const puntiAvversari = analisi.partnershipHcp[analisi.declaringSide === "ns" ? "ew" : "ns"];

  return (
    <div className={`rounded-xl border border-border bg-card ${compatto ? "p-3" : "p-5"}`}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className={compatto ? "text-sm" : "text-base"}>
          <span className="font-bold">{linea}</span> ha{" "}
          <span className="font-bold text-primary">{puntiLinea} punti</span>
          <span className="text-muted-foreground"> ({avversari}: {puntiAvversari})</span>
        </p>
        <p className={`text-muted-foreground ${compatto ? "text-xs" : "text-sm"}`}>
          gioca {NOME[analisi.declarer]}, morto {NOME[analisi.dummy]}
        </p>
      </div>

      <p className={`mt-2 ${compatto ? "text-sm" : "text-base"}`}>
        La tabella delle decisioni dice{" "}
        <span className="font-bold">{analisi.expectedTricks} prese</span>
        {analisi.fits.length > 0 && (
          <span className="text-muted-foreground">
            {" "}
            · fit: {analisi.fits.map((f) => `${STRAIN_LABEL[f.suit]} (${f.count})`).join(", ")}
          </span>
        )}
      </p>

      {onScelta && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {scelte.map((strain: Strain) => {
              const contratto = buildContract(analisi.expectedTricks, strain);
              const consiglio = strain === consigliato;
              const attivo = contrattoScelto === contratto;
              return (
                <button
                  key={strain}
                  onClick={() => onScelta(contratto, analisi.declarer)}
                  aria-pressed={attivo}
                  className={`rounded-lg border p-2.5 text-center transition-colors ${
                    attivo
                      ? "border-primary bg-primary text-primary-foreground"
                      : consiglio
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/50"
                  }`}
                >
                  <p className="font-display text-lg font-bold">{contratto}</p>
                  <p className="text-[12px] opacity-70">{STRAIN_LABEL[strain]}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Le prese in più non contano: il punteggio è quello del contratto scelto, che si
            mantiene o cade.
          </p>
        </>
      )}
    </div>
  );
}
