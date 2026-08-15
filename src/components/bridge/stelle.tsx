"use client";

/**
 * Le stelle di un voto, mezze comprese.
 *
 * PERCHÉ NON `"⭐".repeat(n)`
 * Perché con le mezze stelle quel conto tronca in silenzio: 2,5 diventa due
 * stelle e la mezza sparisce, senza che niente lo segnali. E perché la mezza
 * stella va DISEGNATA: scriverla come «2½» funziona ma costringe a leggere un
 * numero dove tutto il resto è un'immagine.
 *
 * La mezza è una stella piena tagliata a metà da un ritaglio, non un carattere
 * diverso: così le due metà sono sempre della stessa forma e dello stesso
 * colore, qualunque font abbia il dispositivo. Gli emoji, su questo, non danno
 * nessuna garanzia.
 */
export function Stelle({
  quante,
  su = 3,
  className = "",
}: {
  quante: number;
  /** Quante stelle in tutto: 3 per una mano, 18 per sei mani. */
  su?: number;
  className?: string;
}) {
  const piene = Math.floor(quante);
  const mezza = quante - piene >= 0.5;

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${quante} stelle su ${su}`}
    >
      {Array.from({ length: su }, (_, i) => {
        const stato = i < piene ? "piena" : i === piene && mezza ? "mezza" : "vuota";
        return <Stella key={i} stato={stato} />;
      })}
    </span>
  );
}

function Stella({ stato }: { stato: "piena" | "mezza" | "vuota" }) {
  const punta =
    "M12 2.5l2.9 6.3 6.6.8-4.9 4.6 1.3 6.8L12 17.6 6.1 21l1.3-6.8L2.5 9.6l6.6-.8z";
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      {/* Il contorno c'è sempre: dice quante stelle erano in palio. */}
      <path d={punta} className="fill-none stroke-gold" strokeWidth="1.5" />
      {stato !== "vuota" && (
        // Il ritaglio è una proprietà CSS e non un `<clipPath>` con un id: gli
        // id in una pagina con molte stelle si ripeterebbero, e un documento
        // con id duplicati è un documento rotto anche quando si vede bene.
        <path
          d={punta}
          className="fill-gold"
          style={stato === "mezza" ? { clipPath: "inset(0 50% 0 0)" } : undefined}
        />
      )}
    </svg>
  );
}
