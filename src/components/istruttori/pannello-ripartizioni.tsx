"use client";

import { useState } from "react";
import type { Card, GameState, Position, Suit } from "@/lib/bridge-engine";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { avversari, raggruppa, ripartizioni, vuotiMostrati } from "@/lib/ripartizioni";
import { useT } from "@/contexts/traduzioni-provider";

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const NOMI: Record<Position, string> = { north: "Nord", east: "Est", south: "Sud", west: "Ovest" };

const pct = (p: number) =>
  `${(p * 100).toLocaleString("it-IT", { maximumFractionDigits: 2, minimumFractionDigits: 1 })}%`;

/**
 * Come si dividono le carte mancanti, visto dalla linea del dichiarante.
 *
 * DUE MOMENTI, perché il senso dell'esercizio è il confronto. «Tutte le carte»
 * sono le percentuali dei libri, a posti pari (13 e 13). «Carte attuali» usa
 * le carte che restano davvero in mano a ciascun avversario e chi ha già
 * mostrato un vuoto: dopo tre giri di un colore la 3-1 di prima non vale più,
 * e far vedere di quanto cambia è una lezione che a parole non passa.
 *
 * DUE LETTURE. «Divisione» è la tabella dei libri (3-1 insieme a 1-3).
 * «Sinistra / Destra» separa le due metà: con i posti vacanti smettono di
 * essere uguali, ed è lì che si decide da che parte fare l'impasse.
 *
 * Disposizione ripresa dal pannello «Distribuzioni» di BridgeChamp: un seme
 * alla volta, barre invece di sole cifre — in aula si legge da lontano.
 */
export function PannelloRipartizioni({
  mani,
  stato,
  dichiarante,
}: {
  /** La smazzata di partenza: serve per «tutte le carte». */
  mani: Record<Position, Card[]>;
  stato: GameState;
  dichiarante: Position;
}) {
  const t = useT();
  const [modo, setModo] = useState<"inizio" | "adesso">("inizio");
  const [vista, setVista] = useState<"divisione" | "lati">("divisione");
  const [seme, setSeme] = useState<Suit>("spade");

  const [sx, dx] = avversari(dichiarante);
  const fonte = modo === "inizio" ? mani : stato.hands;
  const postiSx = modo === "inizio" ? 13 : stato.hands[sx].length;
  const postiDx = modo === "inizio" ? 13 : stato.hands[dx].length;
  const vuoti = modo === "adesso" ? vuotiMostrati([...stato.tricks, { plays: stato.currentTrick }]) : null;

  const mancantiDi = (s: Suit) =>
    fonte[sx].filter((c) => c.suit === s).length + fonte[dx].filter((c) => c.suit === s).length;

  const mancanti = mancantiDi(seme);
  const vuotoSx = vuoti?.[sx].has(seme) ?? false;
  const vuotoDx = vuoti?.[dx].has(seme) ?? false;
  const lista = ripartizioni(mancanti, postiSx, postiDx, { a: vuotoSx, b: vuotoDx });

  const righe =
    vista === "divisione"
      ? raggruppa(lista).map((r) => ({ etichetta: r.etichetta, p: r.probabilita }))
      : lista.map((r) => ({ etichetta: `${r.a}-${r.b}`, p: r.probabilita }));

  const scelta = (attivo: boolean) =>
    `min-h-11 rounded-lg px-3 text-sm font-medium transition-colors ${
      attivo ? "bg-figb text-white" : "border border-border hover:bg-muted"
    }`;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className={scelta(modo === "inizio")} onClick={() => setModo("inizio")}>
          {t("Tutte le carte")}
        </button>
        <button className={scelta(modo === "adesso")} onClick={() => setModo("adesso")}>
          {t("Carte attuali")}
        </button>
        <span className="ml-auto text-sm text-muted-foreground">
          {t("Carte rimaste")}: {t(NOMI[sx])} {postiSx} · {t(NOMI[dx])} {postiDx}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {SEMI.map((s) => (
          <button
            key={s}
            onClick={() => setSeme(s)}
            aria-pressed={seme === s}
            className={`flex min-h-16 flex-col items-center justify-center rounded-xl border-2 transition-colors ${
              seme === s ? "border-figb bg-figb/5" : "border-border hover:bg-muted"
            }`}
          >
            <SuitSymbol suit={s} size="sm" />
            <span className="mt-1 text-xs text-muted-foreground">
              {t("{n} mancanti", { n: mancantiDi(s) })}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className={scelta(vista === "divisione")} onClick={() => setVista("divisione")}>
          {t("Divisione")}
        </button>
        <button className={scelta(vista === "lati")} onClick={() => setVista("lati")}>
          {t("{sx} / {dx}", { sx: t(NOMI[sx]), dx: t(NOMI[dx]) })}
        </button>
      </div>

      {(vuotoSx || vuotoDx) && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("{nome} ha mostrato il vuoto: le carte sono tutte dall'altra parte.", {
            nome: t(NOMI[vuotoSx ? sx : dx]),
          })}
        </p>
      )}

      {mancanti === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("Nessuna carta fuori in questo seme.")}</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="w-24 pb-2 font-medium">
                {vista === "divisione" ? t("Divisione") : `${t(NOMI[sx])}-${t(NOMI[dx])}`}
              </th>
              <th className="w-20 pb-2 font-medium">{t("Probabilità")}</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => (
              <tr key={r.etichetta}>
                <td className="py-1.5 font-mono font-semibold">{r.etichetta}</td>
                <td className="py-1.5 font-semibold tabular-nums">{pct(r.p)}</td>
                <td className="py-1.5">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-figb to-figb-light"
                      style={{ width: `${Math.max(1, r.p * 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
