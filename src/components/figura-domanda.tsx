"use client";

import type { ReactNode } from "react";
import { SuitSymbol } from "@/components/bridge/suit-symbol";
import { useT } from "@/contexts/traduzioni-provider";
import {
  carteLeggibili,
  descriviFigura,
  semiDaMostrare,
  type Figura,
  type ManoFigura,
  type PostoFigura,
  type SemeFigura,
} from "@/lib/figura-domanda";

const SEME: Record<SemeFigura, "spade" | "heart" | "diamond" | "club"> = { S: "spade", H: "heart", D: "diamond", C: "club" };
const NOME: Record<PostoFigura, string> = { N: "Nord", E: "Est", S: "Sud", W: "Ovest" };

/**
 * La figura di una domanda a scelta, disegnata come nel test: la mano in
 * colonna, la linea Nord-Sud una sopra l'altra, lo schema di un seme a croce
 * con il posto di ognuno. Il testo per lo screen reader è la stessa figura in
 * una riga (`descriviFigura`): il disegno è solo per chi lo vede.
 */
export function FiguraDomanda({ figura }: { figura: Figura }) {
  const t = useT();
  return (
    <figure className="mb-5 rounded-xl border border-border bg-card p-4">
      <figcaption className="sr-only">{descriviFigura(figura, t)}</figcaption>
      <div aria-hidden="true">
        <Disegno figura={figura} />
      </div>
    </figure>
  );
}

function Disegno({ figura: f }: { figura: Figura }) {
  switch (f.tipo) {
    case "mano":
      return <Mano mano={f.mano} />;
    case "confronto":
      return (
        <div className="grid grid-cols-2 gap-4">
          {(["A", "B"] as const).map((k) => (
            <div key={k}>
              <Mano mano={f[k]} />
              <p className="mt-2 pl-6 font-display text-lg font-bold">{k}</p>
            </div>
          ))}
        </div>
      );
    case "smazzata": {
      const posti = (["N", "W", "E", "S"] as const).filter((p) => f[p]);
      const semi = semiDaMostrare(posti.map((p) => f[p]!));
      return (
        <Croce posti={Object.fromEntries(posti.map((p) => [p, <Mano key={p} mano={f[p]!} semi={semi} />]))} />
      );
    }
    case "colore": {
      const posti = (["N", "W", "E", "S"] as const).filter((p) => f[p] != null);
      return (
        <Croce
          centro={f.seme ? <SuitSymbol suit={SEME[f.seme]} size="lg" /> : null}
          posti={Object.fromEntries(posti.map((p) => [p, <Carte key={p} carte={f[p]!} grandi />]))}
        />
      );
    }
    case "colori":
      return (
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {f.figure.map((x, i) => (
            <div key={i} className="text-center">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">{i + 1}</p>
              <Carte carte={x.N ?? ""} grandi />
              <div className="mx-auto my-1 h-px w-10 bg-border" />
              <Carte carte={x.S ?? ""} grandi />
            </div>
          ))}
        </div>
      );
  }
}

function Carte({ carte, grandi = false }: { carte: string; grandi?: boolean }) {
  return (
    <span className={`font-mono font-bold tracking-wider ${grandi ? "text-xl" : "text-lg"}`}>{carteLeggibili(carte)}</span>
  );
}

function Mano({ mano, semi = ["S", "H", "D", "C"] }: { mano: ManoFigura; semi?: SemeFigura[] }) {
  return (
    <div className="space-y-1">
      {semi.map((s) => (
        <p key={s} className="flex items-center gap-2">
          <SuitSymbol suit={SEME[s]} size="md" />
          <Carte carte={mano[s]} />
        </p>
      ))}
    </div>
  );
}

/**
 * Nord in alto, Sud in basso, Ovest ed Est ai lati: come al tavolo e come nei
 * diagrammi del test. I posti che il test non mostra restano vuoti.
 */
function Croce({
  posti,
  centro = null,
}: {
  posti: Partial<Record<PostoFigura, ReactNode>>;
  centro?: ReactNode;
}) {
  const t = useT();
  const cella = (p: PostoFigura) =>
    posti[p] ? (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(NOME[p])}</span>
        {posti[p]}
      </div>
    ) : (
      <div />
    );
  const lati = !!(posti.W || posti.E);
  return (
    <div className={`grid items-center justify-items-center gap-3 ${lati ? "grid-cols-3" : "grid-cols-1"}`}>
      {lati && <div />}
      {cella("N")}
      {lati && <div />}
      {lati && cella("W")}
      {lati ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/40">{centro}</div>
      ) : (
        centro && <div className="flex h-8 items-center justify-center">{centro}</div>
      )}
      {lati && cella("E")}
      {lati && <div />}
      {cella("S")}
      {lati && <div />}
    </div>
  );
}
