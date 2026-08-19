"use client";

import { useState } from "react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import type { Suit } from "@/lib/bridge-engine";
import type { DealConstraints, Range, SeatConstraint } from "@/lib/deal-generator";

type Posto = "north" | "east" | "south" | "west";

const POSTI: { key: Posto; nome: string }[] = [
  { key: "south", nome: "Sud" },
  { key: "north", nome: "Nord" },
  { key: "west", nome: "Ovest" },
  { key: "east", nome: "Est" },
];

const SEMI: Suit[] = ["spade", "heart", "diamond", "club"];

/**
 * Compone un vincolo con menù e cursori, senza scrivere niente.
 *
 * PERCHÉ NON UN LINGUAGGIO. Nessun insegnante di primo livello scriverà mai un
 * vincolo a mano, e chiedergli di farlo vuol dire che userà i sette modelli
 * fissi per sempre. Ma il testo del vincolo resta VISIBILE e modificabile in
 * fondo: la minoranza che sa cosa sta facendo non deve passare da un modulo
 * che le sta stretto, e vedere il risultato del proprio clic scritto in chiaro
 * è anche il modo più rapido di imparare cosa si può chiedere.
 *
 * SUD È IL PRIMO NELL'ELENCO, e non è alfabetico: è il posto da cui gioca
 * l'allievo in tutto il resto dell'applicazione. Un modulo che mette Nord per
 * primo fa comporre l'esercizio nel posto sbagliato senza che nessuno se ne
 * accorga.
 *
 * NIENTE VALIDAZIONE PREVENTIVA sulle combinazioni impossibili. Un vincolo che
 * non si può soddisfare lo si scopre generando — il motore ha un tetto di
 * tentativi e lo dice — e provare a indovinarlo prima vorrebbe dire riscrivere
 * il motore nel modulo.
 */
export function CompositoreVincoli({
  vincoli,
  onCambia,
}: {
  vincoli: DealConstraints;
  onCambia: (v: DealConstraints) => void;
}) {
  const [espanso, setEspanso] = useState<Posto | null>("south");
  const [testoAperto, setTestoAperto] = useState(false);
  const [testo, setTesto] = useState("");
  const [erroreTesto, setErroreTesto] = useState<string | null>(null);

  const perPosto = (p: Posto): SeatConstraint => vincoli[p] ?? {};

  const cambiaPosto = (p: Posto, patch: Partial<SeatConstraint>) => {
    const nuovo: SeatConstraint = { ...perPosto(p), ...patch };
    // Un vincolo vuoto si toglie invece di restare come oggetto vuoto: nel
    // testo in fondo si vedrebbe `"north": {}`, che sembra un vincolo e non lo è.
    for (const k of Object.keys(nuovo) as (keyof SeatConstraint)[]) {
      const v = nuovo[k];
      if (v === undefined || (typeof v === "object" && v !== null && Object.keys(v).length === 0)) {
        delete nuovo[k];
      }
    }
    onCambia({ ...vincoli, [p]: Object.keys(nuovo).length ? nuovo : undefined });
  };

  const campoRange = (
    etichetta: string,
    valore: Range | undefined,
    massimo: number,
    onSet: (r: Range | undefined) => void,
  ) => (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-sm">{etichetta}</span>
      <input
        type="number"
        min={0}
        max={massimo}
        value={valore?.min ?? ""}
        placeholder="da"
        onChange={(e) =>
          onSet(
            e.target.value === "" && valore?.max === undefined
              ? undefined
              : { ...valore, min: e.target.value === "" ? undefined : Number(e.target.value) },
          )
        }
        className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
      />
      <span className="text-muted-foreground">–</span>
      <input
        type="number"
        min={0}
        max={massimo}
        value={valore?.max ?? ""}
        placeholder="a"
        onChange={(e) =>
          onSet(
            e.target.value === "" && valore?.min === undefined
              ? undefined
              : { ...valore, max: e.target.value === "" ? undefined : Number(e.target.value) },
          )
        }
        className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-3">
      {POSTI.map((p) => {
        const c = perPosto(p.key);
        const attivo = Object.keys(c).length > 0;
        const aperto = espanso === p.key;
        return (
          <div key={p.key} className="rounded-lg border border-border">
            <button
              onClick={() => setEspanso(aperto ? null : p.key)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50"
            >
              <span className="font-semibold">{p.nome}</span>
              {attivo && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary">
                  con vincoli
                </span>
              )}
              <span className="ml-auto text-muted-foreground">{aperto ? "−" : "+"}</span>
            </button>

            {aperto && (
              <div className="space-y-2 border-t border-border p-3">
                {campoRange("Punti onori", c.hcp, 37, (r) => cambiaPosto(p.key, { hcp: r }))}

                {SEMI.map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-24 shrink-0">
                      <SuitSymbol suit={s} size="sm" />
                      <span className="ml-1 text-sm text-muted-foreground">carte</span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={13}
                      placeholder="da"
                      value={c[s]?.min ?? ""}
                      onChange={(e) =>
                        cambiaPosto(p.key, {
                          [s]: {
                            ...c[s],
                            min: e.target.value === "" ? undefined : Number(e.target.value),
                          },
                        } as Partial<SeatConstraint>)
                      }
                      className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                      type="number"
                      min={0}
                      max={13}
                      placeholder="a"
                      value={c[s]?.max ?? ""}
                      onChange={(e) =>
                        cambiaPosto(p.key, {
                          [s]: {
                            ...c[s],
                            max: e.target.value === "" ? undefined : Number(e.target.value),
                          },
                        } as Partial<SeatConstraint>)
                      }
                      className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                ))}

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={c.balanced === true}
                    onChange={(e) => cambiaPosto(p.key, { balanced: e.target.checked || undefined })}
                  />
                  Mano bilanciata (4333, 4432, 5332)
                </label>
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-sm font-semibold">Punti della linea</p>
        {campoRange("Nord-Sud", vincoli.nsHcp, 40, (r) => onCambia({ ...vincoli, nsHcp: r }))}
        <div className="h-2" />
        {campoRange("Est-Ovest", vincoli.ewHcp, 40, (r) => onCambia({ ...vincoli, ewHcp: r }))}
      </div>

      {/* Il vincolo in chiaro, per chi sa leggerlo. */}
      <div>
        <button
          onClick={() => {
            setTesto(JSON.stringify(vincoli, null, 2));
            setErroreTesto(null);
            setTestoAperto((v) => !v);
          }}
          className="text-sm text-primary hover:underline"
        >
          {testoAperto ? "Nascondi il vincolo scritto" : "Vedi e modifica il vincolo scritto"}
        </button>
        {testoAperto && (
          <div className="mt-2">
            <textarea
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              rows={10}
              spellCheck={false}
              className="w-full rounded-lg border border-border bg-background p-2 font-mono text-[12px]"
            />
            {erroreTesto && <p className="mt-1 text-sm text-destructive">{erroreTesto}</p>}
            <button
              onClick={() => {
                try {
                  onCambia(JSON.parse(testo) as DealConstraints);
                  setErroreTesto(null);
                } catch {
                  setErroreTesto("Non riesco a leggerlo: manca una virgola o una parentesi.");
                }
              }}
              className="mt-2 rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold hover:bg-muted/70"
            >
              Applica
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
