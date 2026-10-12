"use client";

import { useEffect, useState } from "react";
import { Briciole } from "@/components/briciole";
import { nomeClasse } from "@/lib/instructors";
import { segnalaSalvoRete } from "@/lib/report-error";

/**
 * Le briciole di una sottopagina di classe, con il NOME della classe.
 *
 * Prima ogni sottopagina scriveva «La classe»: con quattro corsi aperti non si
 * capiva in quale si fosse entrati (Trevissoi, ottobre 2026). Il nome si legge
 * qui una volta sola; finché non arriva, o se la lettura non riesce, resta
 * «La classe», che porta comunque nel posto giusto.
 */
export function BricioleClasse({
  classId,
  nome,
  pagina,
}: {
  classId: string;
  /** Se la pagina il nome lo ha già, non serve rileggerlo. */
  nome?: string | null;
  pagina: string;
}) {
  const [letto, setLetto] = useState<string | null>(null);
  useEffect(() => {
    if (nome) return;
    let vivo = true;
    nomeClasse(classId)
      .then((n) => {
        if (vivo) setLetto(n);
      })
      .catch((err) => segnalaSalvoRete("briciole-classe", err));
    return () => {
      vivo = false;
    };
  }, [classId, nome]);

  return (
    <Briciole
      percorso={[
        { etichetta: "Le tue classi", href: "/istruttori" },
        { etichetta: nome || letto || "La classe", href: `/istruttori/${classId}` },
        { etichetta: pagina },
      ]}
    />
  );
}
