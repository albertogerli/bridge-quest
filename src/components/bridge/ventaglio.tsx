"use client";

import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "@/components/bridge/playing-card";
import type { Card } from "@/lib/bridge-engine";

/**
 * Una mano a ventaglio, sul panno. Il componente unico per «mostrare le carte»
 * fuori dal tavolo (home, Gioca, Mano del giorno): dove c'è una mano si
 * disegnano le carte vere, mai una riga di testo come «♠ A 10 5».
 *
 * Lo spazio c'è anche prima che le carte arrivino: niente salti nella pagina.
 * Le carte vanno passate già in ordine (`ordinaManoAlternata`), come al tavolo.
 */
export function Ventaglio({
  carte,
  larghezza = 44,
  etichetta,
}: {
  carte: Card[] | null;
  /** Larghezza di una carta in pixel. */
  larghezza?: number;
  /** Cosa dice uno screen reader: «Le tue carte della prossima mano». */
  etichetta?: string;
}) {
  // Lo spazio che c'è davvero: sul telefono tredici carte con la
  // sovrapposizione di sempre non entrano, e la prima finiva tagliata.
  const box = useRef<HTMLDivElement>(null);
  const [spazio, setSpazio] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const misura = () => setSpazio(el.clientWidth - 48);
    misura();
    const ro = new ResizeObserver(misura);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const n = carte?.length ?? 0;
  const passoIdeale = larghezza * 0.4;
  const passo = spazio && n > 1 ? Math.min(passoIdeale, (spazio - larghezza) / (n - 1)) : passoIdeale;
  const sovrapposizione = Math.round(larghezza - passo);
  return (
    <div
      ref={box}
      className="flex justify-center overflow-hidden px-6 pt-3"
      style={{ height: Math.round(larghezza * 1.45) + 24 }}
      aria-hidden={!carte}
      aria-label={carte ? etichetta : undefined}
      role={carte ? "img" : undefined}
    >
      {carte?.map((c, i) => (
        <div
          key={`${c.suit}${c.rank}`}
          className="origin-[50%_150%]"
          style={{ marginLeft: i === 0 ? 0 : -sovrapposizione, transform: `rotate(${(i - (carte.length - 1) / 2) * 2.5}deg)` }}
        >
          <PlayingCard card={c} cardWidth={larghezza} angolo noHover />
        </div>
      ))}
    </div>
  );
}
