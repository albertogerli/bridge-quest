import type { Figura, ManoFigura, SemeFigura } from "@/lib/esercizi-commissione";
import { TestoConSemi } from "./testo-con-semi";

const SEMI: { seme: SemeFigura; simbolo: string; classe: string }[] = [
  { seme: "S", simbolo: "♠", classe: "suit-spade" },
  { seme: "H", simbolo: "♥", classe: "suit-heart" },
  { seme: "D", simbolo: "♦", classe: "suit-diamond" },
  { seme: "C", simbolo: "♣", classe: "suit-club" },
  { seme: "X", simbolo: "", classe: "" },
];

function Mano({ mano, posto }: { mano: ManoFigura; posto: string }) {
  return (
    <div className="font-mono text-sm leading-snug" aria-label={posto}>
      {SEMI.filter((s) => s.seme in mano).map((s) => (
        <div key={s.seme} className="whitespace-nowrap">
          {s.simbolo && <span className={`${s.classe} mr-1 font-bold`}>{s.simbolo}</span>}
          <span className="font-semibold">{mano[s.seme] === "" ? "—" : mano[s.seme]}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Una figura dell'eserciziario: le mani ai loro posti intorno al tavolo, con
 * solo i semi che l'esercizio mostra. Nord sopra, Sud sotto, come sulla carta.
 */
export function FiguraEsercizio({ figura, nomi }: { figura: Figura; nomi: Record<"nord" | "ovest" | "est" | "sud", string> }) {
  const lati = !!(figura.ovest || figura.est);
  const etichetta = (
    <div className="flex h-8 min-w-8 items-center justify-center rounded-md bg-primary px-1.5 text-xs font-bold text-primary-foreground">
      {figura.etichetta ?? ""}
    </div>
  );
  return (
    <figure className="rounded-xl border border-border bg-card p-3">
      {lati ? (
        <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-3 gap-y-1.5">
          <span />
          <div>{figura.nord && <Mano mano={figura.nord} posto={nomi.nord} />}</div>
          <span />
          <div className="justify-self-end">{figura.ovest && <Mano mano={figura.ovest} posto={nomi.ovest} />}</div>
          <div className="justify-self-center">{etichetta}</div>
          <div>{figura.est && <Mano mano={figura.est} posto={nomi.est} />}</div>
          <span />
          <div>{figura.sud && <Mano mano={figura.sud} posto={nomi.sud} />}</div>
          <span />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {etichetta}
          <div className="grid gap-1.5">
            {figura.nord && <Mano mano={figura.nord} posto={nomi.nord} />}
            {figura.nord && figura.sud && <hr className="border-border" />}
            {figura.sud && <Mano mano={figura.sud} posto={nomi.sud} />}
          </div>
        </div>
      )}
      {figura.nota && (
        <figcaption className="mt-2 text-xs font-semibold text-muted-foreground">
          <TestoConSemi testo={figura.nota} />
        </figcaption>
      )}
    </figure>
  );
}
