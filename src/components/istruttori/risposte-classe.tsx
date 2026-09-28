"use client";

import { useEffect, useState } from "react";
import type { Card, Suit } from "@/lib/bridge-engine";
import { createClient } from "@/lib/supabase/client";
import { ETICHETTE_CONSEGNA, leggiEsercizi, type EsercizioPosizione } from "@/lib/esercizi-posizione";
import { statisticheRisposte, type RigaRisultato } from "@/lib/statistiche-risposte";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];
const ORDINE = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
/** Il primo colore è la risposta più data; il verde lo prende sempre quella giusta. */
const COLORI = ["#003DA5", "#c8a44e", "#e11d48", "#7c3aed", "#0891b2", "#94a3b8"];
const VERDE = "#059669";

/**
 * Le risposte della classe, esercizio per esercizio.
 *
 * Come i quiz dei club di BridgeChamp: la mano che aveva l'allievo, la licita
 * fin lì, e un anello con la divisione delle risposte. L'insegnante lo guarda
 * prima della lezione successiva per sapere cosa rispiegare.
 *
 * NIENTE NOMI QUI. Chi ha risposto cosa è già nella griglia sopra; questa vista
 * serve a leggere la classe, non i singoli, e senza nomi si può anche
 * proiettare in aula per discuterne.
 */
export function RisposteClasse({ esercizioIds, righe }: { esercizioIds: string[]; righe: RigaRisultato[] }) {
  const t = useT();
  const [esercizi, setEsercizi] = useState<EsercizioPosizione[] | null>(null);

  useEffect(() => {
    if (esercizioIds.length === 0) return;
    let vivo = true;
    // Non `select("*")`: le colonne con le risposte attese hanno un privilegio
    // per ruolo, e l'insegnante è `authenticated` come l'allievo. Le proprie si
    // leggono intere da `i_miei_esercizi`; quelle scritte da altri solo come le
    // vede l'allievo — la divisione delle risposte c'è, la risposta attesa no.
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("i_miei_esercizi");
      if (error) segnalaSalvoRete("compito:esercizi-statistiche", error);
      const perId = new Map(((data as EsercizioPosizione[] | null) ?? []).map((e) => [e.id, e]));
      const mancanti = esercizioIds.filter((id) => !perId.has(id));
      if (mancanti.length > 0) {
        for (const e of await leggiEsercizi(mancanti)) {
          perId.set(e.id, { ...e, hands: e.hands as EsercizioPosizione["hands"], risposte: [], soluzione: null });
        }
      }
      if (vivo) setEsercizi(esercizioIds.map((id) => perId.get(id)).filter((e): e is EsercizioPosizione => !!e));
    })();
    return () => { vivo = false; };
  }, [esercizioIds]);

  if (esercizioIds.length === 0 || !esercizi || esercizi.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-1 font-display text-xl font-bold text-foreground">{t("Cosa hanno risposto")}</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {t("La prima risposta di ognuno: dopo un errore la soluzione si vede, e i tentativi seguenti non dicono più cosa pensavano.")}
      </p>
      <div className="space-y-3">
        {esercizi.map((e, n) => {
          const s = statisticheRisposte(righe, e.id, e.risposte ?? []);
          const mano = e.hands?.[e.posizione] ?? [];
          let fine = 0;
          const fette = s.voci.map((v, i) => {
            const inizio = fine;
            fine += v.quota * 100;
            const colore = v.giusta && (e.risposte ?? []).length > 0 ? VERDE : COLORI[i % COLORI.length];
            return { ...v, inizio, fine, colore };
          });
          const anello = fette.length
            ? `conic-gradient(${fette.map((f) => `${f.colore} ${f.inizio}% ${f.fine}%`).join(", ")})`
            : "conic-gradient(#e5e7eb 0 100%)";
          return (
            <div key={e.id} className="flex flex-wrap items-center gap-5 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {t("Domanda {n}", { n: n + 1 })} · {e.titolo || t(ETICHETTE_CONSEGNA[e.consegna])}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-base">
                  {SEMI.map((seme) => (
                    <span key={seme} className="flex items-center gap-1">
                      <SuitSymbol suit={seme} size="xs" />
                      {mano
                        .filter((c: Card) => c.suit === seme)
                        .sort((a: Card, b: Card) => ORDINE.indexOf(a.rank) - ORDINE.indexOf(b.rank))
                        .map((c: Card) => c.rank)
                        .join(" ") || "—"}
                    </span>
                  ))}
                </div>
                {e.bids?.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("Licita finora")}: {e.bids.join(" – ")}
                  </p>
                )}
                {(e.risposte ?? []).length > 0 && (
                  <p className="mt-1 text-sm">
                    <b>{t("Risposta attesa")}:</b> {e.risposte.join(" / ")}
                  </p>
                )}
              </div>

              {s.totale === 0 ? (
                <p className="text-sm text-muted-foreground">{t("Ancora nessuna risposta.")}</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div
                    className="relative h-24 w-24 shrink-0 rounded-full"
                    style={{ background: anello }}
                    role="img"
                    aria-label={fette.map((f) => `${Math.round(f.quota * 100)}% ${f.risposta}`).join(", ")}
                  >
                    <div className="absolute inset-4 flex items-center justify-center rounded-full bg-card text-sm font-bold">
                      {s.totale}
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {fette.map((f) => (
                      <li key={f.risposta} className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: f.colore }} />
                        <span className="tabular-nums font-semibold">{Math.round(f.quota * 100)}%</span>
                        <span>{t("ha risposto {r}", { r: f.risposta })}</span>
                        {f.giusta && (e.risposte ?? []).length > 0 && <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">✓</span>}
                      </li>
                    ))}
                    {(e.risposte ?? []).length > 0 && (
                      <li className="pt-1 text-xs text-muted-foreground">
                        {t("Giuste: {g} su {n}", { g: s.giuste, n: s.totale })}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
